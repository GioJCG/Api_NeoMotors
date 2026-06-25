import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventariosService } from './inventarios.service';
import { AjustarStockDto, TransferirStockDto } from './dto/ajustar-stock.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import type { Request } from 'express';

@ApiTags('Inventario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventariosController {
  constructor(private readonly inventariosService: InventariosService) {}

  @Get()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Consulta')
  @ApiOperation({ summary: 'Ver inventario (por sucursal opcional)' })
  getStock(@Req() req: Request, @Query('sucursalId') sucursalId?: string) {
    return this.inventariosService.getStock(req.user as any, sucursalId);
  }

  @Get('alerts')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Alertas de stock mínimo' })
  getAlertas(@Req() req: Request) {
    return this.inventariosService.getAlertasStock(req.user as any);
  }

  @Get('movements')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Consulta')
  @ApiOperation({ summary: 'Movimientos de inventario' })
  getMovimientos(
    @Req() req: Request,
    @Query('refaccionId') refaccionId?: string,
    @Query('sucursalId') sucursalId?: string,
  ) {
    return this.inventariosService.getMovimientos(req.user as any, refaccionId, sucursalId);
  }

  @Get('parts/:refaccionId')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador')
  @ApiOperation({ summary: 'Stock de una refacción en todas las sucursales' })
  getStockByRefaccion(@Param('refaccionId') refaccionId: string, @Req() req: Request) {
    return this.inventariosService.getStockByRefaccion(refaccionId, req.user as any);
  }

  @Post('adjust')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Ajustar stock (entrada/salida manual)' })
  ajustarStock(@Body() dto: AjustarStockDto, @Req() req: Request) {
    return this.inventariosService.ajustarStock(dto, req.user as any, req.ip);
  }

  @Post('transfer')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Transferir stock entre sucursales' })
  transferir(@Body() dto: TransferirStockDto, @Req() req: Request) {
    return this.inventariosService.transferirStock(dto, req.user as any, req.ip);
  }
}
