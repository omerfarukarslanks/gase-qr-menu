"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useIngredients,
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
} from "@/hooks/use-ingredients";
import { useCurrentStore } from "@/hooks/use-current-store";

const INGREDIENT_TYPES = [
  { value: "", label: "Tumu" },
  { value: "VEGETABLE", label: "Sebze" },
  { value: "FRUIT", label: "Meyve" },
  { value: "MEAT", label: "Et" },
  { value: "SEAFOOD", label: "Deniz Urunleri" },
  { value: "DAIRY", label: "Sut Urunleri" },
  { value: "GRAIN", label: "Tahil" },
  { value: "SPICE", label: "Baharat" },
  { value: "OIL", label: "Yag" },
  { value: "SAUCE", label: "Sos" },
  { value: "OTHER", label: "Diger" },
];

interface IngredientForm {
  name: string;
  type: string;
  stockQuantity: number;
  minStockLevel: number;
}

const emptyForm: IngredientForm = {
  name: "",
  type: "OTHER",
  stockQuantity: 0,
  minStockLevel: 0,
};

export default function IngredientsPage() {
  const { activeStoreId, activeStore } = useCurrentStore();
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useIngredients(activeStoreId ?? "", {
    page,
    type: typeFilter || undefined,
    search: search || undefined,
  });
  const createIngredient = useCreateIngredient();
  const updateIngredient = useUpdateIngredient();
  const deleteIngredient = useDeleteIngredient();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<IngredientForm>(emptyForm);

  const ingredients = data?.data ?? [];
  const meta = data?.meta;

  function handleOpenCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function handleEdit(ingredient: {
    id: string;
    name: string;
    type: string;
    stockQuantity: number;
    minStockLevel: number;
  }) {
    setEditingId(ingredient.id);
    setForm({
      name: ingredient.name,
      type: ingredient.type,
      stockQuantity: ingredient.stockQuantity,
      minStockLevel: ingredient.minStockLevel,
    });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeStoreId) return;
    if (editingId) {
      updateIngredient.mutate(
        {
          id: editingId,
          name: form.name,
          type: form.type,
          stockQuantity: form.stockQuantity,
          minStockLevel: form.minStockLevel,
        },
        { onSuccess: () => handleCancel() }
      );
    } else {
      createIngredient.mutate(
        {
          storeId: activeStoreId,
          name: form.name,
          type: form.type,
          stockQuantity: form.stockQuantity,
          minStockLevel: form.minStockLevel,
        },
        { onSuccess: () => handleCancel() }
      );
    }
  }

  function handleDelete(id: string) {
    if (confirm("Bu malzemeyi silmek istediginize emin misiniz?")) {
      deleteIngredient.mutate(id);
    }
  }

  function getTypeLabel(type: string) {
    return INGREDIENT_TYPES.find((t) => t.value === type)?.label ?? type;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Malzemeler</h1>
          <p className="text-muted-foreground">
            {activeStore
              ? `${activeStore.name} icin malzeme ve stok bilgilerini yonetin.`
              : "Aktif magaza secimi bekleniyor."}
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Malzeme
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? "Malzemeyi Duzenle" : "Yeni Malzeme Ekle"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Malzeme Adi</label>
                <Input
                  placeholder="orn. Domates"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tur</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {INGREDIENT_TYPES.filter((t) => t.value !== "").map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Stok Miktari</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.stockQuantity}
                  onChange={(e) =>
                    setForm({ ...form, stockQuantity: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Min. Stok Seviyesi</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.minStockLevel}
                  onChange={(e) =>
                    setForm({ ...form, minStockLevel: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
                <Button
                  type="submit"
                  disabled={createIngredient.isPending || updateIngredient.isPending}
                >
                  {editingId ? "Guncelle" : "Ekle"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Iptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Malzeme ara..."
            className="pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {INGREDIENT_TYPES.map((t) => (
            <Button
              key={t.value}
              variant={typeFilter === t.value ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTypeFilter(t.value);
                setPage(1);
              }}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Malzeme Listesi</CardTitle>
          <CardDescription>
            Tanimli tum malzemeler ve stok durumlari.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Yukleniyor...</p>
          ) : !activeStoreId ? (
            <p className="text-sm text-muted-foreground">
              Devam etmek icin bir magaza secin.
            </p>
          ) : ingredients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henuz malzeme eklenmemis. &quot;Yeni Malzeme&quot; butonuna
              tiklayarak baslayabilirsiniz.
            </p>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Malzeme Adi</th>
                    <th className="pb-3 font-medium">Tur</th>
                    <th className="pb-3 font-medium text-right">Stok Miktari</th>
                    <th className="pb-3 font-medium text-right">Min. Stok</th>
                    <th className="pb-3 font-medium text-center">Durum</th>
                    <th className="pb-3 font-medium text-right">Islemler</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ingredient) => {
                    const isLowStock =
                      ingredient.stockQuantity <= ingredient.minStockLevel;
                    return (
                      <tr key={ingredient.id} className="border-b last:border-0">
                        <td className="py-3 text-sm font-medium">{ingredient.name}</td>
                        <td className="py-3 text-sm">{getTypeLabel(ingredient.type)}</td>
                        <td className="py-3 text-sm text-right">
                          <span className={isLowStock ? "text-destructive font-medium" : ""}>
                            {ingredient.stockQuantity}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-right">
                          {ingredient.minStockLevel}
                        </td>
                        <td className="py-3 text-center">
                          {isLowStock ? (
                            <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                              Dusuk Stok
                            </span>
                          ) : ingredient.isActive ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                              Pasif
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(ingredient)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(ingredient.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Toplam {meta.total} malzeme, Sayfa {meta.page} / {meta.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Onceki
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage(page + 1)}
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
