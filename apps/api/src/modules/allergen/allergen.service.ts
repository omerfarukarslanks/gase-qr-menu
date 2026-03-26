import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@gase/database';

@Injectable()
export class AllergenService {
  async create(data: { name: string; icon?: string; translations?: { languageCode: string; name: string }[] }) {
    const { translations, ...allergenData } = data;

    return prisma.allergen.create({
      data: {
        ...allergenData,
        translations: translations
          ? { createMany: { data: translations } }
          : undefined,
      },
      include: { translations: true },
    });
  }

  async findAll() {
    return prisma.allergen.findMany({
      orderBy: { name: 'asc' },
      include: { translations: true },
    });
  }

  async findOne(id: string) {
    const allergen = await prisma.allergen.findUnique({
      where: { id },
      include: { translations: true },
    });
    if (!allergen) throw new NotFoundException('Allergen not found');
    return allergen;
  }

  async update(id: string, data: { name?: string; icon?: string; translations?: { languageCode: string; name: string }[] }) {
    await this.findOne(id);
    const { translations, ...allergenData } = data;

    if (translations) {
      await prisma.allergenTranslation.deleteMany({ where: { allergenId: id } });
    }

    return prisma.allergen.update({
      where: { id },
      data: {
        ...allergenData,
        translations: translations
          ? { createMany: { data: translations } }
          : undefined,
      },
      include: { translations: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.allergen.delete({ where: { id } });
  }
}
