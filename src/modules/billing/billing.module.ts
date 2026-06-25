import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { CfdiXmlBuilderService } from './services/cfdi-xml-builder.service';
import { CfdiDigitalSignerService } from './services/cfdi-digital-signer.service';
import { CfdiPdfGeneratorService } from './services/cfdi-pdf-generator.service';
import { CfdiValidatorService } from './services/cfdi-validator.service';
import { CfdiCancellationService } from './services/cfdi-cancellation.service';
import { SimulatedStampingProvider } from './providers/simulated-stamping.provider';
import type { StampingProvider } from './interfaces/stamping-provider.interface';

@Module({
  imports: [PrismaModule, AuditoriaModule],
  controllers: [BillingController],
  providers: [
    BillingService,
    CfdiXmlBuilderService,
    CfdiDigitalSignerService,
    CfdiPdfGeneratorService,
    CfdiValidatorService,
    CfdiCancellationService,
    {
      provide: 'STAMPING_PROVIDER',
      useFactory: (): StampingProvider => {
        const providerName = process.env.PAC_PROVIDER || 'simulated';
        switch (providerName) {
          default:
            return new SimulatedStampingProvider();
        }
      },
    },
  ],
  exports: [BillingService],
})
export class BillingModule {}
