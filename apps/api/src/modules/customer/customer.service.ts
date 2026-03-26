import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CustomerService {
  async trackVisit(data: {
    storeId: string;
    customerSessionId: string;
    tableId?: string;
    deviceInfo?: any;
  }) {
    return prisma.customerVisit.create({
      data: {
        storeId: data.storeId,
        customerSessionId: data.customerSessionId,
        tableId: data.tableId,
        deviceInfo: data.deviceInfo || {},
      },
    });
  }

  async getVisits(storeId: string, query: PaginationQueryDto) {
    const [items, total] = await Promise.all([
      prisma.customerVisit.findMany({
        where: { storeId },
        skip: query.skip,
        take: query.limit,
        orderBy: { visitedAt: 'desc' },
      }),
      prisma.customerVisit.count({ where: { storeId } }),
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

  async getCustomerHistory(customerSessionId: string) {
    const visits = await prisma.customerVisit.findMany({
      where: { customerSessionId },
      orderBy: { visitedAt: 'desc' },
      include: {
        store: { select: { id: true, name: true, logo: true } },
      },
    });

    const orders = await prisma.order.findMany({
      where: { customerSessionId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: { select: { id: true, name: true } } } },
      },
    });

    return {
      visits,
      orders,
      totalVisits: visits.length,
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
    };
  }

  async getLoyaltyStats(storeId: string) {
    const customers = await prisma.customerVisit.groupBy({
      by: ['customerSessionId'],
      where: { storeId },
      _count: true,
      orderBy: { _count: { customerSessionId: 'desc' } },
      take: 50,
    });

    return {
      topCustomers: customers.map((c) => ({
        customerSessionId: c.customerSessionId,
        visitCount: c._count,
      })),
      totalUniqueCustomers: customers.length,
    };
  }
}
