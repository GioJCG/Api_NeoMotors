import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateReceptionDto } from './dto/create-reception.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WorkOrdersService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'recepciones');

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async createReception(dto: CreateReceptionDto, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const empresaId = user.companyId;
    if (!empresaId) {
      throw new ForbiddenException('Debe tener una empresa activa para realizar una recepción');
    }

    await this.ensureClienteBelongsToEmpresa(dto.clienteId, empresaId);
    await this.ensureVehiculoBelongsToEmpresa(dto.vehiculoId, empresaId);

    // Generate folio for the work order
    const folio = await this.generateFolio(empresaId);

    // Create reception + work order in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const recepcion = await tx.recepcionVehiculo.create({
        data: {
          empresaId,
          sucursalId: dto.sucursalId,
          citaId: dto.citaId,
          clienteId: dto.clienteId,
          vehiculoId: dto.vehiculoId,
          kilometraje: dto.kilometraje,
          nivelCombustible: dto.nivelCombustible,
          componentesFaltantes: dto.componentesFaltantes ? JSON.stringify(dto.componentesFaltantes) : null,
          daniosCarroceria: dto.daniosCarroceria,
          createdBy: user.id,
        },
      });

      // Save photos
      if (dto.fotos && dto.fotos.length > 0) {
        const photoRecords = dto.fotos.slice(0, 4).map((base64, index) => {
          const filename = `${recepcion.id}_${index}.png`;
          const filePath = path.join(this.uploadDir, filename);
          const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          fs.writeFileSync(filePath, buffer);
          return {
            recepcionId: recepcion.id,
            url: `/uploads/recepciones/${filename}`,
            orden: index,
          };
        });
        await tx.recepcionFoto.createMany({ data: photoRecords });
      }

      const orden = await tx.ordenTrabajo.create({
        data: {
          empresaId,
          sucursalId: dto.sucursalId,
          clienteId: dto.clienteId,
          vehiculoId: dto.vehiculoId,
          recepcionId: recepcion.id,
          folio,
          estado: 'RECIBIDO',
          descripcion: `Recepción de vehículo - Folio: ${folio}`,
          createdBy: user.id,
        },
      });

      return { recepcion, orden };
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'RECEPCIONAR',
      entidad: 'OrdenTrabajo',
      entidadId: result.orden.id,
      payload: { folio: result.orden.folio, recepcionId: result.recepcion.id } as any,
      contexto: `Empresa: ${empresaId}`,
      ip,
    });

    return {
      reception: result.recepcion,
      workOrder: result.orden,
      folio: result.orden.folio,
    };
  }

  async findAll(user: { id: string; roles: string[]; companyId?: string | null }) {
    if (user.roles.includes('SuperUsuario')) {
      return this.prisma.ordenTrabajo.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          cliente: { select: { id: true, nombre: true } },
          vehiculo: { select: { id: true, placa: true } },
          recepcion: true,
        },
      });
    }

    if (!user.companyId) {
      throw new ForbiddenException('Debe tener una empresa activa');
    }

    return this.prisma.ordenTrabajo.findMany({
      where: { empresaId: user.companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: { select: { id: true, nombre: true } },
        vehiculo: { select: { id: true, placa: true } },
        recepcion: true,
      },
    });
  }

  async findById(id: string, user: { id: string; roles: string[]; companyId?: string | null }) {
    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true, email: true } },
        vehiculo: {
          select: { id: true, placa: true, numeroSerie: true, marca: { select: { nombre: true } }, modelo: { select: { nombre: true } } },
        },
        recepcion: { include: { fotos: { orderBy: { orden: 'asc' } } } },
      },
    });

    if (!orden) {
      throw new NotFoundException('Orden de trabajo no encontrada');
    }

    if (!user.roles.includes('SuperUsuario') && orden.empresaId !== user.companyId) {
      throw new ForbiddenException('No tiene acceso a esta orden');
    }

    return orden;
  }

  private async generateFolio(empresaId: string): Promise<string> {
    const count = await this.prisma.ordenTrabajo.count({ where: { empresaId } });
    const year = new Date().getFullYear();
    return `OT-${year}-${String(count + 1).padStart(5, '0')}`;
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
