import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'OWNER', 'MANAGER')
@Controller('api/reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('overview/:storeId')
  @ApiOperation({ summary: 'Get overview report for a date range' })
  getOverviewReport(
    @Param('storeId') storeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportService.getOverviewReport(storeId, startDate, endDate);
  }

  @Get('daily/:storeId/:date')
  @ApiOperation({ summary: 'Get daily report' })
  getDailyReport(
    @Param('storeId') storeId: string,
    @Param('date') date: string,
  ) {
    return this.reportService.getDailyReport(storeId, date);
  }

  @Get('monthly/:storeId/:year/:month')
  @ApiOperation({ summary: 'Get monthly report' })
  getMonthlyReport(
    @Param('storeId') storeId: string,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    return this.reportService.getMonthlyReport(storeId, parseInt(year), parseInt(month));
  }

  @Get('products/:storeId')
  @ApiOperation({ summary: 'Get product analytics' })
  getProductAnalytics(
    @Param('storeId') storeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportService.getProductAnalytics(storeId, startDate, endDate);
  }

  @Get('customers/:storeId')
  @ApiOperation({ summary: 'Get customer analytics' })
  getCustomerAnalytics(
    @Param('storeId') storeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportService.getCustomerAnalytics(storeId, startDate, endDate);
  }

  @Get('staff/:storeId')
  @ApiOperation({ summary: 'Get staff analytics' })
  getStaffAnalytics(
    @Param('storeId') storeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportService.getStaffAnalytics(storeId, startDate, endDate);
  }
}
