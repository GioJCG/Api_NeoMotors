import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import type { Request } from 'express';

@ApiTags('Clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador')
  @ApiOperation({ summary: 'Crear cliente' })
  async create(@Body() dto: CreateClienteDto, @Req() req: Request) {
    return this.clientesService.create(dto, req.user as any, req.ip);
  }

  @Get()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Listar clientes de la empresa activa' })
  async findAll(@Req() req: Request) {
    return this.clientesService.findAll(req.user as any);
  }

  @Get(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  async findById(@Param('id') id: string, @Req() req: Request) {
    return this.clientesService.findById(id, req.user as any);
  }

  @Put(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador')
  @ApiOperation({ summary: 'Actualizar cliente' })
  async update(@Param('id') id: string, @Body() dto: UpdateClienteDto, @Req() req: Request) {
    return this.clientesService.update(id, dto, req.user as any, req.ip);
  }

  @Delete(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Desactivar cliente (soft-delete)' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    return this.clientesService.remove(id, req.user as any, req.ip);
  }
}
