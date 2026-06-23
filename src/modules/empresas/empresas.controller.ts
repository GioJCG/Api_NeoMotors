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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EmpresasService } from './empresas.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import type { Request } from 'express';

@ApiTags('Empresas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('companies')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Post()
  @Roles('SuperUsuario')
  @ApiOperation({ summary: 'Crear empresa (solo SuperUsuario)' })
  @ApiResponse({ status: 201, description: 'Empresa creada.' })
  @ApiResponse({ status: 409, description: 'RFC duplicado.' })
  async create(@Body() dto: CreateEmpresaDto, @Req() req: Request) {
    const user = req.user as any;
    return this.empresasService.create(dto, user.id, req.ip);
  }

  @Get()
  @Roles('SuperUsuario', 'AdministradorEmpresa')
  @ApiOperation({ summary: 'Listar empresas' })
  async findAll(@Req() req: Request) {
    return this.empresasService.findAll(req.user as any);
  }

  @Get(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa')
  @ApiOperation({ summary: 'Obtener empresa por ID' })
  async findById(@Param('id') id: string, @Req() req: Request) {
    return this.empresasService.findById(id, req.user as any);
  }

  @Put(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa')
  @ApiOperation({ summary: 'Actualizar empresa' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmpresaDto,
    @Req() req: Request,
  ) {
    return this.empresasService.update(id, dto, req.user as any, req.ip);
  }

  @Delete(':id')
  @Roles('SuperUsuario')
  @ApiOperation({ summary: 'Desactivar empresa (solo SuperUsuario)' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    return this.empresasService.remove(id, req.user as any, req.ip);
  }
}
