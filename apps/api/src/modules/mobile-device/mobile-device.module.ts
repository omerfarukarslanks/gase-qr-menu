import { Global, Module } from '@nestjs/common';
import { MobileDeviceController } from './mobile-device.controller';
import { MobileDeviceService } from './mobile-device.service';

@Global()
@Module({
  controllers: [MobileDeviceController],
  providers: [MobileDeviceService],
  exports: [MobileDeviceService],
})
export class MobileDeviceModule {}
