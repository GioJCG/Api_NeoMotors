import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(params: {
    usuarioId?: string;
    accion: string;
    entidad: string;
    entidadId?: string;
    payload?: any;
    contexto?: string;
    ip?: string;
  }) {
    return this.prisma.auditoria.create({
      data: {
        usuarioId: params.usuarioId,
        accion: params.accion,
        entidad: params.entidad,
        entidadId: params.entidadId,
        payload: params.payload ?? undefined,
        contexto: params.contexto,
        ip: params.ip,
      },
    });
  }

  async findAll(
    user: { id: string; roles: string[]; companyId?: string | null },
    filters: {
      page?: number;
      limit?: number;
      entidad?: string;
      accion?: string;
      usuarioId?: string;
      desde?: string;
      hasta?: string;
    },
  ) {
    const where: any = {};

    if (filters.entidad) where.entidad = filters.entidad;
    if (filters.accion) where.accion = { contains: filters.accion, mode: 'insensitive' };
    if (filters.usuarioId) where.usuarioId = filters.usuarioId;
    if (filters.desde || filters.hasta) {
      where.createdAt = {};
      if (filters.desde) where.createdAt.gte = new Date(filters.desde);
      if (filters.hasta) where.createdAt.lte = new Date(filters.hasta);
    }

    if (!user.roles.includes('SuperUsuario')) {
      if (filters.entidad) {
        where.entidad = filters.entidad;
      }
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;

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
