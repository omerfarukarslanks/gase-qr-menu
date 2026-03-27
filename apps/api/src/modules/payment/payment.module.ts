import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { EventsGateway } from '../../gateway/events.gateway';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentController],
  providers: [PaymentService, EventsGateway],
  exports: [PaymentService],
})
export class PaymentModule {}
