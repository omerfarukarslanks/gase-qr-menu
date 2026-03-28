"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/hooks/use-categories";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useCreateMenu, useDeleteMenu, useMenus } from "@/hooks/use-menus";

interface MenuFormState {
  name: string;
  description: string;
  categoryIds: string[];
}

const emptyForm: MenuFormState = {
  name: "",
  description: "",
  categoryIds: [],
};

export default function MenusPage() {
  const { activeStoreId, activeStore } = useCurrentStore();
  const { data: menus = [], isLoading, isError } = useMenus(activeStoreId ?? "");
  const { data: categories = [] } = useCategories(activeStoreId ?? "");
  const createMenu = useCreateMenu();
  const deleteMenu = useDeleteMenu();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MenuFormState>(emptyForm);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const resetForm = () => {
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();

    if (!activeStoreId) {
      return;
    }

    createMenu.mutate(
      {
        storeId: activeStoreId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        categoryIds: form.categoryIds,
      },
      {
        onSuccess: resetForm,
      }
    );
  };

  const copyUrl = async (token: string) => {
    const url = `${window.location.origin}/m/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(token);
    window.setTimeout(() => setCopiedToken(null), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menuler</h1>
          <p className="text-muted-foreground">
            {activeStore
              ? `${activeStore.name} icin QR menu akisini yonetin.`
              : "Aktif magaza secimi bekleniyor."}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={!activeStoreId}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni menu
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Yeni menu</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Menu adi</label>
                  <Input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Aciklama</label>
                  <Input
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Opsiyonel aciklama"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Kategori secimi</label>
                <div className="grid gap-2 md:grid-cols-2">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={form.categoryIds.includes(category.id)}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            categoryIds: event.target.checked
                              ? [...current.categoryIds, category.id]
                              : current.categoryIds.filter((id) => id !== category.id),
                          }))
                        }
                      />
                      <span>{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMenu.isPending}>
                  Olustur
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Iptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Menu listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {!activeStoreId ? (
            <p className="text-sm text-muted-foreground">
              Devam etmek icin bir magaza secin.
            </p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Menuler yukleniyor...</p>
          ) : isError ? (
            <p className="text-sm text-destructive">
              Menuler alinamadi. Backend baglantisini kontrol edin.
            </p>
          ) : menus.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henuz menu bulunmuyor. Ilk menuyu olusturarak baslayabilirsiniz.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {menus.map((menu) => (
                <div key={menu.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">{menu.name}</h2>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            menu.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {menu.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {menu.description || "Aciklama yok"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Link href={`/admin/menus/${menu.id}`}>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (window.confirm("Bu menu pasife cekilsin mi?")) {
                            deleteMenu.mutate(menu.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="text-xl font-semibold">{menu.categoryCount}</div>
                      <div className="text-xs text-muted-foreground">Kategori</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="text-xl font-semibold">{menu.productCount}</div>
                      <div className="text-xs text-muted-foreground">Urun</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="truncate text-xs font-medium">{menu.qrToken}</div>
                      <div className="text-xs text-muted-foreground">QR token</div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-md bg-muted/50 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-muted-foreground">
                        /m/{menu.qrToken}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => copyUrl(menu.qrToken)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Link href={`/m/${menu.qrToken}`} target="_blank">
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                    {copiedToken === menu.qrToken && (
                      <p className="mt-2 text-xs text-green-600">URL kopyalandi.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
