"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import {
  useUnits,
  useCreateUnit,
  useUpdateUnit,
  useDeleteUnit,
} from "@/hooks/use-units";
import { useCurrentStore } from "@/hooks/use-current-store";

interface UnitForm {
  name: string;
  abbreviation: string;
}

const emptyForm: UnitForm = { name: "", abbreviation: "" };

export default function UnitsPage() {
  const { activeStoreId, activeStore } = useCurrentStore();
  const { data: units, isLoading } = useUnits(activeStoreId ?? "");
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const deleteUnit = useDeleteUnit();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UnitForm>(emptyForm);

  function handleOpenCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function handleEdit(unit: { id: string; name: string; abbreviation: string }) {
    setEditingId(unit.id);
    setForm({ name: unit.name, abbreviation: unit.abbreviation });
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
      updateUnit.mutate(
        { id: editingId, name: form.name, abbreviation: form.abbreviation },
        { onSuccess: () => handleCancel() }
      );
    } else {
      createUnit.mutate(
        { storeId: activeStoreId, name: form.name, abbreviation: form.abbreviation },
        { onSuccess: () => handleCancel() }
      );
    }
  }

  function handleDelete(id: string) {
    if (confirm("Bu birimi silmek istediginize emin misiniz?")) {
      deleteUnit.mutate(id);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Birimler"
        description={
          activeStore
            ? `${activeStore.name} icin olcu birimlerini yonetin.`
            : "Aktif magaza secimi bekleniyor."
        }
        action={
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni birim
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
        title={editingId ? "Birimi duzenle" : "Yeni birim ekle"}
        description="Olcu birimlerini tek akista olusturun veya guncelleyin."
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Birim adi</label>
              <Input
                placeholder="orn. Kilogram"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kisaltma</label>
              <Input
                placeholder="orn. kg"
                value={form.abbreviation}
                onChange={(event) =>
                  setForm({ ...form, abbreviation: event.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="sticky bottom-0 z-10 -mx-2 rounded-[1.4rem] border border-border/80 bg-background/92 p-3 shadow-[var(--card-shadow-hover)] backdrop-blur lg:mx-0">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="submit"
                disabled={createUnit.isPending || updateUnit.isPending}
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

      <Card>
        <CardHeader>
          <CardTitle>Birim listesi</CardTitle>
          <CardDescription>Tanimli tum olcu birimleri.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Yukleniyor...</p>
          ) : !activeStoreId ? (
            <p className="text-sm text-muted-foreground">
              Devam etmek icin bir magaza secin.
            </p>
          ) : !units || units.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henuz birim eklenmemis. "Yeni Birim" butonuna tiklayarak baslayabilirsiniz.
            </p>
          ) : (
            <ResponsiveDataTable
              data={units}
              getKey={(unit) => unit.id}
              columns={[
                {
                  header: "Birim adi",
                  cell: (unit) => <span className="font-medium">{unit.name}</span>,
                },
                {
                  header: "Kisaltma",
                  cell: (unit) => <span className="font-mono">{unit.abbreviation}</span>,
                },
                {
                  header: "Islemler",
                  className: "text-right",
                  cell: (unit) => (
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(unit)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(unit.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              mobileCard={(unit) => (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{unit.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {unit.abbreviation}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(unit)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(unit.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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
