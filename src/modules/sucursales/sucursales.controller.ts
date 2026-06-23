import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SucursalesService } from './sucursales.service';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import type { Request } from 'express';

@ApiTags('Sucursales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('branches')
export class SucursalesController {
  constructor(private readonly sucursalesService: SucursalesService) {}

  @Post()
  @Roles('SuperUsuario', 'AdministradorEmpresa')
  @ApiOperation({ summary: 'Crear sucursal' })
  @ApiQuery({ name: 'empresaId', required: true })
  async create(
    @Body() dto: CreateSucursalDto,
    @Query('empresaId') empresaId: string,
    @Req() req: Request,
  ) {
    return this.sucursalesService.create(
      dto,
      empresaId,
      req.user as any,
      req.ip,
    );
  }

  @Get()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Listar sucursales de una empresa' })
  @ApiQuery({ name: 'empresaId', required: true })
  async findAll(@Query('empresaId') empresaId: string, @Req() req: Request) {
    return this.sucursalesService.findAll(empresaId, req.user as any);
  }

  @Get(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Obtener sucursal por ID' })
  async findById(@Param('id') id: string, @Req() req: Request) {
    return this.sucursalesService.findById(id, req.user as any);
  }

  @Put(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Actualizar sucursal' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSucursalDto,
    @Req() req: Request,
  ) {
    return this.sucursalesService.update(id, dto, req.user as any, req.ip);
  }

  @Delete(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa')
  @ApiOperation({ summary: 'Desactivar sucursal' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    return this.sucursalesService.remove(id, req.user as any, req.ip);
  }
}
