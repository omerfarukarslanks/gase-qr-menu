import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@gase/database';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CartService {
  private redis: RedisClientType;
  private readonly CART_TTL = 3600; // 1 hour

  constructor(private configService: ConfigService) {
    const redisConfig = this.configService.get('app.redis');
    this.redis = createClient({
      socket: {
        host: redisConfig?.host || 'localhost',
        port: redisConfig?.port || 6379,
      },
      password: redisConfig?.password || undefined,
    });
    this.redis.connect().catch(console.error);
  }

  private cartKey(sessionId: string): string {
    return `cart:${sessionId}`;
  }

  async addItem(dto: AddToCartDto) {
    const key = this.cartKey(dto.sessionId);

    // Verify product exists and get price
    const product = await prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product || !product.isActive || !product.isAvailable) {
      throw new NotFoundException('Product not found or unavailable');
    }

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
        productName: product.name,
        quantity: dto.quantity,
        unitPrice: Number(product.discountPrice || product.price),
        notes: dto.notes,
        modifiers: dto.modifiers || [],
        coverImage: product.coverImage,
      });
    }

    await this.redis.setEx(key, this.CART_TTL, JSON.stringify(cart));

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

    await this.redis.setEx(key, this.CART_TTL, JSON.stringify(cart));

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
