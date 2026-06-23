import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import type { Request } from 'express';

@ApiTags('Vehículos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Post()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador')
  @ApiOperation({ summary: 'Crear vehículo' })
  create(@Body() dto: CreateVehiculoDto, @Req() req: Request) {
    return this.vehiculosService.create(dto, req.user as any, req.ip);
  }

  @Get()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Listar vehículos' })
  findAll(@Req() req: Request) {
    return this.vehiculosService.findAll(req.user as any);
  }

  // Static catalog routes must come before :id routes
  @Get('catalog/marcas')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Listar marcas disponibles' })
  findAllMarcas() {
    return this.vehiculosService.findAllMarcas();
  }

  @Get('catalog/marcas/:marcaId/modelos')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Listar modelos por marca' })
  findModelosByMarca(@Param('marcaId') marcaId: string) {
    return this.vehiculosService.findModelosByMarca(marcaId);
  }

  @Get(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Obtener vehículo por ID' })
  findById(@Param('id') id: string, @Req() req: Request) {
    return this.vehiculosService.findById(id, req.user as any);
  }

  @Get(':id/history')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Historial de mantenimiento del vehículo' })
  findHistory(@Param('id') id: string, @Req() req: Request) {
    return this.vehiculosService.findHistory(id, req.user as any);
  }

  @Put(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador')
  @ApiOperation({ summary: 'Actualizar vehículo' })
  update(@Param('id') id: string, @Body() dto: UpdateVehiculoDto, @Req() req: Request) {
    return this.vehiculosService.update(id, dto, req.user as any, req.ip);
  }

  @Delete(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Desactivar vehículo' })
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.vehiculosService.remove(id, req.user as any, req.ip);
  }
}
