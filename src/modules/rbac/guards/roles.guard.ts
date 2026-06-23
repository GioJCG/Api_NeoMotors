import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISO_KEY } from '../decorators/permiso.decorator';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermiso = this.reflector.getAllAndOverride<string>(
      PERMISO_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !requiredPermiso) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Acceso denegado: usuario no autenticado');
    }

    const userRoles: string[] = user.roles || [];

    if (requiredRoles) {
      const hasRole = requiredRoles.some((role) => userRoles.includes(role));
      if (!hasRole) {
        throw new ForbiddenException(
          'Acceso denegado: no posee el rol requerido',
        );
      }
    }

    if (requiredPermiso) {
      const userPermisos: string[] = user.permisos || [];
      if (!userPermisos.includes(requiredPermiso)) {
        throw new ForbiddenException(
          'Acceso denegado: no posee el permiso requerido',
        );
      }
    }

    // Soft-lock: if user has a companyId and is not SuperUsuario, check company status
    if (user.companyId && !userRoles.includes('SuperUsuario')) {
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: user.companyId },
        select: { estado: true },
      });
      if (empresa && empresa.estado === 'SUSPENDIDA') {
        throw new ForbiddenException(
          'Acceso denegado: la empresa se encuentra suspendida',
        );
      }
    }

    return true;
  }
}
