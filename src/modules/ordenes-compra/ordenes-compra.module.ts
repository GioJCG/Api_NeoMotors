import { Module } from '@nestjs/common';
import { OrdenesCompraController } from './ordenes-compra.controller';
import { OrdenesCompraService } from './ordenes-compra.service';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [AuditoriaModule],
  controllers: [OrdenesCompraController],
  providers: [OrdenesCompraService],
  exports: [OrdenesCompraService],
})
export class OrdenesCompraModule {}
