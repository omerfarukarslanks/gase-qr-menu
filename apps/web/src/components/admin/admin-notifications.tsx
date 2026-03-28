"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/use-socket";
import { useCurrentStore } from "@/hooks/use-current-store";

interface NotificationItem {
  id: string;
  type: "waiter" | "order" | "status";
  message: string;
  time: Date;
}

export function AdminNotifications() {
  const { activeStoreId } = useCurrentStore();
  const { joinStore, onEvent } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (activeStoreId) {
      joinStore(activeStoreId);
    }
  }, [activeStoreId, joinStore]);

  useEffect(() => {
    const cleanups = [
      onEvent("waiterCall", (data: { tableName?: string }) => {
        setNotifications((previous) => [
          {
            id: `${Date.now()}-waiter`,
            type: "waiter",
            message: `${data.tableName || "Masa"} garson cagiriyor.`,
            time: new Date(),
          },
          ...previous,
        ]);
      }),
      onEvent("newOrder", (data: { orderNumber?: string; tableName?: string }) => {
        setNotifications((previous) => [
          {
            id: `${Date.now()}-order`,
            type: "order",
            message: `Yeni siparis #${data.orderNumber || "---"} - ${data.tableName || "Masa"}`,
            time: new Date(),
          },
          ...previous,
        ]);
      }),
      onEvent("orderStatusUpdate", (data: { orderNumber?: string; status?: string }) => {
        setNotifications((previous) => [
          {
            id: `${Date.now()}-status`,
            type: "status",
            message: `Siparis #${data.orderNumber || "---"} durumu ${data.status || "-"}`,
            time: new Date(),
          },
          ...previous,
        ]);
      }),
    ];

    return () => cleanups.forEach((cleanup) => cleanup?.());
  }, [onEvent]);

  const unreadCount = notifications.length;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="relative rounded-full"
        onClick={() => setIsOpen((current) => !current)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold"
            style={{
              backgroundColor: "hsl(var(--warm))",
              color: "hsl(var(--background))",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[1.5rem] border border-border bg-popover shadow-[var(--card-shadow-hover)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Bildirimler</span>
            {notifications.length > 0 && (
              <button
                onClick={() => setNotifications([])}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Temizle
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                Bildirim yok
              </p>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 border-b border-border/50 px-4 py-3 last:border-0"
                >
                  <div
                    className={cn(
                      "mt-1 h-2.5 w-2.5 rounded-full",
                      notification.type === "waiter" && "bg-[hsl(var(--warm))]",
                      notification.type === "order" && "bg-primary",
                      notification.type === "status" && "bg-[hsl(var(--success))]"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-6 text-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {notification.time.toLocaleTimeString("tr-TR")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
