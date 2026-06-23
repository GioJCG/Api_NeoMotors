import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { EmitirFacturaDto } from './dto/billing.dto';
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
  @Roles('SuperUsuario', 'AdministradorEmpresa')
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
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Req() req?: Request) {
    const user = (req as any).user;
    return this.billing.findAll(user, page ? +page : 1, limit ? +limit : 20);
  }

  @Get(':id/download')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Descargar factura en XML o PDF' })
  @ApiQuery({ name: 'format', required: true })
  async download(@Param('id') id: string, @Query('format') format: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.billing.download(id, format, user);
  }
}
