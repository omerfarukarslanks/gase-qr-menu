"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Maximize2,
  Minimize2,
  Clock,
  Bell,
  BellOff,
  ChefHat,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  notes?: string;
}

interface KitchenOrder {
  id: string;
  orderNumber: number;
  tableName: string;
  status: "PENDING" | "PREPARING" | "READY";
  items: OrderItem[];
  createdAt: Date;
}

const mockOrders: KitchenOrder[] = [
  {
    id: "1",
    orderNumber: 1,
    tableName: "Masa 3",
    status: "PENDING",
    items: [
      { name: "Adana Kebap", quantity: 2, notes: "Az acili" },
      { name: "Ayran", quantity: 2 },
      { name: "Ezme Salata", quantity: 1 },
    ],
    createdAt: new Date(Date.now() - 3 * 60000),
  },
  {
    id: "2",
    orderNumber: 2,
    tableName: "Masa 7",
    status: "PENDING",
    items: [
      { name: "Iskender", quantity: 1 },
      { name: "Mercimek Corbasi", quantity: 1 },
      { name: "Salgam", quantity: 1 },
    ],
    createdAt: new Date(Date.now() - 8 * 60000),
  },
  {
    id: "3",
    orderNumber: 3,
    tableName: "Masa 1",
    status: "PREPARING",
    items: [
      { name: "Lahmacun", quantity: 3 },
      { name: "Pide (Kiymali)", quantity: 1 },
      { name: "Coca Cola", quantity: 3 },
    ],
    createdAt: new Date(Date.now() - 12 * 60000),
  },
  {
    id: "4",
    orderNumber: 4,
    tableName: "Masa 5",
    status: "PREPARING",
    items: [
      { name: "Karisik Izgara", quantity: 2, notes: "Iyi piskin" },
      { name: "Pilav", quantity: 2 },
      { name: "Kunefe", quantity: 1 },
    ],
    createdAt: new Date(Date.now() - 18 * 60000),
  },
  {
    id: "5",
    orderNumber: 5,
    tableName: "Masa 12",
    status: "READY",
    items: [
      { name: "Tavuk Sis", quantity: 2 },
      { name: "Bulgur Pilavi", quantity: 2 },
    ],
    createdAt: new Date(Date.now() - 25 * 60000),
  },
  {
    id: "6",
    orderNumber: 6,
    tableName: "Masa 9",
    status: "READY",
    items: [
      { name: "Sutlac", quantity: 3 },
      { name: "Turk Kahvesi", quantity: 3 },
    ],
    createdAt: new Date(Date.now() - 30 * 60000),
  },
];

function getElapsedMinutes(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 60000);
}

function OrderCard({
  order,
  onAction,
  actionLabel,
}: {
  order: KitchenOrder;
  onAction: () => void;
  actionLabel: string;
}) {
  const elapsed = getElapsedMinutes(order.createdAt);
  const isUrgent = elapsed > 15;

  return (
    <Card
      className={`mb-3 ${isUrgent ? "border-destructive/50 bg-destructive/5" : ""}`}
    >
      <CardHeader className="p-3 pb-1">
        <div className="flex items-center justify-between">
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
        <ul className="space-y-1.5 mb-3">
          {order.items.map((item, idx) => (
            <li key={idx} className="text-sm">
              <span className="font-medium">
                {item.quantity}x {item.name}
              </span>
              {item.notes && (
                <span className="block text-xs italic text-muted-foreground ml-4">
                  {item.notes}
                </span>
              )}
            </li>
          ))}
        </ul>
        <Button onClick={onAction} className="w-full" size="sm">
          {actionLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>(mockOrders);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

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
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const moveOrder = (orderId: string) => {
    setOrders((prev) =>
      prev
        .map((o) => {
          if (o.id !== orderId) return o;
          if (o.status === "PENDING") return { ...o, status: "PREPARING" as const };
          if (o.status === "PREPARING") return { ...o, status: "READY" as const };
          return o;
        })
        .filter((o) => !(o.id === orderId && o.status === "READY" && orders.find(x => x.id === orderId)?.status === "READY"))
    );
  };

  const deliverOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const pending = orders.filter((o) => o.status === "PENDING");
  const preparing = orders.filter((o) => o.status === "PREPARING");
  const ready = orders.filter((o) => o.status === "READY");

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2 bg-background">
        <div className="flex items-center gap-3">
          <ChefHat className="h-6 w-6" />
          <h1 className="text-xl font-bold">Mutfak Ekrani</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-mono text-muted-foreground">
            {currentTime.toLocaleTimeString("tr-TR")}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 grid grid-cols-3 gap-0 overflow-hidden">
        {/* Bekleyen */}
        <div className="flex flex-col border-r overflow-hidden">
          <div className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-950/30 px-4 py-2 border-b">
            <h2 className="font-bold text-yellow-800 dark:text-yellow-200">
              Bekleyen
            </h2>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-200 dark:bg-yellow-800 text-sm font-bold text-yellow-800 dark:text-yellow-200">
              {pending.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 bg-yellow-50/30 dark:bg-yellow-950/10">
            {pending.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Bekleyen siparis yok
              </p>
            ) : (
              pending.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAction={() => moveOrder(order.id)}
                  actionLabel="Hazirlamaya Basla"
                />
              ))
            )}
          </div>
        </div>

        {/* Hazirlaniyor */}
        <div className="flex flex-col border-r overflow-hidden">
          <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-950/30 px-4 py-2 border-b">
            <h2 className="font-bold text-orange-800 dark:text-orange-200">
              Hazirlaniyor
            </h2>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-200 dark:bg-orange-800 text-sm font-bold text-orange-800 dark:text-orange-200">
              {preparing.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 bg-orange-50/30 dark:bg-orange-950/10">
            {preparing.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Hazirlanan siparis yok
              </p>
            ) : (
              preparing.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAction={() => moveOrder(order.id)}
                  actionLabel="Hazir"
                />
              ))
            )}
          </div>
        </div>

        {/* Hazir */}
        <div className="flex flex-col overflow-hidden">
          <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 px-4 py-2 border-b">
            <h2 className="font-bold text-green-800 dark:text-green-200">
              Hazir
            </h2>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-200 dark:bg-green-800 text-sm font-bold text-green-800 dark:text-green-200">
              {ready.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 bg-green-50/30 dark:bg-green-950/10">
            {ready.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Servise hazir siparis yok
              </p>
            ) : (
              ready.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAction={() => deliverOrder(order.id)}
                  actionLabel="Teslim Edildi"
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Stats Bar */}
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
          Toplam: {orders.length} aktif siparis
        </div>
      </div>
    </div>
  );
}
