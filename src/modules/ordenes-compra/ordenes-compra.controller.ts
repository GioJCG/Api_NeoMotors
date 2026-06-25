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
import { OrdenesCompraService } from './ordenes-compra.service';
import { CreateOrdenCompraDto } from './dto/create-orden-compra.dto';
import { UpdateOrdenCompraDto } from './dto/update-orden-compra.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import type { Request } from 'express';

@ApiTags('Órdenes de Compra')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('purchase-orders')
export class OrdenesCompraController {
  constructor(private readonly ordenesCompraService: OrdenesCompraService) {}

  @Post()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Crear orden de compra con cálculo automático' })
  create(@Body() dto: CreateOrdenCompraDto, @Req() req: Request) {
    return this.ordenesCompraService.create(dto, req.user as any, req.ip);
  }

  @Get()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Consulta')
  @ApiOperation({ summary: 'Listar órdenes de compra' })
  findAll(@Req() req: Request) {
    return this.ordenesCompraService.findAll(req.user as any);
  }

  @Get(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Consulta')
  @ApiOperation({ summary: 'Obtener orden de compra por ID' })
  findById(@Param('id') id: string, @Req() req: Request) {
    return this.ordenesCompraService.findById(id, req.user as any);
  }

  @Put(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Actualizar orden de compra o cambiar estado' })
  update(@Param('id') id: string, @Body() dto: UpdateOrdenCompraDto, @Req() req: Request) {
    return this.ordenesCompraService.update(id, dto, req.user as any, req.ip);
  }

  @Delete(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa')
  @ApiOperation({ summary: 'Cancelar orden de compra' })
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.ordenesCompraService.remove(id, req.user as any, req.ip);
  }
}
