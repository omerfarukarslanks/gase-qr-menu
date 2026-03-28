import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, prisma } from '@gase/database';
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

  async findAll(
    currentUser:
      | {
          id: string;
          role: string;
          organizationId?: string | null;
        }
      | null
      | undefined,
    query: PaginationQueryDto,
  ) {
    if (!currentUser?.id) {
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

    const where: Prisma.StoreWhereInput = {};
    const membershipByStoreId = new Map<string, string>();

    if (currentUser.role === 'SUPER_ADMIN') {
      // Super admins can browse every store.
    } else if (currentUser.role === 'OWNER') {
      if (!currentUser.organizationId) {
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

      where.organizationId = currentUser.organizationId;
    } else {
      const memberships = await prisma.userStore.findMany({
        where: {
          userId: currentUser.id,
          isActive: true,
        },
        select: {
          storeId: true,
          role: true,
        },
      });

      if (memberships.length === 0) {
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

      for (const membership of memberships) {
        membershipByStoreId.set(membership.storeId, membership.role);
      }

      where.id = { in: memberships.map((membership) => membership.storeId) };
    }

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
      items: items.map((item) => ({
        ...item,
        role:
          currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'OWNER'
            ? currentUser.role
            : membershipByStoreId.get(item.id) || null,
      })),
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
