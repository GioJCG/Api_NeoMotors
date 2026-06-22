import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.rol.findMany({
      include: {
        permisos: {
          include: { permiso: true },
        },
        _count: { select: { usuarios: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findById(id: string) {
    const rol = await this.prisma.rol.findUnique({
      where: { id },
      include: {
        permisos: {
          include: { permiso: true },
        },
        _count: { select: { usuarios: true } },
      },
    });

    if (!rol) {
      throw new NotFoundException('Rol no encontrado');
    }

    return rol;
  }

  async findByNombre(nombre: string) {
    return this.prisma.rol.findUnique({
      where: { nombre },
      include: {
        permisos: {
          include: { permiso: true },
        },
      },
    });
  }

  async create(data: { nombre: string; descripcion?: string; esGlobal?: boolean }) {
    const existing = await this.prisma.rol.findUnique({ where: { nombre: data.nombre } });
    if (existing) {
      throw new ConflictException('El rol ya existe');
    }

    return this.prisma.rol.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        esGlobal: data.esGlobal ?? true,
      },
    });
  }

  async update(id: string, data: { nombre?: string; descripcion?: string }) {
    await this.findById(id);

    return this.prisma.rol.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return this.prisma.rol.delete({ where: { id } });
  }

  async assignPermiso(rolId: string, permisoId: string) {
    await this.findById(rolId);
    const permiso = await this.prisma.permiso.findUnique({ where: { id: permisoId } });
    if (!permiso) {
      throw new NotFoundException('Permiso no encontrado');
    }

    return this.prisma.rolPermiso.upsert({
      where: { rolId_permisoId: { rolId, permisoId } },
      create: { rolId, permisoId },
      update: {},
    });
  }

  async removePermiso(rolId: string, permisoId: string) {
    return this.prisma.rolPermiso.delete({
      where: { rolId_permisoId: { rolId, permisoId } },
    });
  }
}
