"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  Gift,
  Loader2,
  Percent,
  Plus,
  Search,
  Tag,
} from "lucide-react";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import {
  type Campaign,
  type CampaignType,
  useCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
} from "@/hooks/use-campaigns";

const typeConfig: Record<
  CampaignType,
  { label: string; icon: typeof Percent; tone: string }
> = {
  PERCENTAGE: {
    label: "Yuzde indirim",
    icon: Percent,
    tone: "bg-blue-100 text-blue-700",
  },
  FIXED_AMOUNT: {
    label: "Sabit tutar",
    icon: Tag,
    tone: "bg-green-100 text-green-700",
  },
  BUY_X_GET_Y: {
    label: "X al Y ode",
    icon: Gift,
    tone: "bg-purple-100 text-purple-700",
  },
  HAPPY_HOUR: {
    label: "Happy hour",
    icon: Clock,
    tone: "bg-orange-100 text-orange-700",
  },
};

type CampaignFormState = {
  name: string;
  description: string;
  type: CampaignType;
  discountValue: string;
  minOrderAmount: string;
  buyQuantity: string;
  getQuantity: string;
  happyHourStart: string;
  happyHourEnd: string;
  startDate: string;
  endDate: string;
  couponCode: string;
  usageLimit: string;
  isActive: boolean;
  productIds: string[];
  categoryIds: string[];
};

const emptyForm: CampaignFormState = {
  name: "",
  description: "",
  type: "PERCENTAGE",
  discountValue: "",
  minOrderAmount: "",
  buyQuantity: "2",
  getQuantity: "1",
  happyHourStart: "",
  happyHourEnd: "",
  startDate: "",
  endDate: "",
  couponCode: "",
  usageLimit: "",
  isActive: true,
  productIds: [],
  categoryIds: [],
};

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  if (value.includes("T")) {
    return value.slice(0, 10);
  }

  return value;
}

function formatCampaignValue(campaign: Campaign) {
  if (campaign.type === "BUY_X_GET_Y") {
    return `${campaign.buyQuantity ?? 0} al ${campaign.getQuantity ?? 0} ode`;
  }

  if (campaign.type === "FIXED_AMOUNT") {
    return `${campaign.discountValue} TL`;
  }

  return `%${campaign.discountValue}`;
}

function buildFormFromCampaign(campaign: Campaign): CampaignFormState {
  return {
    name: campaign.name,
    description: campaign.description ?? "",
    type: campaign.type,
    discountValue: String(campaign.discountValue ?? ""),
    minOrderAmount: String(campaign.minOrderAmount ?? ""),
    buyQuantity: String(campaign.buyQuantity ?? 2),
    getQuantity: String(campaign.getQuantity ?? 1),
    happyHourStart: campaign.happyHourStart ?? "",
    happyHourEnd: campaign.happyHourEnd ?? "",
    startDate: toDateInputValue(campaign.startDate),
    endDate: toDateInputValue(campaign.endDate),
    couponCode: campaign.couponCode ?? "",
    usageLimit: String(campaign.usageLimit ?? ""),
    isActive: campaign.isActive,
    productIds: campaign.products.map((item) => item.id),
    categoryIds: campaign.categories.map((item) => item.id),
  };
}

