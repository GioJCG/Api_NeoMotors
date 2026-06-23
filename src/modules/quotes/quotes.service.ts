import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private readonly IVA_RATE = 0.16;

  async create(dto: CreateQuoteDto, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const empresaId = user.companyId;
    if (!empresaId) {
      throw new ForbiddenException('Debe tener una empresa activa para crear cotizaciones');
    }

    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { id: dto.ordenTrabajoId },
    });

    if (!orden || orden.empresaId !== empresaId) {
      throw new NotFoundException('Orden de trabajo no encontrada');
    }

    const folio = await this.generateFolio(empresaId);

    // Calcular cada detalle
    const detallesCalc = dto.detalles.map((det) => {
      const sub = det.cantidad * det.precioUnitario;
      const desc = det.descuento || 0;
      const subtotalConDescuento = sub - desc;
      const iva = Math.round(subtotalConDescuento * this.IVA_RATE * 100) / 100;
      const total = Math.round((subtotalConDescuento + iva) * 100) / 100;
      return {
        tipo: det.tipo,
        descripcion: det.descripcion,
        cantidad: det.cantidad,
        precioUnitario: Math.round(det.precioUnitario * 100) / 100,
        descuento: Math.round(desc * 100) / 100,
        subtotal: Math.round(sub * 100) / 100,
        iva,
        total,
      };
    });

    const subtotalGeneral = Math.round(detallesCalc.reduce((s, d) => s + d.subtotal, 0) * 100) / 100;
    const descuentoGeneral = Math.round((dto.descuento || 0) * 100) / 100;
    const baseIva = Math.max(0, subtotalGeneral - descuentoGeneral);
    const ivaGeneral = Math.round(baseIva * this.IVA_RATE * 100) / 100;
    const totalGeneral = Math.round((baseIva + ivaGeneral) * 100) / 100;

    const cotizacion = await this.prisma.cotizacion.create({
      data: {
        empresaId,
        ordenTrabajoId: dto.ordenTrabajoId,
        folio,
        estado: 'BORRADOR',
        subtotal: subtotalGeneral,
        descuento: descuentoGeneral,
        iva: ivaGeneral,
        total: totalGeneral,
        notas: dto.notas,
        createdBy: user.id,
        detalles: {
          create: detallesCalc,
        },
      },
      include: { detalles: true },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'CREAR_COTIZACION',
      entidad: 'Cotizacion',
      entidadId: cotizacion.id,
      payload: { folio, total: totalGeneral } as any,
      contexto: `Orden: ${orden.folio}`,
      ip,
    });

    return cotizacion;
  }

  async findAll(user: { id: string; roles: string[]; companyId?: string | null }) {
    const where: any = {};
    if (!user.roles.includes('SuperUsuario')) {
      if (!user.companyId) throw new ForbiddenException('Debe tener una empresa activa');
      where.empresaId = user.companyId;
    }

    return this.prisma.cotizacion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        detalles: true,
        ordenTrabajo: { select: { id: true, folio: true, estado: true } },
      },
    });
  }

  async findById(id: string, user: { id: string; roles: string[]; companyId?: string | null }) {
    const cotizacion = await this.prisma.cotizacion.findUnique({
      where: { id },
      include: {
        detalles: { orderBy: { id: 'asc' } },
        ordenTrabajo: { select: { id: true, folio: true, estado: true, clienteId: true, vehiculoId: true } },
      },
    });

    if (!cotizacion) throw new NotFoundException('Cotización no encontrada');
    if (!user.roles.includes('SuperUsuario') && cotizacion.empresaId !== user.companyId) {
      throw new ForbiddenException('No tiene acceso a esta cotización');
    }

    return cotizacion;
  }

  async update(id: string, dto: UpdateQuoteDto, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const cotizacion = await this.findById(id, user);

    if (cotizacion.estado === 'APROBADA' || cotizacion.estado === 'RECHAZADA') {
      throw new BadRequestException(`No se puede modificar una cotización en estado ${cotizacion.estado}`);
    }

    let updateData: any = { updatedBy: user.id };

    // If detalles are provided, recalculate
    if (dto.detalles) {
      const detallesCalc = dto.detalles.map((det) => {
        const sub = det.cantidad * det.precioUnitario;
        const desc = det.descuento || 0;
        const subtotalConDescuento = sub - desc;
        const iva = Math.round(subtotalConDescuento * this.IVA_RATE * 100) / 100;
        const total = Math.round((subtotalConDescuento + iva) * 100) / 100;
        return {
          tipo: det.tipo,
          descripcion: det.descripcion,
          cantidad: det.cantidad,
          precioUnitario: Math.round(det.precioUnitario * 100) / 100,
          descuento: Math.round(desc * 100) / 100,
          subtotal: Math.round(sub * 100) / 100,
          iva,
          total,
        };
      });

      const subtotalGeneral = Math.round(detallesCalc.reduce((s, d) => s + d.subtotal, 0) * 100) / 100;
      const descuentoGeneral = Math.round((dto.descuento ?? Number(cotizacion.descuento)) * 100) / 100;
      const baseIva = Math.max(0, subtotalGeneral - descuentoGeneral);
      const ivaGeneral = Math.round(baseIva * this.IVA_RATE * 100) / 100;
      const totalGeneral = Math.round((baseIva + ivaGeneral) * 100) / 100;

      await this.prisma.cotizacionDetalle.deleteMany({ where: { cotizacionId: id } });

      updateData.detalles = { create: detallesCalc };
      updateData.subtotal = subtotalGeneral;
      updateData.descuento = descuentoGeneral;
      updateData.iva = ivaGeneral;
      updateData.total = totalGeneral;
    }

    // Handle estado change - block order advancement
    if (dto.estado === 'APROBADA') {
      // When quote is approved, update the work order to TRABAJANDO (if in PRESUPUESTADO)
      const orden = await this.prisma.ordenTrabajo.findUnique({ where: { id: cotizacion.ordenTrabajoId } });
      if (orden && orden.estado !== 'PRESUPUESTADO') {
        // Just approve the quote, don't change order state yet
        // Order will advance when explicitly moved
      }
    }

    if (dto.estado) updateData.estado = dto.estado;
    if (dto.notas !== undefined) updateData.notas = dto.notas;

    const updated = await this.prisma.cotizacion.update({
      where: { id },
      data: updateData,
      include: { detalles: { orderBy: { id: 'asc' } } },
    });

    if (dto.estado === 'ENVIADA') {
      this.eventEmitter.emit('cotizacion.para_aprobar', {
        cotizacionId: id,
        empresaId: cotizacion.empresaId,
        folio: cotizacion.folio,
      });
    }

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'ACTUALIZAR_COTIZACION',
      entidad: 'Cotizacion',
      entidadId: id,
      payload: { estado: dto.estado, total: updated.total } as any,
      ip,
    });

    return updated;
  }

  async remove(id: string, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const cotizacion = await this.findById(id, user);

    if (cotizacion.estado === 'APROBADA') {
      throw new BadRequestException('No se puede eliminar una cotización aprobada');
    }

    await this.prisma.cotizacion.delete({ where: { id } });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'ELIMINAR_COTIZACION',
      entidad: 'Cotizacion',
      entidadId: id,
      ip,
    });

    return { message: 'Cotización eliminada exitosamente' };
  }

  private async generateFolio(empresaId: string): Promise<string> {
    const count = await this.prisma.cotizacion.count({ where: { empresaId } });
    const year = new Date().getFullYear();
    return `COT-${year}-${String(count + 1).padStart(5, '0')}`;
  }
}
