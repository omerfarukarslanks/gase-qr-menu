import { Injectable } from '@nestjs/common';
import { prisma } from '@gase/database';

@Injectable()
export class ReportService {
  async getDailyReport(storeId: string, date: string) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const [orders, revenue, payments, topProducts] = await Promise.all([
      // Order stats
      prisma.order.groupBy({
        by: ['status'],
        where: { storeId, createdAt: { gte: startDate, lte: endDate } },
        _count: true,
      }),

      // Revenue
      prisma.order.aggregate({
        where: {
          storeId,
          createdAt: { gte: startDate, lte: endDate },
          status: { not: 'CANCELLED' },
        },
        _sum: { totalAmount: true, discountAmount: true, taxAmount: true },
        _count: true,
        _avg: { totalAmount: true },
      }),

      // Payment breakdown
      prisma.payment.groupBy({
        by: ['method'],
        where: {
          order: {
            storeId,
            createdAt: { gte: startDate, lte: endDate },
          },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
        _count: true,
      }),

      // Top products
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            storeId,
            createdAt: { gte: startDate, lte: endDate },
            status: { not: 'CANCELLED' },
          },
        },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
    ]);

    // Enrich top products with names
    const productIds = topProducts.map((p) => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        slug: true,
        translations: { select: { name: true, languageId: true } },
        images: { where: { isCover: true }, take: 1, select: { url: true } },
      },
    });

    const enrichedTopProducts = topProducts.map((tp) => ({
      ...tp,
      product: products.find((p) => p.id === tp.productId),
    }));

    return {
      date,
      orders,
      revenue: {
        totalRevenue: revenue._sum.totalAmount || 0,
        totalDiscount: revenue._sum.discountAmount || 0,
        totalTax: revenue._sum.taxAmount || 0,
        orderCount: revenue._count,
        averageOrderValue: revenue._avg.totalAmount || 0,
      },
      payments,
      topProducts: enrichedTopProducts,
    };
  }

  async getMonthlyReport(storeId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const [revenue, ordersByDay, categoryRevenue] = await Promise.all([
      prisma.order.aggregate({
        where: {
          storeId,
          createdAt: { gte: startDate, lte: endDate },
          status: { not: 'CANCELLED' },
        },
        _sum: { totalAmount: true },
        _count: true,
        _avg: { totalAmount: true },
      }),

      // Orders grouped by day
      prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*)::int as order_count, 
               SUM(total_amount)::float as revenue
        FROM orders 
        WHERE store_id = ${storeId} 
          AND created_at >= ${startDate} 
          AND created_at <= ${endDate}
          AND status != 'CANCELLED'
        GROUP BY DATE(created_at) 
        ORDER BY date
      `,

      // Revenue by category
      prisma.$queryRaw`
        SELECT c.name as category_name, c.id as category_id,
               SUM(oi.total_price)::float as revenue,
               SUM(oi.quantity)::int as items_sold
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        JOIN categories c ON c.id = p.category_id
        JOIN orders o ON o.id = oi.order_id
        WHERE o.store_id = ${storeId}
          AND o.created_at >= ${startDate}
          AND o.created_at <= ${endDate}
          AND o.status != 'CANCELLED'
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
      `,
    ]);

    return {
      year,
      month,
      revenue: {
        totalRevenue: revenue._sum.totalAmount || 0,
        orderCount: revenue._count,
        averageOrderValue: revenue._avg.totalAmount || 0,
      },
      ordersByDay,
      categoryRevenue,
    };
  }

  async getProductAnalytics(storeId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const analytics = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          storeId,
          createdAt: { gte: start, lte: end },
          status: { not: 'CANCELLED' },
        },
      },
      _sum: { quantity: true, totalPrice: true },
      _avg: { unitPrice: true },
      _count: true,
      orderBy: { _sum: { totalPrice: 'desc' } },
    });

    const productIds = analytics.map((a) => a.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        slug: true,
        categoryId: true,
        translations: { select: { name: true, languageId: true } },
        images: { where: { isCover: true }, take: 1, select: { url: true } },
      },
    });

    return analytics.map((a) => ({
      product: products.find((p) => p.id === a.productId),
      totalQuantity: a._sum.quantity,
      totalRevenue: a._sum.totalPrice,
      averagePrice: a._avg.unitPrice,
      orderCount: a._count,
    }));
  }

  async getCustomerAnalytics(storeId: string) {
    const visits = await prisma.customerVisit.findMany({
      where: { storeId },
      orderBy: { visitDate: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const visitCounts = new Map<string, number>();
    for (const visit of visits) {
      visitCounts.set(visit.customerId, (visitCounts.get(visit.customerId) || 0) + 1);
    }

    const totalCustomers = visitCounts.size;
    const returningCustomers = [...visitCounts.values()].filter((count) => count > 1).length;
    const recentVisits = visits.slice(0, 50);

    return {
      totalUniqueCustomers: totalCustomers,
      returningCustomers,
      returnRate: totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0,
      recentVisits,
    };
  }
}
