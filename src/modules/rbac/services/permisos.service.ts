import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PermisosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.permiso.findMany({
      orderBy: [{ modulo: 'asc' }, { accion: 'asc' }],
    });
  }

  async findByModulo(modulo: string) {
    return this.prisma.permiso.findMany({
      where: { modulo },
      orderBy: { accion: 'asc' },
    });
  }

  async findByNombre(nombre: string) {
    return this.prisma.permiso.findUnique({ where: { nombre } });
  }

  async getModulos() {
    const result = await this.prisma.permiso.findMany({
      select: { modulo: true },
      distinct: ['modulo'],
      orderBy: { modulo: 'asc' },
    });
    return result.map((r) => r.modulo);
  }
}
