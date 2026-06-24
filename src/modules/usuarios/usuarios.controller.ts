import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import type { Request } from 'express';

@ApiTags('Usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @Roles('SuperUsuario', 'AdministradorEmpresa')
  @ApiOperation({ summary: 'Crear usuario (Supervisor, Operador o Consulta)' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado.' })
  async create(@Body() dto: CreateUsuarioDto, @Req() req: Request) {
    return this.usuariosService.create(dto, req.user as any, req.ip);
  }

  @Get()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Listar usuarios de la empresa' })
  async findAll(@Req() req: Request) {
    return this.usuariosService.findAll(req.user as any);
  }

  @Get(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  async findById(@Param('id') id: string, @Req() req: Request) {
    return this.usuariosService.findById(id, req.user as any);
  }

  @Put(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa')
  @ApiOperation({ summary: 'Actualizar usuario' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUsuarioDto,
    @Req() req: Request,
  ) {
    return this.usuariosService.update(id, dto, req.user as any, req.ip);
  }

  @Put(':id/toggle-status')
  @Roles('SuperUsuario', 'AdministradorEmpresa')
  @ApiOperation({ summary: 'Activar/Desactivar usuario' })
  async toggleStatus(@Param('id') id: string, @Req() req: Request) {
    return this.usuariosService.toggleStatus(id, req.user as any, req.ip);
  }
}
