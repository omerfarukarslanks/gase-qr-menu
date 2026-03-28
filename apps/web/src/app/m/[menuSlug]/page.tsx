"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Clock3,
  Flame,
  ShoppingCart,
  Sparkles,
  Store,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FilterBar, MenuFilterValues } from "@/components/menu/filter-bar";
import { ProductCard } from "@/components/menu/product-card";
import { useCartStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  usePublicMenu,
  PublicProduct,
} from "@/hooks/use-public-menu";

interface MenuPageProps {
  params: { menuSlug: string };
}

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[var(--card-shadow)] animate-pulse">
      <div className="flex gap-4 p-4">
        <div className="h-28 w-28 shrink-0 rounded-[1.25rem] bg-muted" />
        <div className="flex flex-1 flex-col justify-between gap-3">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded-full bg-muted" />
            <div className="h-5 w-2/3 rounded-full bg-muted" />
            <div className="h-4 w-full rounded-full bg-muted" />
            <div className="h-4 w-4/5 rounded-full bg-muted" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-6 w-20 rounded-full bg-muted" />
            <div className="h-9 w-24 rounded-full bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MenuPage({ params }: MenuPageProps) {
  const [tableFromQr, setTableFromQr] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState<MenuFilterValues>({
    search: "",
    excludeAllergens: [],
  });

  const totalItemsCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const setTable = useCartStore((state) => state.setTable);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const search = new URLSearchParams(window.location.search);
    setTableFromQr(search.get("table") ?? "");
  }, []);

  const { data: menuData, isLoading, isError, error } = usePublicMenu(
    params.menuSlug,
    tableFromQr ? { table: tableFromQr } : undefined
  );

  useEffect(() => {
    if (!menuData?.store.tableId) {
      return;
    }

    setTable({
      tableId: menuData.store.tableId,
      tableName: menuData.store.tableName,
      menuSlug: params.menuSlug,
    });
  }, [
    menuData?.store.tableId,
    menuData?.store.tableName,
    params.menuSlug,
    setTable,
  ]);

  const categories = menuData?.categories ?? [];
  const storeName = menuData?.store?.name ?? "Menu";
  const storeLogo = menuData?.store?.logo;

  const allProducts = useMemo(() => {
    const products: (PublicProduct & { categoryName?: string })[] = [];

    for (const category of categories) {
      for (const product of category.products) {
        products.push({
          ...product,
          categoryId: category.id,
          categoryName: category.name,
        });
      }
    }

    return products;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      if (selectedCategory && product.categoryId !== selectedCategory) {
        return false;
      }

      const query = searchQuery.toLowerCase();
      if (
        query &&
        !product.name.toLowerCase().includes(query) &&
        !(product.description ?? "").toLowerCase().includes(query)
      ) {
        return false;
      }

      if (advancedFilters.minPrice && product.price < advancedFilters.minPrice) {
        return false;
      }

      if (advancedFilters.maxPrice && product.price > advancedFilters.maxPrice) {
        return false;
      }

      if (advancedFilters.excludeAllergens.length > 0) {
        const productAllergenCodes = product.allergens.map((allergen) =>
          typeof allergen === "string" ? allergen : allergen.code
        );

        const hasExcludedAllergen = advancedFilters.excludeAllergens.some((code) =>
          productAllergenCodes.includes(code)
        );

        if (hasExcludedAllergen) {
          return false;
        }
      }

      return true;
    });
  }, [advancedFilters, allProducts, searchQuery, selectedCategory]);

  const groupedProducts = useMemo(() => {
    if (selectedCategory) {
      return null;
    }

    return categories
      .map((category) => ({
        id: category.id,
        name: category.name,
        products: filteredProducts.filter((product) => product.categoryId === category.id),
      }))
      .filter((group) => group.products.length > 0);
  }, [categories, filteredProducts, selectedCategory]);

  const activeFilterCount =
    (advancedFilters.minPrice ? 1 : 0) +
    (advancedFilters.maxPrice ? 1 : 0) +
    advancedFilters.excludeAllergens.length +
    (searchQuery ? 1 : 0);

  const heroStats = [
    {
      label: "Kategori",
      value: `${categories.length}`,
      hint: "Duzenli bolum yapisi",
      icon: Sparkles,
    },
    {
      label: "Gorunen urun",
      value: `${filteredProducts.length}`,
      hint: activeFilterCount > 0 ? "Filtrelenmis sonuc" : "Canli menu sayisi",
      icon: Flame,
    },
    {
      label: "Servis akisi",
      value: tableFromQr ? `Masa ${tableFromQr}` : "QR hazir",
      hint: "Hizli siparis akisi",
      icon: Clock3,
    },
  ];

  const handleFilterChange = (filters: MenuFilterValues) => {
    setAdvancedFilters(filters);
  };

  if (isLoading) {
    return (
      <div className="space-y-5 pb-28">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-card p-5 shadow-[var(--card-shadow)]">
          <div className="space-y-4">
            <div className="h-4 w-28 rounded-full bg-muted" />
            <div className="h-10 w-2/3 rounded-[1rem] bg-muted" />
            <div className="h-5 w-full rounded-full bg-muted" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-[1.25rem] bg-muted p-4">
                <div className="h-4 w-20 rounded-full bg-background" />
                <div className="mt-3 h-7 w-24 rounded-full bg-background" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-border bg-background/90 p-3 shadow-[var(--card-shadow)]">
          <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-10 w-24 shrink-0 rounded-full bg-muted" />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <ProductCardSkeleton key={item} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-lg rounded-[2rem] border border-border bg-card p-8 text-center shadow-[var(--card-shadow)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-primary">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-5 font-display text-[28px] leading-[34px] text-foreground">
            Menü şu anda yüklenemedi
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Bu QR kod ile ilişkili menüye erişemedik. İnternet bağlantısını veya restoran ekibinden paylaşılan bağlantıyı kontrol edin."}
          </p>
        </div>
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-lg rounded-[2rem] border border-border bg-card p-8 text-center shadow-[var(--card-shadow)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-primary">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-5 font-display text-[28px] leading-[34px] text-foreground">
            Menü bulunamadı
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Bu bağlantı için yayınlanmış bir menü bulunmuyor olabilir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-28">
      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-5 shadow-[var(--card-shadow)] sm:p-6">
        <div
          className="absolute inset-0 opacity-90"
          style={{ backgroundImage: "var(--hero-glow)" }}
        />
        <div className="relative flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                {storeLogo ? (
                  <img
                    src={storeLogo}
                    alt={storeName}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <Store className="h-3.5 w-3.5 text-primary" />
                )}
                {tableFromQr ? `Masa ${tableFromQr}` : "Canli menu"}
              </div>
              <h1 className="mt-4 font-display text-[34px] leading-[42px] text-foreground sm:text-[42px] sm:leading-[48px]">
                {storeName}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-6 text-muted-foreground">
                Menü daha net kategori geçişleri, daha güçlü fiyat hiyerarşisi ve
                daha görünür sipariş CTA'larıyla sunuluyor.
              </p>
            </div>

            <Link href={`/m/${params.menuSlug}/cart`} className="shrink-0">
              <Button variant="outline" size="icon" className="relative rounded-full">
                <ShoppingCart className="h-4 w-4" />
                {totalItemsCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-[var(--card-shadow)]">
                    {totalItemsCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[1.25rem] border border-border bg-background/80 p-4 backdrop-blur"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {stat.label}
                  </p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-xl font-semibold text-foreground">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sticky top-3 z-20 space-y-3 rounded-[1.75rem] border border-border bg-background/90 p-3 shadow-[var(--card-shadow)] backdrop-blur-xl">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
              selectedCategory === null
                ? "bg-primary text-primary-foreground shadow-[var(--card-shadow)]"
                : "bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
            )}
          >
            Tümü
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground shadow-[var(--card-shadow)]"
                  : "bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              )}
            >
              {category.name}
            </button>
          ))}
        </div>

        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={advancedFilters}
          onFilterChange={handleFilterChange}
        />
      </section>

      {filteredProducts.length === 0 ? (
        <div className="rounded-[1.75rem] border border-border bg-card p-8 text-center shadow-[var(--card-shadow)]">
          <p className="font-display text-[28px] leading-[34px] text-foreground">
            Uygun ürün bulunamadı
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Farklı bir kategori seçebilir veya aktif filtreleri temizleyerek tüm
            ürünleri yeniden görüntüleyebilirsiniz.
          </p>
        </div>
      ) : selectedCategory || activeFilterCount > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              description={product.description}
              price={product.price}
              images={product.images}
              allergens={product.allergens}
              menuSlug={params.menuSlug}
              isAvailable={product.isAvailable}
              categoryName={product.categoryName}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedProducts?.map((group) => (
            <section
              key={group.id}
              className="rounded-[1.75rem] border border-border bg-background/70 p-4 shadow-[var(--card-shadow)]"
            >
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Menu bolumu
                  </p>
                  <h2 className="mt-2 font-display text-[28px] leading-[34px] text-foreground">
                    {group.name}
                  </h2>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                  {group.products.length} urun
                </span>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {group.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    description={product.description}
                    price={product.price}
                    images={product.images}
                    allergens={product.allergens}
                    menuSlug={params.menuSlug}
                    isAvailable={product.isAvailable}
                    categoryName={product.categoryName}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {totalItemsCount > 0 && (
        <Link
          href={`/m/${params.menuSlug}/cart`}
          className="fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-xl"
        >
          <Button className="h-14 w-full text-base shadow-[var(--card-shadow-hover)]">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Sepete Git ({totalItemsCount} urun)
          </Button>
        </Link>
      )}
    </div>
  );
}
