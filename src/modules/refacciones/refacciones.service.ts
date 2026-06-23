import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateRefaccionDto } from './dto/create-refaccion.dto';
import { UpdateRefaccionDto } from './dto/update-refaccion.dto';

@Injectable()
export class RefaccionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async create(dto: CreateRefaccionDto, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener una empresa activa');

    const dup = await this.prisma.refaccion.findUnique({
      where: { empresaId_codigo: { empresaId, codigo: dto.codigo } },
    });
    if (dup) throw new ConflictException('Ya existe una refacción con este código en la empresa');

    const refaccion = await this.prisma.refaccion.create({
      data: {
        empresaId,
        codigo: dto.codigo,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        precio: dto.precio ?? 0,
        costo: dto.costo ?? 0,
        unidad: dto.unidad ?? 'PIEZA',
        createdBy: user.id,
      },
    });

    await this.auditoria.registrar({
      usuarioId: user.id, accion: 'CREAR', entidad: 'Refaccion', entidadId: refaccion.id,
      payload: dto as any, contexto: `Empresa: ${empresaId}`, ip,
    });

    return refaccion;
  }

  async findAll(user: { id: string; roles: string[]; companyId?: string | null }) {
    if (user.roles.includes('SuperUsuario')) {
      return this.prisma.refaccion.findMany({
        orderBy: { createdAt: 'desc' },
        include: { empresa: { select: { id: true, nombre: true } } },
      });
    }
    if (!user.companyId) throw new ForbiddenException('Debe tener una empresa activa');
    return this.prisma.refaccion.findMany({
      where: { empresaId: user.companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, user: { id: string; roles: string[]; companyId?: string | null }) {
    const r = await this.prisma.refaccion.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Refacción no encontrada');
    if (!user.roles.includes('SuperUsuario') && r.empresaId !== user.companyId) {
      throw new ForbiddenException('No tiene acceso a esta refacción');
    }
    return r;
  }

  async update(id: string, dto: UpdateRefaccionDto, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const ref = await this.findById(id, user);
    const updated = await this.prisma.refaccion.update({
      where: { id }, data: { ...dto, updatedBy: user.id },
    });
    await this.auditoria.registrar({
      usuarioId: user.id, accion: 'ACTUALIZAR', entidad: 'Refaccion', entidadId: id,
      payload: { antes: ref, despues: dto } as any, contexto: `Empresa: ${ref.empresaId}`, ip,
    });
    return updated;
  }

  async remove(id: string, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    await this.findById(id, user);
    const updated = await this.prisma.refaccion.update({
      where: { id }, data: { estado: 'INACTIVO', updatedBy: user.id },
    });
    await this.auditoria.registrar({
      usuarioId: user.id, accion: 'DESACTIVAR', entidad: 'Refaccion', entidadId: id,
      payload: { estado: 'INACTIVO' }, contexto: `Empresa: ${user.companyId}`, ip,
    });
    return updated;
  }
}
