import { Module } from '@nestjs/common';
import { RefaccionesController } from './refacciones.controller';
import { RefaccionesService } from './refacciones.service';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [AuditoriaModule],
  controllers: [RefaccionesController],
  providers: [RefaccionesService],
  exports: [RefaccionesService],
})
export class RefaccionesModule {}
