import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContextService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getUserCompanies(userId: string, userRoles?: string[]) {
    const isSuper = userRoles?.includes('SuperUsuario');
    if (isSuper) {
      const empresas = await this.prisma.empresa.findMany({
        orderBy: { nombre: 'asc' },
        select: {
          id: true,
          nombre: true,
          rfc: true,
          estado: true,
        },
      });
      return empresas.map((e) => ({ ...e, activa: false }));
    }

    const asignaciones = await this.prisma.usuarioEmpresa.findMany({
      where: { usuarioId: userId },
      include: { empresa: true },
      orderBy: { empresa: { nombre: 'asc' } },
    });

    return asignaciones.map((a) => ({
      id: a.empresa.id,
      nombre: a.empresa.nombre,
      rfc: a.empresa.rfc,
      activa: a.activa,
    }));
  }

  async getUserBranches(userId: string, empresaId: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
    });
    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada');
    }

    const asignaciones = await this.prisma.usuarioSucursal.findMany({
      where: { usuarioId: userId, sucursal: { empresaId } },
      include: { sucursal: true },
      orderBy: { sucursal: { nombre: 'asc' } },
    });

    return asignaciones.map((a) => ({
      id: a.sucursal.id,
      nombre: a.sucursal.nombre,
      esMatriz: a.sucursal.esMatriz,
      activa: a.activa,
    }));
  }

  async setActiveCompany(userId: string, empresaId: string, userRoles?: string[]) {
    const isSuper = userRoles?.includes('SuperUsuario');

    if (!isSuper) {
      const asignacion = await this.prisma.usuarioEmpresa.findUnique({
        where: { usuarioId_empresaId: { usuarioId: userId, empresaId } },
      });

      if (!asignacion) {
        throw new ForbiddenException('No tiene acceso a esta empresa');
      }
    }

    await this.prisma.$transaction([
      this.prisma.usuarioEmpresa.updateMany({
        where: { usuarioId: userId, activa: true },
        data: { activa: false },
      }),
      ...(isSuper
        ? []
        : [
            this.prisma.usuarioEmpresa.update({
              where: { usuarioId_empresaId: { usuarioId: userId, empresaId } },
              data: { activa: true },
            }),
          ]),
      this.prisma.usuario.update({
        where: { id: userId },
        data: { companyId: empresaId, branchId: null },
      }),
      this.prisma.usuarioSucursal.updateMany({
        where: { usuarioId: userId, activa: true },
        data: { activa: false },
      }),
    ]);

    return { message: 'Contexto de empresa actualizado' };
  }

  async setActiveBranch(userId: string, sucursalId: string, userRoles?: string[]) {
    const isSuper = userRoles?.includes('SuperUsuario');

    if (isSuper) {
      const sucursal = await this.prisma.sucursal.findUnique({
        where: { id: sucursalId },
      });
      if (!sucursal) {
        throw new NotFoundException('Sucursal no encontrada');
      }

      await this.prisma.usuario.update({
        where: { id: userId },
        data: {
          companyId: sucursal.empresaId,
          branchId: sucursalId,
        },
      });

      return { message: 'Contexto de sucursal actualizado' };
    }

    const asignacion = await this.prisma.usuarioSucursal.findUnique({
      where: { usuarioId_sucursalId: { usuarioId: userId, sucursalId } },
      include: { sucursal: true },
    });

    if (!asignacion) {
      throw new ForbiddenException('No tiene acceso a esta sucursal');
    }

    await this.prisma.$transaction([
      this.prisma.usuarioSucursal.updateMany({
        where: { usuarioId: userId, activa: true },
        data: { activa: false },
      }),
      this.prisma.usuarioSucursal.update({
        where: { id: asignacion.id },
        data: { activa: true },
      }),
      this.prisma.usuario.update({
        where: { id: userId },
        data: {
          companyId: asignacion.sucursal.empresaId,
          branchId: sucursalId,
        },
      }),
    ]);

    return { message: 'Contexto de sucursal actualizado' };
  }
}
