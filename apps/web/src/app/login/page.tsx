"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogin, useRegister } from "@/hooks/use-auth";
import { useAuthHydration } from "@/hooks/use-auth-hydration";
import { useAuthStore } from "@/lib/store";

type AuthMode = "login" | "register";

const sprintItems = [
  "Token, refresh ve aktif magaza secimi tek kaynaktan yonetilir.",
  "Categories, products ve menus ekranlari store baglamiyla calisir.",
  "Public menu ve admin akislarinda ayni tema dili korunur.",
];

const trustItems = [
  {
    title: "Merkez operasyon",
    description: "Magaza, menu ve siparis akislarini tek panelden takip edin.",
    icon: Store,
  },
  {
    title: "Guvenli oturum",
    description: "JWT ve yenileme akisiyla ekip girislerini kontrollu yonetin.",
    icon: ShieldCheck,
  },
];

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

function LoginPageContent() {
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
      <div className="theme-app-gradient relative flex min-h-screen items-center justify-center px-4">
        <div className="fixed right-4 top-4 z-30">
          <ThemeToggle compact />
        </div>
        <div className="flex items-center gap-3 rounded-full border border-border bg-card/85 px-5 py-3 text-sm text-muted-foreground shadow-[var(--card-shadow)] backdrop-blur">
          <Loader2 className="h-4 w-4 animate-spin" />
          Oturum hazirlaniyor...
        </div>
      </div>
    );
  }

  return (
    <div className="theme-app-gradient relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-6rem] top-[-5rem] h-64 w-64 rounded-full bg-primary/16 blur-3xl" />
        <div className="absolute bottom-[-4rem] right-[-3rem] h-56 w-56 rounded-full bg-[hsl(var(--warm))]/14 blur-3xl" />
      </div>

      <div className="fixed right-4 top-4 z-30">
        <ThemeToggle compact />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <section className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground shadow-[var(--card-shadow)] backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Indigo admin workspace
            </div>

            <div className="mt-6 max-w-xl">
              <p className="font-display text-[42px] leading-[46px] text-foreground sm:text-[54px] sm:leading-[58px]">
                Restoran operasyonunu tek ritimde yonetin.
              </p>
              <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
                GASE admin girisi, menu yayinlarini, siparis akislarini ve magaza
                baglamini ayni indigo tema sistemi icinde toplar.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {trustItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.75rem] border border-border bg-card/78 p-5 shadow-[var(--card-shadow)] backdrop-blur"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 max-w-xl rounded-[2rem] border border-border bg-card/70 p-6 shadow-[var(--card-shadow)] backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--button-shadow)]">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Bu sprintte hazir
                  </p>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    Admin ve public akislarda ortak tema altyapisi
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {sprintItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-[1.25rem] bg-background/70 px-4 py-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-[hsl(var(--success))]" />
                    <p className="text-sm leading-6 text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center">
            <Card className="w-full max-w-xl rounded-[2rem] border-border bg-card/92 p-1 shadow-[var(--card-shadow-hover)] backdrop-blur">
              <CardHeader className="space-y-5 p-6 pb-3 sm:p-8 sm:pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {mode === "login" ? "Kimlik dogrulama" : "Yeni ekip uye kaydi"}
                    </p>
                    <CardTitle className="pt-2 font-display text-[30px] leading-[34px] text-foreground">
                      {mode === "login" ? "Hesabina giris yap" : "Yeni kullanici olustur"}
                    </CardTitle>
                  </div>

                  <div className="hidden rounded-full border border-border bg-muted/70 p-1 sm:flex">
                    <Button
                      type="button"
                      variant={mode === "login" ? "default" : "ghost"}
                      className="h-10 rounded-full px-4"
                      onClick={() => setMode("login")}
                    >
                      Giris
                    </Button>
                    <Button
                      type="button"
                      variant={mode === "register" ? "default" : "ghost"}
                      className="h-10 rounded-full px-4"
                      onClick={() => setMode("register")}
                    >
                      Kayit
                    </Button>
                  </div>
                </div>

                <div className="flex rounded-full border border-border bg-muted/70 p-1 sm:hidden">
                  <Button
                    type="button"
                    variant={mode === "login" ? "default" : "ghost"}
                    className="h-10 flex-1 rounded-full"
                    onClick={() => setMode("login")}
                  >
                    Giris
                  </Button>
                  <Button
                    type="button"
                    variant={mode === "register" ? "default" : "ghost"}
                    className="h-10 flex-1 rounded-full"
                    onClick={() => setMode("register")}
                  >
                    Kayit
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-3 sm:p-8 sm:pt-4">
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
                      <label className="text-sm font-semibold text-foreground">
                        E-posta
                      </label>
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
                      <label className="text-sm font-semibold text-foreground">
                        Sifre
                      </label>
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
                      <p className="rounded-[1.1rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        {errorMessage}
                      </p>
                    )}

                    <Button className="group h-12 w-full" type="submit" disabled={isPending}>
                      {loginMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Giris yap
                      {!loginMutation.isPending && (
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      )}
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
                        <label className="text-sm font-semibold text-foreground">Ad</label>
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
                        <label className="text-sm font-semibold text-foreground">
                          Soyad
                        </label>
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
                      <label className="text-sm font-semibold text-foreground">
                        E-posta
                      </label>
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
                        <label className="text-sm font-semibold text-foreground">
                          Telefon
                        </label>
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
                        <label className="text-sm font-semibold text-foreground">
                          Sifre
                        </label>
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
                      <label className="text-sm font-semibold text-foreground">
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
                      <p className="rounded-[1.1rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        {errorMessage}
                      </p>
                    )}

                    <p className="rounded-[1.1rem] bg-muted/70 px-4 py-3 text-xs leading-5 text-muted-foreground">
                      Bu alan opsiyoneldir. Bos birakirsan ilk giristen sonra
                      organization ve ilk magazani admin icinden olusturabilirsin.
                    </p>

                    <Button className="group h-12 w-full" type="submit" disabled={isPending}>
                      {registerMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Hesap olustur
                      {!registerMutation.isPending && (
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