export default function CampaignsPage() {
  const { activeStore, activeStoreId } = useCurrentStore();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [form, setForm] = useState<CampaignFormState>(emptyForm);
  const [formError, setFormError] = useState("");

  const {
    data: campaignResult,
    isLoading,
    isError,
    error,
    refetch,
  } = useCampaigns(activeStoreId ?? "", {
    pageSize: 100,
    search: search.trim() || undefined,
  });
  const { data: categories = [] } = useCategories(activeStoreId ?? "");
  const { data: productResult } = useProducts(activeStoreId ?? "", {
    pageSize: 100,
  });
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();

  const campaigns = campaignResult?.data ?? [];
  const products = productResult?.data ?? [];

  const activeCount = useMemo(
    () => campaigns.filter((campaign) => campaign.isActive).length,
    [campaigns]
  );
  const couponCount = useMemo(
    () => campaigns.filter((campaign) => campaign.couponCode).length,
    [campaigns]
  );
  const totalUsage = useMemo(
    () => campaigns.reduce((sum, campaign) => sum + (campaign.usedCount ?? 0), 0),
    [campaigns]
  );

  const isSaving = createCampaign.isPending || updateCampaign.isPending;

  const resetForm = () => {
    setForm(emptyForm);
    setEditingCampaign(null);
    setFormError("");
    setShowForm(false);
  };

  const openCreateForm = () => {
    setForm(emptyForm);
    setEditingCampaign(null);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setForm(buildFormFromCampaign(campaign));
    setFormError("");
    setShowForm(true);
  };

  const toggleSelection = (
    key: "productIds" | "categoryIds",
    value: string
  ) => {
    setForm((current) => {
      const items = current[key];
      return {
        ...current,
        [key]: items.includes(value)
          ? items.filter((item) => item !== value)
          : [...items, value],
      };
    });
  };

  const handleSubmit = async () => {
    if (!activeStoreId) {
      setFormError("Aktif magaza bulunamadi.");
      return;
    }

    if (!form.name.trim()) {
      setFormError("Kampanya adi zorunlu.");
      return;
    }

    if (!form.startDate || !form.endDate) {
      setFormError("Baslangic ve bitis tarihlerini doldurun.");
      return;
    }

    if (form.type === "BUY_X_GET_Y") {
      if (!Number(form.buyQuantity) || !Number(form.getQuantity)) {
        setFormError("X al Y ode kampanyasinda adetler zorunlu.");
        return;
      }
    } else if (!Number(form.discountValue) && Number(form.discountValue) !== 0) {
      setFormError("Indirim degerini girin.");
      return;
    }

    if (
      form.type === "HAPPY_HOUR" &&
      (!form.happyHourStart || !form.happyHourEnd)
    ) {
      setFormError("Happy hour icin saat araligini girin.");
      return;
    }

    setFormError("");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      type: form.type,
      discountValue:
        form.type === "BUY_X_GET_Y" ? 0 : Number(form.discountValue || 0),
      minOrderAmount: Number(form.minOrderAmount || 0) || undefined,
      buyQuantity:
        form.type === "BUY_X_GET_Y" ? Number(form.buyQuantity || 0) : undefined,
      getQuantity:
        form.type === "BUY_X_GET_Y" ? Number(form.getQuantity || 0) : undefined,
      happyHourStart:
        form.type === "HAPPY_HOUR" ? form.happyHourStart || undefined : undefined,
      happyHourEnd:
        form.type === "HAPPY_HOUR" ? form.happyHourEnd || undefined : undefined,
      startDate: form.startDate,
      endDate: form.endDate,
      couponCode: form.couponCode.trim() || undefined,
      usageLimit: Number(form.usageLimit || 0) || undefined,
      productIds: form.productIds,
      categoryIds: form.categoryIds,
    };

    try {
      if (editingCampaign) {
        await updateCampaign.mutateAsync({
          id: editingCampaign.id,
          ...payload,
          isActive: form.isActive,
        });
      } else {
        await createCampaign.mutateAsync({
          storeId: activeStoreId,
          ...payload,
        });
      }

      resetForm();
    } catch (mutationError) {
      setFormError(
        mutationError instanceof Error
          ? mutationError.message
          : "Kampanya kaydedilemedi."
      );
    }
  };

  const handleToggleActive = async (campaign: Campaign) => {
    try {
      await updateCampaign.mutateAsync({
        id: campaign.id,
        isActive: !campaign.isActive,
      });
    } catch {
      // Inline state is enough here; failure is reflected on refetch.
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Kampanyalar"
        description={
          activeStore?.name
            ? `${activeStore.name} icin indirim ve kupon akisini yonetin.`
            : "Aktif magazaya ait kampanyalari yonetin."
        }
        action={
          <>
            <Button variant="outline" onClick={() => refetch()}>
              Yenile
            </Button>
            <Button onClick={openCreateForm}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni kampanya
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/80 bg-card/85 shadow-[var(--card-shadow)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam kampanya
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/85 shadow-[var(--card-shadow)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktif kampanya
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/85 shadow-[var(--card-shadow)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam kullanim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {couponCount} kampanyada kupon kodu tanimli
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 bg-card/85 shadow-[var(--card-shadow)]">
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Kampanya ara..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <AdminDrawer
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            resetForm();
          }
        }}
        title={editingCampaign ? "Kampanya duzenle" : "Yeni kampanya"}
        description="Indirim, kupon ve happy hour akisini sag panelden yonetin."
        contentClassName="lg:w-[min(54rem,calc(100vw-2rem))]"
      >
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2 xl:col-span-2">
                <label className="text-sm font-medium">Kampanya adi</label>
                <Input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Ornek: Ogle indirimi"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kampanya tipi</label>
                <SearchableSelect
                  options={[
                    { value: "PERCENTAGE", label: "Yuzde indirim" },
                    { value: "FIXED_AMOUNT", label: "Sabit tutar" },
                    { value: "BUY_X_GET_Y", label: "X al Y ode" },
                    { value: "HAPPY_HOUR", label: "Happy hour" },
                  ]}
                  value={form.type}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      type: String(value) as CampaignType,
                    }))
                  }
                  searchPlaceholder="Kampanya tipi ara..."
                />
              </div>

              <div className="space-y-2 md:col-span-2 xl:col-span-3">
                <label className="text-sm font-medium">Aciklama</label>
                <textarea
                  className="flex min-h-28 w-full rounded-[1rem] border border-input bg-background px-3 py-3 text-sm"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Kampanyanin ne zaman ve nasil calistigini aciklayin"
                />
              </div>

              {form.type === "BUY_X_GET_Y" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kac alinsin</label>
                    <Input
                      type="number"
                      min={1}
                      value={form.buyQuantity}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          buyQuantity: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kac ode</label>
                    <Input
                      type="number"
                      min={1}
                      value={form.getQuantity}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          getQuantity: event.target.value,
                        }))
                      }
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Indirim degeri {form.type === "FIXED_AMOUNT" ? "(TL)" : "(%)"}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={form.discountValue}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        discountValue: event.target.value,
                      }))
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Min. siparis tutari</label>
                <Input
                  type="number"
                  min={0}
                  value={form.minOrderAmount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      minOrderAmount: event.target.value,
                    }))
                  }
                  placeholder="Bos birakirsan sinir olmaz"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Kupon kodu</label>
                <Input
                  value={form.couponCode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      couponCode: event.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="Opsiyonel"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Baslangic tarihi</label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bitis tarihi</label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                />
              </div>

              {form.type === "HAPPY_HOUR" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Baslangic saati</label>
                    <Input
                      type="time"
                      value={form.happyHourStart}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          happyHourStart: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bitis saati</label>
                    <Input
                      type="time"
                      value={form.happyHourEnd}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          happyHourEnd: event.target.value,
                        }))
                      }
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Kullanim limiti</label>
                <Input
                  type="number"
                  min={0}
                  value={form.usageLimit}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      usageLimit: event.target.value,
                    }))
                  }
                  placeholder="Bos birakirsan limitsiz"
                />
              </div>

              <div className="flex items-center gap-3 rounded-[1rem] border border-border bg-secondary/40 px-4 py-3">
                <label className="text-sm font-medium">Aktif</label>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.isActive ? "bg-primary" : "bg-gray-300"
                  }`}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      isActive: !current.isActive,
                    }))
                  }
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="border-border/70">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Bagli kategoriler</CardTitle>
                </CardHeader>
                <CardContent className="max-h-72 space-y-2 overflow-auto">
                  {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Henuz kategori yok.
                    </p>
                  ) : (
                    categories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center gap-3 rounded-[1rem] border border-border px-3 py-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={form.categoryIds.includes(category.id)}
                          onChange={() =>
                            toggleSelection("categoryIds", category.id)
                          }
                        />
                        <span>{category.name}</span>
                      </label>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Bagli urunler</CardTitle>
                </CardHeader>
                <CardContent className="max-h-72 space-y-2 overflow-auto">
                  {products.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Henuz urun yok.
                    </p>
                  ) : (
                    products.map((product) => (
                      <label
                        key={product.id}
                        className="flex items-center gap-3 rounded-[1rem] border border-border px-3 py-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={form.productIds.includes(product.id)}
                          onChange={() =>
                            toggleSelection("productIds", product.id)
                          }
                        />
                        <span>{product.name}</span>
                      </label>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {formError && (
              <div className="rounded-[1rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {formError}
              </div>
            )}

            <div className="sticky bottom-3 z-10 -mx-2 rounded-[1.4rem] border border-border/80 bg-background/92 p-3 shadow-[var(--card-shadow-hover)] backdrop-blur xl:static xl:mx-0 xl:rounded-none xl:border-0 xl:bg-transparent xl:p-0 xl:shadow-none">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={handleSubmit} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCampaign ? "Guncelle" : "Kaydet"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Iptal
                </Button>
              </div>
            </div>
        </div>
      </AdminDrawer>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Kampanyalar yukleniyor...
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="py-10 text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : "Kampanyalar alinamadi."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.length === 0 ? (
            <Card className="md:col-span-2 xl:col-span-3">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Kampanya bulunamadi. Ilk kampanyayi olusturarak baslayin.
              </CardContent>
            </Card>
          ) : (
            campaigns.map((campaign) => {
              const config = typeConfig[campaign.type];
              const TypeIcon = config.icon;

              return (
                <Card
                  key={campaign.id}
                  className={!campaign.isActive ? "opacity-60" : undefined}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">
                          {campaign.name}
                        </CardTitle>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {campaign.description || "Aciklama eklenmedi."}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.tone}`}
                      >
                        <TypeIcon className="h-3 w-3" />
                        {config.label}
                      </span>
                      <span className="text-sm font-semibold">
                        {formatCampaignValue(campaign)}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {toDateInputValue(campaign.startDate)} -{" "}
                          {toDateInputValue(campaign.endDate)}
                        </span>
                      </div>
                      {campaign.type === "HAPPY_HOUR" &&
                        campaign.happyHourStart &&
                        campaign.happyHourEnd && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {campaign.happyHourStart} - {campaign.happyHourEnd}
                            </span>
                          </div>
                        )}
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        <span>
                          {campaign.usedCount} /{" "}
                          {campaign.usageLimit ? campaign.usageLimit : "limitsiz"}{" "}
                          kullanim
                        </span>
                      </div>
                      {campaign.minOrderAmount ? (
                        <div>Min. siparis: {campaign.minOrderAmount} TL</div>
                      ) : null}
                      {campaign.couponCode ? (
                        <div>Kupon: {campaign.couponCode}</div>
                      ) : null}
                    </div>

                    {(campaign.categories.length > 0 || campaign.products.length > 0) && (
                      <div className="space-y-2 border-t pt-3 text-xs text-muted-foreground">
                        {campaign.categories.length > 0 && (
                          <p>
                            Kategoriler:{" "}
                            {campaign.categories.map((item) => item.name).join(", ")}
                          </p>
                        )}
                        {campaign.products.length > 0 && (
                          <p>
                            Urunler:{" "}
                            {campaign.products.map((item) => item.name).join(", ")}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t pt-3">
                      <button
                        type="button"
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          campaign.isActive ? "bg-primary" : "bg-gray-300"
                        }`}
                        onClick={() => handleToggleActive(campaign)}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            campaign.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditForm(campaign)}
                        >
                          Duzenle
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
