import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

// Points config: 1 TL spent = 1 point
const POINTS_PER_TL = 1;

@Injectable()
export class CustomerService {
  async trackVisit(data: {
    storeId: string;
    customerId: string;
    totalSpent?: number;
  }) {
    const pointsEarned = Math.floor((data.totalSpent || 0) * POINTS_PER_TL);

    const visit = await prisma.customerVisit.create({
      data: {
        storeId: data.storeId,
        customerId: data.customerId,
        visitDate: new Date(),
        totalSpent: data.totalSpent || 0,
        pointsEarned,
      },
    });

    // Update loyalty points
    if (pointsEarned > 0) {
      await prisma.loyaltyPoints.upsert({
        where: {
          userId_storeId: {
            userId: data.customerId,
            storeId: data.storeId,
          },
        },
        create: {
          userId: data.customerId,
          storeId: data.storeId,
          points: pointsEarned,
          totalEarned: pointsEarned,
        },
        update: {
          points: { increment: pointsEarned },
          totalEarned: { increment: pointsEarned },
        },
      });
    }

    return visit;
  }

  async getVisits(storeId: string, query: PaginationQueryDto) {
    const [items, total] = await Promise.all([
      prisma.customerVisit.findMany({
        where: { storeId },
        ...query.prismaPagination,
        orderBy: { visitDate: 'desc' },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
      prisma.customerVisit.count({ where: { storeId } }),
    ]);

    return {
      items,
      meta: query.buildMeta(total),
    };
  }

  async getCustomerHistory(customerId: string) {
    const [visits, orders, loyalty] = await Promise.all([
      prisma.customerVisit.findMany({
        where: { customerId },
        orderBy: { visitDate: 'desc' },
        include: {
          store: { select: { id: true, name: true, logo: true } },
        },
      }),
      prisma.order.findMany({
        where: {
          tableSession: { customerId },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: { select: { id: true, slug: true } } } },
          store: { select: { id: true, name: true } },
        },
      }),
      prisma.loyaltyPoints.findMany({
        where: { userId: customerId },
        include: { store: { select: { id: true, name: true } } },
      }),
    ]);

    return {
      visits,
      orders,
      loyalty,
      totalVisits: visits.length,
      totalOrders: orders.length,
      totalSpent: visits.reduce((sum, v) => sum + v.totalSpent, 0),
      totalPoints: loyalty.reduce((sum, l) => sum + l.points, 0),
    };
  }

  async getLoyaltyPoints(userId: string, storeId: string) {
    const loyalty = await prisma.loyaltyPoints.findUnique({
      where: { userId_storeId: { userId, storeId } },
    });

    return loyalty || { points: 0, totalEarned: 0, totalSpent: 0 };
  }

  async redeemPoints(userId: string, storeId: string, points: number) {
    const loyalty = await prisma.loyaltyPoints.findUnique({
      where: { userId_storeId: { userId, storeId } },
    });

    if (!loyalty || loyalty.points < points) {
      throw new NotFoundException('Insufficient loyalty points');
    }

    return prisma.loyaltyPoints.update({
      where: { userId_storeId: { userId, storeId } },
      data: {
        points: { decrement: points },
        totalSpent: { increment: points },
      },
    });
  }

  async getLoyaltyStats(storeId: string) {
    const [topCustomers, totalCustomers] = await Promise.all([
      prisma.loyaltyPoints.findMany({
        where: { storeId },
        orderBy: { totalEarned: 'desc' },
        take: 50,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
      prisma.loyaltyPoints.count({ where: { storeId } }),
    ]);

    const totalVisits = await prisma.customerVisit.count({ where: { storeId } });

    return {
      topCustomers: topCustomers.map((l) => ({
        user: l.user,
        points: l.points,
        totalEarned: l.totalEarned,
        totalSpent: l.totalSpent,
      })),
      totalUniqueCustomers: totalCustomers,
      totalVisits,
    };
  }
}
