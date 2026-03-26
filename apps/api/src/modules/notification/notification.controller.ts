import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/notification.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a notification' })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'List notifications for a store' })
  findAll(
    @Param('storeId') storeId: string,
    @Query() query: PaginationQueryDto & { unreadOnly?: boolean },
  ) {
    return this.notificationService.findAll(storeId, query);
  }

  @Get('store/:storeId/unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  getUnreadCount(@Param('storeId') storeId: string) {
    return this.notificationService.getUnreadCount(storeId);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Put('store/:storeId/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@Param('storeId') storeId: string) {
    return this.notificationService.markAllAsRead(storeId);
  }
}
