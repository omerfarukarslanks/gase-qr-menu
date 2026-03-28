import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateStaffDto, UpdateStaffDto, UpdateStaffStatusDto } from './dto/staff.dto';
import { StaffService } from './staff.service';

@ApiTags('staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'OWNER', 'MANAGER')
@Controller('api/staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('store/:storeId')
  @ApiOperation({ summary: 'List staff for a store' })
  findAll(
    @Param('storeId') storeId: string,
    @CurrentUser()
    currentUser: {
      id: string;
      role: string;
      organizationId?: string | null;
      userStores?: Array<{ storeId: string; role: string; isActive: boolean }>;
    },
  ) {
    return this.staffService.findAll(storeId, currentUser);
  }

  @Post()
  @ApiOperation({ summary: 'Create a staff membership for a store' })
  create(
    @Body() dto: CreateStaffDto,
    @CurrentUser()
    currentUser: {
      id: string;
      role: string;
      organizationId?: string | null;
      userStores?: Array<{ storeId: string; role: string; isActive: boolean }>;
    },
  ) {
    return this.staffService.create(dto, currentUser);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a staff membership and related user fields' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser()
    currentUser: {
      id: string;
      role: string;
      organizationId?: string | null;
      userStores?: Array<{ storeId: string; role: string; isActive: boolean }>;
    },
  ) {
    return this.staffService.update(id, dto, currentUser);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Toggle active status for a staff membership' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStaffStatusDto,
    @CurrentUser()
    currentUser: {
      id: string;
      role: string;
      organizationId?: string | null;
      userStores?: Array<{ storeId: string; role: string; isActive: boolean }>;
    },
  ) {
    return this.staffService.updateStatus(id, dto.isActive, currentUser);
  }
}
