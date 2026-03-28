import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  ChefHat,
  ClipboardList,
  CreditCard,
  FolderTree,
  LayoutDashboard,
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

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const adminNavItems: AdminNavItem[] = [
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

const titleByPrefix: Array<{ prefix: string; title: string }> = [
  { prefix: "/admin/products/new", title: "Yeni urun" },
  { prefix: "/admin/menus/", title: "Menu detayi" },
  { prefix: "/admin", title: "Pano" },
];

export function getAdminPageTitle(pathname: string) {
  const exact = titleByPrefix.find(
    (item) => item.prefix !== "/admin" && pathname.startsWith(item.prefix)
  );
  if (exact) {
    return exact.title;
  }

  const match = adminNavItems.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/admin" && pathname.startsWith(item.href))
  );

  if (match) {
    return match.label;
  }

  return titleByPrefix[titleByPrefix.length - 1]?.title ?? "Admin";
}
