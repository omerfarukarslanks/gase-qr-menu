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
  roles?: string[];
}

export const adminNavItems: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Pano",
    icon: LayoutDashboard,
    roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "STAFF", "WAITER", "KITCHEN"],
  },
  {
    href: "/admin/categories",
    label: "Kategoriler",
    icon: FolderTree,
    roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "STAFF"],
  },
  {
    href: "/admin/units",
    label: "Birimler",
    icon: Ruler,
    roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "STAFF"],
  },
  {
    href: "/admin/ingredients",
    label: "Malzemeler",
    icon: Warehouse,
    roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "STAFF"],
  },
  {
    href: "/admin/products",
    label: "Urunler",
    icon: ShoppingBag,
    roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "STAFF"],
  },
  {
    href: "/admin/menus",
    label: "Menuler",
    icon: BookOpen,
    roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "STAFF"],
  },
  {
    href: "/admin/tables",
    label: "Masalar",
    icon: QrCode,
    roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "STAFF", "WAITER"],
  },
  {
    href: "/admin/orders",
    label: "Siparisler",
    icon: ClipboardList,
    roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "STAFF", "WAITER", "KITCHEN"],
  },
  {
    href: "/admin/kitchen",
    label: "Mutfak",
    icon: ChefHat,
    roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "STAFF", "KITCHEN"],
  },
  {
    href: "/admin/payments",
    label: "Odemeler",
    icon: CreditCard,
    roles: ["SUPER_ADMIN", "OWNER", "MANAGER"],
  },
  {
    href: "/admin/campaigns",
    label: "Kampanyalar",
    icon: Megaphone,
    roles: ["SUPER_ADMIN", "OWNER", "MANAGER"],
  },
  {
    href: "/admin/customers",
    label: "Musteriler",
    icon: Users,
    roles: ["SUPER_ADMIN", "OWNER", "MANAGER"],
  },
  {
    href: "/admin/reports",
    label: "Raporlar",
    icon: BarChart3,
    roles: ["SUPER_ADMIN", "OWNER", "MANAGER"],
  },
  {
    href: "/admin/stock",
    label: "Stok",
    icon: Package,
    roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "STAFF"],
  },
  {
    href: "/admin/staff",
    label: "Personel",
    icon: UserCog,
    roles: ["SUPER_ADMIN", "OWNER", "MANAGER"],
  },
  {
    href: "/admin/settings",
    label: "Ayarlar",
    icon: Settings,
    roles: ["SUPER_ADMIN", "OWNER", "MANAGER"],
  },
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

export function getEffectiveAdminRole(
  userRole?: string | null,
  storeRole?: string | null
) {
  if (userRole === "SUPER_ADMIN" || userRole === "OWNER") {
    return userRole;
  }

  return storeRole ?? userRole ?? null;
}

export function getAccessibleAdminNavItems(
  userRole?: string | null,
  storeRole?: string | null
) {
  const effectiveRole = getEffectiveAdminRole(userRole, storeRole);

  if (!effectiveRole) {
    return [];
  }

  return adminNavItems.filter(
    (item) => !item.roles || item.roles.includes(effectiveRole)
  );
}

export function canAccessAdminPath(
  pathname: string,
  userRole?: string | null,
  storeRole?: string | null
) {
  return getAccessibleAdminNavItems(userRole, storeRole).some(
    (item) =>
      pathname === item.href ||
      (item.href !== "/admin" && pathname.startsWith(item.href))
  );
}
