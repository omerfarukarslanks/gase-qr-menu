import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@gase/database';
import slugify from 'slugify';
import { mapTranslationsWithLanguageIds } from '../../common/utils/language.util';

type AllergenInput = {
  name?: string;
  code?: string;
  icon?: string;
  translations?: { languageCode: string; name: string; description?: string }[];
};

@Injectable()
export class AllergenService {
  private async buildTranslations(translations?: AllergenInput['translations']) {
    const normalizedTranslations = translations ?? [];
    const mappedTranslations = await mapTranslationsWithLanguageIds(normalizedTranslations);

    if (normalizedTranslations.length !== mappedTranslations.length) {
      throw new BadRequestException('One or more allergen translations use an unknown language code');
    }

    return mappedTranslations;
  }

  private formatAllergen(allergen: any) {
    const primaryTranslation = allergen.translations[0];

    return {
      ...allergen,
      name: primaryTranslation?.name ?? allergen.code,
      translations: allergen.translations.map((translation: any) => ({
        languageCode: translation.language?.code,
        name: translation.name,
        description: translation.description ?? null,
      })),
    };
  }

  async create(data: AllergenInput) {
    const mappedTranslations = await this.buildTranslations(data.translations);
    const baseName = data.name || data.translations?.[0]?.name || data.code || `allergen-${Date.now()}`;

    const allergen = await prisma.allergen.create({
      data: {
        code:
          data.code ||
          slugify(baseName, {
            lower: true,
            strict: true,
          }),
        icon: data.icon,
        translations: mappedTranslations.length
          ? { createMany: { data: mappedTranslations } }
          : undefined,
      },
      include: {
        translations: {
          include: {
            language: { select: { code: true } },
          },
        },
      },
    });

    return this.formatAllergen(allergen);
  }

  async findAll() {
    const allergens = await prisma.allergen.findMany({
      orderBy: { code: 'asc' },
      include: {
        translations: {
          include: {
            language: { select: { code: true } },
          },
        },
      },
    });

    return allergens.map((allergen) => this.formatAllergen(allergen));
  }

  async findOne(id: string) {
    const allergen = await prisma.allergen.findUnique({
      where: { id },
      include: {
        translations: {
          include: {
            language: { select: { code: true } },
          },
        },
      },
    });
    if (!allergen) throw new NotFoundException('Allergen not found');
    return this.formatAllergen(allergen);
  }

  async update(id: string, data: AllergenInput) {
    await this.findOne(id);
    const mappedTranslations = await this.buildTranslations(data.translations);

    if (data.translations) {
      await prisma.allergenTranslation.deleteMany({ where: { allergenId: id } });
    }

    const allergen = await prisma.allergen.update({
      where: { id },
      data: {
        code:
          data.code ||
          (data.name
            ? slugify(data.name, {
                lower: true,
                strict: true,
              })
            : undefined),
        icon: data.icon,
        translations: data.translations
          ? { createMany: { data: mappedTranslations } }
          : undefined,
      },
      include: {
        translations: {
          include: {
            language: { select: { code: true } },
          },
        },
      },
    });

    return this.formatAllergen(allergen);
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.allergen.delete({ where: { id } });
  }
}
