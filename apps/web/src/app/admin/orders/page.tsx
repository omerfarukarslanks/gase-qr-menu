"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useSocket } from "@/hooks/use-socket";
import { useCurrentStore } from "@/hooks/use-current-store";

type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  status: OrderStatus;
}

interface Order {
  id: string;
  orderNumber: string;
  tableName: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  time: string;
  createdAt: Date;
}

const statusConfig: Record<
  OrderStatus,
  { label: string; bg: string; color: string }
> = {
  PENDING: { label: "Bekleyen", bg: "bg-yellow-100", color: "text-yellow-700" },
  CONFIRMED: { label: "Onaylandi", bg: "bg-blue-100", color: "text-blue-700" },
  PREPARING: { label: "Hazirlaniyor", bg: "bg-orange-100", color: "text-orange-700" },
  READY: { label: "Hazir", bg: "bg-green-100", color: "text-green-700" },
  SERVED: { label: "Servis Edildi", bg: "bg-gray-100", color: "text-gray-600" },
};

const nextStatusAction: Record<OrderStatus, { next: OrderStatus; label: string } | null> = {
  PENDING: { next: "CONFIRMED", label: "Onayla" },
  CONFIRMED: { next: "PREPARING", label: "Hazirla" },
  PREPARING: { next: "READY", label: "Hazir" },
  READY: { next: "SERVED", label: "Teslim Et" },
  SERVED: null,
};

const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "#001",
    tableName: "Masa 1 - Pencere Kenari",
    customerName: "Ahmet Yilmaz",
    items: [
      { id: "i1", name: "Adana Kebap", quantity: 2, price: 320, status: "PENDING" },
      { id: "i2", name: "Ayran", quantity: 2, price: 30, status: "PENDING" },
      { id: "i3", name: "Kunefe", quantity: 1, price: 150, notes: "Bol fistikli", status: "PENDING" },
    ],
    totalAmount: 850,
    status: "PENDING",
    time: "12:30",
    createdAt: new Date(Date.now() - 5 * 60000),
  },
  {
    id: "2",
    orderNumber: "#002",
    tableName: "Masa 5 - Bahce",
    customerName: "Elif Demir",
    items: [
      { id: "i4", name: "Lahmacun", quantity: 3, price: 120, status: "CONFIRMED" },
      { id: "i5", name: "Mercimek Corbasi", quantity: 2, price: 80, status: "CONFIRMED" },
    ],
    totalAmount: 520,
    status: "CONFIRMED",
    time: "12:25",
    createdAt: new Date(Date.now() - 10 * 60000),
  },
  {
    id: "3",
    orderNumber: "#003",
    tableName: "Masa 8 - Teras",
    customerName: "Mehmet Kara",
    items: [
      { id: "i6", name: "Iskender Kebap", quantity: 1, price: 350, status: "PREPARING" },
      { id: "i7", name: "Pide (Kiymali)", quantity: 1, price: 180, notes: "Az pisirilsin", status: "PREPARING" },
      { id: "i8", name: "Salgam Suyu", quantity: 2, price: 25, status: "PREPARING" },
    ],
    totalAmount: 580,
    status: "PREPARING",
    time: "12:15",
    createdAt: new Date(Date.now() - 20 * 60000),
  },
  {
    id: "4",
    orderNumber: "#004",
    tableName: "Masa 11 - VIP Salon",
    customerName: "Ayse Ozturk",
    items: [
      { id: "i9", name: "Karisik Izgara", quantity: 2, price: 450, status: "READY" },
      { id: "i10", name: "Coban Salata", quantity: 2, price: 80, status: "READY" },
      { id: "i11", name: "Baklava", quantity: 4, price: 120, notes: "Antep fistikli", status: "READY" },
      { id: "i12", name: "Turk Kahvesi", quantity: 4, price: 50, status: "READY" },
    ],
    totalAmount: 1380,
    status: "READY",
    time: "12:00",
    createdAt: new Date(Date.now() - 35 * 60000),
  },
  {
    id: "5",
    orderNumber: "#005",
    tableName: "Masa 2 - Pencere Kenari",
    customerName: "Ali Celik",
    items: [
      { id: "i13", name: "Tavuk Sis", quantity: 2, price: 250, status: "PENDING" },
      { id: "i14", name: "Ezme Salata", quantity: 1, price: 60, status: "PENDING" },
    ],
    totalAmount: 560,
    status: "PENDING",
    time: "12:35",
    createdAt: new Date(Date.now() - 2 * 60000),
  },
  {
    id: "6",
    orderNumber: "#006",
    tableName: "Masa 9 - Teras",
    customerName: "Fatma Sahin",
    items: [
      { id: "i15", name: "Urfa Kebap", quantity: 1, price: 300, status: "SERVED" },
      { id: "i16", name: "Ayran", quantity: 1, price: 30, status: "SERVED" },
    ],
    totalAmount: 330,
    status: "SERVED",
    time: "11:45",
    createdAt: new Date(Date.now() - 50 * 60000),
  },
  {
    id: "7",
    orderNumber: "#007",
    tableName: "Masa 3 - Orta Masa",
    customerName: "Hasan Yildiz",
    items: [
      { id: "i17", name: "Kofte", quantity: 2, price: 220, status: "PREPARING" },
      { id: "i18", name: "Pilav", quantity: 2, price: 50, status: "PREPARING" },
      { id: "i19", name: "Cacik", quantity: 1, price: 50, notes: "Sarimsakli", status: "PREPARING" },
    ],
    totalAmount: 590,
    status: "PREPARING",
    time: "12:20",
    createdAt: new Date(Date.now() - 15 * 60000),
  },
  {
    id: "8",
    orderNumber: "#008",
    tableName: "Masa 6 - Bahce",
    customerName: "Zeynep Arslan",
    items: [
      { id: "i20", name: "Sutlac", quantity: 3, price: 90, status: "CONFIRMED" },
      { id: "i21", name: "Cay", quantity: 3, price: 15, status: "CONFIRMED" },
    ],
    totalAmount: 315,
    status: "CONFIRMED",
    time: "12:28",
    createdAt: new Date(Date.now() - 8 * 60000),
  },
];

