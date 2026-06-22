import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';

@Injectable()
export class SucursalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  private async ensureEmpresaExists(empresaId: string) {
    const empresa = await this.prisma.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada');
    }
    return empresa;
  }

  private async handleMatrizFlag(empresaId: string, sucursalId?: string) {
    await this.prisma.sucursal.updateMany({
      where: {
        empresaId,
        esMatriz: true,
        ...(sucursalId ? { id: { not: sucursalId } } : {}),
      },
      data: { esMatriz: false },
    });
  }

  async create(dto: CreateSucursalDto, empresaId: string, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    if (!user.roles.includes('SuperUsuario') && user.companyId !== empresaId) {
      throw new ForbiddenException('No tiene permiso para crear sucursales en esta empresa');
    }

    await this.ensureEmpresaExists(empresaId);

    if (dto.esMatriz) {
      await this.handleMatrizFlag(empresaId);
    }

    const sucursal = await this.prisma.sucursal.create({
      data: {
        empresaId,
        nombre: dto.nombre,
        direccion: dto.direccion,
        telefono: dto.telefono,
        esMatriz: dto.esMatriz ?? false,
        latitud: dto.latitud,
        longitud: dto.longitud,
        createdBy: user.id,
      },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'CREATE',
      entidad: 'Sucursal',
      entidadId: sucursal.id,
      payload: dto,
      contexto: empresaId,
      ip,
    });

    return sucursal;
  }

  async findAll(empresaId: string, user: { id: string; roles: string[]; companyId?: string | null }) {
    if (!user.roles.includes('SuperUsuario') && user.companyId !== empresaId) {
      throw new ForbiddenException('No tiene acceso a esta empresa');
    }

    await this.ensureEmpresaExists(empresaId);

    return this.prisma.sucursal.findMany({
      where: { empresaId },
      orderBy: [{ esMatriz: 'desc' }, { nombre: 'asc' }],
    });
  }

  async findById(id: string, user: { id: string; roles: string[]; companyId?: string | null }) {
    const sucursal = await this.prisma.sucursal.findUnique({ where: { id } });

    if (!sucursal) {
      throw new NotFoundException('Sucursal no encontrada');
    }

    if (!user.roles.includes('SuperUsuario') && user.companyId !== sucursal.empresaId) {
      throw new ForbiddenException('No tiene acceso a esta sucursal');
    }

    return sucursal;
  }

  async update(id: string, dto: UpdateSucursalDto, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const sucursal = await this.findById(id, user);

    if (dto.esMatriz) {
      await this.handleMatrizFlag(sucursal.empresaId, id);
    }

    const updated = await this.prisma.sucursal.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: user.id,
      },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'UPDATE',
      entidad: 'Sucursal',
      entidadId: id,
      payload: dto,
      contexto: sucursal.empresaId,
      ip,
    });

    return updated;
  }

  async remove(id: string, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const sucursal = await this.findById(id, user);

    if (sucursal.esMatriz) {
      throw new BadRequestException('No se puede desactivar la sucursal matriz. Asigne otra como matriz primero.');
    }

    await this.prisma.sucursal.update({
      where: { id },
      data: { estado: 'INACTIVA', updatedBy: user.id },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'DELETE',
      entidad: 'Sucursal',
      entidadId: id,
      payload: { estado: 'INACTIVA' },
      contexto: sucursal.empresaId,
      ip,
    });

    return { message: 'Sucursal desactivada exitosamente' };
  }
}
