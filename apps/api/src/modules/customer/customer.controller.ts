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

  @Public()
  @Post('visit')
  @ApiOperation({ summary: 'Track a customer visit' })
  trackVisit(
    @Body()
    dto: {
      storeId: string;
      customerSessionId: string;
      tableId?: string;
      deviceInfo?: any;
    },
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

  @Public()
  @Get('session/:sessionId/history')
  @ApiOperation({ summary: 'Get customer history by session' })
  getHistory(@Param('sessionId') sessionId: string) {
    return this.customerService.getCustomerHistory(sessionId);
  }

  @Get('store/:storeId/loyalty')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get loyalty statistics' })
  getLoyaltyStats(@Param('storeId') storeId: string) {
    return this.customerService.getLoyaltyStats(storeId);
  }
}
