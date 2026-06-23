import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrderStats(user: { companyId?: string | null }) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener empresa activa');

    const stats = await this.prisma.ordenTrabajo.groupBy({
      by: ['estado'],
      where: { empresaId },
      _count: true,
    });

    const total = stats.reduce((sum, s) => sum + s._count, 0);

    return {
      total,
      estados: stats.map((s) => ({ estado: s.estado, count: s._count })),
    };
  }

  async getRevenue(
    user: { companyId?: string | null },
    desde?: string,
    hasta?: string,
  ) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener empresa activa');

    const where: any = { empresaId };
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt.gte = new Date(desde);
      if (hasta) where.createdAt.lte = new Date(hasta);
    }

    const pagos = await this.prisma.pago.findMany({ where, select: { monto: true, createdAt: true } });

    const totalIngresos = pagos.reduce((sum, p) => sum + Number(p.monto), 0);

    const ordenes = await this.prisma.ordenTrabajo.findMany({
      where: { empresaId },
      select: { totalEstimado: true, totalReal: true, createdAt: true },
    });

    const totalEstimado = ordenes.reduce((sum, o) => sum + Number(o.totalEstimado || 0), 0);
    const totalReal = ordenes.reduce((sum, o) => sum + Number(o.totalReal || 0), 0);

    return {
      totalIngresos,
      totalEstimado,
      totalReal,
    };
  }

  async getStockAlerts(user: { companyId?: string | null; branchId?: string | null }) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener empresa activa');

    let sql = `
      SELECT i.id, i.stock_actual, i.stock_minimo, r.codigo AS refaccion_codigo, r.nombre AS refaccion_nombre, s.nombre AS sucursal_nombre
      FROM "Inventario" i
      JOIN "Refaccion" r ON r.id = i.refaccion_id
      JOIN "Sucursal" s ON s.id = i.sucursal_id
      WHERE i.empresa_id = $1 AND i.stock_actual < i.stock_minimo
    `;
    const params: any[] = [empresaId];

    if (user.branchId) {
      sql += ` AND i.sucursal_id = $2`;
      params.push(user.branchId);
    }

    sql += ` ORDER BY i.stock_actual ASC`;

    const alerts = await this.prisma.$queryRawUnsafe<Array<{
      id: string; stock_actual: bigint; stock_minimo: bigint;
      refaccion_codigo: string; refaccion_nombre: string; sucursal_nombre: string;
    }>>(sql, ...params);

    return alerts.map((a) => ({
      id: a.id,
      refaccionCodigo: a.refaccion_codigo,
      refaccionNombre: a.refaccion_nombre,
      sucursalNombre: a.sucursal_nombre,
      stockActual: Number(a.stock_actual),
      stockMinimo: Number(a.stock_minimo),
    }));
  }

  async getTechnicianEfficiency(user: { companyId?: string | null }) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener empresa activa');

    const records = await this.prisma.tiempoTecnico.findMany({
      where: {
        ordenTrabajo: { empresaId },
        estado: 'COMPLETADO',
        horaFin: { not: null },
      },
      include: {
        tecnico: { select: { id: true, nombre: true, email: true } },
      },
    });

    const grouped: Record<string, { tecnicoId: string; nombre: string; totalHoras: number; totalOrdenes: Set<string> }> = {};

    for (const r of records) {
      if (!r.horaFin) continue;
      const key = r.tecnicoId;
      if (!grouped[key]) {
        grouped[key] = { tecnicoId: key, nombre: r.tecnico.nombre || r.tecnico.email, totalHoras: 0, totalOrdenes: new Set() };
      }
      const diffMs = r.horaFin.getTime() - r.horaInicio.getTime();
      const horas = diffMs / (1000 * 60 * 60);
      grouped[key].totalHoras += horas;
      grouped[key].totalOrdenes.add(r.ordenTrabajoId);
    }

    return Object.values(grouped).map((g) => ({
      tecnicoId: g.tecnicoId,
      nombre: g.nombre,
      totalHoras: Math.round(g.totalHoras * 100) / 100,
      totalOrdenes: g.totalOrdenes.size,
    }));
  }
}
