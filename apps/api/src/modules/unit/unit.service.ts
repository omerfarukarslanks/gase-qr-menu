import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';

@Injectable()
export class UnitService {
  async create(data: { name: string; abbreviation: string; storeId: string }) {
    return prisma.unit.create({ data });
  }

  async findAll(storeId: string) {
    return prisma.unit.findMany({
      where: { storeId },
      orderBy: { name: 'asc' },
    });
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
