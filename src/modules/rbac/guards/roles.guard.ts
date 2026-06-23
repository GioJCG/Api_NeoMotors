import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISO_KEY } from '../decorators/permiso.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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

    if (requiredRoles) {
      const userRoles: string[] = user.roles || [];
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

    return true;
  }
}
