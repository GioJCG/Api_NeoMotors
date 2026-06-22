import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async create(dto: CreateClienteDto, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const empresaId = user.companyId;
    if (!empresaId) {
      throw new ForbiddenException('Debe tener una empresa activa para crear clientes');
    }

    await this.ensureUnique(empresaId, dto.rfc, dto.email);

    const cliente = await this.prisma.cliente.create({
      data: {
        empresaId,
        nombre: dto.nombre,
        rfc: dto.rfc,
        email: dto.email,
        telefono: dto.telefono,
        direccion: dto.direccion,
        estado: dto.estado || 'ACTIVO',
        createdBy: user.id,
      },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'CREAR',
      entidad: 'Cliente',
      entidadId: cliente.id,
      payload: dto as any,
      contexto: `Empresa: ${empresaId}`,
      ip,
    });

    return cliente;
  }

  async findAll(user: { id: string; roles: string[]; companyId?: string | null }) {
    if (user.roles.includes('SuperUsuario')) {
      return this.prisma.cliente.findMany({
        orderBy: { createdAt: 'desc' },
        include: { empresa: { select: { id: true, nombre: true } } },
      });
    }

    if (!user.companyId) {
      throw new ForbiddenException('Debe tener una empresa activa');
    }

    return this.prisma.cliente.findMany({
      where: { empresaId: user.companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, user: { id: string; roles: string[]; companyId?: string | null }) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id } });
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (!user.roles.includes('SuperUsuario') && cliente.empresaId !== user.companyId) {
      throw new ForbiddenException('No tiene acceso a este cliente');
    }

    return cliente;
  }

  async update(id: string, dto: UpdateClienteDto, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const cliente = await this.findById(id, user);

    if (dto.rfc || dto.email) {
      await this.ensureUnique(cliente.empresaId, dto.rfc ?? undefined, dto.email ?? undefined, id);
    }

    const updated = await this.prisma.cliente.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: user.id,
      },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'ACTUALIZAR',
      entidad: 'Cliente',
      entidadId: id,
      payload: { antes: cliente, despues: dto } as any,
      contexto: `Empresa: ${cliente.empresaId}`,
      ip,
    });

    return updated;
  }

  async remove(id: string, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const cliente = await this.findById(id, user);

    const updated = await this.prisma.cliente.update({
      where: { id },
      data: { estado: 'INACTIVO', updatedBy: user.id },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'DESACTIVAR',
      entidad: 'Cliente',
      entidadId: id,
      payload: { estado: 'INACTIVO' },
      contexto: `Empresa: ${cliente.empresaId}`,
      ip,
    });

    return updated;
  }

  private async ensureUnique(empresaId: string, rfc?: string, email?: string, excludeId?: string) {
    if (rfc) {
      const existing = await this.prisma.cliente.findFirst({
        where: { empresaId, rfc, id: excludeId ? { not: excludeId } : undefined },
      });
      if (existing) {
        throw new ConflictException('Ya existe un cliente con este RFC en la empresa');
      }
    }

    if (email) {
      const existing = await this.prisma.cliente.findFirst({
        where: { empresaId, email, id: excludeId ? { not: excludeId } : undefined },
      });
      if (existing) {
        throw new ConflictException('Ya existe un cliente con este email en la empresa');
      }
    }
  }
}
