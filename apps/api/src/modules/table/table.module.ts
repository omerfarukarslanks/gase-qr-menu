import { Module } from '@nestjs/common';
import { EventsGateway } from '../../gateway/events.gateway';
import { TableController } from './table.controller';
import { TableService } from './table.service';

@Module({
  controllers: [TableController],
  providers: [TableService, EventsGateway],
  exports: [TableService],
})
export class TableModule {}
