import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed Languages
  const languages = await Promise.all([
    prisma.language.upsert({
      where: { code: "tr" },
      update: {},
      create: { code: "tr", name: "Türkçe", isDefault: true },
    }),
    prisma.language.upsert({
      where: { code: "en" },
      update: {},
      create: { code: "en", name: "English", isDefault: false },
    }),
    prisma.language.upsert({
      where: { code: "ar" },
      update: {},
      create: { code: "ar", name: "العربية", isDefault: false },
    }),
    prisma.language.upsert({
      where: { code: "de" },
      update: {},
      create: { code: "de", name: "Deutsch", isDefault: false },
    }),
    prisma.language.upsert({
      where: { code: "ru" },
      update: {},
      create: { code: "ru", name: "Русский", isDefault: false },
    }),
  ]);

  console.log(`Seeded ${languages.length} languages`);

  // Seed EU 14 Allergens
  const allergenData = [
    { code: "gluten", tr: "Gluten", en: "Gluten" },
    { code: "crustaceans", tr: "Kabuklular", en: "Crustaceans" },
    { code: "eggs", tr: "Yumurta", en: "Eggs" },
    { code: "fish", tr: "Balık", en: "Fish" },
    { code: "peanuts", tr: "Yer Fıstığı", en: "Peanuts" },
    { code: "soybeans", tr: "Soya", en: "Soybeans" },
    { code: "milk", tr: "Süt", en: "Milk" },
    { code: "nuts", tr: "Kabuklu Yemişler", en: "Tree Nuts" },
    { code: "celery", tr: "Kereviz", en: "Celery" },
    { code: "mustard", tr: "Hardal", en: "Mustard" },
    { code: "sesame", tr: "Susam", en: "Sesame" },
    { code: "sulphites", tr: "Sülfitler", en: "Sulphites" },
    { code: "lupin", tr: "Acı Bakla", en: "Lupin" },
    { code: "molluscs", tr: "Yumuşakçalar", en: "Molluscs" },
  ];

  const trLang = languages[0];
  const enLang = languages[1];

  for (const data of allergenData) {
    const allergen = await prisma.allergen.upsert({
      where: { code: data.code },
      update: {},
      create: {
        code: data.code,
        icon: `allergen-${data.code}`,
      },
    });

    await prisma.allergenTranslation.upsert({
      where: {
        allergenId_languageId: {
          allergenId: allergen.id,
          languageId: trLang.id,
        },
      },
      update: {},
      create: {
        allergenId: allergen.id,
        languageId: trLang.id,
        name: data.tr,
      },
    });

    await prisma.allergenTranslation.upsert({
      where: {
        allergenId_languageId: {
          allergenId: allergen.id,
          languageId: enLang.id,
        },
      },
      update: {},
      create: {
        allergenId: allergen.id,
        languageId: enLang.id,
        name: data.en,
      },
    });
  }

  console.log(`Seeded ${allergenData.length} allergens with translations`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
