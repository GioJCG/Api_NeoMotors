import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { UpdateCitaDto } from './dto/update-cita.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CitasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateCitaDto, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const empresaId = user.companyId;
    if (!empresaId) {
      throw new ForbiddenException('Debe tener una empresa activa para crear citas');
    }

    await this.ensureClienteBelongsToEmpresa(dto.clienteId, empresaId);
    await this.ensureVehiculoBelongsToEmpresa(dto.vehiculoId, empresaId);

    const cita = await this.prisma.cita.create({
      data: {
        empresaId,
        sucursalId: dto.sucursalId,
        clienteId: dto.clienteId,
        vehiculoId: dto.vehiculoId,
        fecha: new Date(dto.fecha),
        hora: dto.hora,
        notas: dto.notas,
        createdBy: user.id,
      },
      include: {
        cliente: { select: { id: true, nombre: true, email: true } },
        vehiculo: { select: { id: true, placa: true } },
        sucursal: { select: { id: true, nombre: true } },
      },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'CREAR',
      entidad: 'Cita',
      entidadId: cita.id,
      payload: dto as any,
      contexto: `Empresa: ${empresaId}`,
      ip,
    });

    // Disparar evento asíncrono para confirmación por email
    this.eventEmitter.emit('cita.creada', {
      citaId: cita.id,
      email: cita.cliente?.email,
      clienteNombre: cita.cliente?.nombre,
      fecha: cita.fecha,
      hora: cita.hora,
    });

    return cita;
  }

  async findAll(user: { id: string; roles: string[]; companyId?: string | null }, filters?: { fecha?: string; sucursalId?: string }) {
    const where: any = {};

    if (!user.roles.includes('SuperUsuario')) {
      if (!user.companyId) {
        throw new ForbiddenException('Debe tener una empresa activa');
      }
      where.empresaId = user.companyId;
    }

    if (filters?.fecha) {
      const start = new Date(filters.fecha);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.fecha);
      end.setHours(23, 59, 59, 999);
      where.fecha = { gte: start, lte: end };
    }

    if (filters?.sucursalId) {
      where.sucursalId = filters.sucursalId;
    }

    return this.prisma.cita.findMany({
      where,
      orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
        vehiculo: {
          select: { id: true, placa: true, marca: { select: { nombre: true } }, modelo: { select: { nombre: true } } },
        },
        sucursal: { select: { id: true, nombre: true } },
      },
    });
  }

  async findById(id: string, user: { id: string; roles: string[]; companyId?: string | null }) {
    const cita = await this.prisma.cita.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, nombre: true, email: true, telefono: true } },
        vehiculo: {
          select: { id: true, placa: true, numeroSerie: true, marca: { select: { nombre: true } }, modelo: { select: { nombre: true } } },
        },
        sucursal: { select: { id: true, nombre: true } },
      },
    });

    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (!user.roles.includes('SuperUsuario') && cita.empresaId !== user.companyId) {
      throw new ForbiddenException('No tiene acceso a esta cita');
    }

    return cita;
  }

  async update(id: string, dto: UpdateCitaDto, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    await this.findById(id, user);

    const data: any = { ...dto, updatedBy: user.id };
    if (dto.fecha) data.fecha = new Date(dto.fecha);

    const updated = await this.prisma.cita.update({
      where: { id },
      data,
      include: {
        cliente: { select: { id: true, nombre: true } },
        vehiculo: { select: { id: true, placa: true } },
        sucursal: { select: { id: true, nombre: true } },
      },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'ACTUALIZAR',
      entidad: 'Cita',
      entidadId: id,
      payload: dto as any,
      contexto: `Empresa: ${user.companyId}`,
      ip,
    });

    return updated;
  }

  async remove(id: string, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    await this.findById(id, user);

    const deleted = await this.prisma.cita.delete({
      where: { id },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'ELIMINAR',
      entidad: 'Cita',
      entidadId: id,
      payload: { estado: 'ELIMINADA' },
      contexto: `Empresa: ${user.companyId}`,
      ip,
    });

    return deleted;
  }

  async getAvailability(user: { id: string; roles: string[]; companyId?: string | null }, fecha: string, sucursalId?: string) {
    const where: any = { estado: { notIn: ['CANCELADA', 'COMPLETADA'] } };

    if (!user.roles.includes('SuperUsuario') && user.companyId) {
      where.empresaId = user.companyId;
    }

    if (fecha) {
      const start = new Date(fecha);
      start.setHours(0, 0, 0, 0);
      const end = new Date(fecha);
      end.setHours(23, 59, 59, 999);
      where.fecha = { gte: start, lte: end };
    }

    if (sucursalId) {
      where.sucursalId = sucursalId;
    }

    const citas = await this.prisma.cita.findMany({
      where,
      select: { hora: true, sucursalId: true },
    });

    // Return occupied slots grouped by sucursal
    return { occupiedSlots: citas.map((c) => ({ hora: c.hora, sucursalId: c.sucursalId })) };
  }

  private async ensureClienteBelongsToEmpresa(clienteId: string, empresaId: string) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente || cliente.empresaId !== empresaId) {
      throw new ForbiddenException('El cliente no pertenece a la empresa activa');
    }
  }

  private async ensureVehiculoBelongsToEmpresa(vehiculoId: string, empresaId: string) {
    const vehiculo = await this.prisma.vehiculo.findUnique({ where: { id: vehiculoId } });
    if (!vehiculo || vehiculo.empresaId !== empresaId) {
      throw new ForbiddenException('El vehículo no pertenece a la empresa activa');
    }
  }
}
