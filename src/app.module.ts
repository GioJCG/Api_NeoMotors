import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { EmpresasModule } from './modules/empresas/empresas.module';
import { SucursalesModule } from './modules/sucursales/sucursales.module';
import { ContextModule } from './modules/context/context.module';
import { SatCatalogsModule } from './modules/sat-catalogs/sat-catalogs.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { VehiculosModule } from './modules/vehiculos/vehiculos.module';
import { CitasModule } from './modules/citas/citas.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { ProveedoresModule } from './modules/proveedores/proveedores.module';
import { OrdenesCompraModule } from './modules/ordenes-compra/ordenes-compra.module';
import { RefaccionesModule } from './modules/refacciones/refacciones.module';
import { InventariosModule } from './modules/inventarios/inventarios.module';
import { CashDeskModule } from './modules/cash-desk/cash-desk.module';
import { RolesGuard } from './modules/rbac/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    RbacModule,
    AuditoriaModule,
    EmpresasModule,
    SucursalesModule,
    ContextModule,
    SatCatalogsModule,
    ClientesModule,
    VehiculosModule,
    CitasModule,
    WorkOrdersModule,
    QuotesModule,
    ProveedoresModule,
    OrdenesCompraModule,
    RefaccionesModule,
    InventariosModule,
    CashDeskModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
