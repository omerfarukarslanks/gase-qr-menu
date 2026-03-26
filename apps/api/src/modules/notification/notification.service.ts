import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';
import { CreateNotificationDto } from './dto/notification.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Injectable()
export class NotificationService {
  // Gateway will be set externally to avoid circular deps
  private gateway: any;

  setGateway(gateway: any) {
    this.gateway = gateway;
  }

  async create(dto: CreateNotificationDto) {
    const notification = await prisma.notification.create({
      data: {
        storeId: dto.storeId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        userId: dto.userId,
        metadata: dto.metadata || {},
      },
    });

    // Emit via WebSocket if gateway is set
    if (this.gateway) {
      this.gateway.sendToStore(dto.storeId, 'notification', notification);
    }

    return notification;
  }

  async findAll(storeId: string, query: PaginationQueryDto & { unreadOnly?: boolean }) {
    const where: any = { storeId };

    if (query.unreadOnly) {
      where.isRead = false;
    }

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  async markAsRead(id: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(storeId: string) {
    await prisma.notification.updateMany({
      where: { storeId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(storeId: string) {
    const count = await prisma.notification.count({
      where: { storeId, isRead: false },
    });
    return { count };
  }
}
