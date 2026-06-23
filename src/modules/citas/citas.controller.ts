import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CitasService } from './citas.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { UpdateCitaDto } from './dto/update-cita.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import type { Request } from 'express';

@ApiTags('Citas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  @Post()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador')
  @ApiOperation({ summary: 'Crear cita' })
  create(@Body() dto: CreateCitaDto, @Req() req: Request) {
    return this.citasService.create(dto, req.user as any, req.ip);
  }

  @Get()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Listar citas' })
  @ApiQuery({ name: 'fecha', required: false })
  @ApiQuery({ name: 'sucursalId', required: false })
  findAll(@Req() req: Request, @Query('fecha') fecha?: string, @Query('sucursalId') sucursalId?: string) {
    return this.citasService.findAll(req.user as any, { fecha, sucursalId });
  }

  @Get('availability')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Consultar disponibilidad de horarios' })
  @ApiQuery({ name: 'fecha', required: true })
  @ApiQuery({ name: 'sucursalId', required: false })
  getAvailability(@Req() req: Request, @Query('fecha') fecha: string, @Query('sucursalId') sucursalId?: string) {
    return this.citasService.getAvailability(req.user as any, fecha, sucursalId);
  }

  @Get(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Obtener cita por ID' })
  findById(@Param('id') id: string, @Req() req: Request) {
    return this.citasService.findById(id, req.user as any);
  }

  @Put(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador')
  @ApiOperation({ summary: 'Actualizar cita' })
  update(@Param('id') id: string, @Body() dto: UpdateCitaDto, @Req() req: Request) {
    return this.citasService.update(id, dto, req.user as any, req.ip);
  }

  @Delete(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Eliminar cita' })
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.citasService.remove(id, req.user as any, req.ip);
  }
}
