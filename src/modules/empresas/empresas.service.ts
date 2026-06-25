import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

@Injectable()
export class EmpresasService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'logos');

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async create(
    dto: CreateEmpresaDto,
    userId: string,
    user: { id: string; roles: string[]; companyId?: string | null },
    ip?: string,
  ) {
    const existing = await this.prisma.empresa.findUnique({
      where: { rfc: dto.rfc },
    });
    if (existing) {
      throw new ConflictException('El RFC ya está registrado');
    }

    const isAdminEmpresa = user.roles.includes('AdministradorEmpresa');

    if (isAdminEmpresa && user.companyId) {
      throw new BadRequestException(
        'El administrador ya tiene una empresa registrada. Solo puede tener una empresa.',
      );
    }

    const empresa = await this.prisma.empresa.create({
      data: {
        nombre: dto.nombre,
        rfc: dto.rfc.toUpperCase(),
        razonSocial: dto.razonSocial,
        codigoPostalFiscal: dto.codigoPostalFiscal,
        regimenFiscal: dto.regimenFiscal,
        logoUrl: dto.logoUrl,
        colorPrimario: dto.colorPrimario,
        colorSecundario: dto.colorSecundario,
        tema: dto.tema,
        createdBy: userId,
      },
    });

    await this.prisma.usuarioEmpresa.create({
      data: {
        usuarioId: userId,
        empresaId: empresa.id,
        activa: true,
        esPropietario: true,
      },
    });

    await this.prisma.usuario.update({
      where: { id: userId },
      data: { companyId: empresa.id },
    });

    const sucursal = await this.prisma.sucursal.create({
      data: {
        empresaId: empresa.id,
        nombre: 'Matriz',
        esMatriz: true,
        createdBy: userId,
      },
    });

    await this.prisma.usuarioSucursal.create({
      data: {
        usuarioId: userId,
        sucursalId: sucursal.id,
        activa: true,
      },
    });

    await this.prisma.usuario.update({
      where: { id: userId },
      data: { branchId: sucursal.id },
    });

    await this.auditoria.registrar({
      usuarioId: userId,
      accion: 'CREATE',
      entidad: 'Empresa',
      entidadId: empresa.id,
      payload: dto,
      ip,
    });

    return {
      ...empresa,
      sucursalDefault: sucursal,
      message: 'Empresa creada exitosamente. Bienvenido a NeoMotors.',
    };
  }

  async saveLogo(file: { buffer: Buffer; originalname: string; mimetype: string; size: number }): Promise<{ url: string; logoUrl: string }> {
    const ext = path.extname(file.originalname) || '.png';
    const filename = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(this.uploadDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    const url = `/uploads/logos/${filename}`;
    return { url, logoUrl: url };
  }

  async findAll(user: {
    id: string;
    roles: string[];
    companyId?: string | null;
  }) {
    if (user.roles.includes('SuperUsuario')) {
      return this.prisma.empresa.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!user.companyId) {
      return [];
    }

    return this.prisma.empresa.findMany({
      where: { id: user.companyId },
    });
  }

  async findById(
    id: string,
    user: { id: string; roles: string[]; companyId?: string | null },
  ) {
    const empresa = await this.prisma.empresa.findUnique({ where: { id } });

    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada');
    }

    if (!user.roles.includes('SuperUsuario') && user.companyId !== id) {
      throw new ForbiddenException('No tiene acceso a esta empresa');
    }

    return empresa;
  }

  async update(
    id: string,
    dto: UpdateEmpresaDto,
    user: { id: string; roles: string[]; companyId?: string | null },
    ip?: string,
  ) {
    await this.findById(id, user);

    const empresa = await this.prisma.empresa.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.rfc && { rfc: dto.rfc.toUpperCase() }),
        updatedBy: user.id,
      },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'UPDATE',
      entidad: 'Empresa',
      entidadId: id,
      payload: dto,
      contexto: id,
      ip,
    });

    return empresa;
  }

  async remove(id: string, user: { id: string; roles: string[] }, ip?: string) {
    if (!user.roles.includes('SuperUsuario')) {
      throw new ForbiddenException(
        'Solo el SuperUsuario puede eliminar empresas',
      );
    }

    const empresa = await this.prisma.empresa.findUnique({ where: { id } });
    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada');
    }

    await this.prisma.empresa.update({
      where: { id },
      data: { estado: 'INACTIVA', updatedBy: user.id },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'DELETE',
      entidad: 'Empresa',
      entidadId: id,
      payload: { estado: 'INACTIVA' },
      contexto: id,
      ip,
    });

    return { message: 'Empresa desactivada exitosamente' };
  }
}
