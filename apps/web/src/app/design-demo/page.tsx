import {
  ArrowRight,
  BarChart3,
  Bell,
  ChevronRight,
  ClipboardList,
  Flame,
  LayoutDashboard,
  MoonStar,
  Palette,
  QrCode,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  SunMedium,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const paletteSwatches = [
  { label: "Canvas", token: "#FCFCFF", className: "bg-background" },
  { label: "Surface", token: "#FFFFFF", className: "bg-card" },
  { label: "Soft Surface", token: "#F5F7FF", className: "bg-muted" },
  { label: "Brand 300", token: "#818CF8", className: "bg-[hsl(var(--brand-300))]" },
  { label: "Brand 400", token: "#6366F1", className: "bg-[hsl(var(--brand-400))]" },
  { label: "Brand 500", token: "#4F46E5", className: "bg-primary" },
  { label: "Brand 600", token: "#4338CA", className: "bg-[hsl(var(--brand-600))]" },
  { label: "Warm Accent", token: "#C2410C", className: "bg-[hsl(var(--warm))]" },
  { label: "Success", token: "#166534", className: "bg-[hsl(var(--success))]" },
];

const menuItems = [
  {
    title: "Truffle Burger",
    description: "Brioche ekmek, karamelize sogan, gouda ve truffle mayo.",
    price: "₺395",
    badge: "Chef's pick",
    tone: "warm" as const,
  },
  {
    title: "Izgara Somon Bowl",
    description: "Yabani pirinc, narenciye glaze ve avokado ile dengeli tabak.",
    price: "₺420",
    badge: "Protein",
    tone: "success" as const,
  },
  {
    title: "Limonlu San Sebastian",
    description: "Yumusak doku, hafif vanilya ve sicak berry sos.",
    price: "₺215",
    badge: "Dessert",
    tone: "brand" as const,
  },
];

const adminMetrics = [
  { label: "Bugun Siparis", value: "184", delta: "+12%" },
  { label: "Sepet Donusum", value: "68%", delta: "+4.6%" },
  { label: "Ortalama Fis", value: "₺412", delta: "+9%" },
];

const adminNav = [
  { label: "Pano", icon: LayoutDashboard, active: true },
  { label: "Urunler", icon: ShoppingBag },
  { label: "Masalar", icon: QrCode },
  { label: "Siparisler", icon: ClipboardList },
  { label: "Raporlar", icon: BarChart3 },
];

function DemoBadge({
  children,
  tone = "brand",
}: {
  children: React.ReactNode;
  tone?: "brand" | "warm" | "success";
}) {
  const style =
    tone === "warm"
      ? {
          backgroundColor: "hsl(var(--warm-surface))",
          color: "hsl(var(--warm))",
        }
      : tone === "success"
        ? {
            backgroundColor: "hsl(var(--success-surface))",
            color: "hsl(var(--success))",
          }
        : {
            backgroundColor: "hsl(var(--secondary))",
            color: "hsl(var(--secondary-foreground))",
          };

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.02em]"
      style={style}
    >
      {children}
    </span>
  );
}

function ThemeFrame({
  id,
  mode,
  icon,
  title,
  subtitle,
  children,
}: {
  id: string;
  mode: "theme-light" | "theme-dark";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`${mode} theme-surface scroll-mt-6`}>
      <div className="rounded-[2rem] border border-border bg-background shadow-[var(--card-shadow)]">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              {icon}
              {title}
            </div>
            <h2 className="font-display text-[28px] leading-[34px] text-foreground">
              {subtitle}
            </h2>
          </div>
          <div className="hidden rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground md:block">
            Indigo Refresh
          </div>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </section>
  );
}

