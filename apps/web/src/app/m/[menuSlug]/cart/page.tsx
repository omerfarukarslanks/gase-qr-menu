"use client";

import { ArrowLeft, Minus, Plus, Trash2, Bell, CreditCard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCartStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

interface CartPageProps {
  params: { menuSlug: string };
}

export default function CartPage({ params }: CartPageProps) {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalAmount = useCartStore((state) => state.totalAmount);

  return (
    <div className="flex flex-col pb-32">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href={`/m/${params.menuSlug}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Sepetim</h1>
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-destructive"
              onClick={clearCart}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Temizle
            </Button>
          )}
        </div>
      </header>

      {/* Cart Items */}
      <div className="space-y-3 px-4 py-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">Sepetiniz bos.</p>
            <Link href={`/m/${params.menuSlug}`}>
              <Button variant="link" className="mt-2">
                Menuye don
              </Button>
            </Link>
          </div>
        ) : (
          items.map((item) => (
            <Card key={item.productId}>
              <CardContent className="flex items-center gap-3 p-3">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-16 w-16 rounded-md object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{item.name}</h3>
                  <p className="text-sm font-semibold text-primary">
                    {formatCurrency(item.price)}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground truncate">
                      Not: {item.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary & Actions */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4">
          <div className="mx-auto max-w-lg space-y-3">
            <Card>
              <CardHeader className="p-3 pb-0">
                <CardTitle className="text-sm">Siparis Ozeti</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Toplam</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(totalAmount())}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 p-3 pt-0">
                <Button variant="outline" className="flex-1">
                  <Bell className="mr-2 h-4 w-4" />
                  Garson Cagir
                </Button>
                <Button className="flex-1">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Odeme Yap
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
