import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Injectable()
export class OrganizationService {
  async create(dto: CreateOrganizationDto, ownerId: string) {
    return prisma.organization.create({
      data: {
        name: dto.name,
        slug: dto.slug || dto.name.toLowerCase().replace(/\s+/g, '-'),
        logo: dto.logo,
        defaultCurrency: dto.defaultCurrency || 'TRY',
        ownerId,
      },
    });
  }

  async findAll(query: PaginationQueryDto) {
    const where = query.search
      ? { name: { contains: query.search, mode: 'insensitive' as const } }
      : {};

    const [items, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
      }),
      prisma.organization.count({ where }),
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
    const org = await prisma.organization.findUnique({
      where: { id },
      include: { stores: true },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    await this.findOne(id);

    return prisma.organization.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return prisma.organization.delete({ where: { id } });
  }
}
