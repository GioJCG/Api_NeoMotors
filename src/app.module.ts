import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { EmpresasModule } from './modules/empresas/empresas.module';
import { SucursalesModule } from './modules/sucursales/sucursales.module';
import { ContextModule } from './modules/context/context.module';
import { SatCatalogsModule } from './modules/sat-catalogs/sat-catalogs.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { RolesGuard } from './modules/rbac/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    RbacModule,
    AuditoriaModule,
    EmpresasModule,
    SucursalesModule,
    ContextModule,
    SatCatalogsModule,
    ClientesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
