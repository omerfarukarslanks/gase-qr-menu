"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  QrCode,
  ExternalLink,
  Pencil,
  Trash2,
  Eye,
  Copy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Menu {
  id: string;
  name: string;
  description: string;
  slug: string;
  isActive: boolean;
  categoryCount: number;
  productCount: number;
  qrScans: number;
  createdAt: string;
}

const mockMenus: Menu[] = [
  {
    id: "1",
    name: "Ana Menu",
    description: "Restoranin ana menusudur. Tum kategorileri icerir.",
    slug: "ana-menu",
    isActive: true,
    categoryCount: 5,
    productCount: 32,
    qrScans: 1245,
    createdAt: "2025-01-15",
  },
  {
    id: "2",
    name: "Ogle Menusu",
    description: "Hafta ici ogle saatlerine ozel indirimli menu.",
    slug: "ogle-menusu",
    isActive: true,
    categoryCount: 3,
    productCount: 18,
    qrScans: 567,
    createdAt: "2025-02-20",
  },
  {
    id: "3",
    name: "Aksam Menusu",
    description: "Aksam yemegi icin ozel hazirlanmis menu.",
    slug: "aksam-menusu",
    isActive: false,
    categoryCount: 4,
    productCount: 25,
    qrScans: 0,
    createdAt: "2025-03-01",
  },
  {
    id: "4",
    name: "Barda Menu",
    description: "Bar bolumu icin icecek ve atistirmalik menusu.",
    slug: "bar-menu",
    isActive: true,
    categoryCount: 2,
    productCount: 15,
    qrScans: 340,
    createdAt: "2025-03-10",
  },
];

interface MenuFormData {
  name: string;
  description: string;
  slug: string;
}

const emptyForm: MenuFormData = {
  name: "",
  description: "",
  slug: "",
};

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>(mockMenus);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<MenuFormData>(emptyForm);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const handleCreate = () => {
    if (!formData.name.trim()) return;
    const slug =
      formData.slug ||
      formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");
    const newMenu: Menu = {
      id: `new-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      slug,
      isActive: true,
      categoryCount: 0,
      productCount: 0,
      qrScans: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setMenus([...menus, newMenu]);
    setShowForm(false);
    setFormData(emptyForm);
  };

  const handleDelete = (id: string) => {
    setMenus(menus.filter((m) => m.id !== id));
  };

  const copyUrl = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/m/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menuler</h1>
          <p className="text-muted-foreground">
            Farkli menuler olusturun, urun ve kategorileri atayin, QR kodlari yonetin.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Menu Olustur
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Yeni Menu Olustur</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setShowForm(false);
                  setFormData(emptyForm);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Menu Adi *</label>
                <Input
                  placeholder="ornek: Ana Menu"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input
                  placeholder="otomatik-olusturulur"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Aciklama</label>
                <Input
                  placeholder="Menu aciklamasi"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreate}>Olustur</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setFormData(emptyForm);
                }}
              >
                Iptal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {menus.map((menu) => (
          <Card key={menu.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {menu.name}
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        menu.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {menu.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {menu.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/admin/menus/${menu.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(menu.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{menu.categoryCount}</p>
                  <p className="text-xs text-muted-foreground">Kategori</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{menu.productCount}</p>
                  <p className="text-xs text-muted-foreground">Urun</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{menu.qrScans}</p>
                  <p className="text-xs text-muted-foreground">QR Tarama</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm">
                <QrCode className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 truncate text-muted-foreground">
                  /m/{menu.slug}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={() => copyUrl(menu.slug)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                {copiedSlug === menu.slug && (
                  <span className="text-xs text-green-600">Kopyalandi!</span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <Link href={`/admin/menus/${menu.id}`} className="flex-1">
                  <Button variant="outline" className="w-full" size="sm">
                    <Eye className="mr-2 h-3.5 w-3.5" />
                    Duzenle
                  </Button>
                </Link>
                <Link href={`/m/${menu.slug}`} target="_blank" className="flex-1">
                  <Button variant="outline" className="w-full" size="sm">
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    Onizle
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {menus.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <QrCode className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Henuz menu eklenmemis. &quot;Yeni Menu Olustur&quot; butonuna tiklayarak baslayabilirsiniz.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
