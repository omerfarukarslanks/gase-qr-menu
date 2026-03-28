import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/campaign.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export interface DiscountResult {
  campaignId: string;
  campaignName: string;
  type: string;
  discountAmount: number;
  description: string;
}

@Injectable()
export class CampaignService {
  private normalizeType(type: string) {
    return (type === 'FIXED' ? 'FIXED_AMOUNT' : type) as any;
  }

  async create(dto: CreateCampaignDto) {
    const campaign = await prisma.campaign.create({
      data: {
        name: dto.name,
        description: dto.description,
        storeId: dto.storeId,
        type: this.normalizeType(dto.type),
        discountValue: dto.discountValue ?? 0,
        minOrderAmount: dto.minOrderAmount,
        buyQuantity: dto.buyQuantity,
        getQuantity: dto.getQuantity,
        happyHourStart: dto.happyHourStart,
        happyHourEnd: dto.happyHourEnd,
        couponCode: dto.couponCode,
        usageLimit: dto.usageLimit,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });

    // Link products if provided
    if (dto.productIds?.length) {
      await prisma.campaignProduct.createMany({
        data: dto.productIds.map((productId) => ({
          campaignId: campaign.id,
          productId,
        })),
      });
    }

    // Link categories if provided
    if (dto.categoryIds?.length) {
      await prisma.campaignCategory.createMany({
        data: dto.categoryIds.map((categoryId) => ({
          campaignId: campaign.id,
          categoryId,
        })),
      });
    }

    return campaign;
  }

  async findAll(storeId: string, query: PaginationQueryDto) {
    const where: any = { storeId };

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          campaignProducts: { include: { product: { select: { id: true, slug: true } } } },
          campaignCategories: { include: { category: { select: { id: true, slug: true } } } },
        },
      }),
      prisma.campaign.count({ where }),
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

  async findActive(storeId: string) {
    const now = new Date();
    const campaigns = await prisma.campaign.findMany({
      where: {
        storeId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        campaignProducts: true,
        campaignCategories: true,
      },
      orderBy: { startDate: 'desc' },
    });

    // Filter happy hour campaigns by current time
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return campaigns.filter((c) => {
      if (c.type === 'HAPPY_HOUR' && c.happyHourStart && c.happyHourEnd) {
        return currentTime >= c.happyHourStart && currentTime <= c.happyHourEnd;
      }
      // Check usage limit
      if (c.usageLimit && c.usedCount >= c.usageLimit) return false;
      return true;
    });
  }

  async findOne(id: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        campaignProducts: { include: { product: true } },
        campaignCategories: { include: { category: true } },
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async validateCoupon(storeId: string, couponCode: string) {
    const now = new Date();
    const campaign = await prisma.campaign.findFirst({
      where: {
        storeId,
        couponCode,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (!campaign) {
      return { valid: false, message: 'Gecersiz veya suresi dolmus kupon kodu' };
    }

    if (campaign.usageLimit && campaign.usedCount >= campaign.usageLimit) {
      return { valid: false, message: 'Kupon kullanim limiti dolmus' };
    }

    return { valid: true, campaign };
  }

  // Calculate discount for an order
  async calculateDiscount(
    storeId: string,
    orderTotal: number,
    items: Array<{ productId: string; quantity: number; unitPrice: number }>,
    couponCode?: string,
  ): Promise<DiscountResult | null> {
    let campaign: any = null;

    // If coupon code provided, use that specific campaign
    if (couponCode) {
      const result = await this.validateCoupon(storeId, couponCode);
      if (!result.valid) return null;
      campaign = result.campaign;
    } else {
      // Find best applicable auto-campaign (no coupon required)
      const activeCampaigns = await this.findActive(storeId);
      const noCouponCampaigns = activeCampaigns.filter((c) => !c.couponCode);

      // Find the campaign that gives the best discount
      let bestDiscount = 0;
      for (const c of noCouponCampaigns) {
        if (c.minOrderAmount && orderTotal < c.minOrderAmount) continue;
        const discount = this.calculateCampaignDiscount(c, orderTotal, items);
        if (discount > bestDiscount) {
          bestDiscount = discount;
          campaign = c;
        }
      }
    }

    if (!campaign) return null;
    if (campaign.minOrderAmount && orderTotal < campaign.minOrderAmount) return null;

    const discountAmount = this.calculateCampaignDiscount(campaign, orderTotal, items);
    if (discountAmount <= 0) return null;

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      type: campaign.type,
      discountAmount,
      description: this.getDiscountDescription(campaign, discountAmount),
    };
  }

  private calculateCampaignDiscount(
    campaign: any,
    orderTotal: number,
    items: Array<{ productId: string; quantity: number; unitPrice: number }>,
  ): number {
    switch (campaign.type) {
      case 'PERCENTAGE':
        return Math.round((orderTotal * campaign.discountValue) / 100 * 100) / 100;

      case 'FIXED_AMOUNT':
        return Math.min(campaign.discountValue, orderTotal);

      case 'BUY_X_GET_Y': {
        if (!campaign.buyQuantity || !campaign.getQuantity) return 0;
        // Find cheapest items to give free
        const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
        const requiredQuantity = campaign.buyQuantity + campaign.getQuantity;
        if (totalQuantity < requiredQuantity) return 0;

        // Sort items by price ascending, cheapest items are free
        const sortedPrices = items
          .flatMap((i) => Array(i.quantity).fill(i.unitPrice))
          .sort((a, b) => a - b);

        const freeCount = Math.floor(totalQuantity / requiredQuantity) * campaign.getQuantity;
        return sortedPrices.slice(0, freeCount).reduce((sum, p) => sum + p, 0);
      }

      case 'HAPPY_HOUR':
        return Math.round((orderTotal * campaign.discountValue) / 100 * 100) / 100;

      default:
        return 0;
    }
  }

  private getDiscountDescription(campaign: any, amount: number): string {
    switch (campaign.type) {
      case 'PERCENTAGE':
        return `%${campaign.discountValue} indirim (${campaign.name})`;
      case 'FIXED_AMOUNT':
        return `${campaign.discountValue} TL indirim (${campaign.name})`;
      case 'BUY_X_GET_Y':
        return `${campaign.buyQuantity} al ${campaign.getQuantity} ode (${campaign.name})`;
      case 'HAPPY_HOUR':
        return `Happy Hour %${campaign.discountValue} indirim (${campaign.name})`;
      default:
        return `${amount} TL indirim`;
    }
  }

  // Increment usage count after order is placed
  async incrementUsage(campaignId: string) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { usedCount: { increment: 1 } },
    });
  }

  async update(id: string, dto: UpdateCampaignDto) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);

    // Remove array fields from direct update
    delete data.productIds;
    delete data.categoryIds;

    if (data.type) {
      data.type = this.normalizeType(data.type);
    }
    if (data.discountValue === undefined && data.type) {
      data.discountValue = 0;
    }

    const campaign = await prisma.campaign.update({ where: { id }, data });

    // Update product links if provided
    if (dto.productIds) {
      await prisma.campaignProduct.deleteMany({ where: { campaignId: id } });
      if (dto.productIds.length) {
        await prisma.campaignProduct.createMany({
          data: dto.productIds.map((productId) => ({ campaignId: id, productId })),
        });
      }
    }

    // Update category links if provided
    if (dto.categoryIds) {
      await prisma.campaignCategory.deleteMany({ where: { campaignId: id } });
      if (dto.categoryIds.length) {
        await prisma.campaignCategory.createMany({
          data: dto.categoryIds.map((categoryId) => ({ campaignId: id, categoryId })),
        });
      }
    }

    return campaign;
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.campaign.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
