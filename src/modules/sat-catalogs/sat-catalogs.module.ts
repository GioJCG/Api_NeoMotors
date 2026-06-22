import { Module } from '@nestjs/common';
import { SatCatalogsController } from './sat-catalogs.controller';
import { SatCatalogsService } from './sat-catalogs.service';

@Module({
  controllers: [SatCatalogsController],
  providers: [SatCatalogsService],
  exports: [SatCatalogsService],
})
export class SatCatalogsModule {}
