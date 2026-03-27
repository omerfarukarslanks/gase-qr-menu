import { Module } from '@nestjs/common';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { EventsGateway } from '../../gateway/events.gateway';

@Module({
  controllers: [StockController],
  providers: [StockService, EventsGateway],
  exports: [StockService],
})
export class StockModule {}
