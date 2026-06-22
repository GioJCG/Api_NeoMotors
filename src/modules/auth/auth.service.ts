import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyDto } from './dto/verify.dto';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly TOKEN_EXPIRATION_HOURS = 24;

  constructor(private readonly prisma: PrismaService) {}

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
}
