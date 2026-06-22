import { Injectable, ConflictException, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyDto } from './dto/verify.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly TOKEN_EXPIRATION_HOURS = 24;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly BLOCK_DURATION_MINUTES = 15;
  private readonly REFRESH_TOKEN_DAYS = 7;
  private readonly RESET_TOKEN_HOURS = 1;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const user = await this.prisma.usuario.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        nombre: dto.nombre || null,
        estado: 'PENDIENTE',
      },
    });

    const verificationToken = uuidv4();
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + this.TOKEN_EXPIRATION_HOURS);

    await this.prisma.verificacionCuenta.create({
      data: {
        usuarioId: user.id,
        token: verificationToken,
        expiraEn: expirationDate,
      },
    });

    return {
      message: 'Usuario registrado exitosamente. Se ha enviado un token de verificación.',
      verificationToken,
      expiresIn: `${this.TOKEN_EXPIRATION_HOURS} horas`,
    };
  }

  async verify(dto: VerifyDto) {
    const verification = await this.prisma.verificacionCuenta.findUnique({
      where: { token: dto.token },
      include: { usuario: true },
    });

    if (!verification) {
      throw new NotFoundException('Token de verificación no encontrado');
    }

    if (verification.usado) {
      throw new BadRequestException('El token de verificación ya fue utilizado');
    }

    if (new Date() > verification.expiraEn) {
      throw new BadRequestException('El token de verificación ha expirado');
    }

    await this.prisma.$transaction([
      this.prisma.verificacionCuenta.update({
        where: { id: verification.id },
        data: { usado: true },
      }),
      this.prisma.usuario.update({
        where: { id: verification.usuario.id },
        data: { estado: 'ACTIVO' },
      }),
    ]);

    return {
      message: 'Cuenta verificada exitosamente. Su cuenta ahora está activa.',
    };
  }

  async login(dto: LoginDto, ip?: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.estado === 'PENDIENTE') {
      throw new UnauthorizedException('La cuenta no ha sido verificada. Revise su correo.');
    }

    if (user.estado === 'INACTIVO' || user.estado === 'BLOQUEADO') {
      throw new UnauthorizedException('La cuenta está bloqueada o inactiva');
    }

    if (user.bloqueadoHasta && new Date() < user.bloqueadoHasta) {
      const minutesLeft = Math.ceil((user.bloqueadoHasta.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`Cuenta bloqueada. Intente de nuevo en ${minutesLeft} minutos.`);
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Esta cuenta no tiene contraseña. Use inicio de sesión con proveedor social.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      const newAttempts = user.intentosFallidos + 1;
      const updateData: any = { intentosFallidos: newAttempts };

      if (newAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        const blockUntil = new Date();
        blockUntil.setMinutes(blockUntil.getMinutes() + this.BLOCK_DURATION_MINUTES);
        updateData.bloqueadoHasta = blockUntil;
        updateData.estado = 'BLOQUEADO';
      }

      await this.prisma.usuario.update({
        where: { id: user.id },
        data: updateData,
      });

      const remainingAttempts = this.MAX_LOGIN_ATTEMPTS - newAttempts;
      throw new UnauthorizedException(
        remainingAttempts > 0
          ? `Credenciales inválidas. Intentos restantes: ${remainingAttempts}`
          : 'Cuenta bloqueada por múltiples intentos fallidos',
      );
    }

    if (user.intentosFallidos > 0) {
      await this.prisma.usuario.update({
        where: { id: user.id },
        data: { intentosFallidos: 0, bloqueadoHasta: null },
      });
    }

    return this.generateAuthTokens(user);
  }

  async loginWithOAuth(oauthUser: { email: string; nombre: string; provider: string; providerId: string }) {
    if (!oauthUser.email) {
      throw new BadRequestException('El proveedor OAuth no proporcionó un correo electrónico');
    }

    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: oauthUser.email.toLowerCase() },
      include: { proveedoresSociales: true },
    });

    if (existingUser) {
      const alreadyLinked = existingUser.proveedoresSociales.some(
        (p) => p.provider === oauthUser.provider && p.providerId === oauthUser.providerId,
      );

      if (!alreadyLinked) {
        await this.prisma.proveedorSocial.create({
          data: {
            usuarioId: existingUser.id,
            provider: oauthUser.provider,
            providerId: oauthUser.providerId,
          },
        });
      }

      if (existingUser.intentosFallidos > 0) {
        await this.prisma.usuario.update({
          where: { id: existingUser.id },
          data: { intentosFallidos: 0, bloqueadoHasta: null, estado: 'ACTIVO' },
        });
      }

      return this.generateAuthTokens(existingUser);
    }

    const newUser = await this.prisma.usuario.create({
      data: {
        email: oauthUser.email.toLowerCase(),
        nombre: oauthUser.nombre || oauthUser.email,
        passwordHash: null,
        estado: 'ACTIVO',
        proveedoresSociales: {
          create: {
            provider: oauthUser.provider,
            providerId: oauthUser.providerId,
          },
        },
      },
    });

    return this.generateAuthTokens(newUser);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.usuario.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      return { message: 'Si el correo está registrado, recibirá un enlace de recuperación.' };
    }

    const resetToken = uuidv4();
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + this.RESET_TOKEN_HOURS);

    await this.prisma.passwordResetToken.create({
      data: {
        usuarioId: user.id,
        token: resetToken,
        expiraEn: expirationDate,
      },
    });

    return {
      message: 'Si el correo está registrado, recibirá un enlace de recuperación.',
      resetToken,
      expiresIn: `${this.RESET_TOKEN_HOURS} hora`,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
      include: { usuario: true },
    });

    if (!resetToken) {
      throw new NotFoundException('Token de recuperación no encontrado');
    }

    if (resetToken.usado) {
      throw new BadRequestException('El token de recuperación ya fue utilizado');
    }

    if (new Date() > resetToken.expiraEn) {
      throw new BadRequestException('El token de recuperación ha expirado');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usado: true },
      }),
      this.prisma.usuario.update({
        where: { id: resetToken.usuario.id },
        data: {
          passwordHash,
          intentosFallidos: 0,
          bloqueadoHasta: null,
          estado: 'ACTIVO',
        },
      }),
    ]);

    return {
      message: 'Contraseña restablecida exitosamente.',
    };
  }

  private async generateAuthTokens(user: any) {
    const rolesData = await this.prisma.usuario.findUnique({
      where: { id: user.id },
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

    const roles = rolesData?.roles.map((ur: any) => ur.rol.nombre) || [];
    const permisosSet = new Set<string>();
    for (const ur of rolesData?.roles || []) {
      for (const rp of ur.rol.permisos) {
        permisosSet.add(rp.permiso.nombre);
      }
    }
    const permisos = Array.from(permisosSet);

    const accessToken = this.generateAccessToken(user, roles, permisos);
    const refreshToken = await this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn: this.configService.get<string>('JWT_EXPIRATION'),
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        roles,
        permisos,
      },
    };
  }

  private generateAccessToken(user: any, roles: string[] = [], permisos: string[] = []): string {
    const payload = { sub: user.id, email: user.email, roles, permisos };
    return this.jwtService.sign(payload);
  }

  private async generateRefreshToken(user: any) {
    const token = uuidv4();
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + this.REFRESH_TOKEN_DAYS);

    return this.prisma.refreshToken.create({
      data: {
        usuarioId: user.id,
        token,
        expiraEn: expirationDate,
      },
    });
  }
}
