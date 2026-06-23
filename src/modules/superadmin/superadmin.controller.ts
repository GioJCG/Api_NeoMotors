import { Controller, Get, Put, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import { SuperadminService } from './superadmin.service';

@ApiTags('SuperAdmin - Consola Global')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('superadmin')
export class SuperadminController {
  constructor(private readonly superadmin: SuperadminService) {}

  @Get('companies')
  @Roles('SuperUsuario')
  @ApiOperation({ summary: 'Listar todas las empresas del sistema' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  async listCompanies(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.superadmin.listCompanies(
      page ? +page : 1,
      limit ? +limit : 20,
      search,
    );
  }

  @Put('companies/:id/status')
  @Roles('SuperUsuario')
  @ApiOperation({ summary: 'Suspender o activar una empresa (soft-lock)' })
  async toggleStatus(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.superadmin.toggleCompanyStatus(id, user);
  }

  @Get('stats')
  @Roles('SuperUsuario')
  @ApiOperation({ summary: 'Estadísticas globales agregadas del sistema' })
  async getGlobalStats() {
    return this.superadmin.getGlobalStats();
  }

  @Get('audit-logs')
  @Roles('SuperUsuario')
  @ApiOperation({ summary: 'Auditar logs del sistema sin restricción de tenant' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'entidad', required: false })
  @ApiQuery({ name: 'accion', required: false })
  @ApiQuery({ name: 'empresaId', required: false })
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('entidad') entidad?: string,
    @Query('accion') accion?: string,
    @Query('empresaId') empresaId?: string,
  ) {
    return this.superadmin.getAuditLogs(
      page ? +page : 1,
      limit ? +limit : 50,
      { entidad, accion, empresaId },
    );
  }
}
