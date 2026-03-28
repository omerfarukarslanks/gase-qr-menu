"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useCategories } from "@/hooks/use-categories";
import { useDeleteProduct, useProducts } from "@/hooks/use-products";
import { formatCurrency } from "@/lib/utils";

export default function ProductsPage() {
  const { activeStoreId, activeStore } = useCurrentStore();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);

  const { data: categories = [] } = useCategories(activeStoreId ?? "");
  const { data, isLoading, isError } = useProducts(activeStoreId ?? "", {
    page,
    pageSize: 12,
    categoryId: categoryId || undefined,
    search: search || undefined,
  });
  const deleteProduct = useDeleteProduct();

  const products = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Urunler</h1>
          <p className="text-muted-foreground">
            {activeStore
              ? `${activeStore.name} icin urun listesini yonetin.`
              : "Aktif magaza secimi bekleniyor."}
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button disabled={!activeStoreId}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni urun
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-[1fr_240px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Urun ara..."
            />
          </div>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tum kategoriler</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Urun listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {!activeStoreId ? (
            <p className="text-sm text-muted-foreground">
              Devam etmek icin bir magaza secin.
            </p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Urunler yukleniyor...</p>
          ) : isError ? (
            <p className="text-sm text-destructive">
              Urunler alinamadi. Backend baglantisini kontrol edin.
            </p>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henuz urun bulunmuyor. Ilk urunu ekleyerek baslayabilirsiniz.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Urun</th>
                      <th className="pb-3 font-medium">Kategori</th>
                      <th className="pb-3 font-medium">Fiyat</th>
                      <th className="pb-3 font-medium">Durum</th>
                      <th className="pb-3 text-right font-medium">Islemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-muted">
                              {product.coverImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={product.coverImage}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">IMG</span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {product.description || product.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">{product.category?.name || "-"}</td>
                        <td className="py-3">{formatCurrency(product.price)}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              product.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {product.isActive ? "Aktif" : "Pasif"}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex justify-end gap-2">
                            <Link href={`/admin/products/new?edit=${product.id}`}>
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (window.confirm("Bu urun pasife cekilsin mi?")) {
                                  deleteProduct.mutate(product.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {meta && meta.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Toplam {meta.total} urun, sayfa {meta.page} / {meta.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((current) => current - 1)}
                    >
                      Onceki
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Sonraki
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
