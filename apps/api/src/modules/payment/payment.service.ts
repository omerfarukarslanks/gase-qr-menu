import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, prisma } from '@gase/database';
import {
  CreatePaymentDto,
  CreateCashPaymentDto,
  Initiate3DSecureDto,
  Complete3DSecureCallbackDto,
  PaymentListQueryDto,
} from './dto/payment.dto';
import { IyzicoProvider, PaymentProvider } from './providers/iyzico.provider';
import { EventsGateway } from '../../gateway/events.gateway';

@Injectable()
export class PaymentService {
  private provider: PaymentProvider;

  constructor(
    private configService: ConfigService,
    private eventsGateway: EventsGateway,
  ) {
    const iyzicoConfig = this.configService.get('iyzico') || {};
    this.provider = new IyzicoProvider(iyzicoConfig);
  }

  // Cash / simple payment
  async createPayment(dto: CreatePaymentDto) {
    const order = await prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { store: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Cannot pay for a cancelled order');
    }
    if (order.isPaid) {
      throw new BadRequestException('Order is already paid');
    }

    const payableAmount =
      order.finalAmount || order.totalAmount - order.discountAmount;

    const payment = await prisma.payment.create({
      data: {
        orderId: dto.orderId,
        tableSessionId: order.tableSessionId,
        storeId: order.storeId,
        amount: payableAmount,
        currency: dto.currency || 'TRY',
        method: dto.method as any,
        provider: dto.method === 'CASH' ? 'CASH' : 'IYZICO',
        status: dto.method === 'CASH' ? 'COMPLETED' : 'PENDING',
      },
    });

    if (dto.method === 'CASH') {
      await this.markOrderPaid(dto.orderId);
      this.eventsGateway.sendToStore(order.storeId, 'paymentCompleted', {
          orderId: order.id,
          paymentId: payment.id,
          method: 'CASH',
          amount: payableAmount,
        });
      }

    return payment;
  }

  async createCashPayment(dto: CreateCashPaymentDto) {
    return this.createPayment({
      ...dto,
      method: 'CASH',
    });
  }

  // 3D Secure - Step 1: Initiate
  async initiate3DSecure(dto: Initiate3DSecureDto) {
    const order = await prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        store: true,
        items: { include: { product: { include: { translations: true } } } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.isPaid) throw new BadRequestException('Order is already paid');

    const amount = order.finalAmount || order.totalAmount - order.discountAmount;

    const payment = await prisma.payment.create({
      data: {
        orderId: dto.orderId,
        tableSessionId: order.tableSessionId,
        storeId: order.storeId,
        amount,
        currency: dto.currency || 'TRY',
        method: 'CREDIT_CARD',
        provider: 'IYZICO',
        status: 'PENDING',
        callbackUrl: dto.callbackUrl,
      },
    });

    const result = await this.provider.initiate3DSecurePayment({
      paymentId: payment.id,
      amount,
      currency: dto.currency || 'TRY',
      callbackUrl: dto.callbackUrl,
      buyer: {
        id: dto.buyerId || 'guest',
        name: dto.buyerName || 'Misafir',
        surname: dto.buyerSurname || 'Musteri',
        email: dto.buyerEmail || 'guest@example.com',
        phone: dto.buyerPhone || '+905000000000',
        ip: dto.buyerIp || '127.0.0.1',
        city: dto.buyerCity || 'Istanbul',
        country: 'Turkey',
        address: dto.buyerAddress || 'Istanbul, Turkey',
      },
      card: {
        cardHolderName: dto.cardHolderName,
        cardNumber: dto.cardNumber,
        expireMonth: dto.expireMonth,
        expireYear: dto.expireYear,
        cvc: dto.cvc,
      },
      items: order.items.map((item) => ({
        id: item.productId,
        name: item.product.translations[0]?.name || item.product.slug,
        category: 'Food',
        price: item.totalPrice.toFixed(2),
      })),
    });

    if (result.status === 'failure') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', providerResponse: { error: result.errorMessage } },
      });
      throw new BadRequestException(result.errorMessage || 'Payment initiation failed');
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: result.paymentId,
        threeDSecureHtmlContent: result.htmlContent,
      },
    });

    return {
      paymentId: payment.id,
      htmlContent: result.htmlContent,
    };
  }

  // 3D Secure - Step 2: Callback
  async complete3DSecureCallback(dto: Complete3DSecureCallbackDto) {
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { id: dto.paymentId },
          { providerPaymentId: dto.paymentId },
        ],
      },
      include: { order: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    if (dto.status !== 'success' || dto.mdStatus !== '1') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          providerResponse: { mdStatus: dto.mdStatus, status: dto.status },
        },
      });
      return { success: false, message: 'Payment verification failed' };
    }

    const result = await this.provider.complete3DSecurePayment({
      paymentId: dto.paymentId,
    });

    if (result.status === 'success') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          providerTransactionId: result.transactionId,
          providerResponse: result.rawResponse || { completed: true },
        },
      });

      if (payment.orderId) {
        await this.markOrderPaid(payment.orderId);
        if (payment.order) {
          this.eventsGateway.sendToStore(payment.order.storeId, 'paymentCompleted', {
            orderId: payment.orderId,
            paymentId: payment.id,
            method: 'CREDIT_CARD',
            amount: payment.amount,
          });
        }
      }

      return { success: true, paymentId: payment.id };
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        providerResponse: { error: result.errorMessage },
      },
    });

    return { success: false, message: result.errorMessage };
  }

  async findByOrder(orderId: string) {
    return prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStore(storeId: string, query: PaymentListQueryDto) {
    const where: Prisma.PaymentWhereInput = {
      storeId,
    };

    if (query.status) {
      where.status = query.status as any;
    }

    if (query.method) {
      where.method = query.method as any;
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      const searchOrderNumber = Number(search);

      where.OR = [
        {
          tableSession: {
            tableRef: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      ];

      if (!Number.isNaN(searchOrderNumber)) {
        where.OR.push({
          order: {
            orderNumber: searchOrderNumber,
          },
        });
      }
    }

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              isPaid: true,
            },
          },
          tableSession: {
            include: {
              tableRef: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
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
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async refund(paymentId: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException('Can only refund completed payments');
    }

    const result = await this.provider.refund(
      payment.providerPaymentId || payment.providerTransactionId || paymentId,
      Number(payment.amount),
    );

    if (result.status === 'failure') {
      throw new BadRequestException(result.errorMessage || 'Refund failed');
    }

    const providerResponse = JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue;

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED', providerResponse },
    });

    // Mark order as unpaid
    if (payment.orderId) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { isPaid: false },
      });
    }

    return updatedPayment;
  }

  private async markOrderPaid(orderId: string) {
    await prisma.order.update({
      where: { id: orderId },
      data: { isPaid: true },
    });
  }
}
