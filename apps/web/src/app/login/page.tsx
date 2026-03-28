"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogin, useRegister } from "@/hooks/use-auth";
import { useAuthStore } from "@/lib/store";
import { useAuthHydration } from "@/hooks/use-auth-hydration";

type AuthMode = "login" | "register";

function getErrorMessage(error: unknown) {
  if (!error) {
    return null;
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
    return Array.isArray(message) ? message.join(", ") : message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Islem tamamlanamadi.";
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";

  const isAuthenticated = useAuthStore(
    (state) => Boolean(state.isAuthenticated && state.user && state.accessToken)
  );
  const hasHydrated = useAuthHydration();

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const [mode, setMode] = useState<AuthMode>("login");
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    organizationId: "",
  });

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [hasHydrated, isAuthenticated, nextPath, router]);

  const isPending = loginMutation.isPending || registerMutation.isPending;
  const errorMessage = useMemo(
    () =>
      getErrorMessage(loginMutation.error) ||
      getErrorMessage(registerMutation.error),
    [loginMutation.error, registerMutation.error]
  );

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Oturum hazirlaniyor...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border bg-card p-8">
          <div className="max-w-md">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">GASE Admin</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Web tarafini gercek backend servisleriyle calistirmak icin oturum
              ve aktif magaza baglamini bu ekran yonetiyor.
            </p>

            <div className="mt-8 rounded-xl bg-muted/50 p-5">
              <p className="text-sm font-medium">Bu sprintte acilan akis</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Token, refresh ve aktif magaza secimi tek kaynaktan yonetilir.</li>
                <li>Categories, products ve menus ekranlari store baglamiyla calisir.</li>
                <li>Public menu fallback yerine dogrudan API durumu gosterilir.</li>
              </ul>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "login" ? "default" : "outline"}
                onClick={() => setMode("login")}
              >
                Giris
              </Button>
              <Button
                type="button"
                variant={mode === "register" ? "default" : "outline"}
                onClick={() => setMode("register")}
              >
                Kayit
              </Button>
            </div>
            <CardTitle className="pt-4">
              {mode === "login" ? "Hesabina giris yap" : "Yeni kullanici olustur"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mode === "login" ? (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  loginMutation.mutate(loginForm, {
                    onSuccess: () => {
                      router.replace(nextPath);
                    },
                  });
                }}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-posta</label>
                  <Input
                    type="email"
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="owner@gase.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sifre</label>
                  <Input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="******"
                    required
                  />
                </div>
                {errorMessage && (
                  <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {errorMessage}
                  </p>
                )}
                <Button className="w-full" type="submit" disabled={isPending}>
                  {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Giris yap
                </Button>
              </form>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  registerMutation.mutate(
                    {
                      ...registerForm,
                      phone: registerForm.phone || undefined,
                      organizationId: registerForm.organizationId || undefined,
                    },
                    {
                      onSuccess: () => {
                        router.replace(nextPath);
                      },
                    }
                  );
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ad</label>
                    <Input
                      value={registerForm.firstName}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          firstName: event.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Soyad</label>
                    <Input
                      value={registerForm.lastName}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          lastName: event.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-posta</label>
                  <Input
                    type="email"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Telefon</label>
                    <Input
                      value={registerForm.phone}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      placeholder="+90555..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sifre</label>
                    <Input
                      type="password"
                      value={registerForm.password}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Existing Organization ID
                  </label>
                  <Input
                    value={registerForm.organizationId}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        organizationId: event.target.value,
                      }))
                    }
                    placeholder="Mevcut bir organization'a katilacaksan gir"
                  />
                </div>
                {errorMessage && (
                  <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {errorMessage}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Bu alan opsiyoneldir. Bos birakirsan ilk giristen sonra
                  organization ve ilk magazani admin icinden olusturabilirsin.
                </p>
                <Button className="w-full" type="submit" disabled={isPending}>
                  {registerMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Hesap olustur
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
