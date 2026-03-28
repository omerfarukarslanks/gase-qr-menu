"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  ChefHat,
  ClipboardList,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Package,
  QrCode,
  Ruler,
  Settings,
  ShoppingBag,
  UserCog,
  Users,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/use-socket";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useAuthStore } from "@/lib/store";

const navItems = [
  { href: "/admin", label: "Pano", icon: LayoutDashboard },
  { href: "/admin/categories", label: "Kategoriler", icon: FolderTree },
  { href: "/admin/units", label: "Birimler", icon: Ruler },
  { href: "/admin/ingredients", label: "Malzemeler", icon: Warehouse },
  { href: "/admin/products", label: "Urunler", icon: ShoppingBag },
  { href: "/admin/menus", label: "Menuler", icon: BookOpen },
  { href: "/admin/tables", label: "Masalar", icon: QrCode },
  { href: "/admin/orders", label: "Siparisler", icon: ClipboardList },
  { href: "/admin/kitchen", label: "Mutfak", icon: ChefHat },
  { href: "/admin/payments", label: "Odemeler", icon: CreditCard },
  { href: "/admin/campaigns", label: "Kampanyalar", icon: Megaphone },
  { href: "/admin/customers", label: "Musteriler", icon: Users },
  { href: "/admin/reports", label: "Raporlar", icon: BarChart3 },
  { href: "/admin/stock", label: "Stok", icon: Package },
  { href: "/admin/staff", label: "Personel", icon: UserCog },
  { href: "/admin/settings", label: "Ayarlar", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { stores, activeStore, activeStoreId, setActiveStoreId } = useCurrentStore();
  const { onEvent, joinStore } = useSocket();
  const [notifications, setNotifications] = useState<
    Array<{ id: string; type: string; message: string; time: Date }>
  >([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (activeStoreId) {
      joinStore(activeStoreId);
    }
  }, [activeStoreId, joinStore]);

  useEffect(() => {
    const cleanups = [
      onEvent("waiterCall", (data: { tableName?: string }) => {
        setNotifications((prev) => [
          {
            id: `${Date.now()}-waiter`,
            type: "waiter",
            message: `${data.tableName || "Masa"} garson cagiriyor.`,
            time: new Date(),
          },
          ...prev,
        ]);
      }),
      onEvent("newOrder", (data: { orderNumber?: string; tableName?: string }) => {
        setNotifications((prev) => [
          {
            id: `${Date.now()}-order`,
            type: "order",
            message: `Yeni siparis #${data.orderNumber || "---"} - ${data.tableName || "Masa"}`,
            time: new Date(),
          },
          ...prev,
        ]);
      }),
      onEvent("orderStatusUpdate", (data: { orderNumber?: string; status?: string }) => {
        setNotifications((prev) => [
          {
            id: `${Date.now()}-status`,
            type: "status",
            message: `Siparis #${data.orderNumber || "---"} durumu ${data.status || "-"}`,
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
    <aside className="flex h-screen w-72 flex-col border-r bg-card">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl font-bold">GASE</span>
            <span className="text-sm text-muted-foreground">QR Menu</span>
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowNotifications((value) => !value)}
              className="relative rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-md border bg-popover shadow-lg">
                <div className="flex items-center justify-between border-b p-3">
                  <span className="text-sm font-semibold">Bildirimler</span>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => setNotifications([])}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Temizle
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-3 text-center text-sm text-muted-foreground">
                      Bildirim yok
                    </p>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-start gap-2 border-b p-3 last:border-0 hover:bg-accent/50"
                      >
                        <div
                          className={cn(
                            "mt-1 h-2 w-2 rounded-full",
                            notification.type === "waiter" && "bg-yellow-500",
                            notification.type === "order" && "bg-blue-500",
                            notification.type === "status" && "bg-green-500"
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm">{notification.message}</p>
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
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Aktif magaza
            </p>
            <select
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={activeStoreId ?? ""}
              onChange={(event) => setActiveStoreId(event.target.value || null)}
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
            <p className="font-medium">{user?.name || user?.email}</p>
            <p className="text-xs text-muted-foreground">
              {activeStore?.currency || "TRY"} · {activeStore?.timezone || "Europe/Istanbul"}
            </p>
          </div>
        </div>
      </div>

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

      <div className="border-t p-3">
        <button
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
        >
          <LogOut className="h-4 w-4" />
          Cikis yap
        </button>
      </div>
    </aside>
  );
}
