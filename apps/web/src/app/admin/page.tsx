"use client";

import { useEffect } from "react";
import type { ComponentType } from "react";
import {
  AlertTriangle,
  ChefHat,
  ClipboardList,
  DollarSign,
  Loader2,
  QrCode,
  RefreshCw,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useDashboardOverview } from "@/hooks/use-dashboard";
import { useSocket } from "@/hooks/use-socket";

type StatTone = "brand" | "warm" | "success";

const orderStatusLabels: Record<string, string> = {
  DRAFT: "Taslak",
  PENDING: "Bekleyen",
  CONFIRMED: "Onaylandi",
  PREPARING: "Hazirlaniyor",
  READY: "Hazir",
  SERVED: "Servis edildi",
  CANCELLED: "Iptal",
};

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

function formatCurrency(value: number) {
  return `${value.toLocaleString("tr-TR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  })} TL`;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-card p-8 shadow-[var(--card-shadow)]">
        <div className="space-y-3">
          <div className="h-4 w-28 animate-pulse rounded-full bg-muted" />
          <div className="h-10 w-2/3 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-full animate-pulse rounded-full bg-muted" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-6">
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-9 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-6">
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              {Array.from({ length: 4 }).map((__, rowIndex) => (
                <div key={rowIndex} className="h-16 animate-pulse rounded-xl bg-muted/80" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { activeStoreId, activeStore } = useCurrentStore();
  const { joinStore, onEvent } = useSocket();
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboardOverview(
    activeStoreId ?? ""
  );

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

    const cleanups = [
      onEvent("newOrder", () => {
        refetch();
      }),
      onEvent("orderStatusUpdate", () => {
        refetch();
      }),
      onEvent("paymentCompleted", () => {
        refetch();
      }),
      onEvent("stockLow", () => {
        refetch();
      }),
      onEvent("tableSessionOpened", () => {
        refetch();
      }),
      onEvent("tableSessionClosed", () => {
        refetch();
      }),
    ];

    return () => cleanups.forEach((cleanup) => cleanup?.());
  }, [activeStoreId, onEvent, refetch]);

  if (!activeStoreId) {
    return (
      <Card>
        <CardContent className="py-10 text-sm text-muted-foreground">
          Pano verilerini gorebilmek icin once aktif bir magaza secin.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Pano"
          description="Operasyon ozeti alinamadi. Backend baglantisini veya store erisimini kontrol edin."
          action={
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tekrar dene
            </Button>
          }
        />

        <Card>
          <CardContent className="py-10 text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : "Pano verileri alinamadi. Lutfen tekrar deneyin."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats: Array<{
    title: string;
    value: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
    tone: StatTone;
  }> = [
    {
      title: "Bugunun Siparisleri",
      value: String(data.summary.todayOrders),
      description: "Taslak haric toplam siparis",
      icon: ClipboardList,
      tone: "brand",
    },
    {
      title: "Bugunun Cirosu",
      value: formatCurrency(data.summary.todayRevenue),
      description: "Iptal haric siparis geliri",
      icon: DollarSign,
      tone: "warm",
    },
    {
      title: "Aktif Masalar",
      value: `${data.summary.activeTables} / ${data.summary.totalTables}`,
      description: "Dolu / toplam masa",
      icon: QrCode,
      tone: "brand",
    },
    {
      title: "Aktif Urunler",
      value: String(data.summary.activeProducts),
      description: "Menude yayinda olanlar",
      icon: ShoppingBag,
      tone: "success",
    },
    {
      title: "Mutfak Bekleyen",
      value: String(data.summary.kitchenPending),
      description: "Bekleyen + onayli + hazirlaniyor",
      icon: ChefHat,
      tone: "warm",
    },
    {
      title: "Musteriler",
      value: String(data.summary.totalCustomers),
      description: "Bu subede en az bir ziyaret",
      icon: Users,
      tone: "brand",
    },
    {
      title: "Haftalik Buyume",
      value: `${data.summary.weeklyGrowthPercent >= 0 ? "+" : ""}${data.summary.weeklyGrowthPercent.toLocaleString(
        "tr-TR",
        {
          maximumFractionDigits: 2,
        }
      )}%`,
      description: "Son 7 gun / onceki 7 gun",
      icon: data.summary.weeklyGrowthPercent >= 0 ? TrendingUp : TrendingDown,
      tone: data.summary.weeklyGrowthPercent >= 0 ? "success" : "warm",
    },
    {
      title: "Dusuk Stok Uyarilari",
      value: String(data.summary.lowStockCount),
      description: "Kritik seviyedeki malzemeler",
      icon: AlertTriangle,
      tone: "warm",
    },
  ];

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
              Canli operasyon panosu
            </div>
            <h1 className="mt-4 font-display text-[34px] leading-[42px] text-foreground sm:text-[42px] sm:leading-[48px]">
              {activeStore?.name ?? "Aktif magaza"} icin bugunun operasyonunu tek bakista okuyun.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Siparis, masa, mutfak ve stok verileri tek endpoint uzerinden toplanir;
              operasyonel event geldiginde pano kendini canli olarak yeniler.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.25rem] border border-border bg-background/85 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Son guncelleme
              </p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {formatTime(data.live.updatedAt)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isFetching ? "Veriler yenileniyor..." : "Store eventleri ile otomatik guncellenir."}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-border bg-background/85 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Kritik odak
              </p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {data.summary.kitchenPending > 0
                  ? `${data.summary.kitchenPending} siparis mutfak aksiyonunda`
                  : "Mutfak kuyrugu sakin"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.summary.lowStockCount > 0
                  ? `${data.summary.lowStockCount} stok uyarisi takip edilmeli.`
                  : "Stok tarafinda kritik uyarı gorunmuyor."}
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

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-foreground">
              Son siparisler
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Son 6 taslak disi siparis burada listelenir.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentOrders.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
                Henuz siparis yok.
              </div>
            ) : (
              data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-[1.25rem] border border-border bg-muted/40 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          #{String(order.orderNumber).padStart(3, "0")}
                        </p>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                          {orderStatusLabels[order.status] ?? order.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {order.tableName} · {order.customerName || "Musteri"} · Alan:{" "}
                        {order.takenByName}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-foreground">
                        {order.itemSummary || `${order.itemCount} kalem siparis`}
                      </p>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatTime(order.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-foreground">
              Populer urunler
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Son 7 gunde ciroya gore one cikan ilk 5 urun.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topProducts.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
                Henuz urun performans verisi yok.
              </div>
            ) : (
              data.topProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="rounded-[1.25rem] border border-border bg-muted/40 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-sm font-bold text-secondary-foreground">
                      {index + 1}
                    </div>

                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.productName}
                        className="h-10 w-10 rounded-2xl object-cover"
                      />
                    ) : null}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {product.productName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {product.quantity} adet · {product.orderCount} siparis
                      </p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${
                              data.topProducts[0]?.revenue
                                ? Math.max(
                                    12,
                                    (product.revenue / data.topProducts[0].revenue) * 100
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
