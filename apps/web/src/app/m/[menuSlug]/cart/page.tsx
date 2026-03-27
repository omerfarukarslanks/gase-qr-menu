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
  Tag,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { useSocket } from "@/hooks/use-socket";
import api from "@/lib/api";

interface CartPageProps {
  params: { menuSlug: string };
}

export default function CartPage({ params }: CartPageProps) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalAmount = useCartStore((state) => state.totalAmount);

  const { callWaiter } = useSocket();
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{
    valid: boolean;
    discount: number;
    name: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);

  const subtotal = totalAmount();
  const discount = couponApplied?.valid ? couponApplied.discount : 0;
  const grandTotal = Math.max(0, subtotal - discount);

  const handleCallWaiter = () => {
    callWaiter("store-1", "table-1", "Masa 1");
    setWaiterCalled(true);
    setTimeout(() => setWaiterCalled(false), 5000);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    setCouponApplied(null);

    try {
      // In real app, storeId comes from context
      const res = await api.get(
        `/api/campaigns/store/demo-store/validate/${couponCode}`
      );
      if (res.data?.valid && res.data?.campaign) {
        const campaign = res.data.campaign;
        let discountAmount = 0;

        if (campaign.type === "PERCENTAGE") {
          discountAmount = (subtotal * campaign.discountValue) / 100;
        } else if (campaign.type === "FIXED_AMOUNT") {
          discountAmount = Math.min(campaign.discountValue, subtotal);
        } else if (campaign.type === "HAPPY_HOUR") {
          discountAmount = (subtotal * campaign.discountValue) / 100;
        }

        setCouponApplied({
          valid: true,
          discount: Math.round(discountAmount * 100) / 100,
          name: campaign.name,
        });
      } else {
        setCouponError(res.data?.message || "Gecersiz kupon kodu");
      }
    } catch {
      // Mock for development
      if (couponCode.toUpperCase() === "HOSGELDIN") {
        setCouponApplied({
          valid: true,
          discount: Math.round(subtotal * 0.1 * 100) / 100,
          name: "Hos Geldin %10 Indirim",
        });
      } else {
        setCouponError("Gecersiz kupon kodu");
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePayment = () => {
    const amount = subtotal;
    router.push(
      `/m/${params.menuSlug}/payment?orderId=mock-order&amount=${amount}&discount=${discount}`
    );
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setOrderLoading(true);

    try {
      const res = await api.post("/api/orders", {
        storeId: "demo-store",
        tableSessionId: "demo-session",
        couponCode: couponApplied?.valid ? couponCode : undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      });

      const order = res.data;
      clearCart();
      router.push(
        `/m/${params.menuSlug}/payment?orderId=${order.id}&amount=${order.totalAmount}&discount=${order.discountAmount}`
      );
    } catch {
      // Fallback: go to payment with current amounts
      handlePayment();
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <div className="flex flex-col pb-64">
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

      {/* Toast */}
      {waiterCalled && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Garson cagrildi! Kisa sure icinde masaniza gelecek.
          </span>
        </div>
      )}

      {/* Cart Items */}
      <div className="space-y-3 px-4 py-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Sepetiniz bos
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Menuden urun ekleyerek baslayin
            </p>
            <Link href={`/m/${params.menuSlug}`}>
              <Button variant="outline" className="mt-4">
                Menuye Don
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
            {/* Coupon Code */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kupon kodu"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    setCouponError("");
                    if (couponApplied) setCouponApplied(null);
                  }}
                  className="pl-9"
                  disabled={!!couponApplied?.valid}
                />
              </div>
              {couponApplied?.valid ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCouponApplied(null);
                    setCouponCode("");
                  }}
                >
                  Kaldir
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                >
                  {couponLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Uygula"
                  )}
                </Button>
              )}
            </div>
            {couponError && (
              <p className="text-xs text-red-500">{couponError}</p>
            )}
            {couponApplied?.valid && (
              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{couponApplied.name} uygulandı!</span>
              </div>
            )}

            {/* Order Summary */}
            <Card>
              <CardHeader className="p-3 pb-0">
                <CardTitle className="text-sm">Siparis Ozeti</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ara Toplam</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Indirim</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
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
                  {waiterCalled ? "Cagrildi!" : "Garson Cagir"}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handlePlaceOrder}
                  disabled={orderLoading}
                >
                  {orderLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Siparis Ver
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
