"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ResponsiveDataTable } from "@/components/admin/responsive-data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Switch } from "@/components/ui/switch";
import {
  type Category,
  useCategories,
  useCreateCategory,
  useUpdateCategory,
} from "@/hooks/use-categories";
import { useCurrentStore } from "@/hooks/use-current-store";

interface CategoryFormState {
  name: string;
  description: string;
  parentId: string;
  image: string;
  slug: string;
  sortOrder: string;
  isActive: boolean;
}

const emptyForm: CategoryFormState = {
  name: "",
  description: "",
  parentId: "",
  image: "",
  slug: "",
  sortOrder: "0",
  isActive: true,
};

function buildCategoryTree(items: Category[]): Category[] {
  const nodes = new Map<string, Category>();

  items.forEach((item) => {
    nodes.set(item.id, {
      ...item,
      children: [],
    });
  });

  const roots: Category[] = [];

  items.forEach((item) => {
    const node = nodes.get(item.id);

    if (!node) {
      return;
    }

    if (item.parentId && nodes.has(item.parentId)) {
      const parent = nodes.get(item.parentId);
      parent?.children?.push(node);
      return;
    }

    roots.push(node);
  });

  return roots;
}

function flattenCategories(items: Category[], depth = 0): Array<Category & { depth: number }> {
  return items.flatMap((item) => [
    { ...item, depth },
    ...flattenCategories(item.children ?? [], depth + 1),
  ]);
}

export default function CategoriesPage() {
  const { activeStoreId, activeStore } = useCurrentStore();
  const { data: categories = [], isLoading, isError } = useCategories(activeStoreId ?? "");
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const flatCategories = useMemo(
    () => flattenCategories(categoryTree),
    [categoryTree]
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingCategory(null);
    setShowForm(false);
  };

  const openCreate = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      description: category.description ?? "",
      parentId: category.parentId ?? "",
      image: category.image ?? "",
      slug: category.slug ?? "",
      sortOrder: String(category.sortOrder ?? 0),
      isActive: category.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!activeStoreId) {
      return;
    }

    const basePayload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      parentId: form.parentId || undefined,
      image: form.image.trim() || undefined,
      slug: form.slug.trim() || undefined,
      sortOrder: Number(form.sortOrder) || 0,
      translations: [
        {
          languageCode: "tr",
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        },
      ],
    };

    if (editingCategory) {
      updateCategory.mutate(
        {
          id: editingCategory.id,
          ...basePayload,
          isActive: form.isActive,
          parentId: form.parentId || null,
        },
        { onSuccess: resetForm }
      );
      return;
    }

    createCategory.mutate(
      {
        storeId: activeStoreId,
        ...basePayload,
      },
      { onSuccess: resetForm }
    );
  };

  const handleToggleActive = (category: Category) => {
    updateCategory.mutate({
      id: category.id,
      isActive: !category.isActive,
    });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Kategoriler"
        description={
          activeStore
            ? `${activeStore.name} icin menu kategorilerini yonetin.`
            : "Aktif magaza secimi bekleniyor."
        }
        action={
          <Button onClick={openCreate} disabled={!activeStoreId}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni kategori
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
        title={editingCategory ? "Kategori duzenle" : "Yeni kategori"}
        description="Kategori hiyerarsisini sag panelden hizlica yonetin."
      >
        <form
          className="space-y-6"
          onSubmit={handleSubmit}
          onInvalidCapture={(event) =>
            event.currentTarget.classList.add("form-validation-submitted")
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Kategori adi</label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Ana Yemekler"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ust kategori</label>
              <SearchableSelect
                options={[
                  { value: "", label: "Ana kategori" },
                  ...flatCategories
                    .filter((category) => category.id !== editingCategory?.id)
                    .map((category) => ({
                      value: category.id,
                      label: `${"  ".repeat(category.depth)}${category.name}`,
                      keywords: [category.name],
                    })),
                ]}
                value={form.parentId}
                onChange={(value) =>
                  setForm((current) => ({ ...current, parentId: String(value) }))
                }
                placeholder="Ana kategori"
                searchPlaceholder="Kategori ara..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Aciklama</label>
              <textarea
                className="flex min-h-[120px] w-full rounded-[1rem] border border-input bg-background px-3 py-3 text-sm"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Kategori aciklamasi"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug</label>
              <Input
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({ ...current, slug: event.target.value }))
                }
                placeholder="opsiyonel-slug"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Gorsel URL</label>
              <Input
                value={form.image}
                onChange={(event) =>
                  setForm((current) => ({ ...current, image: event.target.value }))
                }
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sira</label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sortOrder: event.target.value }))
                }
              />
            </div>
            {editingCategory && (
              <label className="flex items-center gap-3 rounded-[1rem] border border-border bg-muted/60 px-4 py-3 text-sm font-medium">
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
                Kategori aktif
              </label>
            )}
          </div>

          <div className="sticky bottom-0 z-10 -mx-2 rounded-[1.4rem] border border-border/80 bg-background/92 p-3 shadow-[var(--card-shadow-hover)] backdrop-blur lg:mx-0">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                {editingCategory ? "Guncelle" : "Olustur"}
              </Button>
              <Button variant="outline" type="button" onClick={resetForm}>
                Vazgec
              </Button>
            </div>
          </div>
        </form>
      </AdminDrawer>

      <Card>
        <CardHeader>
          <CardTitle>Kategori listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Kategoriler yukleniyor...</p>
          ) : isError ? (
            <p className="text-sm text-destructive">
              Kategoriler alinamadi. Backend baglantisini kontrol edin.
            </p>
          ) : flatCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henuz kategori yok. Ilk kategoriyi olusturarak baslayabilirsiniz.
            </p>
          ) : (
            <ResponsiveDataTable
              data={flatCategories}
              getKey={(category) => category.id}
              columns={[
                {
                  header: "Kategori",
                  cell: (category) => (
                    <div style={{ paddingLeft: `${category.depth * 16}px` }}>
                      <div className="font-medium">{category.name}</div>
                      {category.description && (
                        <div className="text-xs text-muted-foreground">
                          {category.description}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  header: "Slug",
                  cell: (category) => (
                    <span className="text-muted-foreground">{category.slug}</span>
                  ),
                },
                {
                  header: "Sira",
                  cell: (category) => category.sortOrder,
                },
                {
                  header: "Islemler",
                  className: "text-right",
                  cell: (category) => (
                    <div className="flex items-center justify-end gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={category.isActive}
                          disabled={updateCategory.isPending}
                          onCheckedChange={() => handleToggleActive(category)}
                          aria-label={`${category.name} durumunu degistir`}
                        />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              mobileCard={(category) => (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {`${"• ".repeat(category.depth)}${category.name}`}
                      </p>
                      {category.description && (
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        category.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Slug
                      </p>
                      <p className="mt-1 text-foreground">{category.slug}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Sira
                      </p>
                      <p className="mt-1 text-foreground">{category.sortOrder}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={category.isActive}
                        disabled={updateCategory.isPending}
                        onCheckedChange={() => handleToggleActive(category)}
                        aria-label={`${category.name} durumunu degistir`}
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
