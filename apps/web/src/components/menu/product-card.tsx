"use client";

import Link from "next/link";
import { Plus, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

interface ProductAllergen {
  id: string;
  code: string;
  name: string;
}

interface ProductImage {
  id: string;
  url: string;
  order: number;
}

interface ProductCardProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  images?: ProductImage[];
  image?: string | null;
  allergens?: (string | ProductAllergen)[];
  menuSlug: string;
  isAvailable?: boolean;
}

export function ProductCard({
  id,
  name,
  description,
  price,
  images,
  image,
  allergens = [],
  menuSlug,
  isAvailable = true,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  // Resolve cover image: prefer images array, then fallback to image prop
  const coverImage =
    images && images.length > 0
      ? [...images].sort((a, b) => a.order - b.order)[0].url
      : image ?? null;

  const allergenNames = allergens.map((a) =>
    typeof a === "string" ? a : a.name
  );

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable) return;
    addItem({
      productId: id,
      name,
      price,
      image: coverImage ?? undefined,
    });
  };

  return (
    <Link href={`/m/${menuSlug}/product/${id}`}>
      <Card
        className={`overflow-hidden transition-shadow hover:shadow-md ${
          !isAvailable ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <CardContent className="flex gap-3 p-3">
          {/* Product Image */}
          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-muted">
            {coverImage ? (
              <img
                src={coverImage}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <ImageIcon className="h-6 w-6 opacity-40" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-1 flex-col justify-between min-w-0">
            <div>
              <h3 className="font-semibold truncate">{name}</h3>
              {description && (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {description}
                </p>
              )}
              {/* Allergen Badges */}
              {allergenNames.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {allergenNames.slice(0, 4).map((allergen) => (
                    <span
                      key={allergen}
                      className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    >
                      {allergen}
                    </span>
                  ))}
                  {allergenNames.length > 4 && (
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                      +{allergenNames.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="font-bold text-primary">
                {formatCurrency(price)}
              </span>
              {isAvailable ? (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={handleQuickAdd}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  Tükendi
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
