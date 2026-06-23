import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkOrdersService } from './work-orders.service';
import { CreateReceptionDto } from './dto/create-reception.dto';
import { CreateDiagnosticoDto } from './dto/create-diagnostico.dto';
import { TrackTimeDto } from './dto/track-time.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-status.dto';
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

  @Post(':id/diagnose')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador')
  @ApiOperation({ summary: 'Registrar diagnóstico técnico' })
  diagnose(@Param('id') id: string, @Body() dto: CreateDiagnosticoDto, @Req() req: Request) {
    return this.workOrdersService.diagnose(id, dto, req.user as any, req.ip);
  }

  @Get(':id/diagnoses')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Listar diagnósticos de la orden' })
  getDiagnosticos(@Param('id') id: string, @Req() req: Request) {
    return this.workOrdersService.getDiagnosticos(id, req.user as any);
  }

  @Post(':id/track-time')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador')
  @ApiOperation({ summary: 'Control de tiempo (play/pause/stop)' })
  trackTime(@Param('id') id: string, @Body() dto: TrackTimeDto, @Req() req: Request) {
    return this.workOrdersService.trackTime(id, dto, req.user as any, req.ip);
  }

  @Get(':id/time-records')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Obtener registros de tiempo' })
  getTimeRecords(@Param('id') id: string, @Req() req: Request) {
    return this.workOrdersService.getTimeRecords(id, req.user as any);
  }

  @Put(':id/status')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Actualizar estado de la orden de trabajo' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateWorkOrderStatusDto, @Req() req: Request) {
    return this.workOrdersService.updateStatus(id, dto, req.user as any, req.ip);
  }
}
