import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

@Injectable()
export class EmpresasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async create(dto: CreateEmpresaDto, userId: string, ip?: string) {
    const existing = await this.prisma.empresa.findUnique({ where: { rfc: dto.rfc } });
    if (existing) {
      throw new ConflictException('El RFC ya está registrado');
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

    await this.auditoria.registrar({
      usuarioId: userId,
      accion: 'CREATE',
      entidad: 'Empresa',
      entidadId: empresa.id,
      payload: dto,
      ip,
    });

    return empresa;
  }

  async findAll(user: { id: string; roles: string[]; companyId?: string | null }) {
    if (user.roles.includes('SuperUsuario')) {
      return this.prisma.empresa.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!user.companyId) {
      throw new ForbiddenException('El usuario no está asignado a ninguna empresa');
    }

    return this.prisma.empresa.findMany({
      where: { id: user.companyId },
    });
  }

  async findById(id: string, user: { id: string; roles: string[]; companyId?: string | null }) {
    const empresa = await this.prisma.empresa.findUnique({ where: { id } });

    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada');
    }

    if (!user.roles.includes('SuperUsuario') && user.companyId !== id) {
      throw new ForbiddenException('No tiene acceso a esta empresa');
    }

    return empresa;
  }

  async update(id: string, dto: UpdateEmpresaDto, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
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
      throw new ForbiddenException('Solo el SuperUsuario puede eliminar empresas');
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
