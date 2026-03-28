"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Loader2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/hooks/use-categories";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useMenu, useMenuQrCode, useUpdateMenu } from "@/hooks/use-menus";

interface MenuDetailPageProps {
  params: { id: string };
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

export default function MenuDetailPage({ params }: MenuDetailPageProps) {
  const router = useRouter();
  const { activeStoreId } = useCurrentStore();
  const { data: menu, isLoading, isError } = useMenu(params.id);
  const { data: qrData, isLoading: qrLoading } = useMenuQrCode(params.id);
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

  const publicUrl =
    qrData?.url ??
    (menu
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/m/${menu.qrToken}`
      : "");

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();

    updateMenu.mutate(
      {
        id: params.id,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        isActive: form.isActive,
        categoryIds: form.categoryIds,
      },
      {
        onSuccess: () => {
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
        <Link href="/admin/menus">
          <Button variant="outline">Menulere don</Button>
        </Link>
        <p className="text-sm text-destructive">
          Menu bulunamadi veya backend baglantisi hatasi olustu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/menus">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{menu.name}</h1>
          <p className="text-muted-foreground">
            QR token: <span className="font-mono">{menu.qrToken}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Menu bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSave}>
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
                  className="flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex items-center gap-3">
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
              <Button type="submit" disabled={updateMenu.isPending}>
                {updateMenu.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Degisiklikleri kaydet
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR ve onizleme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center rounded-xl border bg-white p-4">
              {qrLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  QR olusturuluyor...
                </div>
              ) : qrData?.qrCode ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrData.qrCode}
                  alt={`${menu.name} QR`}
                  className="h-56 w-56 object-contain"
                />
              ) : (
                <div className="text-sm text-muted-foreground">QR verisi yok.</div>
              )}
            </div>

            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <div className="truncate font-mono">{publicUrl}</div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(publicUrl)}
              >
                <Copy className="mr-2 h-4 w-4" />
                URL kopyala
              </Button>
              <Link href={`/m/${menu.qrToken}`} target="_blank">
                <Button type="button" variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Menuyu ac
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Secili kategoriler</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedCategoryDetails.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henuz kategori secilmedi.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {selectedCategoryDetails.map((category) => {
                const menuCategory = menu.categories.find((item) => item.id === category.id);

                return (
                  <div key={category.id} className="rounded-md border p-4">
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
