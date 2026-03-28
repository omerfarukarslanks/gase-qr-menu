"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  type Order,
  type OrderStatus,
  useOrders,
  useUpdateOrderStatus,
} from "@/hooks/use-orders";
import { useSocket } from "@/hooks/use-socket";
import { useCurrentStore } from "@/hooks/use-current-store";

type FilterStatus = "ALL" | Exclude<OrderStatus, "DRAFT" | "CANCELLED">;

const statusConfig: Record<
  Exclude<OrderStatus, "DRAFT" | "CANCELLED">,
  { label: string; bg: string; color: string }
> = {
  PENDING: { label: "Bekleyen", bg: "bg-yellow-100", color: "text-yellow-700" },
  CONFIRMED: { label: "Onaylandi", bg: "bg-blue-100", color: "text-blue-700" },
  PREPARING: { label: "Hazirlaniyor", bg: "bg-orange-100", color: "text-orange-700" },
  READY: { label: "Hazir", bg: "bg-green-100", color: "text-green-700" },
  SERVED: { label: "Servis Edildi", bg: "bg-gray-100", color: "text-gray-600" },
};

const nextStatusAction: Partial<
  Record<OrderStatus, { next: OrderStatus; label: string } | null>
> = {
  PENDING: { next: "CONFIRMED", label: "Onayla" },
  CONFIRMED: { next: "PREPARING", label: "Hazirla" },
  PREPARING: { next: "READY", label: "Hazir" },
  READY: { next: "SERVED", label: "Teslim Et" },
  SERVED: null,
};

function getOrderTime(createdAt: string) {
  return new Date(createdAt).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrdersPage() {
  const { activeStoreId } = useCurrentStore();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { joinStore, onEvent } = useSocket();
  const updateOrderStatus = useUpdateOrderStatus();

  const {
    data: orderResult,
    isLoading,
    isError,
    refetch,
    error,
  } = useOrders(activeStoreId ?? "", {
    pageSize: 100,
  });

  useEffect(() => {
    if (!activeStoreId) {
      return;
    }

    joinStore(activeStoreId);
  }, [activeStoreId, joinStore]);

  useEffect(() => {
    const cleanupNew = onEvent("newOrder", () => {
      refetch();
    });
    const cleanupStatus = onEvent("orderStatusUpdate", () => {
      refetch();
    });

    return () => {
      cleanupNew?.();
      cleanupStatus?.();
    };
  }, [onEvent, refetch]);

  const orders = orderResult?.data ?? [];
  const filteredOrders = useMemo(() => {
    const source =
      activeFilter === "ALL"
        ? orders
        : orders.filter((order) => order.status === activeFilter);

    return [...source].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }, [activeFilter, orders]);

  const getCount = (status: Exclude<OrderStatus, "DRAFT" | "CANCELLED">) =>
    orders.filter((order) => order.status === status).length;

  const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: "ALL", label: `Tumu (${orders.length})` },
    { key: "PENDING", label: `Bekleyen (${getCount("PENDING")})` },
    { key: "CONFIRMED", label: `Onaylandi (${getCount("CONFIRMED")})` },
    { key: "PREPARING", label: `Hazirlaniyor (${getCount("PREPARING")})` },
    { key: "READY", label: `Hazir (${getCount("READY")})` },
    { key: "SERVED", label: `Servis Edildi (${getCount("SERVED")})` },
  ];

  const handleStatusChange = (order: Order) => {
    const action = nextStatusAction[order.status];

    if (!action) {
      return;
    }

    updateOrderStatus.mutate({
      id: order.id,
      status: action.next,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Siparisler</h1>
          <p className="text-muted-foreground">
            Gelen siparisleri takip edin, durumlarini guncelleyin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            Canli
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Yenile
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeFilter === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Siparisler yukleniyor...
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="py-10 text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : "Siparisler alinamadi. Backend baglantisini kontrol edin."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingBag className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Bu kategoride siparis bulunmuyor.
                </p>
              </CardContent>
            </Card>
          )}

          {filteredOrders.map((order) => {
            const status = statusConfig[order.status as keyof typeof statusConfig];
            const action = nextStatusAction[order.status];
            const isExpanded = expandedId === order.id;
            const itemsSummary = order.items
              .map((item) => `${item.quantity}x ${item.productName}`)
              .join(", ");

            return (
              <Card
                key={order.id}
                className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="min-w-0 flex-shrink-0">
                      <div className="text-lg font-bold">
                        #{String(order.orderNumber).padStart(3, "0")}
                      </div>
                      <div className="truncate text-sm text-muted-foreground">
                        {order.tableName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.customerName || "Musteri"}
                      </div>
                    </div>

                    <div className="hidden min-w-0 flex-1 sm:block">
                      <p className="truncate text-sm">{itemsSummary}</p>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {getOrderTime(order.createdAt)}
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold">
                          {(order.finalAmount ?? order.totalAmount).toLocaleString("tr-TR")} TL
                        </div>
                        {status && (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.bg} ${status.color}`}
                          >
                            {status.label}
                          </span>
                        )}
                      </div>

                      {action && (
                        <Button
                          size="sm"
                          disabled={updateOrderStatus.isPending}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleStatusChange(order);
                          }}
                        >
                          {action.label}
                        </Button>
                      )}

                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-2 border-t pt-4">
                      <div className="mb-2 text-sm font-medium">Siparis Detaylari</div>
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2"
                        >
                          <div className="flex-1">
                            <span className="text-sm font-medium">
                              {item.quantity}x {item.productName}
                            </span>
                            {item.notes && (
                              <span className="ml-2 text-xs italic text-muted-foreground">
                                ({item.notes})
                              </span>
                            )}
                          </div>
                          <span className="text-sm">
                            {item.totalPrice.toLocaleString("tr-TR")} TL
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-end pt-2 text-sm font-semibold">
                        Toplam: {(order.finalAmount ?? order.totalAmount).toLocaleString("tr-TR")} TL
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
