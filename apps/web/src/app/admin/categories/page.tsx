"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  type Category,
  useCategories,
  useCreateCategory,
  useDeleteCategory,
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
  const deleteCategory = useDeleteCategory();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kategoriler</h1>
          <p className="text-muted-foreground">
            {activeStore
              ? `${activeStore.name} icin menu kategorilerini yonetin.`
              : "Aktif magaza secimi bekleniyor."}
          </p>
        </div>
        <Button onClick={openCreate} disabled={!activeStoreId}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni kategori
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>
              {editingCategory ? "Kategori duzenle" : "Yeni kategori"}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
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
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.parentId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, parentId: event.target.value }))
                  }
                >
                  <option value="">Ana kategori</option>
                  {flatCategories
                    .filter((category) => category.id !== editingCategory?.id)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {`${"  ".repeat(category.depth)}${category.name}`}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
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
                    setForm((current) => ({
                      ...current,
                      sortOrder: event.target.value,
                    }))
                  }
                />
              </div>
              {editingCategory && (
                <div className="flex items-center gap-3 pt-6">
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
              )}
              <div className="md:col-span-2 flex gap-2">
                <Button
                  type="submit"
                  disabled={createCategory.isPending || updateCategory.isPending}
                >
                  {editingCategory ? "Guncelle" : "Kaydet"}
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
          <CardTitle>Kategori listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {!activeStoreId ? (
            <p className="text-sm text-muted-foreground">
              Devam etmek icin bir magaza secin.
            </p>
          ) : isLoading ? (
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Kategori</th>
                    <th className="pb-3 font-medium">Slug</th>
                    <th className="pb-3 font-medium">Durum</th>
                    <th className="pb-3 font-medium">Sira</th>
                    <th className="pb-3 text-right font-medium">Islemler</th>
                  </tr>
                </thead>
                <tbody>
                  {flatCategories.map((category) => (
                    <tr key={category.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div style={{ paddingLeft: `${category.depth * 16}px` }}>
                          <div className="font-medium">{category.name}</div>
                          {category.description && (
                            <div className="text-xs text-muted-foreground">
                              {category.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground">{category.slug}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            category.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {category.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="py-3">{category.sortOrder}</td>
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (window.confirm("Bu kategori pasife cekilsin mi?")) {
                                deleteCategory.mutate(category.id);
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
