"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
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
import { usePublicMenu } from "@/hooks/use-public-menu";
import { useSocket } from "@/hooks/use-socket";
import { useEnsurePublicTableSession } from "@/hooks/use-tables";
import api from "@/lib/api";
import { useCartStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

interface CartPageProps {
  params: { menuSlug: string };
}

export default function CartPage({ params }: CartPageProps) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalAmount = useCartStore((state) => state.totalAmount);
  const tableId = useCartStore((state) => state.tableId);
  const storedTableName = useCartStore((state) => state.tableName);
  const tableSessionId = useCartStore((state) => state.tableSessionId);
  const setTableSessionId = useCartStore((state) => state.setTableSessionId);
  const { data: menuData } = usePublicMenu(
    params.menuSlug,
    tableId ? { table: tableId } : undefined
  );
  const ensurePublicTableSession = useEnsurePublicTableSession();
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
  const [orderError, setOrderError] = useState("");

  const subtotal = totalAmount();
  const discount = couponApplied?.valid ? couponApplied.discount : 0;
  const grandTotal = Math.max(0, subtotal - discount);
  const storeId = menuData?.store.id ?? "";
  const tableName = menuData?.store.tableName ?? storedTableName ?? "Masa";
  const operatingStatus = menuData?.store.operatingStatus;
  const isAcceptingOrders = operatingStatus?.acceptingOrders ?? true;

  const handleCallWaiter = () => {
    if (!storeId) {
      return;
    }

    callWaiter(storeId, tableId || "unknown-table", tableName);
    setWaiterCalled(true);
    setTimeout(() => setWaiterCalled(false), 5000);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      return;
    }

    setCouponLoading(true);
    setCouponError("");
    setCouponApplied(null);

    try {
      if (!storeId) {
        throw new Error("Store baglami bulunamadi");
      }

      const response = await api.post(
        `/api/campaigns/store/${storeId}/calculate-discount`,
        {
          orderTotal: subtotal,
          couponCode: couponCode.trim(),
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
        }
      );

      const discountResult = response.data?.data ?? response.data;

      if (!discountResult?.campaignId) {
        setCouponError("Gecersiz veya uygulanamayan kupon kodu");
        return;
      }

      setCouponApplied({
        valid: true,
        discount: Math.round((discountResult.discountAmount ?? 0) * 100) / 100,
        name: discountResult.campaignName ?? "Kupon indirimi",
      });
    } catch (error: any) {
      setCouponError(
        error?.response?.data?.message || "Gecersiz veya uygulanamayan kupon kodu"
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      return;
    }

    setOrderLoading(true);
    setOrderError("");

    try {
      if (!storeId || !tableId) {
        throw new Error(
          "Siparis vermek icin bu menuyu masa QR kodu ile acmaniz gerekiyor."
        );
      }

      const resolvedTableSessionId =
        tableSessionId ||
        (
          await ensurePublicTableSession.mutateAsync({
            tableId,
          })
        )?.id;

      if (!resolvedTableSessionId) {
        throw new Error("Masa oturumu olusturulamadi");
      }

      if (!tableSessionId) {
        setTableSessionId(resolvedTableSessionId);
      }

      const response = await api.post("/api/orders", {
        storeId,
        tableSessionId: resolvedTableSessionId,
        couponCode: couponApplied?.valid ? couponCode : undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      });

      const order = response.data?.data ?? response.data;
      clearCart();
      router.push(
        `/m/${params.menuSlug}/payment?orderId=${order.id}&amount=${order.totalAmount}&discount=${order.discountAmount}`
      );
    } catch (error: any) {
      const nextMessage =
        error?.response?.data?.message ||
        (error instanceof Error ? error.message : null) ||
        "Siparis olusturulamadi. Lutfen tekrar deneyin.";

      setOrderError(nextMessage);
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <div className="theme-app-gradient flex min-h-screen flex-col pb-72">
      <header className="sticky top-0 z-10 border-b border-border bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
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

      {waiterCalled && (
        <div className="mx-auto mt-3 flex w-[calc(100%-2rem)] max-w-3xl items-center gap-2 rounded-[1.25rem] border border-green-200 bg-green-50 p-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Garson cagrildi. Kisa sure icinde masaniza gelecek.
          </span>
        </div>
      )}

      <div className="mx-auto w-full max-w-3xl space-y-3 px-4 py-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">
              Sepetiniz bos
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Menuden urun ekleyerek baslayin
            </p>
            <Link href={`/m/${params.menuSlug}`}>
              <Button variant="outline" className="mt-4">
                Menuye don
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
                    className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-muted">
                    <ShoppingBag className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium">{item.name}</h3>
                  <p className="text-sm font-semibold text-primary">
                    {formatCurrency(item.price)}
                  </p>
                  {item.notes && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
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
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/94 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[var(--card-shadow-hover)] backdrop-blur-xl">
          <div className="mx-auto max-w-lg space-y-3">
            {!tableId && (
              <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Siparis verebilmek icin bu menuyu masa QR kodu ile acmaniz gerekiyor.
              </div>
            )}
            {!isAcceptingOrders && (
              <div className="flex items-start gap-2 rounded-[1rem] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {operatingStatus?.message ??
                    "Restoran su anda siparis kabul etmiyor. Acilis saatlerinde tekrar deneyin."}
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Kupon kodu"
                  value={couponCode}
                  onChange={(event) => {
                    setCouponCode(event.target.value);
                    setCouponError("");
                    if (couponApplied) {
                      setCouponApplied(null);
                    }
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

            {couponError && <p className="text-xs text-red-500">{couponError}</p>}

            {couponApplied?.valid && (
              <div className="flex items-center gap-2 rounded-[1rem] bg-green-50 p-2 text-xs text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{couponApplied.name} uygulandi.</span>
              </div>
            )}

            {orderError && (
              <div className="rounded-[1rem] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {orderError}
              </div>
            )}

            <Card>
              <CardHeader className="p-3 pb-0">
                <CardTitle className="text-sm">Siparis ozeti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ara toplam</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Indirim</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-1.5">
                  <span className="font-semibold">Toplam</span>
                  <span className="text-lg font-bold text-primary">
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
                  {waiterCalled ? "Cagrildi" : "Garson cagir"}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handlePlaceOrder}
                  disabled={orderLoading || !tableId || !isAcceptingOrders}
                >
                  {orderLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {isAcceptingOrders ? (
                        <CreditCard className="mr-2 h-4 w-4" />
                      ) : (
                        <Clock3 className="mr-2 h-4 w-4" />
                      )}
                    </>
                  )}
                  {isAcceptingOrders ? "Siparis ver" : "Siparis su an kapali"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
