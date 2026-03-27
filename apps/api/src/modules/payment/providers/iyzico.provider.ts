import { Logger } from '@nestjs/common';

export interface IyzicoConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
}

export interface PaymentProvider {
  initiate3DSecurePayment(params: Initiate3DParams): Promise<ThreeDSecureResponse>;
  complete3DSecurePayment(params: Complete3DParams): Promise<PaymentResult>;
  checkPaymentStatus(paymentId: string): Promise<PaymentResult>;
  refund(paymentId: string, amount: number): Promise<RefundResult>;
}

export interface Initiate3DParams {
  paymentId: string;
  amount: number;
  currency: string;
  callbackUrl: string;
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    phone: string;
    ip: string;
    city: string;
    country: string;
    address: string;
  };
  card: {
    cardHolderName: string;
    cardNumber: string;
    expireMonth: string;
    expireYear: string;
    cvc: string;
  };
  items: Array<{
    id: string;
    name: string;
    category: string;
    price: string;
  }>;
}

export interface Complete3DParams {
  paymentId: string;
}

export interface ThreeDSecureResponse {
  status: 'success' | 'failure';
  htmlContent?: string;
  paymentId?: string;
  errorMessage?: string;
}

export interface PaymentResult {
  status: 'success' | 'failure';
  paymentId?: string;
  transactionId?: string;
  amount?: number;
  errorMessage?: string;
  rawResponse?: any;
}

export interface RefundResult {
  status: 'success' | 'failure';
  refundId?: string;
  amount?: number;
  errorMessage?: string;
}

export class IyzicoProvider implements PaymentProvider {
  private logger = new Logger('IyzicoProvider');

  constructor(private config: IyzicoConfig) {
    this.logger.log(`Iyzico initialized: ${config.baseUrl || 'sandbox'}`);
  }

  async initiate3DSecurePayment(params: Initiate3DParams): Promise<ThreeDSecureResponse> {
    try {
      // In production, use the iyzipay SDK:
      // const Iyzipay = require('iyzipay');
      // const iyzipay = new Iyzipay({
      //   apiKey: this.config.apiKey,
      //   secretKey: this.config.secretKey,
      //   uri: this.config.baseUrl
      // });
      //
      // const request = {
      //   locale: Iyzipay.LOCALE.TR,
      //   conversationId: params.paymentId,
      //   price: params.amount.toFixed(2),
      //   paidPrice: params.amount.toFixed(2),
      //   currency: Iyzipay.CURRENCY.TRY,
      //   installment: '1',
      //   basketId: params.paymentId,
      //   paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      //   paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      //   callbackUrl: params.callbackUrl,
      //   paymentCard: {
      //     cardHolderName: params.card.cardHolderName,
      //     cardNumber: params.card.cardNumber,
      //     expireMonth: params.card.expireMonth,
      //     expireYear: params.card.expireYear,
      //     cvc: params.card.cvc,
      //     registerCard: '0',
      //   },
      //   buyer: { ...params.buyer, identityNumber: '11111111111' },
      //   shippingAddress: { ... },
      //   billingAddress: { ... },
      //   basketItems: params.items.map(i => ({
      //     id: i.id,
      //     name: i.name,
      //     category1: i.category,
      //     itemType: Iyzipay.BASKET_ITEM_TYPE.FOOD,
      //     price: i.price,
      //   })),
      // };
      //
      // return new Promise((resolve, reject) => {
      //   iyzipay.threedsInitialize.create(request, (err, result) => {
      //     if (err) return reject(err);
      //     resolve({
      //       status: result.status === 'success' ? 'success' : 'failure',
      //       htmlContent: result.threeDSHtmlContent,
      //       paymentId: result.paymentId,
      //     });
      //   });
      // });

      // Sandbox simulation
      this.logger.log(`3D Secure initiated for payment ${params.paymentId}, amount: ${params.amount}`);

      const sandboxHtml = `
        <html>
        <head><title>3D Secure - Sandbox</title></head>
        <body>
          <div style="text-align:center;padding:50px;font-family:sans-serif">
            <h2>iyzico 3D Secure Sandbox</h2>
            <p>Tutar: ${params.amount.toFixed(2)} ${params.currency}</p>
            <p>Kart: **** **** **** ${params.card.cardNumber.slice(-4)}</p>
            <form method="POST" action="${params.callbackUrl}">
              <input type="hidden" name="paymentId" value="${params.paymentId}" />
              <input type="hidden" name="status" value="success" />
              <input type="hidden" name="mdStatus" value="1" />
              <input type="hidden" name="conversationId" value="${params.paymentId}" />
              <button type="submit" style="padding:15px 40px;font-size:18px;background:#4CAF50;color:white;border:none;border-radius:8px;cursor:pointer">
                Odemeyi Onayla
              </button>
            </form>
          </div>
        </body>
        </html>
      `;

      return {
        status: 'success',
        htmlContent: sandboxHtml,
        paymentId: `iyz_${Date.now()}`,
      };
    } catch (error: any) {
      this.logger.error(`3D Secure initiation failed: ${error.message}`);
      return {
        status: 'failure',
        errorMessage: error.message,
      };
    }
  }

  async complete3DSecurePayment(params: Complete3DParams): Promise<PaymentResult> {
    try {
      // In production:
      // return new Promise((resolve, reject) => {
      //   iyzipay.threedsPayment.create({ paymentId: params.paymentId }, (err, result) => {
      //     if (err) return reject(err);
      //     resolve({
      //       status: result.status === 'success' ? 'success' : 'failure',
      //       paymentId: result.paymentId,
      //       transactionId: result.paymentTransactionId,
      //       amount: parseFloat(result.paidPrice),
      //       rawResponse: result,
      //     });
      //   });
      // });

      // Sandbox simulation
      this.logger.log(`3D Secure completed for payment ${params.paymentId}`);
      return {
        status: 'success',
        paymentId: params.paymentId,
        transactionId: `txn_${Date.now()}`,
        amount: 0,
      };
    } catch (error: any) {
      return {
        status: 'failure',
        errorMessage: error.message,
      };
    }
  }

  async checkPaymentStatus(paymentId: string): Promise<PaymentResult> {
    // In production: iyzipay.payment.retrieve({ paymentId })
    return {
      status: 'success',
      paymentId,
      transactionId: `txn_check_${Date.now()}`,
    };
  }

  async refund(paymentId: string, amount: number): Promise<RefundResult> {
    try {
      // In production:
      // return new Promise((resolve, reject) => {
      //   iyzipay.refund.create({
      //     paymentTransactionId: paymentId,
      //     price: amount.toFixed(2),
      //     currency: Iyzipay.CURRENCY.TRY,
      //     ip: '127.0.0.1',
      //   }, (err, result) => {
      //     if (err) return reject(err);
      //     resolve({ status: 'success', refundId: result.paymentId, amount });
      //   });
      // });

      this.logger.log(`Refund processed for ${paymentId}, amount: ${amount}`);
      return {
        status: 'success',
        refundId: `ref_${Date.now()}`,
        amount,
      };
    } catch (error: any) {
      return {
        status: 'failure',
        errorMessage: error.message,
      };
    }
  }
}
