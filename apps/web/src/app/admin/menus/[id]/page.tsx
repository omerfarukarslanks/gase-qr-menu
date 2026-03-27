"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  QrCode,
  Copy,
  Save,
  ChevronDown,
  ChevronRight,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface MenuProduct {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  sortOrder: number;
}

interface MenuCategory {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  products: MenuProduct[];
}

interface MenuData {
  id: string;
  name: string;
  description: string;
  slug: string;
  isActive: boolean;
  categories: MenuCategory[];
}

const mockMenu: MenuData = {
  id: "1",
  name: "Ana Menu",
  description: "Restoranin ana menusu - tum kategoriler",
  slug: "ana-menu",
  isActive: true,
  categories: [
    {
      id: "cat-1",
      name: "Ana Yemekler",
      isActive: true,
      sortOrder: 1,
      products: [
        { id: "p-1", name: "Adana Kebap", price: 130, isActive: true, sortOrder: 1 },
        { id: "p-2", name: "Iskender", price: 150, isActive: true, sortOrder: 2 },
        { id: "p-3", name: "Karisik Izgara", price: 200, isActive: true, sortOrder: 3 },
        { id: "p-4", name: "Tavuk Sis", price: 110, isActive: false, sortOrder: 4 },
      ],
    },
    {
      id: "cat-2",
      name: "Baslangiclar",
      isActive: true,
      sortOrder: 2,
      products: [
        { id: "p-5", name: "Mercimek Corbasi", price: 50, isActive: true, sortOrder: 1 },
        { id: "p-6", name: "Humus", price: 45, isActive: true, sortOrder: 2 },
        { id: "p-7", name: "Sigara Boregi", price: 55, isActive: true, sortOrder: 3 },
      ],
    },
    {
      id: "cat-3",
      name: "Icecekler",
      isActive: true,
      sortOrder: 3,
      products: [
        { id: "p-8", name: "Ayran", price: 15, isActive: true, sortOrder: 1 },
        { id: "p-9", name: "Kola", price: 25, isActive: true, sortOrder: 2 },
        { id: "p-10", name: "Turk Kahvesi", price: 40, isActive: true, sortOrder: 3 },
        { id: "p-11", name: "Cay", price: 10, isActive: true, sortOrder: 4 },
      ],
    },
    {
      id: "cat-4",
      name: "Tatlilar",
      isActive: false,
      sortOrder: 4,
      products: [
        { id: "p-12", name: "Kunefe", price: 90, isActive: true, sortOrder: 1 },
        { id: "p-13", name: "Baklava", price: 100, isActive: true, sortOrder: 2 },
        { id: "p-14", name: "Sutlac", price: 60, isActive: false, sortOrder: 3 },
      ],
    },
  ],
};

const menuUrl = "https://gase.menu/m/ana-menu";

export default function MenuDetailPage() {
  const [menu, setMenu] = useState<MenuData>(mockMenu);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["cat-1", "cat-2"])
  );
  const [copied, setCopied] = useState(false);

  const toggleCategoryExpand = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCategoryActive = (categoryId: string) => {
    setMenu({
      ...menu,
      categories: menu.categories.map((cat) =>
        cat.id === categoryId ? { ...cat, isActive: !cat.isActive } : cat
      ),
    });
  };

  const toggleProductActive = (categoryId: string, productId: string) => {
    setMenu({
      ...menu,
      categories: menu.categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              products: cat.products.map((p) =>
                p.id === productId ? { ...p, isActive: !p.isActive } : p
              ),
            }
          : cat
      ),
    });
  };

  const toggleMenuActive = () => {
    setMenu({ ...menu, isActive: !menu.isActive });
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/menus">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{menu.name}</h1>
          <p className="text-muted-foreground">{menu.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            {menu.isActive ? "Aktif" : "Pasif"}
          </span>
          <button
            type="button"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              menu.isActive ? "bg-primary" : "bg-gray-300"
            }`}
            onClick={toggleMenuActive}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                menu.isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* QR Code Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Kod
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* QR Code Placeholder */}
            <div className="flex justify-center">
              <div className="w-48 h-48 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center bg-white">
                <div className="space-y-1.5 p-4">
                  {/* Stylized QR placeholder */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: 49 }).map((_, i) => {
                      const row = Math.floor(i / 7);
                      const col = i % 7;
                      const isCorner =
                        (row < 2 && col < 2) ||
                        (row < 2 && col > 4) ||
                        (row > 4 && col < 2);
                      const isRandom = [3, 8, 12, 17, 22, 25, 31, 36, 40, 44, 47].includes(i);
                      const isFilled = isCorner || isRandom;
                      return (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded-[1px] ${
                            isFilled ? "bg-foreground" : "bg-muted"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Menu URL</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={menuUrl}
                  className="text-xs bg-muted"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={handleCopyUrl}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-green-600">URL kopyalandi!</p>
              )}
            </div>

            <Button variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              QR Kodu Indir
            </Button>
          </CardContent>
        </Card>

        {/* Menu Name/Description Edit */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Menu Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Menu Adi</label>
                <Input
                  value={menu.name}
                  onChange={(e) =>
                    setMenu({ ...menu, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={menu.slug}
                  onChange={(e) =>
                    setMenu({ ...menu, slug: e.target.value })
                  }
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Aciklama</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={menu.description}
                  onChange={(e) =>
                    setMenu({ ...menu, description: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories & Products */}
      <Card>
        <CardHeader>
          <CardTitle>Kategoriler ve Urunler</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            {menu.categories.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              const activeProducts = category.products.filter(
                (p) => p.isActive
              ).length;

              return (
                <div key={category.id}>
                  {/* Category Row */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b hover:bg-muted/50 transition-colors">
                    <button
                      onClick={() => toggleCategoryExpand(category.id)}
                      className="p-0.5 hover:bg-muted rounded flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium flex-shrink-0">
                      {category.sortOrder}
                    </span>

                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">
                        {category.name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {activeProducts} / {category.products.length} urun aktif
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0 ${
                        category.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {category.isActive ? "Aktif" : "Pasif"}
                    </span>

                    <button
                      type="button"
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                        category.isActive ? "bg-primary" : "bg-gray-300"
                      }`}
                      onClick={() => toggleCategoryActive(category.id)}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          category.isActive ? "translate-x-4.5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Products */}
                  {isExpanded && (
                    <div className="bg-muted/20">
                      {category.products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 px-4 py-2.5 border-b hover:bg-muted/30 transition-colors"
                          style={{ paddingLeft: "56px" }}
                        >
                          <div className="flex items-center flex-shrink-0">
                            <div className="w-4 border-l-2 border-b-2 border-muted-foreground/30 h-4 -mt-2 mr-2" />
                          </div>

                          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-muted text-[10px] font-medium flex-shrink-0">
                            {product.sortOrder}
                          </span>

                          <div className="flex-1 min-w-0">
                            <span className="text-sm">{product.name}</span>
                          </div>

                          <span className="text-sm text-muted-foreground flex-shrink-0">
                            {product.price} TL
                          </span>

                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0 ${
                              product.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {product.isActive ? "Aktif" : "Pasif"}
                          </span>

                          <button
                            type="button"
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                              product.isActive ? "bg-primary" : "bg-gray-300"
                            }`}
                            onClick={() =>
                              toggleProductActive(category.id, product.id)
                            }
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                product.isActive
                                  ? "translate-x-4.5"
                                  : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg">
          <Save className="mr-2 h-4 w-4" />
          Degisiklikleri Kaydet
        </Button>
      </div>
    </div>
  );
}
