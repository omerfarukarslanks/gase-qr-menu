"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  ClipboardCheck,
  PackagePlus,
  RefreshCw,
  Search,
  Truck,
  Warehouse,
} from "lucide-react";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ResponsiveDataTable } from "@/components/admin/responsive-data-table";
import { getEffectiveAdminRole } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useIngredients } from "@/hooks/use-ingredients";
import {
  useCreatePurchaseReceipt,
  useCreateStockCount,
  useCreateStockMovement,
  useCreateSupplier,
  useLowStockAlerts,
  usePurchaseReceipts,
  useStockIngredientDetail,
  useStockIngredients,
  useStockMovements,
  useStockSummary,
  useSuppliers,
  useUpdateSupplier,
  type LowStockAlert,
  type StockInventoryIngredient,
  type Supplier,
} from "@/hooks/use-stock";
import { useSocket } from "@/hooks/use-socket";
import { useAuthStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";

type TabKey = "overview" | "counts" | "procurement";
type MovementType = "IN" | "OUT" | "ADJUSTMENT" | "WASTE";
type CountFilter = "all" | "low" | "negative" | "uncounted";

const tabs: { key: TabKey; label: string; icon: typeof Warehouse }[] = [
  { key: "overview", label: "Genel", icon: Warehouse },
  { key: "counts", label: "Sayim", icon: ClipboardCheck },
  { key: "procurement", label: "Tedarik", icon: Truck },
];

const MOVEMENT_TYPES: { value: MovementType; label: string }[] = [
  { value: "IN", label: "Giris" },
  { value: "OUT", label: "Cikis" },
  { value: "ADJUSTMENT", label: "Duzeltme" },
  { value: "WASTE", label: "Fire" },
];

function formatCurrency(value: number) {
  return `${value.toLocaleString("tr-TR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  })} TL`;
}

function formatNumber(value: number) {
  return value.toLocaleString("tr-TR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string | string[] } } }).response?.data
      ?.message !== "undefined"
  ) {
    const message = (error as { response?: { data?: { message?: string | string[] } } }).response
      ?.data?.message;
    return Array.isArray(message) ? message.join(", ") : message || "Islem tamamlanamadi.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Islem tamamlanamadi.";
}

function getMovementIcon(type: MovementType) {
  switch (type) {
    case "IN":
      return <ArrowDownCircle className="h-4 w-4 text-emerald-600" />;
    case "OUT":
      return <ArrowUpCircle className="h-4 w-4 text-rose-600" />;
    case "ADJUSTMENT":
      return <RefreshCw className="h-4 w-4 text-blue-600" />;
    case "WASTE":
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
  }
}

function getMovementLabel(type: MovementType) {
  return MOVEMENT_TYPES.find((item) => item.value === type)?.label ?? type;
}

function getMovementNextStock(
  currentStock: number,
  type: MovementType,
  quantity: number
) {
  if (type === "ADJUSTMENT") {
    return quantity;
  }

  if (type === "OUT" || type === "WASTE") {
    return currentStock - quantity;
  }

  return currentStock + quantity;
}

interface MovementFormState {
  ingredientId: string;
  type: MovementType;
  quantity: string;
  unitCost: string;
  reason: string;
  referenceId: string;
}

interface CountFormState {
  ingredientId: string;
  countedQuantity: string;
  notes: string;
}

interface SupplierFormState {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  notes: string;
}

interface PurchaseLineState {
  ingredientId: string;
  quantity: string;
  unitCost: string;
}

interface PurchaseFormState {
  supplierId: string;
  invoiceNumber: string;
  notes: string;
  items: PurchaseLineState[];
}

const emptyMovementForm: MovementFormState = {
  ingredientId: "",
  type: "IN",
  quantity: "",
  unitCost: "",
  reason: "",
  referenceId: "",
};

const emptyCountForm: CountFormState = {
  ingredientId: "",
  countedQuantity: "",
  notes: "",
};

const emptySupplierForm: SupplierFormState = {
  name: "",
  contactName: "",
  phone: "",
  email: "",
  notes: "",
};

const emptyPurchaseForm: PurchaseFormState = {
  supplierId: "",
  invoiceNumber: "",
  notes: "",
  items: [{ ingredientId: "", quantity: "", unitCost: "" }],
};

export default function StockPage() {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const { activeStoreId, activeStore } = useCurrentStore();
  const { joinStore, onEvent } = useSocket();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [movementPage, setMovementPage] = useState(1);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [purchasePage, setPurchasePage] = useState(1);
  const [supplierPage, setSupplierPage] = useState(1);

  const [movementSearch, setMovementSearch] = useState("");
  const [movementIngredientFilter, setMovementIngredientFilter] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState<MovementType | "">("");
  const [movementDateFrom, setMovementDateFrom] = useState("");
  const [movementDateTo, setMovementDateTo] = useState("");

  const [inventorySearch, setInventorySearch] = useState("");
  const [countFilter, setCountFilter] = useState<CountFilter>("all");
  const [procurementSearch, setProcurementSearch] = useState("");

  const [showMovementDrawer, setShowMovementDrawer] = useState(false);
  const [showCountDrawer, setShowCountDrawer] = useState(false);
  const [showSupplierDrawer, setShowSupplierDrawer] = useState(false);
  const [showPurchaseDrawer, setShowPurchaseDrawer] = useState(false);
  const [detailIngredientId, setDetailIngredientId] = useState("");

  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [movementForm, setMovementForm] = useState<MovementFormState>(emptyMovementForm);
  const [countForm, setCountForm] = useState<CountFormState>(emptyCountForm);
  const [supplierForm, setSupplierForm] = useState<SupplierFormState>(emptySupplierForm);
  const [purchaseForm, setPurchaseForm] = useState<PurchaseFormState>(emptyPurchaseForm);
  const [pageMessage, setPageMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const effectiveRole = getEffectiveAdminRole(authUser?.role, activeStore?.role);
  const canManageProcurement = ["SUPER_ADMIN", "OWNER", "MANAGER"].includes(effectiveRole ?? "");

  const { data: allIngredientsQuery } = useIngredients(activeStoreId ?? "", {
    page: 1,
    pageSize: 300,
  });
  const allIngredients = allIngredientsQuery?.data ?? [];

  const summaryQuery = useStockSummary(activeStoreId ?? "");
  const alertsQuery = useLowStockAlerts(activeStoreId ?? "");
  const movementsQuery = useStockMovements(activeStoreId ?? "", {
    page: movementPage,
    pageSize: 12,
    search: movementSearch,
    ingredientId: movementIngredientFilter,
    type: movementTypeFilter,
    dateFrom: movementDateFrom,
    dateTo: movementDateTo,
  });
  const inventoryQuery = useStockIngredients(activeStoreId ?? "", {
    page: inventoryPage,
    pageSize: 12,
    search: inventorySearch,
  });
  const ingredientDetailQuery = useStockIngredientDetail(detailIngredientId);
  const suppliersQuery = useSuppliers(activeStoreId ?? "", {
    page: supplierPage,
    pageSize: 8,
    search: procurementSearch,
  });
  const purchasesQuery = usePurchaseReceipts(activeStoreId ?? "", {
    page: purchasePage,
    pageSize: 8,
    search: procurementSearch,
  });

  const createMovement = useCreateStockMovement();
  const createStockCount = useCreateStockCount();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const createPurchaseReceipt = useCreatePurchaseReceipt();

  useEffect(() => {
    if (!activeStoreId) {
      return;
    }

    joinStore(activeStoreId);
  }, [activeStoreId, joinStore]);

  useEffect(() => {
    if (!activeStoreId) {
      return;
    }

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    };

    const cleanups = [
      onEvent("stockLow", invalidate),
      onEvent("stockMovementCreated", invalidate),
      onEvent("stockCountCompleted", invalidate),
    ];

    return () => cleanups.forEach((cleanup) => cleanup?.());
  }, [activeStoreId, onEvent, queryClient]);

  const selectedMovementIngredient = useMemo(
    () => allIngredients.find((ingredient) => ingredient.id === movementForm.ingredientId) ?? null,
    [allIngredients, movementForm.ingredientId]
  );

  const movementQuantity = parseFloat(movementForm.quantity) || 0;
  const movementPreviewStock = selectedMovementIngredient
    ? getMovementNextStock(
        selectedMovementIngredient.currentStock,
        movementForm.type,
        movementQuantity
      )
    : null;

  const selectedCountIngredient = useMemo(
    () => allIngredients.find((ingredient) => ingredient.id === countForm.ingredientId) ?? null,
    [allIngredients, countForm.ingredientId]
  );

  const filteredInventoryItems = useMemo(() => {
    const items = inventoryQuery.data?.data ?? [];

    return items.filter((item) => {
      if (countFilter === "low") {
        return item.isLowStock;
      }

      if (countFilter === "negative") {
        return item.isNegativeStock;
      }

      if (countFilter === "uncounted") {
        return !item.lastCountedAt;
      }

      return true;
    });
  }, [countFilter, inventoryQuery.data?.data]);

  const lowStockSuggestions = alertsQuery.data ?? [];

  function resetMovementDrawer() {
    setShowMovementDrawer(false);
    setMovementForm(emptyMovementForm);
  }

  function resetCountDrawer() {
    setShowCountDrawer(false);
    setCountForm(emptyCountForm);
  }

  function resetSupplierDrawer() {
    setShowSupplierDrawer(false);
    setEditingSupplier(null);
    setSupplierForm(emptySupplierForm);
  }

  function resetPurchaseDrawer() {
    setShowPurchaseDrawer(false);
    setPurchaseForm(emptyPurchaseForm);
  }

  function openCountDrawer(ingredient?: StockInventoryIngredient | null) {
    setCountForm({
      ingredientId: ingredient?.id ?? "",
      countedQuantity:
        typeof ingredient?.currentStock === "number" ? String(ingredient.currentStock) : "",
      notes: "",
    });
    setShowCountDrawer(true);
  }

  function openEditSupplierDrawer(supplier: Supplier) {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name ?? "",
      contactName: supplier.contactName ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      notes: supplier.notes ?? "",
    });
    setShowSupplierDrawer(true);
  }

  function openPurchaseSuggestionDrawer(alerts: LowStockAlert[]) {
    setPurchaseForm({
      supplierId: "",
      invoiceNumber: "",
      notes: "Dusuk stok bazli yeniden alim onerisi",
      items: alerts.slice(0, 5).map((alert) => ({
        ingredientId: alert.ingredientId,
        quantity: String(Math.max(alert.minStockLevel - alert.currentStock, 0)),
        unitCost: "",
      })),
    });
    setShowPurchaseDrawer(true);
  }

  function handleMovementSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!activeStoreId) return;

    createMovement.mutate(
      {
        storeId: activeStoreId,
        ingredientId: movementForm.ingredientId,
        type: movementForm.type,
        quantity: parseFloat(movementForm.quantity) || 0,
        unitCost: movementForm.unitCost ? parseFloat(movementForm.unitCost) : undefined,
        reason: movementForm.reason || undefined,
        referenceId: movementForm.referenceId || undefined,
      },
      {
        onSuccess: () => {
          resetMovementDrawer();
          setPageMessage({ type: "success", text: "Stok hareketi kaydedildi." });
        },
        onError: (error) => {
          setPageMessage({ type: "error", text: getErrorMessage(error) });
        },
      }
    );
  }

  function handleCountSubmit(event: React.FormEvent) {
    event.preventDefault();

    createStockCount.mutate(
      {
        ingredientId: countForm.ingredientId,
        countedQuantity: parseFloat(countForm.countedQuantity) || 0,
        notes: countForm.notes || undefined,
      },
      {
        onSuccess: () => {
          resetCountDrawer();
          setPageMessage({ type: "success", text: "Sayim sonucu stoğa işlendi." });
        },
        onError: (error) => {
          setPageMessage({ type: "error", text: getErrorMessage(error) });
        },
      }
    );
  }

  function handleSupplierSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!activeStoreId) return;

    const payload = {
      storeId: activeStoreId,
      name: supplierForm.name,
      contactName: supplierForm.contactName || undefined,
      phone: supplierForm.phone || undefined,
      email: supplierForm.email || undefined,
      notes: supplierForm.notes || undefined,
    };

    const mutation = editingSupplier
      ? updateSupplier.mutateAsync({
          id: editingSupplier.id,
          ...payload,
        })
      : createSupplier.mutateAsync(payload);

    mutation
      .then(() => {
        resetSupplierDrawer();
        setPageMessage({
          type: "success",
          text: editingSupplier ? "Tedarikci guncellendi." : "Tedarikci eklendi.",
        });
      })
      .catch((error) => {
        setPageMessage({ type: "error", text: getErrorMessage(error) });
      });
  }

  function handlePurchaseSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!activeStoreId) return;

    createPurchaseReceipt.mutate(
      {
        storeId: activeStoreId,
        supplierId: purchaseForm.supplierId || undefined,
        invoiceNumber: purchaseForm.invoiceNumber || undefined,
        notes: purchaseForm.notes || undefined,
        items: purchaseForm.items
          .filter((item) => item.ingredientId)
          .map((item) => ({
            ingredientId: item.ingredientId,
            quantity: parseFloat(item.quantity) || 0,
            unitCost: parseFloat(item.unitCost) || 0,
          })),
      },
      {
        onSuccess: () => {
          resetPurchaseDrawer();
          setPageMessage({ type: "success", text: "Mal kabul girisi kaydedildi." });
        },
        onError: (error) => {
          setPageMessage({ type: "error", text: getErrorMessage(error) });
        },
      }
    );
  }

  function updatePurchaseLine(index: number, next: Partial<PurchaseLineState>) {
    setPurchaseForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...next } : item
      ),
    }));
  }

  const purchaseTotal = purchaseForm.items.reduce((sum, item) => {
    const quantity = parseFloat(item.quantity) || 0;
    const unitCost = parseFloat(item.unitCost) || 0;
    return sum + quantity * unitCost;
  }, 0);

  const summary = summaryQuery.data;
  const movements = movementsQuery.data?.data ?? [];
  const movementMeta = movementsQuery.data?.meta;
  const suppliers = suppliersQuery.data?.data ?? [];
  const supplierMeta = suppliersQuery.data?.meta;
  const purchases = purchasesQuery.data?.data ?? [];
  const purchaseMeta = purchasesQuery.data?.meta;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Stok yonetimi"
        description={
          activeStore
            ? `${activeStore.name} icin stok, sayim ve tedarik akisini tek yerde yonetin.`
            : "Aktif magaza secimi bekleniyor."
        }
        action={
          activeTab === "overview" ? (
            <Button onClick={() => setShowMovementDrawer(true)}>
              <PackagePlus className="mr-2 h-4 w-4" />
              Stok hareketi ekle
            </Button>
          ) : activeTab === "counts" ? (
            <Button onClick={() => openCountDrawer(null)}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Sayim yap
            </Button>
          ) : canManageProcurement ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSupplierDrawer(true)}>
                Tedarikci ekle
              </Button>
              <Button onClick={() => setShowPurchaseDrawer(true)}>
                <Truck className="mr-2 h-4 w-4" />
                Mal kabul gir
              </Button>
            </div>
          ) : null
        }
      />

      {pageMessage ? (
        <div
          className={`rounded-[1.25rem] border px-4 py-3 text-sm ${
            pageMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-destructive/30 bg-destructive/5 text-destructive"
          }`}
        >
          {pageMessage.text}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-secondary bg-secondary text-secondary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/40"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Toplam malzeme</CardDescription>
                <CardTitle className="text-3xl">
                  {summaryQuery.isLoading ? "..." : summary?.totalIngredients ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Dusuk stok</CardDescription>
                <CardTitle className="text-3xl text-destructive">
                  {summaryQuery.isLoading ? "..." : summary?.lowStockCount ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Bugunku hareket</CardDescription>
                <CardTitle className="text-3xl">
                  {summaryQuery.isLoading ? "..." : summary?.todayMovementCount ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Negatif stok</CardDescription>
                <CardTitle className="text-3xl text-amber-600">
                  {summaryQuery.isLoading ? "..." : summary?.negativeStockCount ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Toplam stok degeri</CardDescription>
                <CardTitle className="text-2xl">
                  {summaryQuery.isLoading ? "..." : formatCurrency(summary?.totalValue ?? 0)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Dusuk stok uyarilari
                </CardTitle>
                <CardDescription>Esik seviyenin altinda kalan malzemeler.</CardDescription>
              </CardHeader>
              <CardContent>
                {alertsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Yukleniyor...</p>
                ) : !lowStockSuggestions.length ? (
                  <p className="text-sm text-muted-foreground">
                    Su an kritik stok uyarisi bulunmuyor.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {lowStockSuggestions.map((alert) => (
                      <div
                        key={alert.ingredientId}
                        className="rounded-[1.25rem] border border-destructive/20 bg-destructive/5 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">{alert.ingredientName}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Esik: {formatNumber(alert.minStockLevel)} {alert.unitAbbreviation}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-destructive">
                              {formatNumber(alert.currentStock)}
                            </p>
                            <p className="text-xs text-muted-foreground">{alert.unitAbbreviation}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                          Acik: {formatNumber(alert.deficit)} {alert.unitAbbreviation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kritik odak listesi</CardTitle>
                <CardDescription>Son hareket ve son sayim bilgisini bir arada gorun.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(summary?.ingredients ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Gosterilecek ozet malzeme bulunmuyor.
                  </p>
                ) : (
                  summary?.ingredients.map((ingredient) => (
                    <div
                      key={ingredient.id}
                      className="rounded-[1.15rem] border border-border bg-muted/20 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{ingredient.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Son hareket:{" "}
                            {ingredient.lastMovementAt
                              ? formatDate(ingredient.lastMovementAt)
                              : "Henuz yok"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-semibold ${
                              ingredient.isNegativeStock
                                ? "text-amber-600"
                                : ingredient.isLowStock
                                ? "text-destructive"
                                : "text-foreground"
                            }`}
                          >
                            {formatNumber(ingredient.currentStock)}{" "}
                            {ingredient.unit?.abbreviation ?? ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Esik {formatNumber(ingredient.lowStockThreshold)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Stok hareket gecmisi</CardTitle>
              <CardDescription>Filtrelenebilir hareket listesi ve stok sonrasi durum.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="relative xl:col-span-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Malzeme, not veya referans ara..."
                    value={movementSearch}
                    onChange={(event) => {
                      setMovementSearch(event.target.value);
                      setMovementPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
                <SearchableSelect
                  options={[
                    { value: "", label: "Tum malzemeler" },
                    ...allIngredients.map((ingredient) => ({
                      value: ingredient.id,
                      label: ingredient.name,
                    })),
                  ]}
                  value={movementIngredientFilter}
                  onChange={(value) => {
                    setMovementIngredientFilter(String(value));
                    setMovementPage(1);
                  }}
                  placeholder="Malzeme filtresi"
                  searchPlaceholder="Malzeme ara..."
                />
                <SearchableSelect
                  options={[
                    { value: "", label: "Tum tipler" },
                    ...MOVEMENT_TYPES.map((item) => ({
                      value: item.value,
                      label: item.label,
                    })),
                  ]}
                  value={movementTypeFilter}
                  onChange={(value) => {
                    setMovementTypeFilter(String(value) as MovementType | "");
                    setMovementPage(1);
                  }}
                  placeholder="Tip filtresi"
                  searchPlaceholder="Tip ara..."
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={movementDateFrom}
                    onChange={(event) => {
                      setMovementDateFrom(event.target.value);
                      setMovementPage(1);
                    }}
                  />
                  <Input
                    type="date"
                    value={movementDateTo}
                    onChange={(event) => {
                      setMovementDateTo(event.target.value);
                      setMovementPage(1);
                    }}
                  />
                </div>
              </div>

              {movementsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Yukleniyor...</p>
              ) : !movements.length ? (
                <p className="text-sm text-muted-foreground">Filtreye uygun hareket bulunmuyor.</p>
              ) : (
                <>
                  <ResponsiveDataTable
                    data={movements}
                    getKey={(movement) => movement.id}
                    columns={[
                      {
                        header: "Tarih",
                        cell: (movement) => (
                          <span className="text-muted-foreground">{formatDate(movement.createdAt)}</span>
                        ),
                      },
                      {
                        header: "Malzeme",
                        cell: (movement) => (
                          <div>
                            <p className="font-medium">{movement.ingredientName}</p>
                            <p className="text-xs text-muted-foreground">
                              {movement.createdByName ?? "Sistem"}
                            </p>
                          </div>
                        ),
                      },
                      {
                        header: "Tip",
                        cell: (movement) => (
                          <span className="inline-flex items-center gap-1">
                            {getMovementIcon(movement.type)}
                            {getMovementLabel(movement.type)}
                          </span>
                        ),
                      },
                      {
                        header: "Miktar",
                        className: "text-right",
                        cell: (movement) => (
                          <span className="font-mono">
                            {movement.type === "IN"
                              ? "+"
                              : movement.type === "ADJUSTMENT"
                              ? ""
                              : "-"}
                            {formatNumber(movement.quantity)}
                          </span>
                        ),
                      },
                      {
                        header: "Sonrasi",
                        className: "text-right",
                        cell: (movement) => (
                          <span className="font-mono">
                            {movement.resultingStock != null
                              ? `${formatNumber(movement.resultingStock)} ${
                                  movement.ingredientUnitAbbreviation ?? ""
                                }`
                              : "-"}
                          </span>
                        ),
                      },
                      {
                        header: "Not",
                        cell: (movement) => (
                          <span className="text-muted-foreground">
                            {movement.reason || movement.notes || "-"}
                          </span>
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
                          <span className="inline-flex items-center gap-1 text-sm font-medium">
                            {getMovementIcon(movement.type)}
                            {getMovementLabel(movement.type)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                              Miktar
                            </p>
                            <p className="mt-1 font-mono font-medium text-foreground">
                              {formatNumber(movement.quantity)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                              Sonrasi
                            </p>
                            <p className="mt-1 font-mono text-foreground">
                              {movement.resultingStock != null
                                ? `${formatNumber(movement.resultingStock)} ${
                                    movement.ingredientUnitAbbreviation ?? ""
                                  }`
                                : "-"}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {movement.reason || movement.notes || "Not bulunmuyor."}
                        </p>
                      </div>
                    )}
                  />

                  {movementMeta && movementMeta.totalPages > 1 ? (
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <p className="text-sm text-muted-foreground">
                        Toplam {movementMeta.total} hareket, Sayfa {movementMeta.page} /{" "}
                        {movementMeta.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={movementPage <= 1}
                          onClick={() => setMovementPage((current) => current - 1)}
                        >
                          Onceki
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={movementPage >= movementMeta.totalPages}
                          onClick={() => setMovementPage((current) => current + 1)}
                        >
                          Sonraki
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === "counts" ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sayim ve malzeme takibi</CardTitle>
              <CardDescription>
                Son sayim, son hareket ve son 30 gun tuketimi ile stok kalitesini izleyin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr] xl:grid-cols-[1.4fr_0.6fr_0.6fr]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Malzeme ara..."
                    value={inventorySearch}
                    onChange={(event) => {
                      setInventorySearch(event.target.value);
                      setInventoryPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
                <SearchableSelect
                  options={[
                    { value: "all", label: "Tum kayitlar" },
                    { value: "low", label: "Dusuk stok" },
                    { value: "negative", label: "Negatif stok" },
                    { value: "uncounted", label: "Sayimi eksik" },
                  ]}
                  value={countFilter}
                  onChange={(value) => setCountFilter(String(value) as CountFilter)}
                  placeholder="Sayim filtresi"
                  searchPlaceholder="Filtre ara..."
                />
                <Button variant="outline" onClick={() => inventoryQuery.refetch()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Listeyi yenile
                </Button>
              </div>

              {inventoryQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Yukleniyor...</p>
              ) : !filteredInventoryItems.length ? (
                <p className="text-sm text-muted-foreground">
                  Secilen filtreye uygun malzeme bulunmuyor.
                </p>
              ) : (
                <>
                  <ResponsiveDataTable
                    data={filteredInventoryItems}
                    getKey={(item) => item.id}
                    columns={[
                      {
                        header: "Malzeme",
                        cell: (item) => (
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.type}</p>
                          </div>
                        ),
                      },
                      {
                        header: "Stok",
                        cell: (item) => (
                          <span
                            className={`font-medium ${
                              item.isNegativeStock
                                ? "text-amber-600"
                                : item.isLowStock
                                ? "text-destructive"
                                : "text-foreground"
                            }`}
                          >
                            {formatNumber(item.currentStock)} {item.unit?.abbreviation ?? ""}
                          </span>
                        ),
                      },
                      {
                        header: "Esik",
                        cell: (item) => (
                          <span>
                            {formatNumber(item.lowStockThreshold)} {item.unit?.abbreviation ?? ""}
                          </span>
                        ),
                      },
                      {
                        header: "30g Cikis",
                        cell: (item) => <span>{formatNumber(item.consumptionLast30Days)}</span>,
                      },
                      {
                        header: "30g Fire",
                        cell: (item) => <span>{formatNumber(item.wasteLast30Days)}</span>,
                      },
                      {
                        header: "Son sayim",
                        cell: (item) => (
                          <span className="text-muted-foreground">
                            {item.lastCountedAt ? formatDate(item.lastCountedAt) : "Yok"}
                          </span>
                        ),
                      },
                      {
                        header: "Aksiyon",
                        className: "text-right",
                        cell: (item) => (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDetailIngredientId(item.id)}
                            >
                              Detay
                            </Button>
                            <Button size="sm" onClick={() => openCountDrawer(item)}>
                              Sayim
                            </Button>
                          </div>
                        ),
                      },
                    ]}
                    mobileCard={(item) => (
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{item.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{item.type}</p>
                          </div>
                          <Button size="sm" onClick={() => openCountDrawer(item)}>
                            Sayim
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                              Stok
                            </p>
                            <p className="mt-1 font-medium text-foreground">
                              {formatNumber(item.currentStock)} {item.unit?.abbreviation ?? ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                              Son sayim
                            </p>
                            <p className="mt-1 text-foreground">
                              {item.lastCountedAt ? formatDate(item.lastCountedAt) : "Yok"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  />

                  {inventoryQuery.data?.meta && inventoryQuery.data.meta.totalPages > 1 ? (
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <p className="text-sm text-muted-foreground">
                        Toplam {inventoryQuery.data.meta.total} malzeme, Sayfa{" "}
                        {inventoryQuery.data.meta.page} / {inventoryQuery.data.meta.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={inventoryPage <= 1}
                          onClick={() => setInventoryPage((current) => current - 1)}
                        >
                          Onceki
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={inventoryPage >= inventoryQuery.data.meta.totalPages}
                          onClick={() => setInventoryPage((current) => current + 1)}
                        >
                          Sonraki
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === "procurement" ? (
        <div className="space-y-6">
          {!canManageProcurement ? (
            <Card>
              <CardContent className="py-10 text-sm text-muted-foreground">
                Tedarik alanini gorebilirsiniz ancak create/update islemleri sadece owner ve manager
                rollerine acik.
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Tedarikciler</CardTitle>
                    <CardDescription>Magazaya bagli supplier kayitlari.</CardDescription>
                  </div>
                  {canManageProcurement ? (
                    <Button variant="outline" onClick={() => setShowSupplierDrawer(true)}>
                      Yeni tedarikci
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {suppliersQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Yukleniyor...</p>
                ) : !suppliers.length ? (
                  <p className="text-sm text-muted-foreground">Henuz tedarikci kaydi bulunmuyor.</p>
                ) : (
                  suppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="rounded-[1.25rem] border border-border bg-muted/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{supplier.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {supplier.contactName || supplier.email || supplier.phone || "Iletisim girilmedi"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              supplier.isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {supplier.isActive ? "Aktif" : "Pasif"}
                          </span>
                          {canManageProcurement ? (
                            <Button size="sm" variant="outline" onClick={() => openEditSupplierDrawer(supplier)}>
                              Duzenle
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {supplierMeta && supplierMeta.totalPages > 1 ? (
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={supplierPage <= 1}
                      onClick={() => setSupplierPage((current) => current - 1)}
                    >
                      Onceki
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={supplierPage >= supplierMeta.totalPages}
                      onClick={() => setSupplierPage((current) => current + 1)}
                    >
                      Sonraki
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Satin alma ve mal kabul</CardTitle>
                    <CardDescription>
                      Fatura bazli girisler stok movement kaydi ile birlikte islenir.
                    </CardDescription>
                  </div>
                  {canManageProcurement ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => openPurchaseSuggestionDrawer(lowStockSuggestions)}
                        disabled={!lowStockSuggestions.length}
                      >
                        Dusuk stok onerisi
                      </Button>
                      <Button onClick={() => setShowPurchaseDrawer(true)}>Mal kabul gir</Button>
                    </div>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {purchasesQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Yukleniyor...</p>
                ) : !purchases.length ? (
                  <p className="text-sm text-muted-foreground">Henuz satin alma kaydi bulunmuyor.</p>
                ) : (
                  purchases.map((receipt) => (
                    <div
                      key={receipt.id}
                      className="rounded-[1.25rem] border border-border bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {receipt.supplier?.name ?? "Tedarikci secilmedi"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {receipt.invoiceNumber
                              ? `Fatura: ${receipt.invoiceNumber}`
                              : "Fatura no girilmedi"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            {formatCurrency(receipt.totalAmount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(receipt.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        {receipt.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-sm text-muted-foreground"
                          >
                            <span>{item.ingredientName}</span>
                            <span>
                              {formatNumber(item.quantity)} {item.unitAbbreviation || ""} x{" "}
                              {formatCurrency(item.unitCost)}
                            </span>
                          </div>
                        ))}
                        {receipt.items.length > 3 ? (
                          <p className="text-xs text-muted-foreground">
                            +{receipt.items.length - 3} satir daha
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}

                {purchaseMeta && purchaseMeta.totalPages > 1 ? (
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={purchasePage <= 1}
                      onClick={() => setPurchasePage((current) => current - 1)}
                    >
                      Onceki
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={purchasePage >= purchaseMeta.totalPages}
                      onClick={() => setPurchasePage((current) => current + 1)}
                    >
                      Sonraki
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      <AdminDrawer
        open={showMovementDrawer}
        onOpenChange={(open) => {
          if (!open) resetMovementDrawer();
        }}
        title="Yeni stok hareketi"
        description="Giris, cikis, duzeltme ve fire hareketlerini kaydedin."
      >
        <form className="space-y-6" onSubmit={handleMovementSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Malzeme</label>
              <SearchableSelect
                options={allIngredients.map((ingredient) => ({
                  value: ingredient.id,
                  label: ingredient.name,
                  keywords: [ingredient.type, ingredient.unit?.abbreviation ?? ""],
                }))}
                value={movementForm.ingredientId}
                onChange={(value) =>
                  setMovementForm((current) => ({ ...current, ingredientId: String(value) }))
                }
                placeholder="Malzeme secin"
                searchPlaceholder="Malzeme ara..."
                name="ingredientId"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Hareket tipi</label>
              <SearchableSelect
                options={MOVEMENT_TYPES.map((item) => ({
                  value: item.value,
                  label: item.label,
                }))}
                value={movementForm.type}
                onChange={(value) =>
                  setMovementForm((current) => ({ ...current, type: String(value) as MovementType }))
                }
                searchPlaceholder="Tip ara..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {movementForm.type === "ADJUSTMENT" ? "Sayilan son stok" : "Miktar"}
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={movementForm.quantity}
                onChange={(event) =>
                  setMovementForm((current) => ({ ...current, quantity: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Birim maliyeti</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={movementForm.unitCost}
                onChange={(event) =>
                  setMovementForm((current) => ({ ...current, unitCost: event.target.value }))
                }
                placeholder="Opsiyonel"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Referans no</label>
              <Input
                value={movementForm.referenceId}
                onChange={(event) =>
                  setMovementForm((current) => ({ ...current, referenceId: event.target.value }))
                }
                placeholder="Fatura, fiş, evrak no"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Not</label>
              <textarea
                value={movementForm.reason}
                onChange={(event) =>
                  setMovementForm((current) => ({ ...current, reason: event.target.value }))
                }
                rows={4}
                className="flex w-full rounded-[1rem] border border-input bg-background px-3 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Hareket sebebi veya aciklamasi"
              />
            </div>
          </div>

          {selectedMovementIngredient ? (
            <div className="rounded-[1.25rem] border border-border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Stok onizleme
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Mevcut stok</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {formatNumber(selectedMovementIngredient.currentStock)}{" "}
                    {selectedMovementIngredient.unit?.abbreviation ?? ""}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Islem sonrasi</p>
                  <p
                    className={`mt-1 text-lg font-semibold ${
                      (movementPreviewStock ?? 0) < 0 ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    {movementPreviewStock != null
                      ? `${formatNumber(movementPreviewStock)} ${
                          selectedMovementIngredient.unit?.abbreviation ?? ""
                        }`
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="sticky bottom-0 z-10 -mx-2 rounded-[1.4rem] border border-border/80 bg-background/92 p-3 shadow-[var(--card-shadow-hover)] backdrop-blur lg:mx-0">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={createMovement.isPending}>
                Kaydet
              </Button>
              <Button type="button" variant="outline" onClick={resetMovementDrawer}>
                Iptal
              </Button>
            </div>
          </div>
        </form>
      </AdminDrawer>

      <AdminDrawer
        open={showCountDrawer}
        onOpenChange={(open) => {
          if (!open) resetCountDrawer();
        }}
        title="Stok sayimi"
        description="Sayilan miktari girin, backend duzeltme hareketini otomatik olustursun."
      >
        <form className="space-y-6" onSubmit={handleCountSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Malzeme</label>
            <SearchableSelect
              options={allIngredients.map((ingredient) => ({
                value: ingredient.id,
                label: ingredient.name,
              }))}
              value={countForm.ingredientId}
              onChange={(value) =>
                setCountForm((current) => ({ ...current, ingredientId: String(value) }))
              }
              name="ingredientId"
              required
              placeholder="Malzeme secin"
              searchPlaceholder="Malzeme ara..."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mevcut stok</label>
              <Input
                value={
                  selectedCountIngredient
                    ? `${formatNumber(selectedCountIngredient.currentStock)} ${
                        selectedCountIngredient.unit?.abbreviation ?? ""
                      }`
                    : "-"
                }
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sayilan miktar</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={countForm.countedQuantity}
                onChange={(event) =>
                  setCountForm((current) => ({ ...current, countedQuantity: event.target.value }))
                }
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Not</label>
            <textarea
              value={countForm.notes}
              onChange={(event) =>
                setCountForm((current) => ({ ...current, notes: event.target.value }))
              }
              rows={4}
              className="flex w-full rounded-[1rem] border border-input bg-background px-3 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Sayim notlari"
            />
          </div>
          <div className="sticky bottom-0 z-10 -mx-2 rounded-[1.4rem] border border-border/80 bg-background/92 p-3 shadow-[var(--card-shadow-hover)] backdrop-blur lg:mx-0">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={createStockCount.isPending}>
                Sayimi isle
              </Button>
              <Button type="button" variant="outline" onClick={resetCountDrawer}>
                Iptal
              </Button>
            </div>
          </div>
        </form>
      </AdminDrawer>

      <AdminDrawer
        open={!!detailIngredientId}
        onOpenChange={(open) => {
          if (!open) setDetailIngredientId("");
        }}
        title={ingredientDetailQuery.data?.name ?? "Malzeme detayi"}
        description="Son hareketler, tuketim ve fire ozetini inceleyin."
      >
        {ingredientDetailQuery.isLoading || !ingredientDetailQuery.data ? (
          <p className="text-sm text-muted-foreground">Detay yukleniyor...</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Mevcut stok</CardDescription>
                  <CardTitle className="text-3xl">
                    {formatNumber(ingredientDetailQuery.data.currentStock)}{" "}
                    {ingredientDetailQuery.data.unit?.abbreviation ?? ""}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Son 30 gun</CardDescription>
                  <CardTitle className="text-lg">
                    Cikis {formatNumber(ingredientDetailQuery.data.consumption.totalOutLast30Days)}
                    {" / "}Fire {formatNumber(ingredientDetailQuery.data.consumption.wasteLast30Days)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <div className="rounded-[1.25rem] border border-border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Siparis kaynakli tuketim</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Son 30 gun siparis cikisi:{" "}
                {formatNumber(ingredientDetailQuery.data.consumption.orderOutLast30Days)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Son sayim:{" "}
                {ingredientDetailQuery.data.lastCountedAt
                  ? formatDate(ingredientDetailQuery.data.lastCountedAt)
                  : "Kayit yok"}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Son hareketler</p>
              {ingredientDetailQuery.data.recentMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="rounded-[1.15rem] border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="inline-flex items-center gap-2 font-medium text-foreground">
                        {getMovementIcon(movement.type)}
                        {getMovementLabel(movement.type)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {movement.createdByName ?? "Sistem"} - {formatDate(movement.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium text-foreground">
                        {formatNumber(movement.quantity)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Sonrasi{" "}
                        {movement.resultingStock != null
                          ? formatNumber(movement.resultingStock)
                          : "-"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {movement.reason || movement.notes || "Not bulunmuyor."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </AdminDrawer>

      <AdminDrawer
        open={showSupplierDrawer}
        onOpenChange={(open) => {
          if (!open) resetSupplierDrawer();
        }}
        title={editingSupplier ? "Tedarikciyi duzenle" : "Yeni tedarikci"}
        description="Supplier kaydini stok modulu icinde yonetin."
      >
        <form className="space-y-6" onSubmit={handleSupplierSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Tedarikci adi</label>
              <Input
                value={supplierForm.name}
                onChange={(event) =>
                  setSupplierForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Yetkili kisi</label>
              <Input
                value={supplierForm.contactName}
                onChange={(event) =>
                  setSupplierForm((current) => ({ ...current, contactName: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefon</label>
              <Input
                value={supplierForm.phone}
                onChange={(event) =>
                  setSupplierForm((current) => ({ ...current, phone: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">E-posta</label>
              <Input
                type="email"
                value={supplierForm.email}
                onChange={(event) =>
                  setSupplierForm((current) => ({ ...current, email: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Not</label>
              <textarea
                value={supplierForm.notes}
                onChange={(event) =>
                  setSupplierForm((current) => ({ ...current, notes: event.target.value }))
                }
                rows={4}
                className="flex w-full rounded-[1rem] border border-input bg-background px-3 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="sticky bottom-0 z-10 -mx-2 rounded-[1.4rem] border border-border/80 bg-background/92 p-3 shadow-[var(--card-shadow-hover)] backdrop-blur lg:mx-0">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={createSupplier.isPending || updateSupplier.isPending}>
                Kaydet
              </Button>
              <Button type="button" variant="outline" onClick={resetSupplierDrawer}>
                Iptal
              </Button>
            </div>
          </div>
        </form>
      </AdminDrawer>

      <AdminDrawer
        open={showPurchaseDrawer}
        onOpenChange={(open) => {
          if (!open) resetPurchaseDrawer();
        }}
        title="Mal kabul / satin alma girisi"
        description="Satir bazli alimlar stok hareketine otomatik cevrilir."
        contentClassName="lg:w-[min(54rem,calc(100vw-2rem))]"
      >
        <form className="space-y-6" onSubmit={handlePurchaseSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tedarikci</label>
              <SearchableSelect
                options={suppliers
                  .filter((supplier) => supplier.isActive)
                  .map((supplier) => ({
                    value: supplier.id,
                    label: supplier.name,
                  }))}
                value={purchaseForm.supplierId}
                onChange={(value) =>
                  setPurchaseForm((current) => ({ ...current, supplierId: String(value) }))
                }
                placeholder="Opsiyonel tedarikci"
                searchPlaceholder="Tedarikci ara..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fatura no</label>
              <Input
                value={purchaseForm.invoiceNumber}
                onChange={(event) =>
                  setPurchaseForm((current) => ({ ...current, invoiceNumber: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Not</label>
              <textarea
                value={purchaseForm.notes}
                onChange={(event) =>
                  setPurchaseForm((current) => ({ ...current, notes: event.target.value }))
                }
                rows={3}
                className="flex w-full rounded-[1rem] border border-input bg-background px-3 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Satirlar</p>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setPurchaseForm((current) => ({
                    ...current,
                    items: [...current.items, { ingredientId: "", quantity: "", unitCost: "" }],
                  }))
                }
              >
                Satir ekle
              </Button>
            </div>
            {purchaseForm.items.map((item, index) => (
              <div
                key={`${index}-${item.ingredientId}`}
                className="rounded-[1.25rem] border border-border bg-muted/20 p-4"
              >
                <div className="grid gap-3 lg:grid-cols-[1.2fr_0.5fr_0.5fr_auto]">
                  <SearchableSelect
                    options={allIngredients.map((ingredient) => ({
                      value: ingredient.id,
                      label: ingredient.name,
                    }))}
                    value={item.ingredientId}
                    onChange={(value) => updatePurchaseLine(index, { ingredientId: String(value) })}
                    placeholder="Malzeme secin"
                    searchPlaceholder="Malzeme ara..."
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.quantity}
                    onChange={(event) => updatePurchaseLine(index, { quantity: event.target.value })}
                    placeholder="Miktar"
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitCost}
                    onChange={(event) => updatePurchaseLine(index, { unitCost: event.target.value })}
                    placeholder="Birim maliyet"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={purchaseForm.items.length === 1}
                    onClick={() =>
                      setPurchaseForm((current) => ({
                        ...current,
                        items: current.items.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                  >
                    Sil
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[1.25rem] border border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Toplam tahmini maliyet</p>
              <p className="text-lg font-semibold text-foreground">{formatCurrency(purchaseTotal)}</p>
            </div>
          </div>

          <div className="sticky bottom-0 z-10 -mx-2 rounded-[1.4rem] border border-border/80 bg-background/92 p-3 shadow-[var(--card-shadow-hover)] backdrop-blur lg:mx-0">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={createPurchaseReceipt.isPending}>
                Kaydet
              </Button>
              <Button type="button" variant="outline" onClick={resetPurchaseDrawer}>
                Iptal
              </Button>
            </div>
          </div>
        </form>
      </AdminDrawer>
    </div>
  );
}