function PaletteBoard() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="grid gap-4 md:grid-cols-3">
        {paletteSwatches.map((swatch) => (
          <Card key={swatch.label} className="overflow-hidden border-border bg-card">
            <div className={`h-24 ${swatch.className}`} />
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-foreground">{swatch.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{swatch.token}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <Card className="border-border bg-card">
          <CardContent className="space-y-4 p-5 pt-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Typography
              </p>
              <h3 className="mt-3 font-display text-[34px] leading-[42px] text-foreground">
                Premium, net ve siparis odakli.
              </h3>
              <p className="mt-3 text-base leading-6 text-muted-foreground">
                Basliklarda karakterli serif, arayuzde ise rahat okunan modern sans
                kullaniliyor.
              </p>
              <p className="mt-3 text-xs leading-4 text-muted-foreground">
                Caption 12/16 · UI label 14/20 · Menu body 16/24
              </p>
            </div>
            <div className="grid gap-3">
              <div className="flex flex-wrap gap-3">
                <Button>Primary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button disabled>Disabled</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-primary-foreground shadow-[var(--card-shadow-hover)]"
                  style={{ backgroundColor: "hsl(var(--primary-hover))" }}
                >
                  Hover State
                </button>
                <button className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-secondary px-5 text-sm font-semibold text-secondary-foreground ring-4 ring-ring/40">
                  Focus Ring
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-11" placeholder="Urun, kategori veya masa ara" />
                </div>
                <div className="rounded-[1.25rem] border border-border bg-muted p-3">
                  <div className="flex flex-wrap gap-2">
                    <DemoBadge tone="brand">Secili kategori</DemoBadge>
                    <DemoBadge tone="warm">Kampanya</DemoBadge>
                    <DemoBadge tone="success">Mutfak hazir</DemoBadge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MenuMockup({ dark = false }: { dark?: boolean }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[var(--card-shadow)]">
      <div
        className="border-b border-border px-5 py-5"
        style={{ backgroundImage: "var(--hero-glow)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              <Store className="h-3.5 w-3.5" />
              GASE Signature Kitchen
            </div>
            <h3 className="mt-4 font-display text-[34px] leading-[42px] text-foreground">
              Mor tonlariyla daha rafine bir menu deneyimi.
            </h3>
            <p className="mt-3 max-w-xl text-base leading-6 text-muted-foreground">
              Urun kartlari, kategori chipleri ve sepet aksiyonu daha hizli
              taranabilen bir hiyerarsi ile sunuluyor.
            </p>
          </div>
          <Button variant="outline" size="icon" className="shrink-0 rounded-full">
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--card-shadow)]">
            One Cikanlar
          </button>
          <button className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
            Burgerler
          </button>
          <button className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
            Bowl
          </button>
          <button className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
            Tatlilar
          </button>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid gap-3">
          {menuItems.map((item, index) => (
            <div
              key={item.title}
              className="group rounded-[1.5rem] border border-border bg-card p-4 shadow-[var(--card-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[hsl(var(--brand-300))] hover:shadow-[var(--card-shadow-hover)]"
            >
              <div className="flex gap-4">
                <div
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.25rem]"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(99, 102, 241, 0.22), rgba(194, 65, 12, 0.10))",
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(circle at top, rgba(255, 255, 255, 0.32), transparent 45%)",
                    }}
                  />
                  <div
                    className="absolute bottom-3 left-3 right-3 rounded-full px-2 py-1 text-center text-[11px] font-semibold text-foreground backdrop-blur"
                    style={{ backgroundColor: "hsl(var(--background) / 0.88)" }}
                  >
                    4.{index + 6} / 5 puan
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <p className="text-base font-semibold text-[hsl(var(--brand-600))]">
                      {item.price}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <DemoBadge tone={item.tone}>
                      {item.tone === "warm" && <Flame className="h-3 w-3" />}
                      {item.tone === "success" && <Zap className="h-3 w-3" />}
                      {item.tone === "brand" && <Sparkles className="h-3 w-3" />}
                      {item.badge}
                    </DemoBadge>
                    <Button
                      variant={dark ? "default" : "outline"}
                      size="sm"
                      className="rounded-full"
                    >
                      Ekle
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button className="h-14 w-full text-base shadow-[var(--card-shadow-hover)]">
          <ShoppingCart className="mr-2 h-5 w-5" />
          Sepete Git · 3 urun
        </Button>
      </div>
    </div>
  );
}

function AdminPreview() {
  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-[1.75rem] border border-border bg-card p-4 shadow-[var(--card-shadow)]">
        <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="font-display text-[28px] leading-[34px] text-foreground">GASE</p>
            <p className="text-sm text-muted-foreground">Admin experience preview</p>
          </div>
          <button className="relative rounded-full border border-border bg-muted p-2 text-muted-foreground">
            <Bell className="h-4 w-4" />
            <span
              className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "hsl(var(--warm))" }}
            />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {adminNav.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-3 rounded-[1.1rem] px-3 py-3 text-sm font-medium ${
                item.active
                  ? "bg-primary text-primary-foreground shadow-[var(--card-shadow)]"
                  : "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[1.25rem] bg-muted p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Aktif magaza
          </p>
          <p className="mt-3 text-base font-semibold text-foreground">Galataport Branch</p>
          <p className="mt-1 text-sm text-muted-foreground">Aksam servisi hazir.</p>
        </div>
      </aside>

      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          {adminMetrics.map((metric) => (
            <Card key={metric.label} className="border-border bg-card">
              <CardContent className="p-5 pt-5">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <div className="mt-3 flex items-end justify-between">
                  <p className="font-display text-[32px] leading-none text-foreground">
                    {metric.value}
                  </p>
                  <DemoBadge tone="success">{metric.delta}</DemoBadge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border bg-card">
            <CardContent className="p-5 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Bugun siparis akisi</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Urun ve masa aksiyonlari daha sade yuzeylerle onceliklendirildi.
                  </p>
                </div>
                <Button variant="outline">
                  Ayrintiya Git
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  {
                    name: "Masa 12 · Truffle Burger x2",
                    status: "Hazirlaniyor",
                    eta: "8 dk",
                  },
                  {
                    name: "Paket Siparis · Salmon Bowl",
                    status: "Kurye bekleniyor",
                    eta: "5 dk",
                  },
                  {
                    name: "Masa 03 · San Sebastian",
                    status: "Servise hazir",
                    eta: "1 dk",
                  },
                ].map((order, index) => (
                  <div
                    key={order.name}
                    className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-border bg-muted px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{order.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{order.status}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <DemoBadge tone={index === 2 ? "success" : index === 1 ? "brand" : "warm"}>
                        {order.eta}
                      </DemoBadge>
                      <button className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground">
                        Incele
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="space-y-4 p-5 pt-5">
              <div>
                <p className="text-sm font-semibold text-foreground">Arama ve filtre</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Daha yumusak surface tonlari ve mor focus halkasi.
                </p>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-11" placeholder="Siparis, urun veya personel ara" />
              </div>
              <div className="flex flex-wrap gap-2">
                <DemoBadge tone="brand">Aktif kampanya</DemoBadge>
                <DemoBadge tone="warm">Dusuk stok</DemoBadge>
                <DemoBadge tone="success">Odeme tamamlandi</DemoBadge>
              </div>
              <div className="rounded-[1.25rem] border border-dashed border-border bg-muted p-4">
                <p className="text-sm font-semibold text-foreground">Hover mantigi</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Kart ve liste satirlari aktif olduklarinda daha parlak border ve
                  yumusak indigo shadow kullaniyor.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function DesignDemoPage() {
  return (
    <div
      className="min-h-screen px-4 py-8 text-foreground md:px-6 lg:px-10"
      style={{
        background:
          "linear-gradient(180deg, #f3f4ff 0%, #fcfcff 20%, #eef2ff 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="overflow-hidden rounded-[2rem] border border-[#d8dcf4] bg-white px-6 py-8 shadow-[0_30px_80px_-48px_rgba(79,70,229,0.28)] md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#eef2ff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#4338ca]">
                <Palette className="h-3.5 w-3.5" />
                Indigo Refresh Demo
              </div>
              <h1 className="mt-5 font-display text-[34px] leading-[42px] text-[#111827] md:text-[48px] md:leading-[56px]">
                Musterinin ilgisini ceken, daha anlasilir ve daha premium bir QR
                menu dili.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#5b647a]">
                <span className="font-semibold text-[#4338ca]">#6366f1</span> etrafinda
                kurulu bu yon; daha net CTA, daha okunakli tipografi ve hem light
                hem dark modda tutarli bir restoran deneyimi sunuyor.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-[#d8dcf4] bg-[#fcfcff] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5b647a]">
                  Font pair
                </p>
                <p className="mt-3 font-display text-[28px] leading-[34px] text-[#111827]">
                  Fraunces
                </p>
                <p className="mt-1 text-sm text-[#5b647a]">Display / section headings</p>
                <p className="mt-3 text-base font-semibold text-[#111827]">
                  Plus Jakarta Sans
                </p>
                <p className="mt-1 text-sm text-[#5b647a]">UI / body / form controls</p>
              </div>
              <div className="rounded-[1.25rem] border border-[#1f2744] bg-[#111827] px-4 py-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b3bed6]">
                  Contrast logic
                </p>
                <p className="mt-3 text-sm leading-6 text-[#e5e7eb]">
                  Light primary <span className="font-semibold text-[#a5b4fc]">#4F46E5</span>,
                  dark primary <span className="font-semibold text-[#c7d2fe]">#A5B4FC</span>
                  kullaniliyor; beyaz yaziyi direkt #6366F1 uzerine bindirmiyoruz.
                </p>
              </div>
            </div>
          </div>
        </header>

        <ThemeFrame
          id="palette"
          mode="theme-light"
          icon={<SunMedium className="h-3.5 w-3.5" />}
          title="Palette Board"
          subtitle="Light mode renk sistemi, tipografi ve state ornekleri"
        >
          <PaletteBoard />
        </ThemeFrame>

        <ThemeFrame
          id="menu-light"
          mode="theme-light"
          icon={<SunMedium className="h-3.5 w-3.5" />}
          title="Menu Light"
          subtitle="Musteri menusu, daha rafine hiyerarsi ile"
        >
          <MenuMockup />
        </ThemeFrame>

        <ThemeFrame
          id="menu-dark"
          mode="theme-dark"
          icon={<MoonStar className="h-3.5 w-3.5" />}
          title="Menu Dark"
          subtitle="Koyu zeminde net CTA ve kontrastli kategori akis"
        >
          <MenuMockup dark />
        </ThemeFrame>

        <ThemeFrame
          id="admin-preview"
          mode="theme-dark"
          icon={<MoonStar className="h-3.5 w-3.5" />}
          title="Admin Preview"
          subtitle="Ayni tasarim ailesi ile daha sakin admin yuzeyi"
        >
          <AdminPreview />
        </ThemeFrame>
      </div>
    </div>
  );
}
