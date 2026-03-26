"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/menu/filter-bar";
import { ProductCard } from "@/components/menu/product-card";
import { useCartStore } from "@/lib/store";

interface MenuPageProps {
  params: { menuSlug: string };
}

// Placeholder data - will be replaced with API calls
const placeholderCategories = [
  { id: "1", name: "Baslangiclar" },
  { id: "2", name: "Ana Yemekler" },
  { id: "3", name: "Tatlilar" },
  { id: "4", name: "Icecekler" },
];

const placeholderProducts = [
  {
    id: "1",
    name: "Ornek Urun",
    description: "Urun aciklamasi burada gorunecektir.",
    price: 0,
    categoryId: "1",
    image: null,
    allergens: [],
  },
];

export default function MenuPage({ params }: MenuPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const totalItems = useCartStore((state) => state.totalItems);

  const filteredProducts = placeholderProducts.filter((product) => {
    if (selectedCategory && product.categoryId !== selectedCategory)
      return false;
    if (
      searchQuery &&
      !product.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold">Menu</h1>
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
              : "bg-muted text-muted-foreground"
          }`}
        >
          Tumunu
        </button>
        {placeholderCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
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
      />

      {/* Product Grid */}
      <div className="grid grid-cols-1 gap-4 px-4 py-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              description={product.description}
              price={product.price}
              image={product.image}
              allergens={product.allergens}
              menuSlug={params.menuSlug}
            />
          ))
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Urun bulunamadi.
          </p>
        )}
      </div>
    </div>
  );
}
