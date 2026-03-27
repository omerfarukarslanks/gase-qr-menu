"use client";

import { useState, useMemo } from "react";
import { ShoppingCart, Store, Loader2 , AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FilterBar, MenuFilterValues } from "@/components/menu/filter-bar";
import { ProductCard } from "@/components/menu/product-card";
import { useCartStore } from "@/lib/store";
import { usePublicMenu, PublicProduct, PublicCategory } from "@/hooks/use-public-menu";

interface MenuPageProps {
  params: { menuSlug: string };
}

// ---- Mock data fallback for development ----
const mockCategories: PublicCategory[] = [
  {
    id: "mock-1",
    name: "Başlangıçlar",
    order: 1,
    products: [
      {
        id: "mock-p1",
        name: "Mercimek Çorbası",
        description: "Geleneksel kırmızı mercimek çorbası, limon ve ekmek ile servis edilir.",
        price: 85,
        images: [],
        allergens: [{ id: "a1", code: "gluten", name: "Gluten" }],
        ingredients: [{ id: "i1", name: "Mercimek", isRemovable: false }],
        categoryId: "mock-1",
        isAvailable: true,
      },
      {
        id: "mock-p2",
        name: "Sigara Böreği",
        description: "Peynirli el açması sigara böreği (4 adet).",
        price: 110,
        images: [],
        allergens: [
          { id: "a1", code: "gluten", name: "Gluten" },
          { id: "a2", code: "milk", name: "Süt" },
        ],
        ingredients: [],
        categoryId: "mock-1",
        isAvailable: true,
      },
    ],
  },
  {
    id: "mock-2",
    name: "Ana Yemekler",
    order: 2,
    products: [
      {
        id: "mock-p3",
        name: "Izgara Köfte",
        description: "Dana kıyma köfte, pilav ve ızgara sebze ile.",
        price: 240,
        images: [],
        allergens: [{ id: "a1", code: "gluten", name: "Gluten" }],
        ingredients: [],
        categoryId: "mock-2",
        isAvailable: true,
      },
      {
        id: "mock-p4",
        name: "Tavuk Şiş",
        description: "Marine edilmiş tavuk şiş, bulgur pilavı ve salata ile.",
        price: 210,
        images: [],
        allergens: [],
        ingredients: [],
        categoryId: "mock-2",
        isAvailable: true,
      },
    ],
  },
  {
    id: "mock-3",
    name: "Tatlılar",
    order: 3,
    products: [
      {
        id: "mock-p5",
        name: "Künefe",
        description: "Sıcak servis edilen peynirli künefe, dondurma ile.",
        price: 150,
        images: [],
        allergens: [
          { id: "a1", code: "gluten", name: "Gluten" },
          { id: "a2", code: "milk", name: "Süt" },
        ],
        ingredients: [],
        categoryId: "mock-3",
        isAvailable: true,
      },
    ],
  },
  {
    id: "mock-4",
    name: "İçecekler",
    order: 4,
    products: [
      {
        id: "mock-p6",
        name: "Ayran",
        description: "Taze yayık ayranı.",
        price: 35,
        images: [],
        allergens: [{ id: "a2", code: "milk", name: "Süt" }],
        ingredients: [],
        categoryId: "mock-4",
        isAvailable: true,
      },
      {
        id: "mock-p7",
        name: "Türk Çayı",
        description: "Geleneksel demlenmiş Türk çayı.",
        price: 25,
        images: [],
        allergens: [],
        ingredients: [],
        categoryId: "mock-4",
        isAvailable: true,
      },
    ],
  },
];

const mockMenuData = {
  id: "mock-menu",
  name: "Ana Menü",
  slug: "demo",
  store: { id: "mock-store", name: "GASE Demo Restoran" },
  categories: mockCategories,
  allergens: [],
};

