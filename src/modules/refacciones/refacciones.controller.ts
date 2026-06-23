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
import { RefaccionesService } from './refacciones.service';
import { CreateRefaccionDto } from './dto/create-refaccion.dto';
import { UpdateRefaccionDto } from './dto/update-refaccion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import type { Request } from 'express';

@ApiTags('Refacciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('parts')
export class RefaccionesController {
  constructor(private readonly refaccionesService: RefaccionesService) {}

  @Post()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Crear refacción' })
  create(@Body() dto: CreateRefaccionDto, @Req() req: Request) {
    return this.refaccionesService.create(dto, req.user as any, req.ip);
  }

  @Get()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Listar refacciones' })
  findAll(@Req() req: Request) {
    return this.refaccionesService.findAll(req.user as any);
  }

  @Get(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Obtener refacción por ID' })
  findById(@Param('id') id: string, @Req() req: Request) {
    return this.refaccionesService.findById(id, req.user as any);
  }

  @Put(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Actualizar refacción' })
  update(@Param('id') id: string, @Body() dto: UpdateRefaccionDto, @Req() req: Request) {
    return this.refaccionesService.update(id, dto, req.user as any, req.ip);
  }

  @Delete(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa')
  @ApiOperation({ summary: 'Desactivar refacción' })
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.refaccionesService.remove(id, req.user as any, req.ip);
  }
}
