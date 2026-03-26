import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@gase/database';
import { CreatePaymentDto, ProcessCardPaymentDto } from './dto/payment.dto';

// Abstract payment provider interface
export interface PaymentProvider {
  createPayment(params: any): Promise<any>;
  checkPaymentStatus(paymentId: string): Promise<any>;
  refund(paymentId: string, amount: number): Promise<any>;
}

// Iyzico implementation stub
class IyzicoProvider implements PaymentProvider {
  constructor(private config: { apiKey: string; secretKey: string; baseUrl: string }) {}

  async createPayment(params: any): Promise<any> {
    // TODO: Implement actual iyzico API call
    // const Iyzipay = require('iyzipay');
    // const iyzipay = new Iyzipay({ apiKey: this.config.apiKey, secretKey: this.config.secretKey, uri: this.config.baseUrl });
    return {
      status: 'success',
      paymentId: `iyz_${Date.now()}`,
      message: 'Payment processed (stub)',
    };
  }

  async checkPaymentStatus(paymentId: string): Promise<any> {
    return { status: 'success', paymentId };
  }

  async refund(paymentId: string, amount: number): Promise<any> {
    return { status: 'success', paymentId, refundedAmount: amount };
  }
}

@Injectable()
export class PaymentService {
  private provider: PaymentProvider;

  constructor(private configService: ConfigService) {
    const iyzicoConfig = this.configService.get('app.iyzico');
    this.provider = new IyzicoProvider(iyzicoConfig || {});
  }

  async createPayment(dto: CreatePaymentDto) {
    const order = await prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Cannot pay for a cancelled order');
    }

    const payment = await prisma.payment.create({
      data: {
        orderId: dto.orderId,
        storeId: order.storeId,
        amount: dto.amount,
        currency: dto.currency || 'TRY',
        method: dto.method,
        status: dto.method === 'CASH' ? 'COMPLETED' : 'PENDING',
      },
    });

    if (dto.method === 'CASH') {
      await this.markOrderPaid(dto.orderId);
    }

    return payment;
  }

  async processCardPayment(dto: ProcessCardPaymentDto) {
    const order = await prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const payment = await prisma.payment.create({
      data: {
        orderId: dto.orderId,
        storeId: order.storeId,
        amount: dto.amount,
        currency: dto.currency || 'TRY',
        method: 'CREDIT_CARD',
        status: 'PENDING',
      },
    });

    try {
      const result = await this.provider.createPayment({
        paymentId: payment.id,
        amount: dto.amount,
        card: {
          cardHolderName: dto.cardHolderName,
          cardNumber: dto.cardNumber,
          expireMonth: dto.expireMonth,
          expireYear: dto.expireYear,
          cvc: dto.cvc,
        },
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          providerPaymentId: result.paymentId,
          providerResponse: result,
        },
      });

      await this.markOrderPaid(dto.orderId);

      return { payment, providerResult: result };
    } catch (error: any) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', providerResponse: { error: error.message } },
      });

      throw new BadRequestException('Payment failed: ' + error.message);
    }
  }

  async findByOrder(orderId: string) {
    return prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async refund(paymentId: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException('Can only refund completed payments');
    }

    const result = await this.provider.refund(
      payment.providerPaymentId || paymentId,
      Number(payment.amount),
    );

    return prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED', providerResponse: result },
    });
  }

  private async markOrderPaid(orderId: string) {
    await prisma.order.update({
      where: { id: orderId },
      data: { isPaid: true },
    });
  }
}
