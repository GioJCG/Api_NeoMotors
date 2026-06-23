import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AjustarStockDto, TransferirStockDto } from './dto/ajustar-stock.dto';

@Injectable()
export class InventariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async getStock(user: { id: string; roles: string[]; companyId?: string | null }, sucursalId?: string) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener una empresa activa');

    const where: any = { empresaId };
    if (sucursalId) where.sucursalId = sucursalId;

    if (user.roles.includes('SuperUsuario')) {
      delete where.empresaId;
    }

    const items = await this.prisma.inventario.findMany({
      where,
      include: {
        refaccion: { select: { id: true, codigo: true, nombre: true, precio: true, unidad: true } },
        sucursal: { select: { id: true, nombre: true } },
      },
      orderBy: [{ sucursalId: 'asc' }, { refaccion: { nombre: 'asc' } }],
    });

    return items.map((i) => ({
      ...i,
      stockBajo: i.stockMinimo > 0 && i.stockActual <= i.stockMinimo,
    }));
  }

  async getStockByRefaccion(refaccionId: string, user: { id: string; roles: string[]; companyId?: string | null }) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener una empresa activa');

    const ref = await this.prisma.refaccion.findUnique({ where: { id: refaccionId } });
    if (!ref || ref.empresaId !== empresaId) throw new NotFoundException('Refacción no encontrada');

    return this.prisma.inventario.findMany({
      where: { empresaId, refaccionId },
      include: { sucursal: { select: { id: true, nombre: true } } },
    });
  }

  async ajustarStock(
    dto: AjustarStockDto,
    user: { id: string; roles: string[]; companyId?: string | null; branchId?: string | null },
    ip?: string,
  ) {
    const empresaId = user.companyId;
    const sucursalId = user.branchId;
    if (!empresaId || !sucursalId) throw new ForbiddenException('Debe tener empresa y sucursal activa');

    const ref = await this.prisma.refaccion.findUnique({ where: { id: dto.refaccionId } });
    if (!ref || ref.empresaId !== empresaId) throw new NotFoundException('Refacción no encontrada');

    return this.prisma.$transaction(async (tx) => {
      let inv = await tx.inventario.findUnique({
        where: { empresaId_sucursalId_refaccionId: { empresaId, sucursalId, refaccionId: dto.refaccionId } },
      });

      if (!inv) {
        inv = await tx.inventario.create({
          data: {
            empresaId, sucursalId, refaccionId: dto.refaccionId,
            stockActual: 0, stockMinimo: dto.stockMinimo ?? 0,
          },
        });
      }

      const stockAnterior = inv.stockActual;
      const esEntrada = ['ENTRADA_POR_COMPRA', 'AJUSTE_INVENTARIO'].includes(dto.tipo);
      let cantidad = dto.cantidad;
      if (!esEntrada && cantidad > stockAnterior) {
        throw new BadRequestException('Stock insuficiente');
      }
      if (!esEntrada) cantidad = -cantidad; // negative for SALIDA

      const stockNuevo = stockAnterior + cantidad;

      await tx.inventario.update({
        where: { id: inv.id },
        data: {
          stockActual: stockNuevo,
          stockMinimo: dto.stockMinimo ?? inv.stockMinimo,
        },
      });

      const mov = await tx.movimientoInventario.create({
        data: {
          empresaId, sucursalId, refaccionId: dto.refaccionId,
          tipo: dto.tipo,
          cantidad: dto.cantidad,
          stockAnterior, stockNuevo,
          referencia: dto.referencia,
          observaciones: dto.observaciones,
          createdBy: user.id,
        },
      });

      await this.auditoria.registrar({
        usuarioId: user.id, accion: 'AJUSTAR_STOCK', entidad: 'Inventario', entidadId: inv.id,
        payload: { tipo: dto.tipo, cantidad: dto.cantidad, stockAnterior, stockNuevo },
        contexto: `Empresa: ${empresaId}, Sucursal: ${sucursalId}`,
        ip,
      });

      return { inventario: { ...inv, stockActual: stockNuevo }, movimiento: mov };
    });
  }

  async transferirStock(
    dto: TransferirStockDto,
    user: { id: string; roles: string[]; companyId?: string | null },
    ip?: string,
  ) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener una empresa activa');

    const ref = await this.prisma.refaccion.findUnique({ where: { id: dto.refaccionId } });
    if (!ref || ref.empresaId !== empresaId) throw new NotFoundException('Refacción no encontrada');

    const sucOrigen = await this.prisma.sucursal.findUnique({ where: { id: dto.sucursalOrigenId } });
    const sucDestino = await this.prisma.sucursal.findUnique({ where: { id: dto.sucursalDestinoId } });
    if (!sucOrigen || !sucDestino || sucOrigen.empresaId !== empresaId || sucDestino.empresaId !== empresaId) {
      throw new BadRequestException('Sucursales no válidas');
    }

    return this.prisma.$transaction(async (tx) => {
      const invOrigen = await tx.inventario.findUnique({
        where: { empresaId_sucursalId_refaccionId: { empresaId, sucursalId: dto.sucursalOrigenId, refaccionId: dto.refaccionId } },
      });
      if (!invOrigen || invOrigen.stockActual < dto.cantidad) {
        throw new BadRequestException('Stock insuficiente en origen');
      }

      await tx.inventario.update({
        where: { id: invOrigen.id },
        data: { stockActual: invOrigen.stockActual - dto.cantidad },
      });

      const invDestino = await tx.inventario.upsert({
        where: { empresaId_sucursalId_refaccionId: { empresaId, sucursalId: dto.sucursalDestinoId, refaccionId: dto.refaccionId } },
        create: { empresaId, sucursalId: dto.sucursalDestinoId, refaccionId: dto.refaccionId, stockActual: dto.cantidad },
        update: { stockActual: { increment: dto.cantidad } },
      });

      await tx.movimientoInventario.create({
        data: {
          empresaId, sucursalId: dto.sucursalOrigenId, refaccionId: dto.refaccionId,
          tipo: 'TRANSFERENCIA', cantidad: dto.cantidad,
          stockAnterior: invOrigen.stockActual, stockNuevo: invOrigen.stockActual - dto.cantidad,
          referencia: `Destino: ${dto.sucursalDestinoId}`,
          observaciones: dto.observaciones, createdBy: user.id,
        },
      });

      return { origen: { ...invOrigen, stockActual: invOrigen.stockActual - dto.cantidad }, destino: invDestino };
    });
  }

  async getMovimientos(
    user: { id: string; roles: string[]; companyId?: string | null },
    refaccionId?: string,
    sucursalId?: string,
  ) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener una empresa activa');

    const where: any = { empresaId };
    if (refaccionId) where.refaccionId = refaccionId;
    if (sucursalId) where.sucursalId = sucursalId;

    return this.prisma.movimientoInventario.findMany({
      where,
      include: {
        refaccion: { select: { id: true, codigo: true, nombre: true } },
        sucursal: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getAlertasStock(user: { id: string; roles: string[]; companyId?: string | null }) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener una empresa activa');

    return this.prisma.inventario.findMany({
      where: {
        empresaId,
        stockMinimo: { gt: 0 },
        stockActual: { lte: this.prisma.inventario.fields.stockMinimo },
      },
      include: {
        refaccion: { select: { id: true, codigo: true, nombre: true, unidad: true } },
        sucursal: { select: { id: true, nombre: true } },
      },
      orderBy: [{ sucursalId: 'asc' }, { refaccion: { nombre: 'asc' } }],
    });
  }
}
