import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateOrdenCompraDto } from './dto/create-orden-compra.dto';
import { UpdateOrdenCompraDto } from './dto/update-orden-compra.dto';

@Injectable()
export class OrdenesCompraService {
  private readonly IVA_RATE = 0.16;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async create(dto: CreateOrdenCompraDto, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener una empresa activa');

    const proveedor = await this.prisma.proveedor.findUnique({ where: { id: dto.proveedorId } });
    if (!proveedor || proveedor.empresaId !== empresaId) {
      throw new BadRequestException('Proveedor no válido');
    }

    const folio = await this.generateFolio(empresaId);

    const detallesCalc = dto.detalles.map((d) => {
      const cantidad = Number(d.cantidad) || 0;
      const pu = Number(d.precioUnitario) || 0;
      const descPct = Number(d.descuento) || 0;
      const subt = cantidad * pu;
      const descAmt = subt * (descPct / 100);
      const afterDisc = subt - descAmt;
      const iva = afterDisc * this.IVA_RATE;
      const total = afterDisc + iva;
      return {
        descripcion: d.descripcion,
        cantidad,
        precioUnitario: pu,
        descuento: descAmt,
        subtotal: subt,
        iva,
        total,
      };
    });

    const subtotal = detallesCalc.reduce((s, d) => s + d.subtotal, 0);
    const descuentoTotal = detallesCalc.reduce((s, d) => s + d.descuento, 0);
    const ivaTotal = detallesCalc.reduce((s, d) => s + d.iva, 0);
    const total = detallesCalc.reduce((s, d) => s + d.total, 0);

    const orden = await this.prisma.ordenCompra.create({
      data: {
        empresaId,
        proveedorId: dto.proveedorId,
        folio,
        descripcion: dto.descripcion,
        subtotal,
        descuento: descuentoTotal,
        iva: ivaTotal,
        total,
        fechaPedido: dto.fechaPedido ? new Date(dto.fechaPedido) : null,
        createdBy: user.id,
        detalles: {
          create: detallesCalc,
        },
      },
      include: { detalles: true, proveedor: { select: { id: true, nombre: true } } },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'CREAR',
      entidad: 'OrdenCompra',
      entidadId: orden.id,
      payload: dto as any,
      contexto: `Empresa: ${empresaId}`,
      ip,
    });

    return orden;
  }

  async findAll(user: { id: string; roles: string[]; companyId?: string | null }) {
    if (user.roles.includes('SuperUsuario')) {
      return this.prisma.ordenCompra.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          proveedor: { select: { id: true, nombre: true } },
          detalles: true,
        },
      });
    }
    if (!user.companyId) throw new ForbiddenException('Debe tener una empresa activa');
    return this.prisma.ordenCompra.findMany({
      where: { empresaId: user.companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        proveedor: { select: { id: true, nombre: true } },
        detalles: true,
      },
    });
  }

  async findById(id: string, user: { id: string; roles: string[]; companyId?: string | null }) {
    const orden = await this.prisma.ordenCompra.findUnique({
      where: { id },
      include: { detalles: true, proveedor: { select: { id: true, nombre: true } } },
    });
    if (!orden) throw new NotFoundException('Orden de compra no encontrada');
    if (!user.roles.includes('SuperUsuario') && orden.empresaId !== user.companyId) {
      throw new ForbiddenException('No tiene acceso a esta orden');
    }
    return orden;
  }

  async update(id: string, dto: UpdateOrdenCompraDto, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const orden = await this.findById(id, user);
    if (orden.estado === 'CANCELADA' || orden.estado === 'RECIBIDA') {
      throw new BadRequestException('No se puede modificar una orden cancelada o recibida');
    }

    let updateData: any = { ...dto, updatedBy: user.id };
    delete updateData.detalles;

    if (dto.estado === 'RECIBIDA') {
      updateData.fechaRecibido = new Date();
    }

    if (dto.detalles && dto.detalles.length > 0) {
      const detallesCalc = dto.detalles.map((d) => {
        const cantidad = Number(d.cantidad) || 0;
        const pu = Number(d.precioUnitario) || 0;
        const descPct = Number(d.descuento) || 0;
        const subt = cantidad * pu;
        const descAmt = subt * (descPct / 100);
        const afterDisc = subt - descAmt;
        const iva = afterDisc * this.IVA_RATE;
        const total = afterDisc + iva;
        return {
          descripcion: d.descripcion,
          cantidad,
          precioUnitario: pu,
          descuento: descAmt,
          subtotal: subt,
          iva,
          total,
        };
      });

      const subtotal = detallesCalc.reduce((s, d) => s + d.subtotal, 0);
      const descuentoTotal = detallesCalc.reduce((s, d) => s + d.descuento, 0);
      const ivaTotal = detallesCalc.reduce((s, d) => s + d.iva, 0);
      const total = detallesCalc.reduce((s, d) => s + d.total, 0);

      updateData.subtotal = subtotal;
      updateData.descuento = descuentoTotal;
      updateData.iva = ivaTotal;
      updateData.total = total;

      await this.prisma.ordenCompraDetalle.deleteMany({ where: { ordenCompraId: id } });
      await this.prisma.ordenCompraDetalle.createMany({
        data: detallesCalc.map((d) => ({ ...d, ordenCompraId: id })),
      });
    }

    const updated = await this.prisma.ordenCompra.update({
      where: { id },
      data: updateData,
      include: { detalles: true, proveedor: { select: { id: true, nombre: true } } },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'ACTUALIZAR',
      entidad: 'OrdenCompra',
      entidadId: id,
      payload: { antes: orden, despues: dto } as any,
      contexto: `Empresa: ${orden.empresaId}`,
      ip,
    });

    return updated;
  }

  async remove(id: string, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const orden = await this.findById(id, user);
    if (orden.estado !== 'BORRADOR') {
      throw new BadRequestException('Solo se pueden cancelar órdenes en estado BORRADOR');
    }

    const updated = await this.prisma.ordenCompra.update({
      where: { id },
      data: { estado: 'CANCELADA', updatedBy: user.id },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'CANCELAR',
      entidad: 'OrdenCompra',
      entidadId: id,
      payload: { estado: 'CANCELADA' },
      contexto: `Empresa: ${orden.empresaId}`,
      ip,
    });

    return updated;
  }

  private async generateFolio(empresaId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.ordenCompra.count({
      where: { empresaId, createdAt: { gte: new Date(`${year}-01-01`) } },
    });
    return `OC-${year}-${String(count + 1).padStart(5, '0')}`;
  }
}
