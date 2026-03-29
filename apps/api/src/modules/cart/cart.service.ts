import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@gase/database';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import Redis from 'ioredis';

@Injectable()
export class CartService {
  private redis: Redis;
  private readonly CART_TTL = 3600; // 1 hour
  private readonly logger = new Logger(CartService.name);
  private isConnected = false;

  constructor(private configService: ConfigService) {
    const redisConfig = this.configService.get('redis');
    this.redis = new Redis({
      host: redisConfig?.host || 'localhost',
      port: redisConfig?.port || 6379,
      password: redisConfig?.password || undefined,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 5) {
          this.logger.error('Redis connection failed after 5 retries');
          return null;
        }
        return Math.min(times * 500, 3000);
      },
    });

    this.redis.on('connect', () => {
      this.isConnected = true;
      this.logger.log('Redis connected for cart service');
    });

    this.redis.on('error', (err) => {
      this.isConnected = false;
      this.logger.error(`Redis connection error: ${err.message}`);
    });

    this.redis.on('close', () => {
      this.isConnected = false;
      this.logger.warn('Redis connection closed');
    });

    this.redis.connect().catch((err) => {
      this.logger.error(`Redis initial connection failed: ${err.message}`);
    });
  }

  private cartKey(sessionId: string): string {
    return `cart:${sessionId}`;
  }

  async addItem(dto: AddToCartDto) {
    const key = this.cartKey(dto.sessionId);

    // Verify product exists and get price
    const product = await prisma.product.findUnique({
      where: { id: dto.productId },
      include: {
        translations: true,
        images: {
          where: { isCover: true },
          take: 1,
        },
      },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found or unavailable');
    }

    // Get product name from first translation or slug as fallback
    const productName =
      product.translations.length > 0
        ? product.translations[0].name
        : product.slug;

    // Get cover image from ProductImage relation
    const coverImage =
      product.images.length > 0 ? product.images[0].url : null;

    const cartData = await this.redis.get(key);
    const cart = cartData ? JSON.parse(cartData) : { storeId: dto.storeId, items: [] };

    const existingIndex = cart.items.findIndex(
      (item: any) => item.productId === dto.productId,
    );

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += dto.quantity;
      cart.items[existingIndex].notes = dto.notes || cart.items[existingIndex].notes;
    } else {
      cart.items.push({
        productId: dto.productId,
        productName,
        quantity: dto.quantity,
        unitPrice: Number(product.salePrice),
        notes: dto.notes,
        modifiers: dto.modifiers || [],
        coverImage,
      });
    }

    await this.redis.setex(key, this.CART_TTL, JSON.stringify(cart));

    return this.formatCart(cart);
  }

  async getCart(sessionId: string) {
    const key = this.cartKey(sessionId);
    const cartData = await this.redis.get(key);

    if (!cartData) {
      return { storeId: null, items: [], totalAmount: 0, itemCount: 0 };
    }

    return this.formatCart(JSON.parse(cartData));
  }

  async updateItem(sessionId: string, productId: string, dto: UpdateCartItemDto) {
    const key = this.cartKey(sessionId);
    const cartData = await this.redis.get(key);

    if (!cartData) {
      throw new NotFoundException('Cart not found');
    }

    const cart = JSON.parse(cartData);
    const itemIndex = cart.items.findIndex((item: any) => item.productId === productId);

    if (itemIndex < 0) {
      throw new NotFoundException('Item not in cart');
    }

    if (dto.quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = dto.quantity;
      if (dto.notes !== undefined) {
        cart.items[itemIndex].notes = dto.notes;
      }
    }

    await this.redis.setex(key, this.CART_TTL, JSON.stringify(cart));

    return this.formatCart(cart);
  }

  async clearCart(sessionId: string) {
    const key = this.cartKey(sessionId);
    await this.redis.del(key);
    return { message: 'Cart cleared' };
  }

  private formatCart(cart: any) {
    const items = cart.items || [];
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.unitPrice * item.quantity,
      0,
    );
    const itemCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);

    return {
      storeId: cart.storeId,
      items,
      totalAmount,
      itemCount,
    };
  }
}
