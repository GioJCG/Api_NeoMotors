import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@Injectable()
export class ProveedoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async create(dto: CreateProveedorDto, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener una empresa activa');

    if (dto.rfc) {
      const dup = await this.prisma.proveedor.findFirst({
        where: { empresaId, rfc: dto.rfc },
      });
      if (dup) throw new ConflictException('Ya existe un proveedor con este RFC en la empresa');
    }

    const proveedor = await this.prisma.proveedor.create({
      data: {
        empresaId,
        nombre: dto.nombre,
        rfc: dto.rfc,
        email: dto.email,
        telefono: dto.telefono,
        direccion: dto.direccion,
        contacto: dto.contacto,
        estado: 'ACTIVO',
        createdBy: user.id,
      },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'CREAR',
      entidad: 'Proveedor',
      entidadId: proveedor.id,
      payload: dto as any,
      contexto: `Empresa: ${empresaId}`,
      ip,
    });

    return proveedor;
  }

  async findAll(user: { id: string; roles: string[]; companyId?: string | null }) {
    if (user.roles.includes('SuperUsuario')) {
      return this.prisma.proveedor.findMany({
        orderBy: { createdAt: 'desc' },
        include: { empresa: { select: { id: true, nombre: true } } },
      });
    }
    if (!user.companyId) throw new ForbiddenException('Debe tener una empresa activa');
    return this.prisma.proveedor.findMany({
      where: { empresaId: user.companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, user: { id: string; roles: string[]; companyId?: string | null }) {
    const proveedor = await this.prisma.proveedor.findUnique({ where: { id } });
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado');
    if (!user.roles.includes('SuperUsuario') && proveedor.empresaId !== user.companyId) {
      throw new ForbiddenException('No tiene acceso a este proveedor');
    }
    return proveedor;
  }

  async update(id: string, dto: UpdateProveedorDto, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const proveedor = await this.findById(id, user);

    const updated = await this.prisma.proveedor.update({
      where: { id },
      data: { ...dto, updatedBy: user.id },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'ACTUALIZAR',
      entidad: 'Proveedor',
      entidadId: id,
      payload: { antes: proveedor, despues: dto } as any,
      contexto: `Empresa: ${proveedor.empresaId}`,
      ip,
    });

    return updated;
  }

  async remove(id: string, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const proveedor = await this.findById(id, user);

    const updated = await this.prisma.proveedor.update({
      where: { id },
      data: { estado: 'INACTIVO', updatedBy: user.id },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'DESACTIVAR',
      entidad: 'Proveedor',
      entidadId: id,
      payload: { estado: 'INACTIVO' },
      contexto: `Empresa: ${proveedor.empresaId}`,
      ip,
    });

    return updated;
  }
}
