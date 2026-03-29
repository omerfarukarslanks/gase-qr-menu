import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RegisterMobileDeviceDto } from './dto/mobile-device.dto';
import { MobileDeviceService } from './mobile-device.service';

@ApiTags('mobile-devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/mobile/devices')
export class MobileDeviceController {
  constructor(private readonly mobileDeviceService: MobileDeviceService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register or update a mobile push device' })
  register(
    @CurrentUser()
    currentUser: {
      id: string;
      role: string;
      organizationId?: string | null;
      userStores?: Array<{ storeId: string; role: string; isActive: boolean }>;
    },
    @Body() dto: RegisterMobileDeviceDto,
  ) {
    return this.mobileDeviceService.register(currentUser, dto);
  }

  @Delete(':deviceId')
  @ApiOperation({ summary: 'Deactivate a mobile push device' })
  unregister(@CurrentUser('id') userId: string, @Param('deviceId') deviceId: string) {
    return this.mobileDeviceService.unregister(userId, deviceId);
  }
}
