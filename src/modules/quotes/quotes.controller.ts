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
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import type { Request } from 'express';

@ApiTags('Cotizaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador')
  @ApiOperation({ summary: 'Crear cotización con cálculo automático' })
  create(@Body() dto: CreateQuoteDto, @Req() req: Request) {
    return this.quotesService.create(dto, req.user as any, req.ip);
  }

  @Get()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Listar cotizaciones' })
  findAll(@Req() req: Request) {
    return this.quotesService.findAll(req.user as any);
  }

  @Get(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Obtener cotización por ID' })
  findById(@Param('id') id: string, @Req() req: Request) {
    return this.quotesService.findById(id, req.user as any);
  }

  @Put(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Actualizar cotización o cambiar estado (aprobar/rechazar)' })
  update(@Param('id') id: string, @Body() dto: UpdateQuoteDto, @Req() req: Request) {
    return this.quotesService.update(id, dto, req.user as any, req.ip);
  }

  @Delete(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa')
  @ApiOperation({ summary: 'Eliminar cotización (solo si no está aprobada)' })
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.quotesService.remove(id, req.user as any, req.ip);
  }
}
