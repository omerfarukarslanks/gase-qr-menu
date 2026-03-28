"use client";

import { useMemo, useState } from "react";
import { Building2, Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCreateOrganization } from "@/hooks/use-organizations";
import { useCreateStore } from "@/hooks/use-stores";
import { useAuthStore } from "@/lib/store";

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string | string[] } } }).response?.data
      ?.message !== "undefined"
  ) {
    const message = (error as { response?: { data?: { message?: string | string[] } } })
      .response?.data?.message;
    return Array.isArray(message) ? message.join(", ") : message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return null;
}

interface StoreOnboardingCardProps {
  onReady: () => Promise<unknown> | unknown;
  onLogout: () => void;
}

export function StoreOnboardingCard({
  onReady,
  onLogout,
}: StoreOnboardingCardProps) {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const hasOrganization = Boolean(user?.organizationId);
  const createOrganization = useCreateOrganization();
  const createStore = useCreateStore();

  const [organizationForm, setOrganizationForm] = useState({
    name: "",
    defaultCurrency: "TRY",
  });
  const [storeForm, setStoreForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    currency: "TRY",
    timezone: "Europe/Istanbul",
  });

  const isPending = createOrganization.isPending || createStore.isPending;
  const errorMessage = useMemo(
    () =>
      getErrorMessage(createOrganization.error) ||
      getErrorMessage(createStore.error),
    [createOrganization.error, createStore.error]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let organizationId = user?.organizationId ?? null;

    if (!organizationId) {
      const organization = await createOrganization.mutateAsync({
        name: organizationForm.name,
        defaultCurrency: organizationForm.defaultCurrency,
      });

      organizationId = organization.id;
      updateUser({ organizationId });
    }

    await createStore.mutateAsync({
      organizationId,
      name: storeForm.name,
      address: storeForm.address || undefined,
      phone: storeForm.phone || undefined,
      email: storeForm.email || undefined,
      currency:
        storeForm.currency || organizationForm.defaultCurrency || "TRY",
      timezone: storeForm.timezone || "Europe/Istanbul",
    });

    await onReady();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              {hasOrganization ? (
                <Store className="h-6 w-6 text-primary" />
              ) : (
                <Building2 className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <CardTitle>
                {hasOrganization
                  ? "Ilk magazani olustur"
                  : "Organization ve ilk magazani olustur"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Organization ID'yi elle baglamana gerek yok. Ilk kurulum burada
                tamamlanacak.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!hasOrganization && (
              <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
                <div>
                  <h2 className="text-sm font-semibold">1. Organization</h2>
                  <p className="text-sm text-muted-foreground">
                    Bu hesap icin once organization kaydi olusturulacak.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium">
                      Organization adi
                    </label>
                    <Input
                      value={organizationForm.name}
                      onChange={(event) =>
                        setOrganizationForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Orn. GASE Restaurant Group"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Varsayilan para birimi
                    </label>
                    <Input
                      value={organizationForm.defaultCurrency}
                      onChange={(event) =>
                        setOrganizationForm((current) => ({
                          ...current,
                          defaultCurrency: event.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="TRY"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
              <div>
                <h2 className="text-sm font-semibold">
                  {hasOrganization ? "1. Magaza" : "2. Ilk magaza"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Admin ekranlari bu magaza baglamiyla calisacak.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">Magaza adi</label>
                  <Input
                    value={storeForm.name}
                    onChange={(event) =>
                      setStoreForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Orn. Kadikoy Subesi"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">Adres</label>
                  <Input
                    value={storeForm.address}
                    onChange={(event) =>
                      setStoreForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    placeholder="Sube adresi"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefon</label>
                  <Input
                    value={storeForm.phone}
                    onChange={(event) =>
                      setStoreForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="+90 5xx xxx xx xx"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-posta</label>
                  <Input
                    type="email"
                    value={storeForm.email}
                    onChange={(event) =>
                      setStoreForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="sube@gase.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Para birimi</label>
                  <Input
                    value={storeForm.currency}
                    onChange={(event) =>
                      setStoreForm((current) => ({
                        ...current,
                        currency: event.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="TRY"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Saat dilimi</label>
                  <Input
                    value={storeForm.timezone}
                    onChange={(event) =>
                      setStoreForm((current) => ({
                        ...current,
                        timezone: event.target.value,
                      }))
                    }
                    placeholder="Europe/Istanbul"
                  />
                </div>
              </div>
            </div>

            {errorMessage && (
              <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={onReady}>
                Listeyi yenile
              </Button>
              <Button type="button" variant="secondary" onClick={onLogout}>
                Cikis yap
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {hasOrganization ? "Magazayi olustur" : "Kurulumu tamamla"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
