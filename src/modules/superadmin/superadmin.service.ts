import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';

@Injectable()
export class SuperadminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async listCompanies(page = 1, limit = 20, search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { rfc: { contains: search, mode: 'insensitive' } },
        { razonSocial: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.empresa.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nombre: true,
          rfc: true,
          razonSocial: true,
          estado: true,
          createdAt: true,
          _count: { select: { sucursales: true, usuariosAsignados: true, facturasFiscales: true } },
        },
      }),
      this.prisma.empresa.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async toggleCompanyStatus(id: string, user: { id: string }) {
    const empresa = await this.prisma.empresa.findUnique({ where: { id } });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');

    const nuevoEstado = empresa.estado === 'ACTIVA' ? 'SUSPENDIDA' : 'ACTIVA';

    const updated = await this.prisma.empresa.update({
      where: { id },
      data: { estado: nuevoEstado },
      select: { id: true, nombre: true, estado: true },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: empresa.estado === 'ACTIVA' ? 'SUSPENDER_EMPRESA' : 'ACTIVAR_EMPRESA',
      entidad: 'Empresa',
      entidadId: id,
      payload: { estadoAnterior: empresa.estado, estadoNuevo: nuevoEstado },
      contexto: `SuperUsuario modificó estado de empresa ${empresa.nombre}`,
    });

    return updated;
  }

  async getGlobalStats() {
    const [totalEmpresas, empresasActivas, empresasSuspendidas, totalUsuarios, totalSucursales] = await Promise.all([
      this.prisma.empresa.count(),
      this.prisma.empresa.count({ where: { estado: 'ACTIVA' } }),
      this.prisma.empresa.count({ where: { estado: 'SUSPENDIDA' } }),
      this.prisma.usuario.count(),
      this.prisma.sucursal.count(),
    ]);

    const facturasResumen = await this.prisma.facturaFiscal.groupBy({
      by: ['estado'],
      _count: true,
      _sum: { total: true },
    });

    const totalFacturas = facturasResumen.reduce((s, f) => s + f._count, 0);
    const totalTimbrado = facturasResumen
      .filter((f) => f.estado === 'TIMBRADA')
      .reduce((s, f) => s + Number(f._sum?.total || 0), 0);

    const ordenesPorEstado = await this.prisma.ordenTrabajo.groupBy({
      by: ['estado'],
      _count: true,
    });

    return {
      empresas: { total: totalEmpresas, activas: empresasActivas, suspendidas: empresasSuspendidas },
      usuarios: totalUsuarios,
      sucursales: totalSucursales,
      facturacion: {
        total: totalFacturas,
        timbradas: facturasResumen.find((f) => f.estado === 'TIMBRADA')?._count || 0,
        canceladas: facturasResumen.find((f) => f.estado === 'CANCELADA')?._count || 0,
        montoTotalTimbrado: totalTimbrado,
      },
      ordenes: ordenesPorEstado.map((o) => ({ estado: o.estado, count: o._count })),
    };
  }

  async getAuditLogs(
    page = 1,
    limit = 50,
    filters?: { entidad?: string; accion?: string; empresaId?: string },
  ) {
    const where: any = {};

    if (filters?.entidad) where.entidad = filters.entidad;
    if (filters?.accion) where.accion = { contains: filters.accion, mode: 'insensitive' };
    if (filters?.empresaId) {
      where.contexto = { contains: filters.empresaId, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.auditoria.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditoria.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
