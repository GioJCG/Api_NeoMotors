import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { FiscalService } from './fiscal.service';
import { FiscalController } from './fiscal.controller';

@Module({
  imports: [PrismaModule, AuditoriaModule],
  controllers: [FiscalController],
  providers: [FiscalService],
})
export class FiscalModule {}
