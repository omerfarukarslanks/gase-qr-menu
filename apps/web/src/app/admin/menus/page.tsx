"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { MenuEditor } from "@/components/admin/menu-editor";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MenuQrCard } from "@/components/admin/menu-qr-card";
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
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [form, setForm] = useState<MenuFormState>(emptyForm);

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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Menuler"
        description={
          activeStore
            ? `${activeStore.name} icin QR menu akisini yonetin.`
            : "Aktif magaza secimi bekleniyor."
        }
        action={
          <Button onClick={() => setShowForm(true)} disabled={!activeStoreId}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni menu
          </Button>
        }
      />

      <AdminDrawer
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            resetForm();
          }
        }}
        title="Yeni menu"
        description="QR menunun temel bilgilerini drawer icinden olusturun."
      >
        <form className="space-y-6" onSubmit={handleCreate}>
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
                  className="flex items-center gap-2 rounded-[1rem] border px-3 py-3 text-sm"
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

          <div className="sticky bottom-0 z-10 -mx-2 rounded-[1.4rem] border border-border/80 bg-background/92 p-3 shadow-[var(--card-shadow-hover)] backdrop-blur lg:mx-0">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={createMenu.isPending}>
                Olustur
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Iptal
              </Button>
            </div>
          </div>
        </form>
      </AdminDrawer>

      <AdminDrawer
        open={Boolean(editingMenuId)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingMenuId(null);
          }
        }}
        title="Menu duzenle"
        description="Menu detaylarini, kategori secimlerini ve QR onizlemesini drawer icinden yonetin."
        contentClassName="lg:w-[min(56rem,calc(100vw-2rem))]"
      >
        {editingMenuId ? (
          <MenuEditor
            menuId={editingMenuId}
            onDone={() => setEditingMenuId(null)}
            onCancel={() => setEditingMenuId(null)}
          />
        ) : null}
      </AdminDrawer>

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
            <div className="grid gap-4 xl:grid-cols-2">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingMenuId(menu.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
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

                  <div className="mt-4">
                    <MenuQrCard
                      qrToken={menu.qrToken}
                      menuName={menu.name}
                      size={156}
                    />
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
