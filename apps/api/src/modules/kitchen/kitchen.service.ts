import { Injectable } from '@nestjs/common';
import { prisma } from '@gase/database';

@Injectable()
export class KitchenService {
  async getActiveOrders(storeId: string) {
    const orders = await prisma.order.findMany({
      where: {
        storeId,
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, coverImage: true, preparationTime: true },
            },
          },
        },
        tableSession: {
          include: { table: { select: { id: true, name: true, section: true } } },
        },
      },
    });

    return {
      pending: orders.filter((o) => o.status === 'PENDING'),
      confirmed: orders.filter((o) => o.status === 'CONFIRMED'),
      preparing: orders.filter((o) => o.status === 'PREPARING'),
      ready: orders.filter((o) => o.status === 'READY'),
      total: orders.length,
    };
  }

  async getOrdersByStatus(storeId: string, status: string) {
    return prisma.order.findMany({
      where: { storeId, status },
      orderBy: { createdAt: 'asc' },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, coverImage: true, preparationTime: true },
            },
          },
        },
        tableSession: {
          include: { table: { select: { id: true, name: true, section: true } } },
        },
      },
    });
  }

  async updateOrderItemStatus(orderItemId: string, status: string) {
    return prisma.orderItem.update({
      where: { id: orderItemId },
      data: { status },
      include: { product: true, order: true },
    });
  }

  async getKitchenStats(storeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeOrders, completedToday, avgPrepTime] = await Promise.all([
      prisma.order.count({
        where: {
          storeId,
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] },
        },
      }),
      prisma.order.count({
        where: {
          storeId,
          status: 'SERVED',
          createdAt: { gte: today },
        },
      }),
      prisma.order.aggregate({
        where: {
          storeId,
          status: 'SERVED',
          createdAt: { gte: today },
        },
        _avg: { preparationTime: true },
      }),
    ]);

    return {
      activeOrders,
      completedToday,
      avgPreparationTime: avgPrepTime._avg.preparationTime || 0,
    };
  }
}
