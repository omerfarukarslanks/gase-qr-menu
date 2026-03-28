"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  RefreshCw,
} from "lucide-react";
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
  useCreateStockMovement,
  useLowStockAlerts,
  useStockMovements,
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
  const { data: movementsData, isLoading: movementsLoading } = useStockMovements(
    activeStoreId ?? "",
    { page }
  );
  const { data: alerts, isLoading: alertsLoading } = useLowStockAlerts(activeStoreId ?? "");
  const createMovement = useCreateStockMovement();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MovementForm>(emptyForm);

  const movements = movementsData?.data ?? [];
  const meta = movementsData?.meta;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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
    return MOVEMENT_TYPES.find((item) => item.value === type)?.label ?? type;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Stok yonetimi"
        description={
          activeStore
            ? `${activeStore.name} icin stok hareketlerini izleyin.`
            : "Aktif magaza secimi bekleniyor."
        }
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Stok hareketi ekle
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Dusuk stok uyarilari
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
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {alerts.map((alert) => (
                <div
                  key={alert.ingredientId}
                  className="flex items-center justify-between rounded-[1.25rem] border border-destructive/20 bg-destructive/5 p-4"
                >
                  <div>
                    <p className="text-sm font-medium">{alert.ingredientName}</p>
                    <p className="text-xs text-muted-foreground">
                      Min: {alert.minStockLevel} {alert.unitAbbreviation}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-destructive">{alert.currentStock}</p>
                    <p className="text-xs text-muted-foreground">{alert.unitAbbreviation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Yeni stok hareketi</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Malzeme ID</label>
                <Input
                  placeholder="Malzeme ID girin"
                  value={form.ingredientId}
                  onChange={(event) =>
                    setForm({ ...form, ingredientId: event.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hareket tipi</label>
                <select
                  className="flex h-11 w-full rounded-[1rem] border border-input bg-background px-3 py-2 text-sm"
                  value={form.type}
                  onChange={(event) =>
                    setForm({ ...form, type: event.target.value as MovementType })
                  }
                >
                  {MOVEMENT_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
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
                  onChange={(event) =>
                    setForm({
                      ...form,
                      quantity: parseFloat(event.target.value) || 0,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Aciklama</label>
                <Input
                  placeholder="Opsiyonel aciklama"
                  value={form.reason}
                  onChange={(event) => setForm({ ...form, reason: event.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2 xl:col-span-4 sm:flex-row">
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

      <Card>
        <CardHeader>
          <CardTitle>Stok hareket gecmisi</CardTitle>
          <CardDescription>Tum stok giris, cikis ve duzeltme kayitlari.</CardDescription>
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
              <ResponsiveDataTable
                data={movements}
                getKey={(movement) => movement.id}
                columns={[
                  {
                    header: "Tarih",
                    cell: (movement) => (
                      <span className="text-muted-foreground">
                        {formatDate(movement.createdAt)}
                      </span>
                    ),
                  },
                  {
                    header: "Malzeme",
                    cell: (movement) => (
                      <span className="font-medium">{movement.ingredientName}</span>
                    ),
                  },
                  {
                    header: "Tip",
                    cell: (movement) => (
                      <span className="inline-flex items-center gap-1">
                        {getMovementIcon(movement.type as MovementType)}
                        {getMovementLabel(movement.type as MovementType)}
                      </span>
                    ),
                  },
                  {
                    header: "Miktar",
                    className: "text-right",
                    cell: (movement) => (
                      <span className="font-mono">
                        {movement.type === "OUT" ? "-" : "+"}
                        {movement.quantity}
                      </span>
                    ),
                  },
                  {
                    header: "Aciklama",
                    cell: (movement) => (
                      <span className="text-muted-foreground">{movement.reason || "-"}</span>
                    ),
                  },
                ]}
                mobileCard={(movement) => (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {movement.ingredientName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(movement.createdAt)}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                        {getMovementIcon(movement.type as MovementType)}
                        {getMovementLabel(movement.type as MovementType)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Miktar
                        </p>
                        <p className="mt-1 font-mono font-medium text-foreground">
                          {movement.type === "OUT" ? "-" : "+"}
                          {movement.quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Aciklama
                        </p>
                        <p className="mt-1 text-foreground">{movement.reason || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}
              />

              {meta && meta.totalPages > 1 && (
                <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
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
