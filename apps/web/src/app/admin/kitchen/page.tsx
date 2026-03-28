"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bell, BellOff, CheckCircle2, Clock, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  type Order,
  type OrderStatus,
  useKitchenOrders,
  useUpdateOrderStatus,
} from "@/hooks/use-orders";
import { useSocket } from "@/hooks/use-socket";
import { useCurrentStore } from "@/hooks/use-current-store";

function getElapsedMinutes(dateString: string) {
  return Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
}

function nextKitchenAction(status: OrderStatus) {
  if (status === "PENDING") return { next: "CONFIRMED" as const, label: "Onayla" };
  if (status === "CONFIRMED") return { next: "PREPARING" as const, label: "Hazirlamaya Basla" };
  if (status === "PREPARING") return { next: "READY" as const, label: "Hazir" };
  if (status === "READY") return { next: "SERVED" as const, label: "Servise Gonder" };
  return null;
}

function OrderCard({
  order,
  onAction,
}: {
  order: Order;
  onAction: () => void;
}) {
  const elapsed = getElapsedMinutes(order.createdAt);
  const isUrgent = elapsed > 15;
  const action = nextKitchenAction(order.status);

  return (
    <Card className={`mb-3 ${isUrgent ? "border-destructive/50 bg-destructive/5" : ""}`}>
      <CardHeader className="p-3 pb-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">
            #{String(order.orderNumber).padStart(3, "0")} - {order.tableName}
          </CardTitle>
          <span
            className={`flex items-center gap-1 text-sm font-medium ${
              isUrgent ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            {elapsed} dk
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <ul className="mb-3 space-y-1.5">
          {order.items.map((item) => (
            <li key={item.id} className="text-sm">
              <span className="font-medium">
                {item.quantity}x {item.productName}
              </span>
              {item.notes && (
                <span className="ml-4 block text-xs italic text-muted-foreground">
                  {item.notes}
                </span>
              )}
            </li>
          ))}
        </ul>
        {action && (
          <Button onClick={onAction} className="w-full" size="sm">
            {action.label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function KitchenDisplayPage() {
  const { activeStoreId } = useCurrentStore();
  const { joinStore, joinKitchen, onEvent } = useSocket();
  const { data, isLoading, isError, error, refetch } = useKitchenOrders(activeStoreId ?? "");
  const updateOrderStatus = useUpdateOrderStatus();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!activeStoreId) {
      return;
    }

    joinStore(activeStoreId);
    joinKitchen(activeStoreId);
  }, [activeStoreId, joinKitchen, joinStore]);

  useEffect(() => {
    const cleanupNew = onEvent("newOrder", () => {
      refetch();

      if (soundEnabled) {
        try {
          const audio = new Audio("/notification.mp3");
          void audio.play().catch(() => {});
        } catch {}
      }
    });

    const cleanupStatus = onEvent("orderStatusUpdate", () => {
      refetch();
    });

    return () => {
      cleanupNew?.();
      cleanupStatus?.();
    };
  }, [onEvent, refetch, soundEnabled]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.();
    } else {
      void document.exitFullscreen?.();
    }
  };

  const pending = useMemo(
    () => [...(data?.pending ?? []), ...(data?.confirmed ?? [])].sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    ),
    [data?.confirmed, data?.pending]
  );
  const preparing = data?.preparing ?? [];
  const ready = data?.ready ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between border-b bg-background px-4 py-2">
        <div>
          <h1 className="text-xl font-bold">Mutfak Ekrani</h1>
          <p className="text-sm text-muted-foreground">
            Canli siparis akisi store bazli backend servisinden geliyor.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-mono text-muted-foreground">
            {currentTime.toLocaleTimeString("tr-TR")}
          </span>
          <Button variant="outline" size="icon" onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Mutfak siparisleri yukleniyor...
        </div>
      ) : isError ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-destructive">
          {error instanceof Error ? error.message : "Mutfak siparisleri alinamadi."}
        </div>
      ) : (
        <>
          <div className="grid flex-1 grid-cols-3 overflow-hidden">
            <div className="flex flex-col overflow-hidden border-r">
              <div className="flex items-center justify-between border-b bg-yellow-50 px-4 py-2">
                <h2 className="font-bold text-yellow-800">Bekleyen</h2>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-200 text-sm font-bold text-yellow-800">
                  {pending.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto bg-yellow-50/30 p-3">
                {pending.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Bekleyen siparis yok
                  </p>
                ) : (
                  pending.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAction={() => {
                        const action = nextKitchenAction(order.status);
                        if (!action) return;
                        updateOrderStatus.mutate({ id: order.id, status: action.next });
                      }}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col overflow-hidden border-r">
              <div className="flex items-center justify-between border-b bg-orange-50 px-4 py-2">
                <h2 className="font-bold text-orange-800">Hazirlaniyor</h2>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-200 text-sm font-bold text-orange-800">
                  {preparing.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto bg-orange-50/30 p-3">
                {preparing.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Hazirlanan siparis yok
                  </p>
                ) : (
                  preparing.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAction={() => updateOrderStatus.mutate({ id: order.id, status: "READY" })}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b bg-green-50 px-4 py-2">
                <h2 className="font-bold text-green-800">Hazir</h2>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-200 text-sm font-bold text-green-800">
                  {ready.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto bg-green-50/30 p-3">
                {ready.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Servise hazir siparis yok
                  </p>
                ) : (
                  ready.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAction={() => updateOrderStatus.mutate({ id: order.id, status: "SERVED" })}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t bg-muted/50 px-4 py-2 text-sm">
            <div className="flex gap-6">
              <span>
                <span className="font-medium text-yellow-600">{pending.length}</span> Bekleyen
              </span>
              <span>
                <span className="font-medium text-orange-600">{preparing.length}</span> Hazirlaniyor
              </span>
              <span>
                <span className="font-medium text-green-600">{ready.length}</span> Hazir
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              Toplam: {total} aktif siparis
            </div>
          </div>
        </>
      )}
    </div>
  );
}
