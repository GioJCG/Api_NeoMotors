import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkOrdersService } from './work-orders.service';
import { CreateReceptionDto } from './dto/create-reception.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import type { Request } from 'express';

@ApiTags('Órdenes de Trabajo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post('reception')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador')
  @ApiOperation({ summary: 'Registrar recepción de vehículo y generar orden de trabajo' })
  createReception(@Body() dto: CreateReceptionDto, @Req() req: Request) {
    return this.workOrdersService.createReception(dto, req.user as any, req.ip);
  }

  @Get()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Listar órdenes de trabajo' })
  findAll(@Req() req: Request) {
    return this.workOrdersService.findAll(req.user as any);
  }

  @Get(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Obtener orden de trabajo por ID' })
  findById(@Param('id') id: string, @Req() req: Request) {
    return this.workOrdersService.findById(id, req.user as any);
  }
}
