"use client";

import Link from "next/link";
import { ImageIcon, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore } from "@/lib/store";
import { cn, formatCurrency } from "@/lib/utils";

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
  categoryName?: string;
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
  categoryName,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const coverImage =
    images && images.length > 0
      ? [...images].sort((a, b) => a.order - b.order)[0].url
      : image ?? null;

  const allergenNames = allergens.map((allergen) =>
    typeof allergen === "string" ? allergen : allergen.name
  );

  const handleQuickAdd = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAvailable) {
      return;
    }

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
        className={cn(
          "group overflow-hidden border-border bg-card/95 transition-all duration-200 hover:-translate-y-1 hover:border-[hsl(var(--brand-300))] hover:shadow-[var(--card-shadow-hover)]",
          !isAvailable && "opacity-70"
        )}
      >
        <CardContent className="flex gap-4 p-4 pt-4">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[1.25rem]">
            {coverImage ? (
              <img
                src={coverImage}
                alt={name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div
                className="flex h-full items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(194, 65, 12, 0.08))",
                }}
              >
                <ImageIcon className="h-7 w-7 text-muted-foreground/70" />
              </div>
            )}

            <div
              className="absolute inset-x-3 bottom-3 rounded-full px-2 py-1 text-center text-[11px] font-semibold backdrop-blur"
              style={{ backgroundColor: "hsl(var(--background) / 0.9)" }}
            >
              {isAvailable ? "Menu detayi" : "Servis disi"}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              {categoryName && (
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {categoryName}
                </p>
              )}
              <h3 className="mt-2 text-base font-semibold text-foreground">{name}</h3>
              {description && (
                <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-2">
                  {description}
                </p>
              )}

              {allergenNames.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {allergenNames.slice(0, 3).map((allergen) => (
                    <span
                      key={allergen}
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{
                        backgroundColor: "hsl(var(--warm-surface))",
                        color: "hsl(var(--warm))",
                      }}
                    >
                      {allergen}
                    </span>
                  ))}
                  {allergenNames.length > 3 && (
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
                      +{allergenNames.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Menu fiyati</p>
                <span className="text-lg font-semibold text-[hsl(var(--brand-600))]">
                  {formatCurrency(price)}
                </span>
              </div>

              {isAvailable ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full px-4"
                  onClick={handleQuickAdd}
                >
                  <Sparkles className="mr-1 h-4 w-4" />
                  Ekle
                  <Plus className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  Tukendi
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
