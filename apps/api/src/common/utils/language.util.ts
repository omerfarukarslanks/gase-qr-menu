import { prisma } from '@gase/database';

export interface TranslationInput {
  languageCode: string;
  name: string;
  description?: string | null;
}

export async function getLanguageCodeMap(codes: string[]) {
  const uniqueCodes = [...new Set(codes.map((code) => code.toLowerCase()))];

  if (uniqueCodes.length === 0) {
    return new Map<string, string>();
  }

  const languages = await prisma.language.findMany({
    where: {
      code: { in: uniqueCodes },
    },
    select: {
      id: true,
      code: true,
    },
  });

  return new Map(languages.map((language) => [language.code.toLowerCase(), language.id]));
}

export async function mapTranslationsWithLanguageIds<T extends TranslationInput>(
  translations: T[],
) {
  const languageMap = await getLanguageCodeMap(
    translations.map((translation) => translation.languageCode),
  );

  return translations
    .map((translation) => {
      const languageId = languageMap.get(translation.languageCode.toLowerCase());

      if (!languageId) {
        return null;
      }

      return {
        languageId,
        name: translation.name,
        description: translation.description ?? undefined,
      };
    })
    .filter((translation): translation is NonNullable<typeof translation> => translation !== null);
}

export function pickLocalizedTranslation<
  T extends {
    name: string;
    description?: string | null;
    language?: { code: string };
  },
>(translations: T[], preferredCode?: string, fallbackCode?: string) {
  if (translations.length === 0) {
    return null;
  }

  const normalizedPreferred = preferredCode?.toLowerCase();
  const normalizedFallback = fallbackCode?.toLowerCase();

  return (
    translations.find((translation) => translation.language?.code?.toLowerCase() === normalizedPreferred) ??
    translations.find((translation) => translation.language?.code?.toLowerCase() === normalizedFallback) ??
    translations[0]
  );
}

export function splitDisplayName(name: string) {
  const normalizedName = name.trim();

  if (!normalizedName) {
    return {
      firstName: '',
      lastName: '',
    };
  }

  const parts = normalizedName.split(/\s+/);

  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}
