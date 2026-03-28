"use client";

import { useState } from "react";
import { Pencil, Plus, Search } from "lucide-react";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ResponsiveDataTable } from "@/components/admin/responsive-data-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Switch } from "@/components/ui/switch";
import {
  useIngredients,
  useCreateIngredient,
  useUpdateIngredient,
} from "@/hooks/use-ingredients";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useUnits } from "@/hooks/use-units";

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
  unitId: string;
  stockQuantity: number;
  minStockLevel: number;
}

const emptyForm: IngredientForm = {
  name: "",
  type: "OTHER",
  unitId: "",
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
  const { data: units = [] } = useUnits(activeStoreId ?? "");
  const createIngredient = useCreateIngredient();
  const updateIngredient = useUpdateIngredient();

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
    unitId?: string | null;
    unit?: { abbreviation: string } | null;
    stockQuantity: number;
    minStockLevel: number;
  }) {
    setEditingId(ingredient.id);
    setForm({
      name: ingredient.name,
      type: ingredient.type,
      unitId: ingredient.unitId ?? "",
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

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!activeStoreId) return;

    if (editingId) {
      updateIngredient.mutate(
        {
          id: editingId,
          name: form.name,
          type: form.type,
          unitId: form.unitId || undefined,
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
          unitId: form.unitId || undefined,
          stockQuantity: form.stockQuantity,
          minStockLevel: form.minStockLevel,
        },
        { onSuccess: () => handleCancel() }
      );
    }
  }

  function getTypeLabel(type: string) {
    return INGREDIENT_TYPES.find((item) => item.value === type)?.label ?? type;
  }

  function handleToggleActive(ingredient: {
    id: string;
    isActive: boolean;
  }) {
    updateIngredient.mutate({
      id: ingredient.id,
      isActive: !ingredient.isActive,
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Malzemeler"
        description={
          activeStore
            ? `${activeStore.name} icin malzeme ve stok bilgilerini yonetin.`
            : "Aktif magaza secimi bekleniyor."
        }
        action={
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni malzeme
          </Button>
        }
      />

      <AdminDrawer
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            handleCancel();
          }
        }}
        title={editingId ? "Malzemeyi duzenle" : "Yeni malzeme ekle"}
        description="Malzeme, tur ve stok esiklerini tek panelden yonetin."
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
          onInvalidCapture={(event) =>
            event.currentTarget.classList.add("form-validation-submitted")
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Malzeme adi</label>
              <Input
                placeholder="orn. Domates"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tur</label>
              <SearchableSelect
                options={INGREDIENT_TYPES.filter((item) => item.value !== "").map((item) => ({
                  value: item.value,
                  label: item.label,
                }))}
                value={form.type}
                onChange={(value) => setForm({ ...form, type: String(value) })}
                searchPlaceholder="Tur ara..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Stok birimi</label>
              <SearchableSelect
                options={units.map((unit) => ({
                  value: unit.id,
                  label: `${unit.name} (${unit.abbreviation})`,
                  keywords: [unit.abbreviation],
                }))}
                value={form.unitId}
                onChange={(value) => setForm({ ...form, unitId: String(value) })}
                placeholder="Birim secin"
                searchPlaceholder="Birim ara..."
                emptyMessage="Birim bulunamadi."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Stok miktari</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.stockQuantity}
                onChange={(event) =>
                  setForm({
                    ...form,
                    stockQuantity: parseFloat(event.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Min. stok seviyesi</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.minStockLevel}
                onChange={(event) =>
                  setForm({
                    ...form,
                    minStockLevel: parseFloat(event.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="sticky bottom-0 z-10 -mx-2 rounded-[1.4rem] border border-border/80 bg-background/92 p-3 shadow-[var(--card-shadow-hover)] backdrop-blur lg:mx-0">
            <div className="flex flex-col gap-2 sm:flex-row">
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
          </div>
        </form>
      </AdminDrawer>

      <div className="flex flex-col gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Malzeme ara..."
            className="pl-10"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {INGREDIENT_TYPES.map((item) => (
            <Button
              key={item.value}
              variant={typeFilter === item.value ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTypeFilter(item.value);
                setPage(1);
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Malzeme listesi</CardTitle>
          <CardDescription>Tanimli tum malzemeler ve stok durumlari.</CardDescription>
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
              Henuz malzeme eklenmemis. "Yeni Malzeme" butonuna tiklayarak baslayabilirsiniz.
            </p>
          ) : (
            <>
              <ResponsiveDataTable
                data={ingredients}
                getKey={(ingredient) => ingredient.id}
                columns={[
                  {
                    header: "Malzeme adi",
                    cell: (ingredient) => (
                      <span className="font-medium">{ingredient.name}</span>
                    ),
                  },
                  {
                    header: "Tur",
                    cell: (ingredient) => getTypeLabel(ingredient.type),
                  },
                  {
                    header: "Stok miktari",
                    className: "text-right",
                    cell: (ingredient) => {
                      const isLowStock =
                        ingredient.stockQuantity <= ingredient.minStockLevel;
                      const quantityLabel = ingredient.unit?.abbreviation
                        ? `${ingredient.stockQuantity} ${ingredient.unit.abbreviation}`
                        : ingredient.stockQuantity;
                      return (
                        <span className={isLowStock ? "font-medium text-destructive" : ""}>
                          {quantityLabel}
                        </span>
                      );
                    },
                  },
                  {
                    header: "Min. stok",
                    className: "text-right",
                    cell: (ingredient) =>
                      ingredient.unit?.abbreviation
                        ? `${ingredient.minStockLevel} ${ingredient.unit.abbreviation}`
                        : ingredient.minStockLevel,
                  },
                  {
                    header: "Islemler",
                    className: "text-right",
                    cell: (ingredient) => (
                      <div className="flex items-center justify-end gap-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={ingredient.isActive}
                            disabled={updateIngredient.isPending}
                            onCheckedChange={() => handleToggleActive(ingredient)}
                            aria-label={`${ingredient.name} durumunu degistir`}
                          />
                          <span
                            className={`text-xs font-medium ${
                              ingredient.stockQuantity <= ingredient.minStockLevel
                                ? "text-destructive"
                                : "text-muted-foreground"
                            }`}
                          >
                          </span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(ingredient)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    ),
                  },
                ]}
                mobileCard={(ingredient) => {
                  const isLowStock = ingredient.stockQuantity <= ingredient.minStockLevel;

                  return (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {ingredient.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {getTypeLabel(ingredient.type)}
                          </p>
                        </div>
                        {isLowStock ? (
                          <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                            Dusuk stok
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                            Aktif
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            Stok
                          </p>
                          <p className="mt-1 font-medium text-foreground">
                            {ingredient.unit?.abbreviation
                              ? `${ingredient.stockQuantity} ${ingredient.unit.abbreviation}`
                              : ingredient.stockQuantity}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            Min. stok
                          </p>
                          <p className="mt-1 font-medium text-foreground">
                            {ingredient.unit?.abbreviation
                              ? `${ingredient.minStockLevel} ${ingredient.unit.abbreviation}`
                              : ingredient.minStockLevel}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={ingredient.isActive}
                            disabled={updateIngredient.isPending}
                            onCheckedChange={() => handleToggleActive(ingredient)}
                            aria-label={`${ingredient.name} durumunu degistir`}
                          />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(ingredient)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                }}
              />

              {meta && meta.totalPages > 1 && (
                <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
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
