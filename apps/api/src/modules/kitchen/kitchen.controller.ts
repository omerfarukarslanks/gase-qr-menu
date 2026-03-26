import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KitchenService } from './kitchen.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('kitchen')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/kitchen')
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  @Get('store/:storeId/orders')
  @ApiOperation({ summary: 'Get active orders grouped by status for kitchen display' })
  getActiveOrders(@Param('storeId') storeId: string) {
    return this.kitchenService.getActiveOrders(storeId);
  }

  @Get('store/:storeId/orders/:status')
  @ApiOperation({ summary: 'Get orders by status' })
  getOrdersByStatus(
    @Param('storeId') storeId: string,
    @Param('status') status: string,
  ) {
    return this.kitchenService.getOrdersByStatus(storeId, status);
  }

  @Put('items/:orderItemId/status')
  @ApiOperation({ summary: 'Update order item status' })
  updateItemStatus(
    @Param('orderItemId') orderItemId: string,
    @Body() body: { status: string },
  ) {
    return this.kitchenService.updateOrderItemStatus(orderItemId, body.status);
  }

  @Get('store/:storeId/stats')
  @ApiOperation({ summary: 'Get kitchen statistics' })
  getStats(@Param('storeId') storeId: string) {
    return this.kitchenService.getKitchenStats(storeId);
  }
}
