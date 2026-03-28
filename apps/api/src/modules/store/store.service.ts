import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Injectable()
export class StoreService {
  async create(dto: CreateStoreDto) {
    return prisma.store.create({
      data: {
        name: dto.name,
        slug: dto.slug || dto.name.toLowerCase().replace(/\s+/g, '-'),
        organizationId: dto.organizationId,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        logo: dto.logo,
        coverImage: dto.coverImage,
        currency: dto.currency || 'TRY',
        timezone: dto.timezone || 'Europe/Istanbul',
        settings: dto.settings || {},
      },
    });
  }

  async findAll(organizationId: string | null | undefined, query: PaginationQueryDto) {
    if (!organizationId) {
      return {
        items: [],
        meta: {
          total: 0,
          page: query.page,
          limit: query.limit,
          totalPages: 0,
        },
      };
    }

    const where: any = { organizationId };

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      prisma.store.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
      }),
      prisma.store.count({ where }),
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
    const store = await prisma.store.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  async update(id: string, dto: UpdateStoreDto) {
    await this.findOne(id);

    return prisma.store.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return prisma.store.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
