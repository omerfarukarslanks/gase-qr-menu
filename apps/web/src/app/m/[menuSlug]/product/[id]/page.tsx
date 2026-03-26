"use client";

import { useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModelViewer } from "@/components/menu/model-viewer";
import { useCartStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

interface ProductDetailPageProps {
  params: { menuSlug: string; id: string };
}

// Placeholder - will be replaced with API call
const placeholderProduct = {
  id: "1",
  name: "Ornek Urun",
  description:
    "Bu urunun detayli aciklamasi burada gorunecektir. Icerik, porsiyon bilgisi ve diger detaylar.",
  price: 150,
  image: null as string | null,
  modelUrl: null as string | null,
  allergens: ["Gluten", "Sut"],
  ingredients: ["Malzeme 1", "Malzeme 2", "Malzeme 3"],
  nutritionInfo: {
    calories: 350,
    protein: 25,
    carbs: 40,
    fat: 12,
  },
};

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const addItem = useCartStore((state) => state.addItem);

  const product = placeholderProduct;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image ?? undefined,
      notes: notes || undefined,
    });
  };

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href={`/m/${params.menuSlug}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold truncate">{product.name}</h1>
        </div>
      </header>

      {/* 3D Model / Image */}
      <div className="aspect-square w-full bg-muted">
        {product.modelUrl ? (
          <ModelViewer
            src={product.modelUrl}
            alt={product.name}
            className="h-full w-full"
          />
        ) : product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Gorsel yuklenecek
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-4 px-4 py-4">
        <div>
          <h2 className="text-2xl font-bold">{product.name}</h2>
          <p className="mt-1 text-2xl font-semibold text-primary">
            {formatCurrency(product.price)}
          </p>
        </div>

        <p className="text-sm text-muted-foreground">{product.description}</p>

        {/* Allergens */}
        {product.allergens.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Alerjenler</h3>
            <div className="flex flex-wrap gap-2">
              {product.allergens.map((allergen) => (
                <span
                  key={allergen}
                  className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive"
                >
                  {allergen}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Nutrition Info */}
        {product.nutritionInfo && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Besin Degerleri</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="rounded-md bg-muted p-2">
                <p className="text-xs text-muted-foreground">Kalori</p>
                <p className="text-sm font-semibold">
                  {product.nutritionInfo.calories}
                </p>
              </div>
              <div className="rounded-md bg-muted p-2">
                <p className="text-xs text-muted-foreground">Protein</p>
                <p className="text-sm font-semibold">
                  {product.nutritionInfo.protein}g
                </p>
              </div>
              <div className="rounded-md bg-muted p-2">
                <p className="text-xs text-muted-foreground">Karb</p>
                <p className="text-sm font-semibold">
                  {product.nutritionInfo.carbs}g
                </p>
              </div>
              <div className="rounded-md bg-muted p-2">
                <p className="text-xs text-muted-foreground">Yag</p>
                <p className="text-sm font-semibold">
                  {product.nutritionInfo.fat}g
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Notunuz</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ozel isteklerinizi yazabilirsiniz..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            rows={2}
          />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4">
        <div className="mx-auto flex max-w-lg items-center gap-4">
          <div className="flex items-center gap-3 rounded-md border px-2">
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
