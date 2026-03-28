"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MenuQrCard } from "@/components/admin/menu-qr-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/hooks/use-categories";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useMenu, useUpdateMenu } from "@/hooks/use-menus";

interface MenuEditorProps {
  menuId: string;
  standalone?: boolean;
  onDone?: () => void;
  onCancel?: () => void;
}

interface MenuFormState {
  name: string;
  description: string;
  isActive: boolean;
  categoryIds: string[];
}

const emptyForm: MenuFormState = {
  name: "",
  description: "",
  isActive: true,
  categoryIds: [],
};

export function MenuEditor({
  menuId,
  standalone = false,
  onDone,
  onCancel,
}: MenuEditorProps) {
  const router = useRouter();
  const { activeStoreId } = useCurrentStore();
  const { data: menu, isLoading, isError } = useMenu(menuId);
  const { data: categories = [] } = useCategories(activeStoreId ?? "");
  const updateMenu = useUpdateMenu();

  const [form, setForm] = useState<MenuFormState>(emptyForm);

  useEffect(() => {
    if (!menu) {
      return;
    }

    setForm({
      name: menu.name,
      description: menu.description ?? "",
      isActive: menu.isActive,
      categoryIds: menu.categoryIds,
    });
  }, [menu]);

  const selectedCategoryDetails = useMemo(
    () => categories.filter((category) => form.categoryIds.includes(category.id)),
    [categories, form.categoryIds]
  );

  const handleClose = () => {
    if (onCancel) {
      onCancel();
      return;
    }

    router.push("/admin/menus");
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();

    updateMenu.mutate(
      {
        id: menuId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        isActive: form.isActive,
        categoryIds: form.categoryIds,
      },
      {
        onSuccess: () => {
          if (onDone) {
            onDone();
            return;
          }

          router.refresh();
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Menu bilgileri yukleniyor...
      </div>
    );
  }

  if (isError || !menu) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={handleClose}>
          Menulere don
        </Button>
        <p className="text-sm text-destructive">
          Menu bulunamadi veya backend baglantisi hatasi olustu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {standalone ? (
        <AdminPageHeader
          title={menu.name}
          description={`QR token: ${menu.qrToken}`}
          action={
            <Button variant="outline" onClick={handleClose}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Menulere don
            </Button>
          }
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Menu bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={handleSave}
              onInvalidCapture={(event) =>
                event.currentTarget.classList.add("form-validation-submitted")
              }
            >
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
                <textarea
                  className="flex min-h-[112px] w-full rounded-[1rem] border border-input bg-background px-3 py-3 text-sm"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex items-center gap-3 rounded-[1rem] border border-border bg-secondary/40 px-4 py-3">
                <label className="text-sm font-medium">Aktif</label>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isActive: event.target.checked,
                    }))
                  }
                />
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

              <div className="sticky bottom-3 z-10 -mx-2 rounded-[1.4rem] border border-border/80 bg-background/92 p-3 shadow-[var(--card-shadow-hover)] backdrop-blur lg:static lg:mx-0 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="submit" disabled={updateMenu.isPending}>
                    {updateMenu.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Degisiklikleri kaydet
                  </Button>
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Iptal
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR ve onizleme</CardTitle>
          </CardHeader>
          <CardContent>
            <MenuQrCard qrToken={menu.qrToken} menuName={menu.name} size={224} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Secili kategoriler</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedCategoryDetails.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henuz kategori secilmedi.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {selectedCategoryDetails.map((category) => {
                const menuCategory = menu.categories.find((item) => item.id === category.id);

                return (
                  <div key={category.id} className="rounded-[1rem] border p-4">
                    <div className="font-medium">{category.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {menuCategory?.products?.length ?? 0} urun su anda bu kategori altinda
                      gorunuyor.
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
