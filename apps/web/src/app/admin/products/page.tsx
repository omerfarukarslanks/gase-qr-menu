"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
  ImageIcon,
  Package,
  Filter,
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

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  categoryId: string;
  price: number;
  currency: string;
  costPrice: number;
  taxRate: number;
  imageUrl: string;
  isActive: boolean;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  preparationTime: number;
}

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Adana Kebap",
    slug: "adana-kebap",
    description: "Ozel baharatlarla hazirlanan el yapimi adana kebap",
    category: "Kebaplar",
    categoryId: "1-2",
    price: 320,
    currency: "TRY",
    costPrice: 180,
    taxRate: 10,
    imageUrl: "",
    isActive: true,
    stockStatus: "in_stock",
    preparationTime: 25,
  },
  {
    id: "2",
    name: "Urfa Kebap",
    slug: "urfa-kebap",
    description: "Baharatsiz, hafif lezzetli urfa kebap",
    category: "Kebaplar",
    categoryId: "1-2",
    price: 310,
    currency: "TRY",
    costPrice: 170,
    taxRate: 10,
    imageUrl: "",
    isActive: true,
    stockStatus: "in_stock",
    preparationTime: 25,
  },
  {
    id: "3",
    name: "Karisik Izgara",
    slug: "karisik-izgara",
    description: "Kuzu pirzola, cop sis, tavuk kanat, kofte",
    category: "Izgara",
    categoryId: "1-1",
    price: 450,
    currency: "TRY",
    costPrice: 250,
    taxRate: 10,
    imageUrl: "",
    isActive: true,
    stockStatus: "in_stock",
    preparationTime: 30,
  },
  {
    id: "4",
    name: "Mercimek Corbasi",
    slug: "mercimek-corbasi",
    description: "Geleneksel mercimek corbasi",
    category: "Baslangiclar",
    categoryId: "2",
    price: 85,
    currency: "TRY",
    costPrice: 25,
    taxRate: 10,
    imageUrl: "",
    isActive: true,
    stockStatus: "in_stock",
    preparationTime: 10,
  },
  {
    id: "5",
    name: "Coban Salata",
    slug: "coban-salata",
    description: "Domates, salatalik, biber, sogan, maydanoz",
    category: "Salatalar",
    categoryId: "3",
    price: 75,
    currency: "TRY",
    costPrice: 20,
    taxRate: 10,
    imageUrl: "",
    isActive: true,
    stockStatus: "in_stock",
    preparationTime: 8,
  },
  {
    id: "6",
    name: "Kunefe",
    slug: "kunefe",
    description: "Fistikli kunefe, dondurma ile servis edilir",
    category: "Tatlilar",
    categoryId: "5",
    price: 180,
    currency: "TRY",
    costPrice: 60,
    taxRate: 10,
    imageUrl: "",
    isActive: true,
    stockStatus: "low_stock",
    preparationTime: 15,
  },
  {
    id: "7",
    name: "Ayran",
    slug: "ayran",
    description: "Ev yapimi ayran",
    category: "Soguk Icecekler",
    categoryId: "4-1",
    price: 35,
    currency: "TRY",
    costPrice: 8,
    taxRate: 10,
    imageUrl: "",
    isActive: true,
    stockStatus: "in_stock",
    preparationTime: 2,
  },
  {
    id: "8",
    name: "Turk Kahvesi",
    slug: "turk-kahvesi",
    description: "Geleneksel Turk kahvesi, lokum ile servis edilir",
    category: "Sicak Icecekler",
    categoryId: "4-2",
    price: 60,
    currency: "TRY",
    costPrice: 15,
    taxRate: 10,
    imageUrl: "",
    isActive: false,
    stockStatus: "out_of_stock",
    preparationTime: 5,
  },
];

const categories = [
  "Tumu",
  "Kebaplar",
  "Izgara",
  "Baslangiclar",
  "Salatalar",
  "Tatlilar",
  "Soguk Icecekler",
  "Sicak Icecekler",
];

const stockStatusMap: Record<string, { label: string; className: string }> = {
  in_stock: { label: "Stokta", className: "bg-green-100 text-green-700" },
  low_stock: { label: "Az Kaldi", className: "bg-yellow-100 text-yellow-700" },
  out_of_stock: { label: "Tukendi", className: "bg-red-100 text-red-700" },
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tumu");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "Tumu" || p.category === selectedCategory;
    const matchesActive =
      activeFilter === "all" ||
      (activeFilter === "active" && p.isActive) ||
      (activeFilter === "inactive" && !p.isActive);
    return matchesSearch && matchesCategory && matchesActive;
  });

  const handleDelete = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Urunler</h1>
          <p className="text-muted-foreground">
            Urun ekleyin, duzenleyin, fiyatlandirin ve 3D modeller yukleyin.
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Urun Ekle
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Urun ara..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as "all" | "active" | "inactive")}
          >
            <option value="all">Tum Durum</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </select>

          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-10 w-10 rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="icon"
              className="h-10 w-10 rounded-l-none"
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {filteredProducts.length} urun listeleniyor
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-video bg-muted flex items-center justify-center relative">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
                )}
                {!product.isActive && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-sm font-medium bg-black/60 px-3 py-1 rounded">
                      Pasif
                    </span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">
                    {product.category}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      stockStatusMap[product.stockStatus].className
                    }`}
                  >
                    {stockStatusMap[product.stockStatus].label}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold">
                    {product.price.toFixed(2)} TL
                  </span>
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/products/new?edit=${product.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Gorsel</th>
                    <th className="text-left p-3 font-medium">Urun Adi</th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">Kategori</th>
                    <th className="text-left p-3 font-medium">Fiyat</th>
                    <th className="text-left p-3 font-medium hidden sm:table-cell">Stok</th>
                    <th className="text-left p-3 font-medium hidden sm:table-cell">Durum</th>
                    <th className="text-right p-3 font-medium">Islemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="object-cover w-full h-full rounded"
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                          {product.description}
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">{product.price.toFixed(2)} TL</td>
                      <td className="p-3 hidden sm:table-cell">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            stockStatusMap[product.stockStatus].className
                          }`}
                        >
                          {stockStatusMap[product.stockStatus].label}
                        </span>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            product.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {product.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/products/new?edit=${product.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Aramanizla eslesen urun bulunamadi.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
