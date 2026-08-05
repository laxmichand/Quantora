import { Module } from '@nestjs/common';
import { AngelModule } from './providers/angel/angel.module';
import { MarketDataController } from './market-data.controller';

@Module({
  imports: [AngelModule],
  controllers: [MarketDataController],
})
export class MarketDataModule {}
