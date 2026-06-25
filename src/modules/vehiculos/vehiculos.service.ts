import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';

@Injectable()
export class VehiculosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async create(dto: CreateVehiculoDto, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const empresaId = user.companyId;
    if (!empresaId) {
      throw new ForbiddenException('Debe tener una empresa activa para crear vehículos');
    }

    await this.ensureUniquePlate(empresaId, dto.placa);
    await this.ensureClienteBelongsToEmpresa(dto.clienteId, empresaId);
    await this.ensureModeloBelongsToMarca(dto.marcaId, dto.modeloId);

    const vehiculo = await this.prisma.vehiculo.create({
      data: {
        empresaId,
        clienteId: dto.clienteId,
        marcaId: dto.marcaId,
        modeloId: dto.modeloId,
        placa: dto.placa,
        numeroSerie: dto.numeroSerie,
        anio: dto.anio,
        color: dto.color,
        estado: dto.estado || 'ACTIVO',
        createdBy: user.id,
      },
      include: {
        cliente: { select: { id: true, nombre: true } },
        marca: { select: { id: true, nombre: true } },
        modelo: { select: { id: true, nombre: true } },
      },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'CREAR',
      entidad: 'Vehiculo',
      entidadId: vehiculo.id,
      payload: dto as any,
      contexto: `Empresa: ${empresaId}`,
      ip,
    });

    return vehiculo;
  }

  async findAll(user: { id: string; roles: string[]; companyId?: string | null }) {
    if (user.roles.includes('SuperUsuario')) {
      return this.prisma.vehiculo.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          cliente: { select: { id: true, nombre: true } },
          marca: { select: { id: true, nombre: true } },
          modelo: { select: { id: true, nombre: true } },
        },
      });
    }

    if (!user.companyId) {
      throw new ForbiddenException('Debe tener una empresa activa');
    }

    return this.prisma.vehiculo.findMany({
      where: { empresaId: user.companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: { select: { id: true, nombre: true } },
        marca: { select: { id: true, nombre: true } },
        modelo: { select: { id: true, nombre: true } },
      },
    });
  }

  async findById(id: string, user: { id: string; roles: string[]; companyId?: string | null }) {
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, nombre: true, rfc: true, email: true, telefono: true } },
        marca: { select: { id: true, nombre: true } },
        modelo: { select: { id: true, nombre: true } },
      },
    });

    if (!vehiculo) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    if (!user.roles.includes('SuperUsuario') && vehiculo.empresaId !== user.companyId) {
      throw new ForbiddenException('No tiene acceso a este vehículo');
    }

    return vehiculo;
  }

  async update(id: string, dto: UpdateVehiculoDto, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const vehiculo = await this.findById(id, user);

    if (dto.placa && dto.placa !== vehiculo.placa) {
      await this.ensureUniquePlate(vehiculo.empresaId, dto.placa, id);
    }

    if (dto.clienteId) {
      await this.ensureClienteBelongsToEmpresa(dto.clienteId, vehiculo.empresaId);
    }

    const updated = await this.prisma.vehiculo.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: user.id,
      },
      include: {
        cliente: { select: { id: true, nombre: true } },
        marca: { select: { id: true, nombre: true } },
        modelo: { select: { id: true, nombre: true } },
      },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'ACTUALIZAR',
      entidad: 'Vehiculo',
      entidadId: id,
      payload: { antes: { placa: vehiculo.placa }, despues: dto } as any,
      contexto: `Empresa: ${vehiculo.empresaId}`,
      ip,
    });

    return updated;
  }

  async remove(id: string, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const vehiculo = await this.findById(id, user);

    const updated = await this.prisma.vehiculo.update({
      where: { id },
      data: { estado: 'INACTIVO', updatedBy: user.id },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'DESACTIVAR',
      entidad: 'Vehiculo',
      entidadId: id,
      payload: { estado: 'INACTIVO' },
      contexto: `Empresa: ${vehiculo.empresaId}`,
      ip,
    });

    return updated;
  }

  async findHistory(id: string, user: { id: string; roles: string[]; companyId?: string | null }) {
    await this.findById(id, user);
    // Work orders not yet implemented (Task 7.x) — returns empty for now
    return { workOrders: [], diagnoses: [], partsConsumed: [] };
  }

  async findAllMarcas() {
    return this.prisma.marca.findMany({
      where: { estado: 'ACTIVA' },
      orderBy: { nombre: 'asc' },
    });
  }

  async findModelosByMarca(marcaId: string) {
    return this.prisma.modelo.findMany({
      where: { marcaId, estado: 'ACTIVA' },
      orderBy: { nombre: 'asc' },
    });
  }

  private async ensureUniquePlate(empresaId: string, placa: string, excludeId?: string) {
    const existing = await this.prisma.vehiculo.findFirst({
      where: { empresaId, placa, id: excludeId ? { not: excludeId } : undefined },
    });
    if (existing) {
      throw new ConflictException('Ya existe un vehículo con esta placa en la empresa');
    }
  }

  private async ensureClienteBelongsToEmpresa(clienteId: string, empresaId: string) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente || cliente.empresaId !== empresaId) {
      throw new ConflictException('El cliente no pertenece a la empresa activa');
    }
  }

  private async ensureModeloBelongsToMarca(marcaId: string, modeloId: string) {
    const modelo = await this.prisma.modelo.findUnique({ where: { id: modeloId } });
    if (!modelo || modelo.marcaId !== marcaId) {
      throw new ConflictException('El modelo no pertenece a la marca seleccionada');
    }
  }
}