// ---- Skeleton Components ----
function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card overflow-hidden animate-pulse">
      <div className="flex gap-3 p-3">
        <div className="h-24 w-24 flex-shrink-0 rounded-md bg-muted" />
        <div className="flex flex-1 flex-col justify-between">
          <div className="space-y-2">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-5 w-16 rounded bg-muted" />
            <div className="h-8 w-8 rounded-full bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MenuPage({ params }: MenuPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState<MenuFilterValues>({
    search: "",
    excludeAllergens: [],
  });
  const totalItems = useCartStore((state) => state.totalItems);

  const { data: apiMenu, isLoading, isError } = usePublicMenu(params.menuSlug);

  // Fallback to mock data if API fails or is unavailable
  const menuData = apiMenu ?? (isError ? mockMenuData : null);

  const categories = menuData?.categories ?? [];
  const storeName = menuData?.store?.name ?? "Menü";
  const storeLogo = menuData?.store?.logo;

  // Flatten all products from categories
  const allProducts = useMemo(() => {
    const products: (PublicProduct & { categoryName?: string })[] = [];
    for (const cat of categories) {
      for (const p of cat.products) {
        products.push({ ...p, categoryId: cat.id, categoryName: cat.name });
      }
    }
    return products;
  }, [categories]);

  // Apply client-side filters
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // Category filter
      if (selectedCategory && product.categoryId !== selectedCategory) return false;

      // Search filter
      const query = searchQuery.toLowerCase();
      if (
        query &&
        !product.name.toLowerCase().includes(query) &&
        !(product.description ?? "").toLowerCase().includes(query)
      ) {
        return false;
      }

      // Price range filter
      if (advancedFilters.minPrice && product.price < advancedFilters.minPrice) return false;
      if (advancedFilters.maxPrice && product.price > advancedFilters.maxPrice) return false;

      // Allergen exclusion filter
      if (advancedFilters.excludeAllergens.length > 0) {
        const productAllergenCodes = product.allergens.map((a) =>
          typeof a === "string" ? a : a.code
        );
        const hasExcludedAllergen = advancedFilters.excludeAllergens.some((code) =>
          productAllergenCodes.includes(code)
        );
        if (hasExcludedAllergen) return false;
      }

      return true;
    });
  }, [allProducts, selectedCategory, searchQuery, advancedFilters]);

  // Group products by category for display
  const groupedProducts = useMemo(() => {
    if (selectedCategory) return null; // flat list when category selected
    const groups: { id: string; name: string; products: typeof filteredProducts }[] = [];
    for (const cat of categories) {
      const catProducts = filteredProducts.filter((p) => p.categoryId === cat.id);
      if (catProducts.length > 0) {
        groups.push({ id: cat.id, name: cat.name, products: catProducts });
      }
    }
    return groups;
  }, [categories, filteredProducts, selectedCategory]);

  const handleFilterChange = (filters: MenuFilterValues) => {
    setAdvancedFilters(filters);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col pb-20">
        {/* Header skeleton */}
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="h-6 w-32 rounded bg-muted animate-pulse" />
            <div className="h-8 w-8 rounded bg-muted animate-pulse" />
          </div>
        </header>
        {/* Category tabs skeleton */}
        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-24 rounded-full bg-muted animate-pulse flex-shrink-0" />
          ))}
        </div>
        {/* Product cards skeleton */}
        <div className="grid grid-cols-1 gap-4 px-4 py-4">
          {[1, 2, 3, 4].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error state with no fallback
  if (!menuData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Menü Bulunamadı</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Bu QR kod ile ilişkili bir menü bulunamadı. Lütfen restoran personeline danışın.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-20">
      {/* Store Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {storeLogo ? (
              <img
                src={storeLogo}
                alt={storeName}
                className="h-8 w-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                <Store className="h-4 w-4 text-primary" />
              </div>
            )}
            <h1 className="text-lg font-bold truncate">{storeName}</h1>
          </div>
          <Link href={`/m/${params.menuSlug}/cart`}>
            <Button variant="outline" size="sm" className="relative">
              <ShoppingCart className="h-4 w-4" />
              {totalItems() > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {totalItems()}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            selectedCategory === null
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Tümü
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={advancedFilters}
        onFilterChange={handleFilterChange}
      />

      {/* Product Grid */}
      <div className="px-4 py-4">
        {filteredProducts.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Ürün bulunamadı.
          </p>
        ) : selectedCategory || searchQuery || advancedFilters.minPrice || advancedFilters.maxPrice || advancedFilters.excludeAllergens.length > 0 ? (
          /* Flat list when filtering */
          <div className="grid grid-cols-1 gap-4">
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
              />
            ))}
          </div>
        ) : (
          /* Grouped by category */
          <div className="space-y-6">
            {groupedProducts?.map((group) => (
              <div key={group.id}>
                <h2 className="text-base font-semibold mb-3 text-foreground">{group.name}</h2>
                <div className="grid grid-cols-1 gap-3">
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
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {totalItems() > 0 && (
        <Link href={`/m/${params.menuSlug}/cart`} className="fixed bottom-4 left-4 right-4 z-20 mx-auto max-w-lg">
          <Button className="w-full h-12 text-base shadow-lg">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Sepeti Görüntüle ({totalItems()} ürün)
          </Button>
        </Link>
      )}
    </div>
  );
}
