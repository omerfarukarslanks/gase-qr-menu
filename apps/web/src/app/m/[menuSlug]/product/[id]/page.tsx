"use client";

import { useState, useRef } from "react";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModelViewer } from "@/components/menu/model-viewer";
import { useCartStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { usePublicProduct, PublicProduct } from "@/hooks/use-public-menu";

interface ProductDetailPageProps {
  params: { menuSlug: string; id: string };
}

// Mock fallback product
const mockProduct: PublicProduct = {
  id: "mock-p1",
  name: "Mercimek Çorbası",
  description:
    "Geleneksel kırmızı mercimek çorbası, taze sıkılmış limon ve ev yapımı ekmek ile servis edilir. Hafif baharatlı, vegan dostu bir başlangıç.",
  price: 85,
  images: [],
  modelUrl: null,
  allergens: [
    { id: "a1", code: "gluten", name: "Gluten" },
    { id: "a2", code: "celery", name: "Kereviz" },
  ],
  ingredients: [
    { id: "i1", name: "Kırmızı Mercimek", isRemovable: false },
    { id: "i2", name: "Soğan", isRemovable: true },
    { id: "i3", name: "Havuç", isRemovable: true },
    { id: "i4", name: "Limon", isRemovable: true },
    { id: "i5", name: "Nane", isRemovable: true },
  ],
  categoryId: "mock-1",
  isAvailable: true,
  nutritionInfo: { calories: 180, protein: 12, carbs: 28, fat: 3 },
};

// ---- Image Gallery ----
function ImageGallery({ images, name }: { images: { url: string }[]; name: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square w-full bg-muted flex items-center justify-center">
        <ImageIcon className="h-16 w-16 text-muted-foreground opacity-30" />
      </div>
    );
  }

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const w = scrollRef.current.clientWidth;
    const newIndex =
      direction === "left"
        ? Math.max(0, currentIndex - 1)
        : Math.min(images.length - 1, currentIndex + 1);
    scrollRef.current.scrollTo({ left: newIndex * w, behavior: "smooth" });
    setCurrentIndex(newIndex);
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const w = scrollRef.current.clientWidth;
    const idx = Math.round(scrollRef.current.scrollLeft / w);
    setCurrentIndex(idx);
  };

  return (
    <div className="relative w-full">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
      >
        {images.map((img, idx) => (
          <div key={idx} className="aspect-square w-full flex-shrink-0 snap-center">
            <img
              src={img.url}
              alt={`${name} - ${idx + 1}`}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {currentIndex < images.length - 1 && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
          {/* Dots indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  idx === currentIndex ? "bg-primary" : "bg-background/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const addItem = useCartStore((state) => state.addItem);

  const { data: product, isLoading, isError } = usePublicProduct(params.id);

  const toggleIngredient = (id: string) => {
    setRemovedIngredients((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Build notes with removed ingredients
    const removedNames = product.ingredients
      .filter((i) => removedIngredients.includes(i.id))
      .map((i) => i.name);
    const fullNotes = [
      ...(removedNames.length > 0 ? [`Çıkarılacak: ${removedNames.join(", ")}`] : []),
      ...(notes ? [notes] : []),
    ].join(" | ");

    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        image:
          product.images.length > 0
            ? [...product.images].sort((a, b) => a.order - b.order)[0].url
            : undefined,
        notes: fullNotes || undefined,
      });
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="theme-app-gradient flex flex-col pb-28 animate-pulse">
        <header className="sticky top-0 z-10 border-b border-border bg-background/92 backdrop-blur-xl">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
            <div className="h-9 w-9 rounded bg-muted" />
            <div className="h-5 w-40 rounded bg-muted" />
          </div>
        </header>
        <div className="aspect-square w-full bg-muted" />
        <div className="space-y-4 px-4 py-4">
          <div className="h-7 w-2/3 rounded bg-muted" />
          <div className="h-7 w-24 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
        </div>
      </div>
    );
  }

  // Error state - no product
  if (isError || !product) {
    return (
      <div className="theme-app-gradient flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Ürün Bulunamadı</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Bu ürün artık mevcut olmayabilir.
        </p>
        <Link href={`/m/${params.menuSlug}`}>
          <Button variant="outline">Menüye Dön</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="theme-app-gradient flex flex-col pb-32">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link href={`/m/${params.menuSlug}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold truncate">{product.name}</h1>
        </div>
      </header>

      {/* 3D Model / Image Gallery */}
      {product.modelUrl ? (
        <div className="aspect-square w-full bg-muted">
          <ModelViewer
            src={product.modelUrl}
            alt={product.name}
            className="h-full w-full"
          />
        </div>
      ) : (
        <ImageGallery images={product.images} name={product.name} />
      )}

      {/* Product Info */}
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4">
        <div>
          <h2 className="text-2xl font-bold">{product.name}</h2>
          <p className="mt-1 text-2xl font-semibold text-primary">
            {formatCurrency(product.price)}
          </p>
        </div>

        {product.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Allergens */}
        {product.allergens.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Alerjenler</h3>
            <div className="flex flex-wrap gap-2">
              {product.allergens.map((allergen) => (
                <span
                  key={typeof allergen === "string" ? allergen : allergen.id}
                  className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive"
                >
                  {typeof allergen === "string" ? allergen : allergen.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Ingredients with removable toggles */}
        {product.ingredients.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Malzemeler</h3>
            <div className="space-y-1.5">
              {product.ingredients.map((ingredient) => {
                const isRemoved = removedIngredients.includes(ingredient.id);
                return (
                  <div
                    key={ingredient.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <span
                      className={`text-sm ${
                        isRemoved ? "text-muted-foreground line-through" : ""
                      }`}
                    >
                      {ingredient.name}
                    </span>
                    {ingredient.isRemovable && (
                      <button
                        onClick={() => toggleIngredient(ingredient.id)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                          isRemoved
                            ? "bg-muted text-muted-foreground"
                            : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        }`}
                      >
                        {isRemoved ? "Ekle" : "Çıkar"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Nutrition Info */}
        {product.nutritionInfo && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Besin Değerleri</h3>
            <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
              {product.nutritionInfo.calories != null && (
                <div className="rounded-md bg-muted p-2">
                  <p className="text-xs text-muted-foreground">Kalori</p>
                  <p className="text-sm font-semibold">{product.nutritionInfo.calories}</p>
                </div>
              )}
              {product.nutritionInfo.protein != null && (
                <div className="rounded-md bg-muted p-2">
                  <p className="text-xs text-muted-foreground">Protein</p>
                  <p className="text-sm font-semibold">{product.nutritionInfo.protein}g</p>
                </div>
              )}
              {product.nutritionInfo.carbs != null && (
                <div className="rounded-md bg-muted p-2">
                  <p className="text-xs text-muted-foreground">Karb</p>
                  <p className="text-sm font-semibold">{product.nutritionInfo.carbs}g</p>
                </div>
              )}
              {product.nutritionInfo.fat != null && (
                <div className="rounded-md bg-muted p-2">
                  <p className="text-xs text-muted-foreground">Yağ</p>
                  <p className="text-sm font-semibold">{product.nutritionInfo.fat}g</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Notunuz</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Özel isteklerinizi yazabilirsiniz..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            rows={2}
          />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/94 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-4">
          <div className="flex items-center gap-3 rounded-[1rem] border border-border bg-card/80 px-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-semibold">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button className="flex-1" onClick={handleAddToCart}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Sepete Ekle - {formatCurrency(product.price * quantity)}
          </Button>
        </div>
      </div>
    </div>
  );
}
