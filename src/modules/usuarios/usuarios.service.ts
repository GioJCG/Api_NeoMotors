import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

const ROLES_PERMITIDOS = ['SupervisorSucursal', 'Operador', 'Consulta'];

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);
  private readonly SALT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async create(
    dto: CreateUsuarioDto,
    user: { id: string; roles: string[]; companyId?: string | null },
    ip?: string,
  ) {
    if (!user.companyId) {
      throw new BadRequestException(
        'Debe tener una empresa activa para crear usuarios',
      );
    }

    if (!ROLES_PERMITIDOS.includes(dto.rol)) {
      throw new BadRequestException(
        `El rol debe ser uno de: ${ROLES_PERMITIDOS.join(', ')}`,
      );
    }

    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const sucursal = await this.prisma.sucursal.findUnique({
      where: { id: dto.sucursalId },
    });
    if (!sucursal || sucursal.empresaId !== user.companyId) {
      throw new NotFoundException('Sucursal no encontrada en su empresa');
    }

    const rol = await this.prisma.rol.findUnique({
      where: { nombre: dto.rol },
    });
    if (!rol) {
      throw new NotFoundException(`Rol ${dto.rol} no encontrado`);
    }

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const nuevoUsuario = await this.prisma.usuario.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        nombre: dto.nombre,
        estado: 'ACTIVO',
        createdBy: user.id,
        companyId: user.companyId,
        branchId: dto.sucursalId,
        roles: {
          create: {
            rolId: rol.id,
            companyId: user.companyId,
          },
        },
        empresasAsignadas: {
          create: {
            empresaId: user.companyId,
            activa: true,
            esPropietario: false,
          },
        },
        sucursalesAsignadas: {
          create: {
            sucursalId: dto.sucursalId,
            activa: true,
          },
        },
      },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'CREATE',
      entidad: 'Usuario',
      entidadId: nuevoUsuario.id,
      payload: { email: dto.email, rol: dto.rol, sucursalId: dto.sucursalId },
      contexto: user.companyId,
      ip,
    });

    this.logger.log(`Usuario ${nuevoUsuario.email} creado con rol ${dto.rol}`);

    return {
      id: nuevoUsuario.id,
      email: nuevoUsuario.email,
      nombre: nuevoUsuario.nombre,
      rol: dto.rol,
      sucursalId: dto.sucursalId,
      estado: nuevoUsuario.estado,
    };
  }

  async findAll(
    user: { id: string; roles: string[]; companyId?: string | null },
  ) {
    if (!user.companyId) {
      return [];
    }

    const usuarios = await this.prisma.usuario.findMany({
      where: {
        empresasAsignadas: {
          some: { empresaId: user.companyId },
        },
      },
      include: {
        roles: {
          include: { rol: true },
        },
        sucursalesAsignadas: {
          include: { sucursal: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return usuarios.map((u) => ({
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      estado: u.estado,
      roles: u.roles.map((ur) => ur.rol.nombre),
      sucursales: u.sucursalesAsignadas.map((us) => ({
        id: us.sucursal.id,
        nombre: us.sucursal.nombre,
        activa: us.activa,
      })),
      createdAt: u.createdAt,
    }));
  }

  async findById(
    id: string,
    user: { id: string; roles: string[]; companyId?: string | null },
  ) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        roles: {
          include: { rol: true },
        },
        empresasAsignadas: true,
        sucursalesAsignadas: {
          include: { sucursal: true },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (
      !user.roles.includes('SuperUsuario') &&
      !usuario.empresasAsignadas.some((ue) => ue.empresaId === user.companyId)
    ) {
      throw new ForbiddenException('No tiene acceso a este usuario');
    }

    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      estado: usuario.estado,
      roles: usuario.roles.map((ur) => ur.rol.nombre),
      sucursales: usuario.sucursalesAsignadas.map((us) => ({
        id: us.sucursal.id,
        nombre: us.sucursal.nombre,
        activa: us.activa,
      })),
      createdAt: usuario.createdAt,
    };
  }

  async update(
    id: string,
    dto: UpdateUsuarioDto,
    user: { id: string; roles: string[]; companyId?: string | null },
    ip?: string,
  ) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: { empresasAsignadas: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (
      !user.roles.includes('SuperUsuario') &&
      !usuario.empresasAsignadas.some((ue) => ue.empresaId === user.companyId)
    ) {
      throw new ForbiddenException('No tiene acceso a este usuario');
    }

    const updateData: any = {};
    if (dto.nombre) updateData.nombre = dto.nombre;
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    }
    updateData.updatedBy = user.id;

    await this.prisma.usuario.update({
      where: { id },
      data: updateData,
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'UPDATE',
      entidad: 'Usuario',
      entidadId: id,
      payload: dto,
      contexto: user.companyId ?? undefined,
      ip,
    });

    return { message: 'Usuario actualizado exitosamente' };
  }

  async toggleStatus(
    id: string,
    user: { id: string; roles: string[]; companyId?: string | null },
    ip?: string,
  ) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: { empresasAsignadas: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (
      !user.roles.includes('SuperUsuario') &&
      !usuario.empresasAsignadas.some((ue) => ue.empresaId === user.companyId)
    ) {
      throw new ForbiddenException('No tiene acceso a este usuario');
    }

    const nuevoEstado = usuario.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    await this.prisma.usuario.update({
      where: { id },
      data: { estado: nuevoEstado, updatedBy: user.id },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'UPDATE',
      entidad: 'Usuario',
      entidadId: id,
      payload: { estado: nuevoEstado },
      contexto: user.companyId ?? undefined,
      ip,
    });

    return {
      message: `Usuario ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'} exitosamente`,
      estado: nuevoEstado,
    };
  }
}
