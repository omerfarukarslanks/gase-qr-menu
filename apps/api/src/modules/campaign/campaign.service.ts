import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/campaign.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CampaignService {
  async create(dto: CreateCampaignDto) {
    return prisma.campaign.create({
      data: {
        name: dto.name,
        description: dto.description,
        storeId: dto.storeId,
        type: dto.type,
        discountValue: dto.discountValue,
        minOrderAmount: dto.minOrderAmount,
        buyQuantity: dto.buyQuantity,
        getQuantity: dto.getQuantity,
        happyHourStart: dto.happyHourStart,
        happyHourEnd: dto.happyHourEnd,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        couponCode: dto.couponCode,
      },
    });
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
    return prisma.campaign.findMany({
      where: {
        storeId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
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
      return { valid: false, message: 'Invalid or expired coupon' };
    }

    return { valid: true, campaign };
  }

  async update(id: string, dto: UpdateCampaignDto) {
    await this.findOne(id);
    return prisma.campaign.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.campaign.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
