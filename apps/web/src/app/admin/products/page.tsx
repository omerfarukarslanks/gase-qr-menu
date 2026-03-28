"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ResponsiveDataTable } from "@/components/admin/responsive-data-table";
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
      <AdminPageHeader
        title="Urunler"
        description={
          activeStore
            ? `${activeStore.name} icin urun listesini yonetin.`
            : "Aktif magaza secimi bekleniyor."
        }
        action={
          <Link href="/admin/products/new">
            <Button disabled={!activeStoreId} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Yeni urun
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-[minmax(0,1fr)_240px]">
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
            className="flex h-11 w-full rounded-[1rem] border border-input bg-background px-3 py-2 text-sm"
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
              <ResponsiveDataTable
                data={products}
                getKey={(product) => product.id}
                columns={[
                  {
                    header: "Urun",
                    cell: (product) => (
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
                    ),
                  },
                  {
                    header: "Kategori",
                    cell: (product) => product.category?.name || "-",
                  },
                  {
                    header: "Fiyat",
                    cell: (product) => formatCurrency(product.price),
                  },
                  {
                    header: "Durum",
                    cell: (product) => (
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          product.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {product.isActive ? "Aktif" : "Pasif"}
                      </span>
                    ),
                  },
                  {
                    header: "Islemler",
                    className: "text-right",
                    cell: (product) => (
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
                    ),
                  },
                ]}
                mobileCard={(product) => (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] bg-muted">
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
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{product.name}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                          {product.description || product.slug}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Kategori
                        </p>
                        <p className="mt-1 font-medium text-foreground">
                          {product.category?.name || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Fiyat
                        </p>
                        <p className="mt-1 font-medium text-foreground">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          product.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {product.isActive ? "Aktif" : "Pasif"}
                      </span>
                      <div className="flex gap-1">
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
                    </div>
                  </div>
                )}
              />

              {meta && meta.totalPages > 1 && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
