"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUnits, useCreateUnit, useUpdateUnit, useDeleteUnit } from "@/hooks/use-units";
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Birimler</h1>
          <p className="text-muted-foreground">
            {activeStore
              ? `${activeStore.name} icin olcu birimlerini yonetin.`
              : "Aktif magaza secimi bekleniyor."}
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Birim
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Birimi Duzenle" : "Yeni Birim Ekle"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Birim Adi</label>
                <Input
                  placeholder="orn. Kilogram"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="w-32 space-y-2">
                <label className="text-sm font-medium">Kisaltma</label>
                <Input
                  placeholder="orn. kg"
                  value={form.abbreviation}
                  onChange={(e) => setForm({ ...form, abbreviation: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createUnit.isPending || updateUnit.isPending}>
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

      <Card>
        <CardHeader>
          <CardTitle>Birim Listesi</CardTitle>
          <CardDescription>
            Tanimli tum olcu birimleri.
          </CardDescription>
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
              Henuz birim eklenmemis. &quot;Yeni Birim&quot; butonuna tiklayarak baslayabilirsiniz.
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Birim Adi</th>
                  <th className="pb-3 font-medium">Kisaltma</th>
                  <th className="pb-3 font-medium text-right">Islemler</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id} className="border-b last:border-0">
                    <td className="py-3 text-sm">{unit.name}</td>
                    <td className="py-3 text-sm font-mono">{unit.abbreviation}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(unit)}
                        >
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
