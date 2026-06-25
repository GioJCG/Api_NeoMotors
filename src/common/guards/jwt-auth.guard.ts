import { Injectable, UnauthorizedException, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | any {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const handlerName = context.getHandler().name;
    const className = context.getClass().name;
    this.logger.log(`[canActivate] ${className}.${handlerName} isPublic=${isPublic}`);

    if (isPublic) {
      this.logger.log(`[canActivate] PUBLIC route - skipping auth`);
      return true;
    }

    this.logger.log(`[canActivate] Calling super.canActivate (Passport JWT auth)`);
    const result = super.canActivate(context);
    this.logger.log(`[canActivate] super.canActivate returned ${result}`);
    return result;
  }

  handleRequest(err: any, user: any) {
    this.logger.log(`[handleRequest] err=${err?.message || null}, user=${user ? user.id || 'present' : 'null'}`);
    if (err || !user) {
      this.logger.warn(`[handleRequest] REJECTED: ${err?.message || 'No user'}`);
      throw (
        err || new UnauthorizedException('Token de acceso inválido o expirado')
      );
    }
    this.logger.log(`[handleRequest] ACCEPTED user=${user.id}`);
    return user;
  }
}
