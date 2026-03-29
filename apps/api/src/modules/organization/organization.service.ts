import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Injectable()
export class OrganizationService {
  async create(dto: CreateOrganizationDto, ownerId: string) {
    return prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.name,
          slug: dto.slug || dto.name.toLowerCase().replace(/\s+/g, '-'),
          logo: dto.logo,
          defaultCurrency: dto.defaultCurrency || 'TRY',
          ownerId,
        },
      });

      await tx.user.update({
        where: { id: ownerId },
        data: { organizationId: organization.id },
      });

      return organization;
    });
  }

  async findAll(query: PaginationQueryDto) {
    const where = query.search
      ? { name: { contains: query.search, mode: 'insensitive' as const } }
      : {};

    const [items, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        ...query.prismaPagination,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
      }),
      prisma.organization.count({ where }),
    ]);

    return {
      items,
      meta: query.buildMeta(total),
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
