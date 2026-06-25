import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import { AuditoriaService } from './auditoria.service';

@ApiTags('Auditoría')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('SuperUsuario', 'AdministradorEmpresa')
export class AuditoriaController {
  constructor(private readonly service: AuditoriaService) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('entidad') entidad?: string,
    @Query('accion') accion?: string,
    @Query('usuarioId') usuarioId?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.service.findAll(req.user, {
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      entidad,
      accion,
      usuarioId,
      desde,
      hasta,
    });
  }
}
