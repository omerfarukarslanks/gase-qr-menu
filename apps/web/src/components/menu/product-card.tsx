"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string | null;
  allergens?: string[];
  menuSlug: string;
}

export function ProductCard({
  id,
  name,
  description,
  price,
  image,
  allergens = [],
  menuSlug,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: id,
      name,
      price,
      image: image ?? undefined,
    });
  };

  return (
    <Link href={`/m/${menuSlug}/product/${id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="flex gap-3 p-3">
          {/* Product Image */}
          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-muted">
            {image ? (
              <img
                src={image}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Gorsel
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
              {allergens.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {allergens.map((allergen) => (
                    <span
                      key={allergen}
                      className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    >
                      {allergen}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="font-bold text-primary">
                {formatCurrency(price)}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleQuickAdd}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
