import type { ComponentType } from "react";
import {
  AlertTriangle,
  ChefHat,
  ClipboardList,
  DollarSign,
  QrCode,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type StatTone = "brand" | "warm" | "success";

const stats: Array<{
  title: string;
  value: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  tone: StatTone;
}> = [
  {
    title: "Bugunun Siparisleri",
    value: "0",
    description: "Toplam siparis",
    icon: ClipboardList,
    tone: "brand",
  },
  {
    title: "Bugunun Cirosu",
    value: "0 TL",
    description: "Toplam gelir",
    icon: DollarSign,
    tone: "warm",
  },
  {
    title: "Aktif Masalar",
    value: "0 / 0",
    description: "Dolu / Toplam",
    icon: QrCode,
    tone: "brand",
  },
  {
    title: "Aktif Urunler",
    value: "0",
    description: "Menudeki urunler",
    icon: ShoppingBag,
    tone: "success",
  },
  {
    title: "Mutfak Bekleyen",
    value: "0",
    description: "Hazirlanan siparisler",
    icon: ChefHat,
    tone: "warm",
  },
  {
    title: "Musteriler",
    value: "0",
    description: "Kayitli musteri",
    icon: Users,
    tone: "brand",
  },
  {
    title: "Haftalik Buyume",
    value: "%0",
    description: "Gecen haftaya gore",
    icon: TrendingUp,
    tone: "success",
  },
  {
    title: "Dusuk Stok Uyarilari",
    value: "0",
    description: "Kritik seviye",
    icon: AlertTriangle,
    tone: "warm",
  },
];

const toneStyles: Record<StatTone, { background: string; color: string }> = {
  brand: {
    background: "hsl(var(--secondary))",
    color: "hsl(var(--secondary-foreground))",
  },
  warm: {
    background: "hsl(var(--warm-surface))",
    color: "hsl(var(--warm))",
  },
  success: {
    background: "hsl(var(--success-surface))",
    color: "hsl(var(--success))",
  },
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-6 py-6 shadow-[var(--card-shadow)] sm:px-8">
        <div
          className="absolute inset-0 opacity-90"
          style={{ backgroundImage: "var(--hero-glow)" }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-foreground">
              Indigo admin pano
            </div>
            <h1 className="mt-4 font-display text-[34px] leading-[42px] text-foreground sm:text-[42px] sm:leading-[48px]">
              Operasyonu daha hizli okuyun, oncelikleri daha net yonetin.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Siparis, stok ve masa akislarini tek bakista ayiran daha rafine bir
              admin deneyimi. Bu ilk rollout turu dashboard ve navigation katmanini
              yeni tasarim diliyle hizaliyor.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.25rem] border border-border bg-background/85 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Vardiya notu
              </p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                Aksam servisi hazir
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Siparis, mutfak ve kasa ekranlari ayni tasarim diliyle okunuyor.
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-border bg-background/85 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                UI sonucu
              </p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                Daha sakin ama daha fark edilir
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Indigo vurgu, semantik durum tonlari ve daha net kart hiyerarsisi.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const toneStyle = toneStyles[stat.tone];

          return (
            <Card key={stat.title} className="border-border bg-card">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-sm font-semibold leading-6 text-foreground">
                    {stat.title}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={toneStyle}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-display text-[34px] leading-[38px] text-foreground">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-foreground">
              Son siparisler
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Dashboard rollout sonrasi siparis listesi burada daha net aksiyonlarla
              gosterilecek.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Henüz yeni sipariş yok",
              "Mutfak kuyrugu bos durumda",
              "QR kaynakli siparisler burada vurgulanacak",
            ].map((line, index) => (
              <div
                key={line}
                className="rounded-[1.25rem] border border-border bg-muted/70 px-4 py-4"
              >
                <p className="text-sm font-semibold text-foreground">0{index + 1}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{line}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-foreground">
              Populer urunler
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Menu ve urun ekranlarina ayni tonlar rollout edildiginde bu alan daha
              guclu gorsel referanslar alacak.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-[1.25rem] border border-border bg-muted/70 p-4">
              <p className="text-sm font-semibold text-foreground">Hazir veri bekleniyor</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Urun performansi geldikce burada kart bazli bir ozet gorunecek.
              </p>
            </div>
            <div className="rounded-[1.25rem] bg-secondary p-4 text-secondary-foreground">
              <p className="text-sm font-semibold">Bir sonraki rollout</p>
              <p className="mt-1 text-sm leading-6">
                Product form, stok tablolari ve siparis listesi de ayni hiyerarsiye
                cekilecek.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
