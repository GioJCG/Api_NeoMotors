import { Module } from '@nestjs/common';
import { RolesService } from './services/roles.service';
import { PermisosService } from './services/permisos.service';
import { RolesGuard } from './guards/roles.guard';

@Module({
  providers: [RolesService, PermisosService, RolesGuard],
  exports: [RolesService, PermisosService, RolesGuard],
})
export class RbacModule {}
