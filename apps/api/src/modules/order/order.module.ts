import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { EventsGateway } from '../../gateway/events.gateway';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [CartModule],
  controllers: [OrderController],
  providers: [OrderService, EventsGateway],
  exports: [OrderService],
})
export class OrderModule {}
