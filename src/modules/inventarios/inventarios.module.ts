import { Module } from '@nestjs/common';
import { InventariosController } from './inventarios.controller';
import { InventariosService } from './inventarios.service';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [AuditoriaModule],
  controllers: [InventariosController],
  providers: [InventariosService],
  exports: [InventariosService],
})
export class InventariosModule {}
