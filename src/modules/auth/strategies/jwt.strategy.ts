import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  companyId?: string | null;
  branchId?: string | null;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    this.logger.log(`[validate] JWT payload received: sub=${payload.sub}, email=${payload.email}, exp=${payload.exp}`);
    this.logger.log(`[validate] Looking up user ${payload.sub} in DB...`);

    const user = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            rol: {
              include: {
                permisos: {
                  include: { permiso: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      this.logger.warn(`[validate] User ${payload.sub} NOT FOUND in database`);
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    if (user.estado !== 'ACTIVO') {
      this.logger.warn(`[validate] User ${payload.sub} is estado=${user.estado}, not ACTIVO`);
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    const roles = user.roles.map((ur) => ur.rol.nombre);
    const permisosSet = new Set<string>();
    for (const ur of user.roles) {
      for (const rp of ur.rol.permisos) {
        permisosSet.add(rp.permiso.nombre);
      }
    }

    this.logger.log(`[validate] User ${user.id} ACCEPTED. roles=${JSON.stringify(roles)}, companyId=${user.companyId}`);

    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      estado: user.estado,
      companyId: user.companyId,
      branchId: user.branchId || null,
      roles,
      permisos: Array.from(permisosSet),
    };
  }
}
