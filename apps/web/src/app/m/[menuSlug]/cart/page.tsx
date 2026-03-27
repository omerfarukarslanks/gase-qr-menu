"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  Bell,
  CreditCard,
  CheckCircle2,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
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
import { useSocket } from "@/hooks/use-socket";

interface CartPageProps {
  params: { menuSlug: string };
}

export default function CartPage({ params }: CartPageProps) {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalAmount = useCartStore((state) => state.totalAmount);

  const { callWaiter } = useSocket();
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [paymentAlert, setPaymentAlert] = useState(false);

  // Calculate summary
  const subtotal = totalAmount();
  const estimatedTax = subtotal * 0.1;
  const grandTotal = subtotal + estimatedTax;

  const handleCallWaiter = () => {
    // In real app, storeId and tableId come from URL params or session
    callWaiter("store-1", "table-1", "Masa 1");
    setWaiterCalled(true);
    setTimeout(() => setWaiterCalled(false), 5000);
  };

  const handlePayment = () => {
    setPaymentAlert(true);
    setTimeout(() => setPaymentAlert(false), 4000);
  };

  return (
    <div className="flex flex-col pb-56">
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

      {/* Toast notifications */}
      {waiterCalled && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-800 dark:text-green-200">
            Garson çağrıldı! Kısa süre içinde masanıza gelecek.
          </span>
        </div>
      )}

      {paymentAlert && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Ödeme sistemi yakında aktif olacak. Şimdilik garson çağırarak ödeme yapabilirsiniz.
          </span>
        </div>
      )}

      {/* Cart Items */}
      <div className="space-y-3 px-4 py-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Sepetiniz boş
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Menüden ürün ekleyerek başlayın
            </p>
            <Link href={`/m/${params.menuSlug}`}>
              <Button variant="outline" className="mt-4">
                Menüye Dön
              </Button>
            </Link>
          </div>
        ) : (
          items.map((item) => (
            <Card key={item.productId}>
              <CardContent className="flex items-center gap-3 p-3">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-16 w-16 rounded-md object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{item.name}</h3>
                  <p className="text-sm font-semibold text-primary">
                    {formatCurrency(item.price)}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.notes}
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
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 shadow-lg">
          <div className="mx-auto max-w-lg space-y-3">
            <Card>
              <CardHeader className="p-3 pb-0">
                <CardTitle className="text-sm">Sipariş Özeti</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ara Toplam</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tahmini KDV (%10)</span>
                  <span>{formatCurrency(estimatedTax)}</span>
                </div>
                <div className="border-t pt-1.5 flex justify-between">
                  <span className="font-semibold">Toplam</span>
                  <span className="font-bold text-lg text-primary">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 p-3 pt-0">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCallWaiter}
                  disabled={waiterCalled}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  {waiterCalled ? "Çağrıldı!" : "Garson Çağır"}
                </Button>
                <Button className="flex-1" onClick={handlePayment}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Ödeme Yap
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
