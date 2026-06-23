import { Module } from '@nestjs/common';
import { CashDeskController } from './cash-desk.controller';
import { CashDeskService } from './cash-desk.service';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [AuditoriaModule],
  controllers: [CashDeskController],
  providers: [CashDeskService],
  exports: [CashDeskService],
})
export class CashDeskModule {}
