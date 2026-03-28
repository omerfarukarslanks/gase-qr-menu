"use client";

import { useState } from "react";
import { Plus, AlertTriangle, ArrowDownCircle, ArrowUpCircle, RefreshCw } from "lucide-react";
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
  useStockMovements,
  useLowStockAlerts,
  useCreateStockMovement,
} from "@/hooks/use-stock";
import { formatDate } from "@/lib/utils";
import { useCurrentStore } from "@/hooks/use-current-store";

type MovementType = "IN" | "OUT" | "ADJUSTMENT";

const MOVEMENT_TYPES: { value: MovementType; label: string }[] = [
  { value: "IN", label: "Giris" },
  { value: "OUT", label: "Cikis" },
  { value: "ADJUSTMENT", label: "Duzeltme" },
];

interface MovementForm {
  ingredientId: string;
  type: MovementType;
  quantity: number;
  reason: string;
}

const emptyForm: MovementForm = {
  ingredientId: "",
  type: "IN",
  quantity: 0,
  reason: "",
};

export default function StockPage() {
  const { activeStoreId, activeStore } = useCurrentStore();
  const [page, setPage] = useState(1);
  const { data: movementsData, isLoading: movementsLoading } = useStockMovements(activeStoreId ?? "", { page });
  const { data: alerts, isLoading: alertsLoading } = useLowStockAlerts(activeStoreId ?? "");
  const createMovement = useCreateStockMovement();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MovementForm>(emptyForm);

  const movements = movementsData?.data ?? [];
  const meta = movementsData?.meta;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeStoreId) return;
    createMovement.mutate(
      {
        storeId: activeStoreId,
        ingredientId: form.ingredientId,
        type: form.type,
        quantity: form.quantity,
        reason: form.reason || undefined,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm(emptyForm);
        },
      }
    );
  }

  function getMovementIcon(type: MovementType) {
    switch (type) {
      case "IN":
        return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
      case "OUT":
        return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
      case "ADJUSTMENT":
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
    }
  }

  function getMovementLabel(type: MovementType) {
    return MOVEMENT_TYPES.find((t) => t.value === type)?.label ?? type;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stok Yonetimi</h1>
          <p className="text-muted-foreground">
            {activeStore
              ? `${activeStore.name} icin stok hareketlerini izleyin.`
              : "Aktif magaza secimi bekleniyor."}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Stok Hareketi Ekle
        </Button>
      </div>

      {/* Low Stock Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Dusuk Stok Uyarilari
          </CardTitle>
          <CardDescription>
            Minimum stok seviyesinin altina dusen malzemeler.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <p className="text-sm text-muted-foreground">Yukleniyor...</p>
          ) : !alerts || alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Dusuk stok uyarisi bulunmuyor. Tum malzemeler yeterli seviyede.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {alerts.map((alert) => (
                <div
                  key={alert.ingredientId}
                  className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{alert.ingredientName}</p>
                    <p className="text-xs text-muted-foreground">
                      Min: {alert.minStockLevel} {alert.unitAbbreviation}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-destructive">
                      {alert.currentStock}
                    </p>
                    <p className="text-xs text-muted-foreground">{alert.unitAbbreviation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Movement Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Yeni Stok Hareketi</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Malzeme ID</label>
                <Input
                  placeholder="Malzeme ID girin"
                  value={form.ingredientId}
                  onChange={(e) => setForm({ ...form, ingredientId: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hareket Tipi</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as MovementType })}
                >
                  {MOVEMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Miktar</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Aciklama</label>
                <Input
                  placeholder="Opsiyonel aciklama"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
                <Button type="submit" disabled={createMovement.isPending}>
                  Kaydet
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setForm(emptyForm);
                  }}
                >
                  Iptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stock Movement History */}
      <Card>
        <CardHeader>
          <CardTitle>Stok Hareket Gecmisi</CardTitle>
          <CardDescription>
            Tum stok giris, cikis ve duzeltme kayitlari.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {movementsLoading ? (
            <p className="text-sm text-muted-foreground">Yukleniyor...</p>
          ) : !activeStoreId ? (
            <p className="text-sm text-muted-foreground">
              Devam etmek icin bir magaza secin.
            </p>
          ) : movements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henuz stok hareketi bulunmuyor.
            </p>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Tarih</th>
                    <th className="pb-3 font-medium">Malzeme</th>
                    <th className="pb-3 font-medium">Tip</th>
                    <th className="pb-3 font-medium text-right">Miktar</th>
                    <th className="pb-3 font-medium">Aciklama</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => (
                    <tr key={movement.id} className="border-b last:border-0">
                      <td className="py-3 text-sm text-muted-foreground">
                        {formatDate(movement.createdAt)}
                      </td>
                      <td className="py-3 text-sm font-medium">
                        {movement.ingredientName}
                      </td>
                      <td className="py-3 text-sm">
                        <span className="inline-flex items-center gap-1">
                          {getMovementIcon(movement.type as MovementType)}
                          {getMovementLabel(movement.type as MovementType)}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-right font-mono">
                        {movement.type === "OUT" ? "-" : "+"}
                        {movement.quantity}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {movement.reason || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Toplam {meta.total} hareket, Sayfa {meta.page} / {meta.totalPages}
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
