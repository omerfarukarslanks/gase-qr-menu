"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  BellOff,
  Clock,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
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

type KitchenColumnKey = "pending" | "preparing" | "ready";

const columnConfig: Record<
  KitchenColumnKey,
  { label: string; headerClassName: string; bodyClassName: string }
> = {
  pending: {
    label: "Bekleyen",
    headerClassName: "bg-yellow-50 text-yellow-800",
    bodyClassName: "bg-yellow-50/30",
  },
  preparing: {
    label: "Hazirlaniyor",
    headerClassName: "bg-orange-50 text-orange-800",
    bodyClassName: "bg-orange-50/30",
  },
  ready: {
    label: "Hazir",
    headerClassName: "bg-green-50 text-green-800",
    bodyClassName: "bg-green-50/30",
  },
};

function getElapsedMinutes(dateString: string) {
  return Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
}

function nextKitchenAction(status: OrderStatus) {
  if (status === "PENDING") return { next: "CONFIRMED" as const, label: "Onayla" };
  if (status === "CONFIRMED") return { next: "PREPARING" as const, label: "Hazirlamaya basla" };
  if (status === "PREPARING") return { next: "READY" as const, label: "Hazir" };
  if (status === "READY") return { next: "SERVED" as const, label: "Servise gonder" };
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
  const [activeColumn, setActiveColumn] = useState<KitchenColumnKey>("pending");

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
    () =>
      [...(data?.pending ?? []), ...(data?.confirmed ?? [])].sort(
        (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      ),
    [data?.confirmed, data?.pending]
  );
  const preparing = data?.preparing ?? [];
  const ready = data?.ready ?? [];
  const total = data?.total ?? 0;

  const columns: Array<{ key: KitchenColumnKey; orders: Order[] }> = [
    { key: "pending", orders: pending },
    { key: "preparing", orders: preparing },
    { key: "ready", orders: ready },
  ];

  const renderColumn = (key: KitchenColumnKey, orders: Order[]) => {
    const config = columnConfig[key];

    return (
      <section
        key={key}
        className="flex min-h-[22rem] flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card"
      >
        <div className={`flex items-center justify-between px-4 py-3 ${config.headerClassName}`}>
          <h2 className="font-bold">{config.label}</h2>
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-background/70 px-2 text-sm font-bold text-foreground">
            {orders.length}
          </span>
        </div>
        <div className={`flex-1 overflow-y-auto p-3 ${config.bodyClassName}`}>
          {orders.length === 0 ? (
            <p className="rounded-[1.25rem] border border-dashed border-border/70 bg-background/80 py-8 text-center text-sm text-muted-foreground">
              {config.label} siparis yok
            </p>
          ) : (
            orders.map((order) => (
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
      </section>
    );
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Mutfak ekrani"
        description={`Canli siparis akisi backend servisinden geliyor. Toplam ${total} aktif siparis izleniyor.`}
        action={
          <>
            <span className="text-sm font-mono text-muted-foreground">
              {currentTime.toLocaleTimeString("tr-TR")}
            </span>
            <Button variant="outline" size="icon" onClick={() => setSoundEnabled(!soundEnabled)}>
              {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="flex min-h-[20rem] items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Mutfak siparisleri yukleniyor...
        </div>
      ) : isError ? (
        <div className="flex min-h-[20rem] items-center justify-center px-6 text-center text-sm text-destructive">
          {error instanceof Error ? error.message : "Mutfak siparisleri alinamadi."}
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
            {columns.map((column) => (
              <Button
                key={column.key}
                variant={activeColumn === column.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveColumn(column.key)}
              >
                {columnConfig[column.key].label} ({column.orders.length})
              </Button>
            ))}
          </div>

          <div className="md:hidden">
            {renderColumn(
              activeColumn,
              columns.find((column) => column.key === activeColumn)?.orders ?? []
            )}
          </div>

          <div className="hidden gap-4 overflow-x-auto pb-2 md:flex xl:hidden">
            {columns.map((column) => (
              <div
                key={column.key}
                className="min-w-[20rem] max-w-[24rem] flex-1 snap-start"
              >
                {renderColumn(column.key, column.orders)}
              </div>
            ))}
          </div>

          <div className="hidden xl:grid xl:grid-cols-3 xl:gap-4">
            {columns.map((column) => renderColumn(column.key, column.orders))}
          </div>
        </>
      )}
    </div>
  );
}
