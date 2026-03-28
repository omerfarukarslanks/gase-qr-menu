"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, CreditCard, Globe, Loader2, Save, Store, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCurrentStore } from "@/hooks/use-current-store";
import {
  useAddStoreLanguage,
  useRemoveStoreLanguage,
  useSetDefaultStoreLanguage,
  useStoreLanguages,
} from "@/hooks/use-i18n";
import { useStore, useUpdateStore } from "@/hooks/use-stores";

const tabs = [
  { key: "store", label: "Magaza Bilgileri", icon: Store },
  { key: "operations", label: "Operasyon", icon: Clock3 },
  { key: "payment", label: "Odeme Ayarlari", icon: CreditCard },
  { key: "language", label: "Dil Ayarlari", icon: Globe },
  { key: "staff", label: "Personel", icon: Users },
] as const;

type TabKey = (typeof tabs)[number]["key"];

interface StoreFormState {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo: string;
}

interface PaymentFormState {
  iyzicoApiKey: string;
  iyzicoSecretKey: string;
  isSandbox: boolean;
}

interface WorkingHourState {
  day: string;
  label: string;
  enabled: boolean;
  open: string;
  close: string;
}

interface OperationsFormState {
  isStoreActive: boolean;
  isPubliclyVisible: boolean;
  workingHours: WorkingHourState[];
}

const workingDayDefinitions = [
  { day: "monday", label: "Pazartesi" },
  { day: "tuesday", label: "Sali" },
  { day: "wednesday", label: "Carsamba" },
  { day: "thursday", label: "Persembe" },
  { day: "friday", label: "Cuma" },
  { day: "saturday", label: "Cumartesi" },
  { day: "sunday", label: "Pazar" },
] as const;

const emptyStoreForm: StoreFormState = {
  name: "",
  address: "",
  phone: "",
  email: "",
  logo: "",
};

const emptyPaymentForm: PaymentFormState = {
  iyzicoApiKey: "",
  iyzicoSecretKey: "",
  isSandbox: true,
};

const defaultWorkingHours: WorkingHourState[] = workingDayDefinitions.map((day) => ({
  ...day,
  enabled: true,
  open: "09:00",
  close: "22:00",
}));

const emptyOperationsForm: OperationsFormState = {
  isStoreActive: true,
  isPubliclyVisible: true,
  workingHours: defaultWorkingHours,
};

function getErrorMessage(error: unknown) {
  if (!error) {
    return "Islem tamamlanamadi.";
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string | string[] } } }).response?.data
      ?.message !== "undefined"
  ) {
    const message = (error as { response?: { data?: { message?: string | string[] } } })
      .response?.data?.message;
    return Array.isArray(message) ? message.join(", ") : message || "Islem tamamlanamadi.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Islem tamamlanamadi.";
}

