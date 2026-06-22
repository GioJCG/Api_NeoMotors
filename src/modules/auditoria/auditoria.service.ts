import { Injectable } from '@nestjs/common';
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
}
