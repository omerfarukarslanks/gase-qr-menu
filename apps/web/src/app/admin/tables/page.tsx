"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChefHat,
  Clock,
  Loader2,
  Pencil,
  Plus,
  QrCode,
  Users,
} from "lucide-react";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MenuQrCard } from "@/components/admin/menu-qr-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Switch } from "@/components/ui/switch";
import { useMenus } from "@/hooks/use-menus";
import { useStaff } from "@/hooks/use-staff";
import {
  type RestaurantTable,
  type TableStatus,
  useCloseTableSession,
  useCreateTable,
  useOpenTableSession,
  useTables,
  useUpdateTable,
} from "@/hooks/use-tables";
import { useCurrentStore } from "@/hooks/use-current-store";
import {
  buildClientPaginationMeta,
  type AdminPageSize,
} from "@/lib/pagination";

type Section = "ALL" | "IC_MEKAN" | "DIS_MEKAN" | "TERAS" | "VIP";

const sectionLabels: Record<Exclude<Section, "ALL">, string> = {
  IC_MEKAN: "Ic Mekan",
  DIS_MEKAN: "Dis Mekan",
  TERAS: "Teras",
  VIP: "VIP",
};

const sectionColors: Record<Exclude<Section, "ALL">, string> = {
  IC_MEKAN: "bg-blue-100 text-blue-700",
  DIS_MEKAN: "bg-emerald-100 text-emerald-700",
  TERAS: "bg-amber-100 text-amber-700",
  VIP: "bg-purple-100 text-purple-700",
};

const sectionOptions = Object.entries(sectionLabels).map(([value, label]) => ({
  value,
  label,
}));

const staffRoleLabels = {
  MANAGER: "Yonetici",
  STAFF: "Personel",
  WAITER: "Garson",
  KITCHEN: "Mutfak",
} as const;

const statusConfig: Record<
  TableStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  AVAILABLE: {
    label: "Musait",
    color: "text-green-700",
    bg: "bg-green-100",
    border: "border-green-300",
  },
  OCCUPIED: {
    label: "Dolu",
    color: "text-red-700",
    bg: "bg-red-100",
    border: "border-red-300",
  },
  RESERVED: {
    label: "Rezerve",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
    border: "border-yellow-300",
  },
  OUT_OF_SERVICE: {
    label: "Hizmet Disi",
    color: "text-gray-700",
    bg: "bg-gray-100",
    border: "border-gray-300",
  },
};

interface TableFormData {
  number: number;
  name: string;
  capacity: number;
  section: Exclude<Section, "ALL">;
}

interface OpenSessionFormData {
  customerName: string;
  customerPhone: string;
  assignedStaffUserId: string;
}

const emptyForm: TableFormData = {
  number: 0,
  name: "",
  capacity: 2,
  section: "IC_MEKAN",
};

const emptySessionForm: OpenSessionFormData = {
  customerName: "",
  customerPhone: "",
  assignedStaffUserId: "",
};

function getElapsedMinutes(openedAt: string) {
  return Math.floor((Date.now() - new Date(openedAt).getTime()) / 60000);
}

