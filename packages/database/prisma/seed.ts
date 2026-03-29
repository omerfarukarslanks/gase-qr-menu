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
    { code: "gluten", tr: "Gluten", en: "Gluten", ar: "الغلوتين", de: "Gluten", ru: "Глютен" },
    { code: "crustaceans", tr: "Kabuklular", en: "Crustaceans", ar: "القشريات", de: "Krebstiere", ru: "Ракообразные" },
    { code: "eggs", tr: "Yumurta", en: "Eggs", ar: "البيض", de: "Eier", ru: "Яйца" },
    { code: "fish", tr: "Balık", en: "Fish", ar: "السمك", de: "Fisch", ru: "Рыба" },
    { code: "peanuts", tr: "Yer Fıstığı", en: "Peanuts", ar: "الفول السوداني", de: "Erdnüsse", ru: "Арахис" },
    { code: "soybeans", tr: "Soya", en: "Soybeans", ar: "فول الصويا", de: "Soja", ru: "Соя" },
    { code: "milk", tr: "Süt", en: "Milk", ar: "الحليب", de: "Milch", ru: "Молоко" },
    { code: "nuts", tr: "Kabuklu Yemişler", en: "Tree Nuts", ar: "المكسرات", de: "Schalenfrüchte", ru: "Орехи" },
    { code: "celery", tr: "Kereviz", en: "Celery", ar: "الكرفس", de: "Sellerie", ru: "Сельдерей" },
    { code: "mustard", tr: "Hardal", en: "Mustard", ar: "الخردل", de: "Senf", ru: "Горчица" },
    { code: "sesame", tr: "Susam", en: "Sesame", ar: "السمسم", de: "Sesam", ru: "Кунжут" },
    { code: "sulphites", tr: "Sülfitler", en: "Sulphites", ar: "الكبريتات", de: "Sulfite", ru: "Сульфиты" },
    { code: "lupin", tr: "Acı Bakla", en: "Lupin", ar: "الترمس", de: "Lupinen", ru: "Люпин" },
    { code: "molluscs", tr: "Yumuşakçalar", en: "Molluscs", ar: "الرخويات", de: "Weichtiere", ru: "Моллюски" },
  ];

  const [trLang, enLang, arLang, deLang, ruLang] = languages;

  for (const data of allergenData) {
    const allergen = await prisma.allergen.upsert({
      where: { code: data.code },
      update: {},
      create: {
        code: data.code,
        icon: `allergen-${data.code}`,
      },
    });

    const translationEntries = [
      { lang: trLang, name: data.tr },
      { lang: enLang, name: data.en },
      { lang: arLang, name: data.ar },
      { lang: deLang, name: data.de },
      { lang: ruLang, name: data.ru },
    ];

    for (const entry of translationEntries) {
      await prisma.allergenTranslation.upsert({
        where: {
          allergenId_languageId: {
            allergenId: allergen.id,
            languageId: entry.lang.id,
          },
        },
        update: {},
        create: {
          allergenId: allergen.id,
          languageId: entry.lang.id,
          name: entry.name,
        },
      });
    }
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
