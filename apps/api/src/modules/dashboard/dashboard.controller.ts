import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DashboardService } from './dashboard.service';

type CurrentUserPayload = {
  id: string;
  role: string;
  organizationId?: string | null;
  userStores?: Array<{ storeId: string; role: string; isActive: boolean }>;
};

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF', 'WAITER', 'KITCHEN')
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Get dashboard overview for a store' })
  getOverview(
    @Param('storeId') storeId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.dashboardService.getOverview(storeId, currentUser);
  }
}
