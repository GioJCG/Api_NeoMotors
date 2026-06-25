import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuditoriaService } from './auditoria.service';
import { Roles } from '../rbac/decorators/roles.decorator';

@Controller('audit-logs')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AuditoriaController {
  constructor(private readonly service: AuditoriaService) {}

  @Get()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
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
