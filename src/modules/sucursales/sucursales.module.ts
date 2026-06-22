import { Module } from '@nestjs/common';
import { SucursalesController } from './sucursales.controller';
import { SucursalesService } from './sucursales.service';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [AuditoriaModule],
  controllers: [SucursalesController],
  providers: [SucursalesService],
  exports: [SucursalesService],
})
export class SucursalesModule {}
