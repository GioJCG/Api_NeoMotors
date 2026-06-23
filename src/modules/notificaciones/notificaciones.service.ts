import { Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    user: { id: string; roles: string[]; companyId?: string | null; branchId?: string | null },
    page = 1,
    limit = 50,
    leida?: string,
  ) {
    const empresaId = user.companyId;
    if (!empresaId) return { data: [], total: 0, page, limit };

    const where: any = { empresaId };

    if (leida === 'true') where.leida = true;
    else if (leida === 'false') where.leida = false;

    const [data, total] = await Promise.all([
      this.prisma.notificacionTaller.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notificacionTaller.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async unreadCount(user: { id: string; roles: string[]; companyId?: string | null }) {
    const empresaId = user.companyId;
    if (!empresaId) return { count: 0 };

    const count = await this.prisma.notificacionTaller.count({
      where: { empresaId, leida: false },
    });

    return { count };
  }

  async markAsRead(id: string, user: { id: string; roles: string[]; companyId?: string | null }) {
    const notif = await this.prisma.notificacionTaller.findUnique({ where: { id } });
    if (!notif) throw new NotFoundException('Notificación no encontrada');

    if (notif.empresaId !== user.companyId && !user.roles.includes('SuperUsuario')) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return this.prisma.notificacionTaller.update({
      where: { id },
      data: { leida: true, fechaLectura: new Date() },
    });
  }

  async markAllAsRead(user: { id: string; roles: string[]; companyId?: string | null }) {
    const empresaId = user.companyId;
    if (!empresaId) return { count: 0 };

    const result = await this.prisma.notificacionTaller.updateMany({
      where: { empresaId, leida: false },
      data: { leida: true, fechaLectura: new Date() },
    });

    return { count: result.count };
  }

  async create(data: {
    empresaId: string;
    sucursalId?: string;
    usuarioId?: string;
    tipo: string;
    titulo: string;
    mensaje: string;
    referencia?: string;
    prioridad?: string;
  }) {
    return this.prisma.notificacionTaller.create({
      data: {
        empresaId: data.empresaId,
        sucursalId: data.sucursalId,
        usuarioId: data.usuarioId,
        tipo: data.tipo,
        titulo: data.titulo,
        mensaje: data.mensaje,
        referencia: data.referencia,
        prioridad: data.prioridad || 'NORMAL',
      },
    });
  }

  @OnEvent('orden.terminada')
  async handleOrdenTerminada(payload: { ordenId: string; empresaId: string; sucursalId?: string; folio: string }) {
    await this.create({
      empresaId: payload.empresaId,
      sucursalId: payload.sucursalId,
      tipo: 'ORDEN_TERMINADA',
      titulo: 'Orden terminada',
      mensaje: `La orden ${payload.folio} ha sido marcada como TERMINADA y está lista para cobro.`,
      referencia: payload.ordenId,
      prioridad: 'ALTA',
    });
  }

  @OnEvent('cotizacion.para_aprobar')
  async handleCotizacionParaAprobar(payload: { cotizacionId: string; empresaId: string; sucursalId?: string; folio: string }) {
    await this.create({
      empresaId: payload.empresaId,
      sucursalId: payload.sucursalId,
      tipo: 'COTIZACION_APROBACION',
      titulo: 'Cotización requiere aprobación',
      mensaje: `La cotización ${payload.folio} requiere aprobación del supervisor.`,
      referencia: payload.cotizacionId,
      prioridad: 'ALTA',
    });
  }

  @OnEvent('pago.registrado')
  async handlePagoRegistrado(payload: { pagoId: string; empresaId: string; sucursalId?: string; monto: number; folioOrden: string }) {
    await this.create({
      empresaId: payload.empresaId,
      sucursalId: payload.sucursalId,
      tipo: 'PAGO_REGISTRADO',
      titulo: 'Pago registrado',
      mensaje: `Se registró un pago de $${payload.monto} para la orden ${payload.folioOrden}.`,
      referencia: payload.pagoId,
      prioridad: 'NORMAL',
    });
  }
}
