import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { CreateStockMovementDto } from './dto/stock.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('movements')
  @ApiOperation({ summary: 'Create a stock movement' })
  createMovement(@Body() dto: CreateStockMovementDto) {
    return this.stockService.createMovement(dto);
  }

  @Get('movements/store/:storeId')
  @ApiOperation({ summary: 'Get stock movements for a store' })
  getMovements(
    @Param('storeId') storeId: string,
    @Query() query: PaginationQueryDto & { ingredientId?: string; type?: string },
  ) {
    return this.stockService.getMovements(storeId, query);
  }

  @Get('alerts/store/:storeId')
  @ApiOperation({ summary: 'Get low stock alerts' })
  getLowStockAlerts(@Param('storeId') storeId: string) {
    return this.stockService.getLowStockAlerts(storeId);
  }

  @Get('summary/store/:storeId')
  @ApiOperation({ summary: 'Get stock summary' })
  getStockSummary(@Param('storeId') storeId: string) {
    return this.stockService.getStockSummary(storeId);
  }
}