type FilterStatus = "ALL" | OrderStatus;

export default function OrdersPage() {
  const { activeStoreId } = useCurrentStore();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { joinStore, onEvent } = useSocket();

  const storeId = activeStoreId ?? "";

  useEffect(() => {
    if (storeId) {
      joinStore(storeId);
    }
  }, [joinStore, storeId]);

  // Listen for new orders via WebSocket
  useEffect(() => {
    const cleanupNew = onEvent("newOrder", (data: any) => {
      const newOrder: Order = {
        id: data.id,
        orderNumber: `#${String(data.orderNumber).padStart(3, "0")}`,
        tableName: data.tableSession?.tableRef?.name || "Masa",
        customerName: data.tableSession?.customerName || "Musteri",
        items: (data.items || []).map((item: any) => ({
          id: item.id,
          name: item.product?.translations?.[0]?.name || item.product?.slug || "Urun",
          quantity: item.quantity,
          price: item.unitPrice,
          notes: item.notes,
          status: item.status || "PENDING",
        })),
        totalAmount: data.totalAmount || 0,
        status: data.status || "PENDING",
        time: new Date(data.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        createdAt: new Date(data.createdAt),
      };
      setOrders((prev) => [newOrder, ...prev]);
    });

    const cleanupStatus = onEvent("orderStatusUpdate", (data: any) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === data.id
            ? {
                ...o,
                status: data.status,
                items: o.items.map((item) => ({ ...item, status: data.status })),
              }
            : o
        )
      );
    });

    return () => {
      cleanupNew?.();
      cleanupStatus?.();
    };
  }, [onEvent]);

  const filteredOrders =
    activeFilter === "ALL"
      ? [...orders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      : [...orders]
          .filter((o) => o.status === activeFilter)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const getCount = (status: OrderStatus) =>
    orders.filter((o) => o.status === status).length;

  const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: "ALL", label: `Tumu (${orders.length})` },
    { key: "PENDING", label: `Bekleyen (${getCount("PENDING")})` },
    { key: "CONFIRMED", label: `Onaylandi (${getCount("CONFIRMED")})` },
    { key: "PREPARING", label: `Hazirlaniyor (${getCount("PREPARING")})` },
    { key: "READY", label: `Hazir (${getCount("READY")})` },
    { key: "SERVED", label: `Servis Edildi (${getCount("SERVED")})` },
  ];

  const handleStatusChange = (orderId: string) => {
    setOrders(
      orders.map((o) => {
        if (o.id !== orderId) return o;
        const action = nextStatusAction[o.status];
        if (!action) return o;
        return {
          ...o,
          status: action.next,
          items: o.items.map((item) => ({ ...item, status: action.next })),
        };
      })
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
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
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            Canli
          </span>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Yenile
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
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

      <div className="space-y-3">
        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Bu kategoride siparis bulunmuyor.
              </p>
            </CardContent>
          </Card>
        )}

        {filteredOrders.map((order) => {
          const status = statusConfig[order.status];
          const action = nextStatusAction[order.status];
          const isExpanded = expandedId === order.id;
          const itemsSummary = order.items
            .map((item) => `${item.quantity}x ${item.name}`)
            .join(", ");

          return (
            <Card
              key={order.id}
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => toggleExpand(order.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 min-w-0">
                    <div className="text-lg font-bold">{order.orderNumber}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {order.tableName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.customerName}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 hidden sm:block">
                    <p className="text-sm truncate">{itemsSummary}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {order.time}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-semibold">
                        {order.totalAmount.toLocaleString("tr-TR")} TL
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.bg} ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    {action && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(order.id);
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
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="text-sm font-medium mb-2">Siparis Detaylari</div>
                    {order.items.map((item) => {
                      const itemStatus = statusConfig[item.status];
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30"
                        >
                          <div className="flex-1">
                            <span className="text-sm font-medium">
                              {item.quantity}x {item.name}
                            </span>
                            {item.notes && (
                              <span className="text-xs text-muted-foreground italic ml-2">
                                ({item.notes})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm">
                              {(item.price * item.quantity).toLocaleString("tr-TR")} TL
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${itemStatus.bg} ${itemStatus.color}`}
                            >
                              {itemStatus.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-end pt-2 text-sm font-semibold">
                      Toplam: {order.totalAmount.toLocaleString("tr-TR")} TL
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
