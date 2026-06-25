import {
  Controller, Get, Post, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { EmitirFacturaDto } from './dto/billing.dto';
import { CancelarFacturaDto } from './dto/cancel.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import type { Request } from 'express';

@ApiTags('Facturación Electrónica')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post('issue')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Emitir (timbrar) una factura CFDI 4.0' })
  async issue(@Body() dto: EmitirFacturaDto, @Req() req: Request) {
    const user = (req as any).user;
    return this.billing.issue(dto, user, req.ip);
  }

  @Get()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Listar facturas emitidas' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'desde', required: false })
  @ApiQuery({ name: 'hasta', required: false })
  @ApiQuery({ name: 'q', required: false, description: 'Buscar por folio, RFC o nombre del receptor' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('estado') estado?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('q') q?: string,
    @Req() req?: Request,
  ) {
    const user = (req as any).user;
    return this.billing.findAll(user, page ? +page : 1, limit ? +limit : 20, {
      estado, desde, hasta, q,
    });
  }

  @Get('sat-catalogs')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Obtener catálogos SAT (formas de pago, métodos, usos, etc.)' })
  async getSatCatalogs() {
    return this.billing.getSatCatalogs();
  }

  @Get('stats')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Estadísticas de facturación para dashboard' })
  async stats(@Req() req: Request) {
    const user = (req as any).user;
    return this.billing.stats(user);
  }

  @Get(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Obtener detalle de una factura' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.billing.findOne(id, user);
  }

  @Get(':id/download')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Descargar factura en XML o PDF' })
  @ApiQuery({ name: 'format', required: true, enum: ['xml', 'pdf'] })
  async download(@Param('id') id: string, @Query('format') format: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.billing.download(id, format, user);
  }

  @Post(':id/cancel')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Cancelar una factura timbrada' })
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelarFacturaDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return this.billing.cancel(id, dto.motivo, dto.uuidSustituto, user, req.ip);
  }
}
