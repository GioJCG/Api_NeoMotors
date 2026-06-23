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
import { ProveedoresService } from './proveedores.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import type { Request } from 'express';

@ApiTags('Proveedores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('suppliers')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Post()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Crear proveedor' })
  create(@Body() dto: CreateProveedorDto, @Req() req: Request) {
    return this.proveedoresService.create(dto, req.user as any, req.ip);
  }

  @Get()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Listar proveedores de la empresa activa' })
  findAll(@Req() req: Request) {
    return this.proveedoresService.findAll(req.user as any);
  }

  @Get(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Obtener proveedor por ID' })
  findById(@Param('id') id: string, @Req() req: Request) {
    return this.proveedoresService.findById(id, req.user as any);
  }

  @Put(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Actualizar proveedor' })
  update(@Param('id') id: string, @Body() dto: UpdateProveedorDto, @Req() req: Request) {
    return this.proveedoresService.update(id, dto, req.user as any, req.ip);
  }

  @Delete(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa')
  @ApiOperation({ summary: 'Desactivar proveedor (soft-delete)' })
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.proveedoresService.remove(id, req.user as any, req.ip);
  }
}