export default function TablesPage() {
  const { activeStoreId } = useCurrentStore();
  const { data: tables = [], isLoading, isError, error } = useTables(activeStoreId ?? "");
  const { data: menus = [] } = useMenus(activeStoreId ?? "");
  const { data: staff = [] } = useStaff(activeStoreId ?? "");
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const openTableSession = useOpenTableSession();
  const closeTableSession = useCloseTableSession();

  const [activeFilter, setActiveFilter] = useState<Section>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(10);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TableFormData>(emptyForm);
  const [sessionTable, setSessionTable] = useState<RestaurantTable | null>(null);
  const [sessionFormData, setSessionFormData] =
    useState<OpenSessionFormData>(emptySessionForm);
  const [qrTableId, setQrTableId] = useState<string | null>(null);
  const [qrMenuId, setQrMenuId] = useState<string | null>(null);

  const activeMenus = useMemo(() => menus.filter((menu) => menu.isActive), [menus]);
  const assignableStaffOptions = useMemo(
    () =>
      staff
        .filter((member) => member.isActive && member.role !== "KITCHEN")
        .map((member) => ({
          value: member.userId,
          label: `${member.name} • ${staffRoleLabels[member.role]}`,
          keywords: [member.email, member.storeName],
        })),
    [staff]
  );
  const qrTable = useMemo(
    () => tables.find((table) => table.id === qrTableId) ?? null,
    [qrTableId, tables]
  );
  const selectedQrMenu = useMemo(
    () => activeMenus.find((menu) => menu.id === qrMenuId) ?? activeMenus[0] ?? null,
    [activeMenus, qrMenuId]
  );

  const filteredTables = useMemo(
    () =>
      activeFilter === "ALL"
        ? tables
        : tables.filter((table) => (table.section ?? "") === activeFilter),
    [activeFilter, tables]
  );
  const totalPages =
    pageSize === "all"
      ? filteredTables.length > 0
        ? 1
        : 0
      : Math.ceil(filteredTables.length / pageSize);
  const paginatedTables = useMemo(() => {
    if (pageSize === "all") {
      return filteredTables;
    }
    const start = (page - 1) * pageSize;
    return filteredTables.slice(start, start + pageSize);
  }, [filteredTables, page, pageSize]);

  const filterTabs: { key: Section; label: string }[] = [
    { key: "ALL", label: "Tumu" },
    { key: "IC_MEKAN", label: "Ic Mekan" },
    { key: "DIS_MEKAN", label: "Dis Mekan" },
    { key: "TERAS", label: "Teras" },
    { key: "VIP", label: "VIP" },
  ];

  useEffect(() => {
    if (page > 1 && totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, activeStoreId, pageSize]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const resetSessionForm = () => {
    setSessionTable(null);
    setSessionFormData(emptySessionForm);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      ...emptyForm,
      number: Math.max(0, ...tables.map((table) => table.number)) + 1,
    });
    setShowForm(true);
  };

  const handleEdit = (table: RestaurantTable) => {
    setEditingId(table.id);
    setFormData({
      number: table.number,
      name: table.name,
      capacity: table.capacity,
      section:
        (table.section as Exclude<Section, "ALL"> | null) ?? "IC_MEKAN",
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!activeStoreId || !formData.name.trim() || formData.number <= 0) {
      return;
    }

    if (editingId) {
      updateTable.mutate(
        {
          id: editingId,
          name: formData.name.trim(),
          capacity: formData.capacity,
          section: formData.section,
        },
        {
          onSuccess: resetForm,
        }
      );
      return;
    }

    createTable.mutate(
      {
        storeId: activeStoreId,
        number: formData.number,
        name: formData.name.trim(),
        capacity: formData.capacity,
        section: formData.section,
      },
      {
        onSuccess: resetForm,
      }
    );
  };

  const handleOpenQrPanel = (table: RestaurantTable) => {
    setQrTableId(table.id);
    setQrMenuId((current) => {
      if (current && activeMenus.some((menu) => menu.id === current)) {
        return current;
      }

      return activeMenus[0]?.id ?? null;
    });
  };

  const handleToggleTableActive = (table: RestaurantTable) => {
    const nextStatus: TableStatus =
      table.status === "OUT_OF_SERVICE" ? "AVAILABLE" : "OUT_OF_SERVICE";

    updateTable.mutate({
      id: table.id,
      status: nextStatus,
    });
  };

  const handleOpenSessionDrawer = (table: RestaurantTable) => {
    setSessionTable(table);
    setSessionFormData(emptySessionForm);
  };

  const handleSubmitSession = () => {
    if (!sessionTable) {
      return;
    }

    openTableSession.mutate(
      {
        tableId: sessionTable.id,
        customerName: sessionFormData.customerName.trim() || undefined,
        customerPhone: sessionFormData.customerPhone.trim() || undefined,
        assignedStaffUserId: sessionFormData.assignedStaffUserId || undefined,
      },
      {
        onSuccess: resetSessionForm,
      }
    );
  };

  const formContent = (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Masa numarasi</label>
          <Input
            type="number"
            value={formData.number || ""}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                number: parseInt(event.target.value, 10) || 0,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Masa adi</label>
          <Input
            value={formData.name}
            onChange={(event) =>
              setFormData((current) => ({ ...current, name: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Kapasite</label>
          <Input
            type="number"
            min={1}
            max={20}
            value={formData.capacity || ""}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                capacity: parseInt(event.target.value, 10) || 2,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Bolum</label>
          <SearchableSelect
            options={sectionOptions}
            value={formData.section}
            onChange={(value) =>
              setFormData((current) => ({
                ...current,
                section: String(value) as Exclude<Section, "ALL">,
              }))
            }
            searchPlaceholder="Bolum ara..."
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={handleSave} disabled={createTable.isPending || updateTable.isPending}>
          {editingId ? "Guncelle" : "Kaydet"}
        </Button>
        <Button variant="outline" onClick={resetForm}>
          Iptal
        </Button>
      </div>
    </div>
  );

  const qrPanelContent =
    qrTable && selectedQrMenu ? (
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Menu secimi</label>
          <SearchableSelect
            options={activeMenus.map((menu) => ({
              value: menu.id,
              label: menu.name,
              keywords: [menu.qrToken],
            }))}
            value={selectedQrMenu.id}
            onChange={(value) => setQrMenuId(String(value))}
            searchPlaceholder="Menu ara..."
          />
          <p className="text-xs text-muted-foreground">
            Masa bazli QR linki: `/m/{selectedQrMenu.qrToken}?table={qrTable.id}`
          </p>
        </div>

        <MenuQrCard
          qrToken={selectedQrMenu.qrToken}
          menuName={`${selectedQrMenu.name}-masa-${qrTable.number}`}
          size={208}
          publicUrlOverride={`${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/m/${selectedQrMenu.qrToken}?table=${encodeURIComponent(qrTable.id)}`}
          openHrefOverride={`/m/${selectedQrMenu.qrToken}?table=${encodeURIComponent(qrTable.id)}`}
          downloadFileName={`masa-${qrTable.number}-${selectedQrMenu.name.toLowerCase().replace(/\s+/g, "-")}-qr.svg`}
        />
      </div>
    ) : null;

  const sessionFormContent = sessionTable ? (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="text-sm font-medium">Masa {sessionTable.number}</div>
        <div className="text-sm text-muted-foreground">
          {sessionTable.name} • {sessionTable.capacity} kisi
        </div>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Musteri adi</label>
          <Input
            value={sessionFormData.customerName}
            placeholder="Opsiyonel"
            onChange={(event) =>
              setSessionFormData((current) => ({
                ...current,
                customerName: event.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Telefon</label>
          <Input
            value={sessionFormData.customerPhone}
            placeholder="Opsiyonel"
            onChange={(event) =>
              setSessionFormData((current) => ({
                ...current,
                customerPhone: event.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Siparisi alan personel</label>
          <SearchableSelect
            options={assignableStaffOptions}
            value={sessionFormData.assignedStaffUserId}
            onChange={(value) =>
              setSessionFormData((current) => ({
                ...current,
                assignedStaffUserId: String(value || ""),
              }))
            }
            placeholder="Secim yapmadan devam et"
            searchPlaceholder="Personel ara..."
            emptyMessage="Secilebilir personel bulunamadi."
          />
          <p className="text-xs text-muted-foreground">
            Bos birakirsaniz siparisler varsayilan olarak giris yapan kullaniciya yazilir.
          </p>
        </div>
      </div>

      {openTableSession.isError ? (
        <p className="text-sm text-destructive">
          {openTableSession.error instanceof Error
            ? openTableSession.error.message
            : "Masa oturumu acilamadi."}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={handleSubmitSession} disabled={openTableSession.isPending}>
          {openTableSession.isPending ? "Aciliyor..." : "Masayi ac"}
        </Button>
        <Button variant="outline" onClick={resetSessionForm}>
          Iptal
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Masalar"
        description="Masalari yonetin, aktif oturumlari takip edin ve QR akisini menulerle eslestirin."
        action={
          <Button onClick={handleAdd} disabled={!activeStoreId}>
            <Plus className="mr-2 h-4 w-4" />
            Masa ekle
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeFilter === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <AdminDrawer
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            resetForm();
          }
        }}
        title={editingId ? "Masa duzenle" : "Yeni masa ekle"}
        description="Masa detaylari, kapasite ve bolum bilgisini drawer icinden yonetin."
      >
        {formContent}
      </AdminDrawer>

      <AdminDrawer
        open={Boolean(qrTable && selectedQrMenu)}
        onOpenChange={(open) => {
          if (!open) {
            setQrTableId(null);
          }
        }}
        title={qrTable ? `Masa ${qrTable.number} icin QR` : "QR paneli"}
        description="Secili menu ile masa baglamina ozel QR kodu olusturun."
        contentClassName="lg:w-[min(34rem,calc(100vw-2rem))]"
      >
        {qrPanelContent}
      </AdminDrawer>

      <AdminDrawer
        open={Boolean(sessionTable)}
        onOpenChange={(open) => {
          if (!open) {
            resetSessionForm();
          }
        }}
        title={sessionTable ? `Masa ${sessionTable.number} oturumu` : "Masa oturumu"}
        description="Masa acarken opsiyonel musteri ve sorumlu personel bilgisini baglayin."
      >
        {sessionFormContent}
      </AdminDrawer>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Masalar yukleniyor...
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="py-10 text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : "Masalar alinamadi. Backend baglantisini kontrol edin."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {paginatedTables.map((table) => {
            const status = statusConfig[table.status];
            const sessionMinutes = table.currentSession
              ? getElapsedMinutes(table.currentSession.openedAt)
              : 0;
            const sectionKey =
              (table.section as Exclude<Section, "ALL"> | null) ?? "IC_MEKAN";

              return (
                <Card
                  key={table.id}
                  className={`relative overflow-hidden border-2 ${status.border}`}
                >
                  <div className={`absolute left-0 right-0 top-0 h-1 ${status.bg}`} />
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-lg font-bold">Masa {table.number}</div>
                        <div className="text-sm text-muted-foreground">{table.name}</div>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.bg} ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {table.capacity} Kisi
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sectionColors[sectionKey]}`}
                      >
                        {sectionLabels[sectionKey]}
                      </span>
                    </div>

                    {table.currentSession && (
                      <div className="space-y-1 rounded-md bg-muted/50 p-2">
                        <div className="text-sm font-medium">
                          {table.currentSession.customerName || "Aktif masa oturumu"}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {sessionMinutes} dk
                          </span>
                          <span className="flex items-center gap-1">
                            <ChefHat className="h-3 w-3" />
                            {table.currentSession.orderCount} aktif siparis
                          </span>
                          {table.currentSession.assignedStaff?.name ? (
                            <span>{table.currentSession.assignedStaff.name}</span>
                          ) : null}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 pt-1">
                      {table.currentSession ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={closeTableSession.isPending}
                          onClick={() =>
                            closeTableSession.mutate({
                              sessionId: table.currentSession!.id,
                            })
                          }
                        >
                          Oturumu kapat
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            openTableSession.isPending || table.status === "OUT_OF_SERVICE"
                          }
                          onClick={() => handleOpenSessionDrawer(table)}
                        >
                          Masa ac
                        </Button>
                      )}

                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={table.status !== "OUT_OF_SERVICE"}
                            disabled={
                              updateTable.isPending ||
                              Boolean(table.currentSession) ||
                              table.status === "OCCUPIED" ||
                              table.status === "RESERVED"
                            }
                            onCheckedChange={() => handleToggleTableActive(table)}
                            aria-label={`${table.name} durumunu degistir`}
                          />
                        </div>

                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={
                              activeMenus.length > 0
                                ? "Bu masa icin QR olustur"
                                : "Once aktif bir menu olusturun"
                            }
                            disabled={activeMenus.length === 0}
                            onClick={() => handleOpenQrPanel(table)}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(table)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <AdminPagination
            meta={buildClientPaginationMeta(filteredTables.length, page, pageSize)}
            itemLabel="masa"
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
}
