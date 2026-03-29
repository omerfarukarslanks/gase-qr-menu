import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Injectable()
export class UnitService {
  async create(data: { name: string; abbreviation: string; storeId: string }) {
    return prisma.unit.create({ data });
  }

  async findAll(storeId: string, query: PaginationQueryDto) {
    const where = {
      storeId,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { abbreviation: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.unit.findMany({
        where,
        ...query.prismaPagination,
        orderBy: { name: 'asc' },
      }),
      prisma.unit.count({ where }),
    ]);

    return {
      items,
      meta: query.buildMeta(total),
    };
  }

  async findOne(id: string) {
    const unit = await prisma.unit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async update(id: string, data: { name?: string; abbreviation?: string }) {
    await this.findOne(id);
    return prisma.unit.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.unit.delete({ where: { id } });
  }
}
