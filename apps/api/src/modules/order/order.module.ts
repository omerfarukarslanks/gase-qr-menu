import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { CartModule } from '../cart/cart.module';
import { CampaignModule } from '../campaign/campaign.module';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [CartModule, CampaignModule, StockModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
