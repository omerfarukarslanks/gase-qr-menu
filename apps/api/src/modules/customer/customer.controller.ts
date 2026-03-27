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
import { CustomerService } from './customer.service';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('customers')
@Controller('api/customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('visit')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Track a customer visit' })
  trackVisit(
    @Body() dto: { storeId: string; customerId: string; totalSpent?: number },
  ) {
    return this.customerService.trackVisit(dto);
  }

  @Get('store/:storeId/visits')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List customer visits for a store' })
  getVisits(@Param('storeId') storeId: string, @Query() query: PaginationQueryDto) {
    return this.customerService.getVisits(storeId, query);
  }

  @Get(':customerId/history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get customer history' })
  getHistory(@Param('customerId') customerId: string) {
    return this.customerService.getCustomerHistory(customerId);
  }

  @Get(':userId/loyalty/:storeId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get customer loyalty points' })
  getLoyaltyPoints(
    @Param('userId') userId: string,
    @Param('storeId') storeId: string,
  ) {
    return this.customerService.getLoyaltyPoints(userId, storeId);
  }

  @Post(':userId/loyalty/:storeId/redeem')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Redeem loyalty points' })
  redeemPoints(
    @Param('userId') userId: string,
    @Param('storeId') storeId: string,
    @Body() dto: { points: number },
  ) {
    return this.customerService.redeemPoints(userId, storeId, dto.points);
  }

  @Get('store/:storeId/loyalty')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get loyalty statistics' })
  getLoyaltyStats(@Param('storeId') storeId: string) {
    return this.customerService.getLoyaltyStats(storeId);
  }
}