function getSettingsObject(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function getWorkingHours(value: unknown): WorkingHourState[] {
  const workingHours = Array.isArray(value) ? value : [];

  return workingDayDefinitions.map((dayDefinition) => {
    const current = workingHours.find(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        "day" in entry &&
        typeof (entry as { day?: unknown }).day === "string" &&
        (entry as { day: string }).day.toLowerCase() === dayDefinition.day
    ) as
      | {
          day?: string;
          enabled?: boolean;
          open?: string;
          close?: string;
        }
      | undefined;

    return {
      ...dayDefinition,
      enabled: typeof current?.enabled === "boolean" ? current.enabled : true,
      open: typeof current?.open === "string" ? current.open : "09:00",
      close: typeof current?.close === "string" ? current.close : "22:00",
    };
  });
}

function getVisibilitySettings(value: unknown) {
  const visibility = getSettingsObject(value);

  return {
    isPubliclyVisible:
      typeof visibility.isPubliclyVisible === "boolean" ? visibility.isPubliclyVisible : true,
  };
}

export default function SettingsPage() {
  const { activeStoreId, activeStore } = useCurrentStore();
  const [activeTab, setActiveTab] = useState<TabKey>("store");
  const [storeForm, setStoreForm] = useState<StoreFormState>(emptyStoreForm);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(emptyPaymentForm);
  const [operationsForm, setOperationsForm] = useState<OperationsFormState>(emptyOperationsForm);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const storeQuery = useStore(activeStoreId ?? "");
  const languagesQuery = useStoreLanguages(activeStoreId ?? "");
  const updateStore = useUpdateStore();
  const addStoreLanguage = useAddStoreLanguage();
  const removeStoreLanguage = useRemoveStoreLanguage();
  const setDefaultLanguage = useSetDefaultStoreLanguage();

  const isBusy =
    updateStore.isPending ||
    addStoreLanguage.isPending ||
    removeStoreLanguage.isPending ||
    setDefaultLanguage.isPending;

  const storeSettings = useMemo(
    () => getSettingsObject(storeQuery.data?.settings),
    [storeQuery.data?.settings]
  );

  useEffect(() => {
    if (!storeQuery.data) {
      setStoreForm(emptyStoreForm);
      setPaymentForm(emptyPaymentForm);
      setOperationsForm(emptyOperationsForm);
      return;
    }

    const nextStoreForm = {
      name: storeQuery.data.name ?? "",
      address: storeQuery.data.address ?? "",
      phone: storeQuery.data.phone ?? "",
      email: storeQuery.data.email ?? "",
      logo: storeQuery.data.logo ?? "",
    };

    const paymentSettings = getSettingsObject(storeSettings.payment);
    const visibilitySettings = getVisibilitySettings(storeSettings.visibility);
    const nextPaymentForm = {
      iyzicoApiKey:
        typeof paymentSettings.iyzicoApiKey === "string"
          ? paymentSettings.iyzicoApiKey
          : "",
      iyzicoSecretKey:
        typeof paymentSettings.iyzicoSecretKey === "string"
          ? paymentSettings.iyzicoSecretKey
          : "",
      isSandbox:
        typeof paymentSettings.isSandbox === "boolean"
          ? paymentSettings.isSandbox
          : true,
    };
    const nextOperationsForm = {
      isStoreActive:
        typeof storeQuery.data.isActive === "boolean" ? storeQuery.data.isActive : true,
      isPubliclyVisible: visibilitySettings.isPubliclyVisible,
      workingHours: getWorkingHours(storeSettings.workingHours),
    };

    setStoreForm(nextStoreForm);
    setPaymentForm(nextPaymentForm);
    setOperationsForm(nextOperationsForm);
  }, [storeQuery.data, storeSettings.payment, storeSettings.visibility, storeSettings.workingHours]);

  useEffect(() => {
    setSuccessMessage("");
    setErrorMessage("");
  }, [activeStoreId, activeTab]);

  function handleStoreSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!activeStoreId) {
      setErrorMessage("Devam etmek icin aktif magaza secin.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    updateStore.mutate(
      {
        id: activeStoreId,
        name: storeForm.name.trim(),
        address: storeForm.address.trim() || undefined,
        phone: storeForm.phone.trim() || undefined,
        email: storeForm.email.trim() || undefined,
        logo: storeForm.logo.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSuccessMessage("Magaza bilgileri kaydedildi.");
          storeQuery.refetch();
        },
        onError: (error) => {
          setErrorMessage(getErrorMessage(error));
        },
      }
    );
  }

  function handlePaymentSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!activeStoreId) {
      setErrorMessage("Devam etmek icin aktif magaza secin.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    updateStore.mutate(
      {
        id: activeStoreId,
        settings: {
          ...storeSettings,
          payment: {
            iyzicoApiKey: paymentForm.iyzicoApiKey.trim(),
            iyzicoSecretKey: paymentForm.iyzicoSecretKey.trim(),
            isSandbox: paymentForm.isSandbox,
          },
        },
      },
      {
        onSuccess: () => {
          setSuccessMessage("Odeme ayarlari kaydedildi.");
          storeQuery.refetch();
        },
        onError: (error) => {
          setErrorMessage(getErrorMessage(error));
        },
      }
    );
  }

  function handleOperationsSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!activeStoreId) {
      setErrorMessage("Devam etmek icin aktif magaza secin.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    updateStore.mutate(
      {
        id: activeStoreId,
        isActive: operationsForm.isStoreActive,
        settings: {
          ...storeSettings,
          visibility: {
            ...getVisibilitySettings(storeSettings.visibility),
            isPubliclyVisible: operationsForm.isPubliclyVisible,
          },
          workingHours: operationsForm.workingHours.map((day) => ({
            day: day.day,
            enabled: day.enabled,
            open: day.open,
            close: day.close,
          })),
        },
      },
      {
        onSuccess: () => {
          setSuccessMessage("Calisma saatleri ve gorunurluk ayarlari kaydedildi.");
          storeQuery.refetch();
        },
        onError: (error) => {
          setErrorMessage(getErrorMessage(error));
        },
      }
    );
  }

  function handleToggleLanguage(code: string, name: string, isActive: boolean, isDefault: boolean) {
    if (!activeStoreId || isBusy) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    if (isDefault) {
      setErrorMessage("Varsayilan dil kaldirilamaz.");
      return;
    }

    if (isActive) {
      removeStoreLanguage.mutate(
        { storeId: activeStoreId, languageCode: code },
        {
          onSuccess: () => {
            setSuccessMessage(`${name} dili magaza listesinden kaldirildi.`);
          },
          onError: (error) => {
            setErrorMessage(getErrorMessage(error));
          },
        }
      );
      return;
    }

    addStoreLanguage.mutate(
      {
        storeId: activeStoreId,
        languageCode: code,
        name,
      },
      {
        onSuccess: () => {
          setSuccessMessage(`${name} dili aktif edildi.`);
        },
        onError: (error) => {
          setErrorMessage(getErrorMessage(error));
        },
      }
    );
  }

  function handleSetDefaultLanguage(code: string, name: string, isDefault: boolean) {
    if (!activeStoreId || isBusy || isDefault) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    setDefaultLanguage.mutate(
      { storeId: activeStoreId, languageCode: code },
      {
        onSuccess: () => {
          setSuccessMessage(`${name} varsayilan dil yapildi.`);
          storeQuery.refetch();
        },
        onError: (error) => {
          setErrorMessage(getErrorMessage(error));
        },
      }
    );
  }

  if (!activeStoreId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
          <p className="text-muted-foreground">
            Ayarlari duzenlemek icin once aktif bir magaza secin.
          </p>
        </div>

        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">
            Sol ustteki magaza seciciden bir sube secerek devam edebilirsiniz.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-muted-foreground">
          {activeStore
            ? `${activeStore.name} icin magaza, operasyon, odeme ve dil ayarlarini yonetin.`
            : "Magaza, operasyon, odeme ve dil ayarlarini yapilandirin."}
        </p>
      </div>

      {successMessage ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="py-3 text-sm text-emerald-700">{successMessage}</CardContent>
        </Card>
      ) : null}

      {errorMessage ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-3 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon className="mr-2 h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "store" && (
        <Card>
          <CardHeader>
            <CardTitle>Magaza Bilgileri</CardTitle>
            <CardDescription>
              Magazanizin temel bilgilerini guncelleyin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {storeQuery.isLoading ? (
              <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Magaza bilgileri yukleniyor...
              </div>
            ) : (
              <form
                onSubmit={handleStoreSubmit}
                className="max-w-lg space-y-4"
                onInvalidCapture={(event) =>
                  event.currentTarget.classList.add("form-validation-submitted")
                }
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Magaza Adi</label>
                  <Input
                    required
                    placeholder="orn. GASE Restaurant"
                    value={storeForm.name}
                    onChange={(event) =>
                      setStoreForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Adres</label>
                  <Input
                    placeholder="Magaza adresi"
                    value={storeForm.address}
                    onChange={(event) =>
                      setStoreForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Telefon</label>
                    <Input
                      placeholder="+90 5xx xxx xx xx"
                      value={storeForm.phone}
                      onChange={(event) =>
                        setStoreForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      placeholder="info@restoran.com"
                      value={storeForm.email}
                      onChange={(event) =>
                        setStoreForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Logo URL</label>
                  <Input
                    placeholder="Logo dosya yolu veya URL"
                    value={storeForm.logo}
                    onChange={(event) =>
                      setStoreForm((current) => ({ ...current, logo: event.target.value }))
                    }
                  />
                </div>
                <Button type="submit" disabled={isBusy}>
                  <Save className="mr-2 h-4 w-4" />
                  Kaydet
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "operations" && (
        <form onSubmit={handleOperationsSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gorunurluk</CardTitle>
              <CardDescription>
                Magazanin aktifligini ve musteri menusu yayininin acik olup olmadigini yonetin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {storeQuery.isLoading ? (
                <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Operasyon ayarlari yukleniyor...
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Magaza aktif</div>
                      <p className="text-sm text-muted-foreground">
                        Kapali oldugunda admin tarafinda veriler kalir ancak sube operasyonel olarak
                        pasif kabul edilir.
                      </p>
                    </div>
                    <Switch
                      checked={operationsForm.isStoreActive}
                      onCheckedChange={(checked) =>
                        setOperationsForm((current) => ({
                          ...current,
                          isStoreActive: checked,
                        }))
                      }
                      disabled={isBusy}
                    />
                  </div>

                  <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Musteri menusu yayinda</div>
                      <p className="text-sm text-muted-foreground">
                        Kapatildiginda QR menusu ve urun detaylari public tarafta erisilemez olur.
                      </p>
                    </div>
                    <Switch
                      checked={operationsForm.isPubliclyVisible}
                      onCheckedChange={(checked) =>
                        setOperationsForm((current) => ({
                          ...current,
                          isPubliclyVisible: checked,
                        }))
                      }
                      disabled={isBusy}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calisma Saatleri</CardTitle>
              <CardDescription>
                Her gun icin acilis ve kapanis saatlerini belirleyin. Bu veri simdilik ayarlarda
                saklanir ve musteri deneyiminde kullanima hazirdir.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {storeQuery.isLoading ? (
                <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calisma saatleri yukleniyor...
                </div>
              ) : (
                <>
                  {operationsForm.workingHours.map((day, index) => (
                    <div
                      key={day.day}
                      className="grid gap-3 rounded-xl border p-4 md:grid-cols-[180px_1fr_1fr_auto]"
                    >
                      <div className="flex items-center justify-between gap-3 md:block">
                        <div className="text-sm font-medium">{day.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {day.enabled ? "Acilis gunu" : "Kapali"}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Acilis
                        </label>
                        <Input
                          type="time"
                          value={day.open}
                          disabled={!day.enabled || isBusy}
                          onChange={(event) =>
                            setOperationsForm((current) => ({
                              ...current,
                              workingHours: current.workingHours.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, open: event.target.value }
                                  : entry
                              ),
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Kapanis
                        </label>
                        <Input
                          type="time"
                          value={day.close}
                          disabled={!day.enabled || isBusy}
                          onChange={(event) =>
                            setOperationsForm((current) => ({
                              ...current,
                              workingHours: current.workingHours.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, close: event.target.value }
                                  : entry
                              ),
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between gap-3 md:justify-end">
                        <span className="text-xs text-muted-foreground">
                          {day.enabled ? "Acik" : "Kapali"}
                        </span>
                        <Switch
                          checked={day.enabled}
                          onCheckedChange={(checked) =>
                            setOperationsForm((current) => ({
                              ...current,
                              workingHours: current.workingHours.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, enabled: checked }
                                  : entry
                              ),
                            }))
                          }
                          disabled={isBusy}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    Magaza saatleri{" "}
                    <span className="font-medium text-foreground">
                      {storeQuery.data?.timezone ?? "Europe/Istanbul"}
                    </span>{" "}
                    zaman dilimine gore saklanir.
                  </div>

                  <Button type="submit" disabled={isBusy}>
                    <Save className="mr-2 h-4 w-4" />
                    Operasyon Ayarlarini Kaydet
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </form>
      )}

      {activeTab === "payment" && (
        <Card>
          <CardHeader>
            <CardTitle>Odeme Ayarlari</CardTitle>
            <CardDescription>
              iyzico odeme entegrasyonu ayarlari store settings uzerinden saklanir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {storeQuery.isLoading ? (
              <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Odeme ayarlari yukleniyor...
              </div>
            ) : (
              <form
                onSubmit={handlePaymentSubmit}
                className="max-w-lg space-y-4"
                onInvalidCapture={(event) =>
                  event.currentTarget.classList.add("form-validation-submitted")
                }
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">iyzico API Key</label>
                  <Input
                    type="password"
                    placeholder="API anahtarinizi girin"
                    value={paymentForm.iyzicoApiKey}
                    onChange={(event) =>
                      setPaymentForm((current) => ({
                        ...current,
                        iyzicoApiKey: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">iyzico Secret Key</label>
                  <Input
                    type="password"
                    placeholder="Secret anahtarinizi girin"
                    value={paymentForm.iyzicoSecretKey}
                    onChange={(event) =>
                      setPaymentForm((current) => ({
                        ...current,
                        iyzicoSecretKey: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="sandbox"
                    checked={paymentForm.isSandbox}
                    onChange={(event) =>
                      setPaymentForm((current) => ({
                        ...current,
                        isSandbox: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-input"
                  />
                  <label htmlFor="sandbox" className="text-sm font-medium">
                    Sandbox Modu (Test ortami)
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sandbox: https://sandbox-api.iyzipay.com | Production: https://api.iyzipay.com
                </p>
                <Button type="submit" disabled={isBusy}>
                  <Save className="mr-2 h-4 w-4" />
                  Kaydet
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "language" && (
        <Card>
          <CardHeader>
            <CardTitle>Dil Ayarlari</CardTitle>
            <CardDescription>
              Magazada aktif olacak dilleri ve varsayilan dili yonetin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {languagesQuery.isLoading ? (
              <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Dil ayarlari yukleniyor...
              </div>
            ) : (
              <div className="max-w-2xl space-y-3">
                {(languagesQuery.data ?? []).map((language) => (
                  <div
                    key={language.code}
                    className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-muted px-2 py-1 font-mono text-sm uppercase">
                        {language.code}
                      </span>
                      <div>
                        <div className="text-sm font-medium">{language.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {language.isDefault
                            ? "Bu magaza icin varsayilan dil"
                            : language.isActive
                              ? "Aktif dil"
                              : "Pasif dil"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={language.isDefault ? "default" : "outline"}
                        disabled={language.isDefault || isBusy}
                        onClick={() =>
                          handleSetDefaultLanguage(
                            language.code,
                            language.name,
                            language.isDefault
                          )
                        }
                      >
                        {language.isDefault ? "Varsayilan" : "Varsayilan yap"}
                      </Button>
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleLanguage(
                            language.code,
                            language.name,
                            language.isActive,
                            language.isDefault
                          )
                        }
                        disabled={language.isDefault || isBusy}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          language.isActive ? "bg-primary" : "bg-muted"
                        } ${
                          language.isDefault || isBusy
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            language.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "staff" && (
        <Card>
          <CardHeader>
            <CardTitle>Personel Yonetimi</CardTitle>
            <CardDescription>
              Personel ekleyin, rollerini ve sube atamalarini yonetin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/staff">
              <Button>
                <Users className="mr-2 h-4 w-4" />
                Personel Yonetim Sayfasina Git
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
