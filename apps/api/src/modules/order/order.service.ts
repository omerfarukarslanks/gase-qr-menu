import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@gase/database';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

const STATUS_FLOW: Record<string, string[]> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['SERVED', 'CANCELLED'],
  SERVED: [],
  CANCELLED: [],
};

@Injectable()
export class OrderService {
  async create(dto: CreateOrderDto) {
    const { items, ...orderData } = dto;

    // Generate daily order number
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastOrder = await prisma.order.findFirst({
      where: {
        storeId: dto.storeId,
        createdAt: { gte: today },
      },
      orderBy: { dailyOrderNumber: 'desc' },
    });

    const dailyOrderNumber = (lastOrder?.dailyOrderNumber || 0) + 1;

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    return prisma.order.create({
      data: {
        ...orderData,
        dailyOrderNumber,
        status: 'PENDING',
        subtotal,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: subtotal,
        items: {
          createMany: {
            data: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.unitPrice * item.quantity,
              notes: item.notes,
              modifiers: item.modifiers || [],
            })),
          },
        },
      },
      include: {
        items: { include: { product: true } },
        tableSession: { include: { table: true } },
      },
    });
  }

  async findAll(storeId: string, query: PaginationQueryDto & { status?: string }) {
    const where: any = { storeId };

    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: true } },
          tableSession: { include: { table: true } },
        },
      }),
      prisma.order.count({ where }),
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

  async findOne(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        tableSession: { include: { table: true } },
        payments: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);

    const allowedStatuses = STATUS_FLOW[order.status] || [];
    if (!allowedStatuses.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}. Allowed: ${allowedStatuses.join(', ')}`,
      );
    }

    return prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: {
        items: { include: { product: true } },
        tableSession: { include: { table: true } },
      },
    });
  }

  async getActiveOrders(storeId: string) {
    return prisma.order.findMany({
      where: {
        storeId,
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        items: { include: { product: true } },
        tableSession: { include: { table: true } },
      },
    });
  }
}
