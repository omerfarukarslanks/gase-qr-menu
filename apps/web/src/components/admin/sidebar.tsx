"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/use-socket";
import {
  LayoutDashboard,
  FolderTree,
  Ruler,
  Warehouse,
  ShoppingBag,
  BookOpen,
  QrCode,
  ClipboardList,
  ChefHat,
  Megaphone,
  Users,
  BarChart3,
  Package,
  UserCog,
  Settings,
  LogOut,
  Bell,
  CreditCard,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Pano", icon: LayoutDashboard },
  { href: "/admin/categories", label: "Kategoriler", icon: FolderTree },
  { href: "/admin/units", label: "Birimler", icon: Ruler },
  { href: "/admin/ingredients", label: "Malzemeler", icon: Warehouse },
  { href: "/admin/products", label: "Ürünler", icon: ShoppingBag },
  { href: "/admin/menus", label: "Menüler", icon: BookOpen },
  { href: "/admin/tables", label: "Masalar", icon: QrCode },
  { href: "/admin/orders", label: "Siparişler", icon: ClipboardList },
  { href: "/admin/kitchen", label: "Mutfak Ekranı", icon: ChefHat },
  { href: "/admin/payments", label: "Ödemeler", icon: CreditCard },
  { href: "/admin/campaigns", label: "Kampanyalar", icon: Megaphone },
  { href: "/admin/customers", label: "Müşteriler", icon: Users },
  { href: "/admin/reports", label: "Raporlar", icon: BarChart3 },
  { href: "/admin/stock", label: "Stok", icon: Package },
  { href: "/admin/staff", label: "Personel", icon: UserCog },
  { href: "/admin/settings", label: "Ayarlar", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { onEvent, joinStore } = useSocket();
  const [notifications, setNotifications] = useState<
    Array<{ id: string; type: string; message: string; time: Date }>
  >([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Join store room on mount (demo store)
  useEffect(() => {
    joinStore("store-1");
  }, [joinStore]);

  // Listen for real-time events
  useEffect(() => {
    const cleanups = [
      onEvent("waiterCall", (data: any) => {
        setNotifications((prev) => [
          {
            id: Date.now().toString(),
            type: "waiter",
            message: `${data.tableName || "Masa"} garson çağırıyor!`,
            time: new Date(),
          },
          ...prev,
        ]);
      }),
      onEvent("newOrder", (data: any) => {
        setNotifications((prev) => [
          {
            id: Date.now().toString(),
            type: "order",
            message: `Yeni sipariş: #${data.orderNumber || "---"} - ${data.tableName || "Masa"}`,
            time: new Date(),
          },
          ...prev,
        ]);
      }),
      onEvent("orderStatusUpdate", (data: any) => {
        setNotifications((prev) => [
          {
            id: Date.now().toString(),
            type: "status",
            message: `Sipariş #${data.orderNumber || "---"} durumu: ${data.status}`,
            time: new Date(),
          },
          ...prev,
        ]);
      }),
    ];

    return () => cleanups.forEach((fn) => fn?.());
  }, [onEvent]);

  const unreadCount = notifications.length;

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-xl font-bold">GASE</span>
          <span className="text-sm text-muted-foreground">QR Menu</span>
        </Link>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-1 w-72 rounded-md border bg-popover shadow-lg z-50">
              <div className="flex items-center justify-between border-b p-3">
                <span className="text-sm font-semibold">Bildirimler</span>
                {notifications.length > 0 && (
                  <button
                    onClick={() => setNotifications([])}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Tümünü temizle
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-3 text-center text-sm text-muted-foreground">
                    Bildirim yok
                  </p>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      className="flex items-start gap-2 border-b last:border-0 p-3 hover:bg-accent/50"
                    >
                      <div
                        className={cn(
                          "mt-0.5 h-2 w-2 rounded-full flex-shrink-0",
                          notif.type === "waiter" && "bg-yellow-500",
                          notif.type === "order" && "bg-blue-500",
                          notif.type === "status" && "bg-green-500"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{notif.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {notif.time.toLocaleTimeString("tr-TR")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t p-3">
        <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
