"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  DollarSign,
  Download,
  Loader2,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useCustomerAnalytics,
  useProductAnalytics,
  useReportOverview,
  useStaffAnalytics,
} from "@/hooks/use-reports";
import { useCurrentStore } from "@/hooks/use-current-store";

type DateRange = "today" | "week" | "month" | "last30" | "custom";

const dateRangeLabels: Record<DateRange, string> = {
  today: "Bugun",
  week: "Bu Hafta",
  month: "Bu Ay",
  last30: "Son 30 Gun",
  custom: "Ozel",
};

const orderStatusLabels: Record<string, string> = {
  DRAFT: "Taslak",
  PENDING: "Bekleyen",
  CONFIRMED: "Onaylandi",
  PREPARING: "Hazirlaniyor",
  READY: "Hazir",
  SERVED: "Servis Edildi",
  CANCELLED: "Iptal",
};

const staffRoleLabels: Record<string, string> = {
  OWNER: "Isletme Sahibi",
  MANAGER: "Yonetici",
  STAFF: "Personel",
  WAITER: "Garson",
  KITCHEN: "Mutfak",
  SYSTEM: "Sistem",
};

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function shiftDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function getStartOfWeek(date: Date) {
  const current = new Date(date);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diff);
  current.setHours(0, 0, 0, 0);
  return current;
}

function formatCurrency(value: number) {
  return `${value.toLocaleString("tr-TR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  })} TL`;
}

function formatRangeLabel(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return `${start.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
  })} - ${end.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
  })}`;
}

function buildDateRange(
  selectedRange: DateRange,
  customStartDate: string,
  customEndDate: string
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (selectedRange) {
    case "today":
      return {
        startDate: formatDateInput(today),
        endDate: formatDateInput(today),
      };
    case "week":
      return {
        startDate: formatDateInput(getStartOfWeek(today)),
        endDate: formatDateInput(today),
      };
    case "month":
      return {
        startDate: formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1)),
        endDate: formatDateInput(today),
      };
    case "custom":
      return {
        startDate: customStartDate,
        endDate: customEndDate,
      };
    case "last30":
    default:
      return {
        startDate: formatDateInput(shiftDays(today, -29)),
        endDate: formatDateInput(today),
      };
  }
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-6">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-8 w-28 animate-pulse rounded bg-muted" />
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-6">
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              {Array.from({ length: 6 }).map((__, rowIndex) => (
                <div key={rowIndex} className="h-8 animate-pulse rounded bg-muted/80" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="h-5 w-48 animate-pulse rounded bg-muted" />
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded bg-muted/80" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  const { activeStoreId } = useCurrentStore();
  const [selectedRange, setSelectedRange] = useState<DateRange>("last30");
  const [customStartDate, setCustomStartDate] = useState(() =>
    formatDateInput(shiftDays(new Date(), -29))
  );
  const [customEndDate, setCustomEndDate] = useState(() => formatDateInput(new Date()));

  const { startDate, endDate } = useMemo(
    () => buildDateRange(selectedRange, customStartDate, customEndDate),
    [customEndDate, customStartDate, selectedRange]
  );

  const overviewQuery = useReportOverview(activeStoreId ?? "", startDate, endDate);
  const productAnalyticsQuery = useProductAnalytics(
    activeStoreId ?? "",
    startDate,
    endDate
  );
  const customerAnalyticsQuery = useCustomerAnalytics(
    activeStoreId ?? "",
    startDate,
    endDate
  );
  const staffAnalyticsQuery = useStaffAnalytics(activeStoreId ?? "", startDate, endDate);

  const isLoading =
    overviewQuery.isLoading ||
    productAnalyticsQuery.isLoading ||
    customerAnalyticsQuery.isLoading ||
    staffAnalyticsQuery.isLoading;

  const isError =
    overviewQuery.isError ||
    productAnalyticsQuery.isError ||
    customerAnalyticsQuery.isError ||
    staffAnalyticsQuery.isError;

  const overview = overviewQuery.data;
  const products = productAnalyticsQuery.data;
  const customers = customerAnalyticsQuery.data;
  const staff = staffAnalyticsQuery.data;

  const revenueSeries = overview?.series.revenueByDay ?? [];
  const maxRevenue = Math.max(...revenueSeries.map((item) => item.revenue), 0);
  const maxProductQuantity = Math.max(
    ...(products?.items.map((item) => item.quantity) ?? [0]),
    0
  );

  const hasData =
    (overview?.summary.totalOrders ?? 0) > 0 ||
    (products?.items.length ?? 0) > 0 ||
    (staff?.items.length ?? 0) > 0 ||
    (customers?.summary.totalCustomers ?? 0) > 0;

  const handleRefresh = () => {
    overviewQuery.refetch();
    productAnalyticsQuery.refetch();
    customerAnalyticsQuery.refetch();
    staffAnalyticsQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Raporlar</h1>
          <p className="text-muted-foreground">
            Gercek siparis, ciro ve personel performans verilerini inceleyin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Yenile
          </Button>
          <Button variant="outline" size="sm" disabled title="Excel export yakinda eklenecek">
            <Download className="mr-2 h-3.5 w-3.5" />
            Excel Yakinda
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(dateRangeLabels) as DateRange[]).map((range) => (
          <Button
            key={range}
            variant={selectedRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedRange(range)}
          >
            {range === "custom" ? <Calendar className="mr-1.5 h-3.5 w-3.5" /> : null}
            {dateRangeLabels[range]}
          </Button>
        ))}
      </div>

      {selectedRange === "custom" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:max-w-xl">
          <div className="space-y-2">
            <label className="text-sm font-medium">Baslangic tarihi</label>
            <Input
              type="date"
              value={customStartDate}
              onChange={(event) => setCustomStartDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Bitis tarihi</label>
            <Input
              type="date"
              value={customEndDate}
              onChange={(event) => setCustomEndDate(event.target.value)}
            />
          </div>
        </div>
      ) : null}

      {!activeStoreId ? (
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">
            Raporlari gorebilmek icin once aktif bir magaza secin.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <ReportsSkeleton />
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col gap-4 py-10 text-sm text-destructive">
            <span>Rapor verileri alinamadi. Backend baglantisini ve tarih araligini kontrol edin.</span>
            <div>
              <Button variant="outline" onClick={handleRefresh}>
                Tekrar dene
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : !hasData ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {formatRangeLabel(startDate, endDate)} araliginda raporlanacak veri bulunmuyor.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Toplam Ciro</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(overview?.summary.totalRevenue ?? 0)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Donem: {formatRangeLabel(startDate, endDate)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Toplam Siparis</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.summary.totalOrders ?? 0}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Iptal:{" "}
                  {overview?.breakdown.ordersByStatus.find(
                    (item) => item.status === "CANCELLED"
                  )?.count ?? 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ort. Siparis Tutari</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(overview?.summary.averageOrderAmount ?? 0)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Atanan personel siparisi: {staff?.summary.trackedOrders ?? 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Musteri Sayisi</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customers?.summary.totalCustomers ?? overview?.summary.totalCustomers ?? 0}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Yeni {customers?.summary.newCustomers ?? 0} • Geri donen{" "}
                  {customers?.summary.returningCustomers ?? 0}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Gunluk Ciro ve Siparis Trendi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  {overview?.breakdown.ordersByStatus.map((status) => (
                    <span
                      key={status.status}
                      className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {orderStatusLabels[status.status] ?? status.status}: {status.count}
                    </span>
                  ))}
                </div>

                <div className="space-y-3">
                  {revenueSeries.map((day) => (
                    <div key={day.date} className="flex items-center gap-3">
                      <div className="w-16 flex-shrink-0 text-sm font-medium">
                        {day.label}
                      </div>
                      <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted">
                        <div
                          className="h-full rounded-md bg-primary transition-all"
                          style={{
                            width:
                              maxRevenue > 0 ? `${(day.revenue / maxRevenue) * 100}%` : "0%",
                          }}
                        />
                      </div>
                      <div className="w-28 flex-shrink-0 text-right text-xs text-muted-foreground">
                        {formatCurrency(day.revenue)} • {day.orders} siparis
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>En Cok Satan Urunler</CardTitle>
              </CardHeader>
              <CardContent>
                {products?.items.length ? (
                  <div className="space-y-3">
                    {products.items.map((product, index) => (
                      <div key={product.productId} className="flex items-start gap-3">
                        <span className="mt-0.5 w-5 flex-shrink-0 text-xs font-medium text-muted-foreground">
                          {index + 1}.
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <span className="truncate text-sm font-medium">
                              {product.productName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(product.revenue)}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary/70 transition-all"
                              style={{
                                width:
                                  maxProductQuantity > 0
                                    ? `${(product.quantity / maxProductQuantity) * 100}%`
                                    : "0%",
                              }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {product.quantity} adet • {product.orderCount} siparis
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Secili aralikta urun satis verisi bulunmuyor.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Personel Performansi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1">
                  Takip edilen siparis: {staff?.summary.trackedOrders ?? 0}
                </span>
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1">
                  Atanmayan siparis: {staff?.summary.unassignedOrders ?? 0}
                </span>
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1">
                  Personel cirosu: {formatCurrency(staff?.summary.totalRevenue ?? 0)}
                </span>
              </div>

              {staff?.items.length ? (
                <div className="space-y-2">
                  {staff.items.map((member) => (
                    <div
                      key={member.staffUserId ?? "system"}
                      className="grid gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 md:grid-cols-[1.6fr_0.8fr_0.8fr_1fr_1fr]"
                    >
                      <div>
                        <div className="font-medium">{member.staffName}</div>
                        <div className="text-xs text-muted-foreground">
                          {staffRoleLabels[member.role] ?? member.role}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{member.orderCount}</div>
                        <div className="text-xs text-muted-foreground">Siparis</div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{formatCurrency(member.revenue)}</div>
                        <div className="text-xs text-muted-foreground">Ciro</div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">
                          {formatCurrency(member.averageOrderValue)}
                        </div>
                        <div className="text-xs text-muted-foreground">Ortalama</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.staffUserId ? "Takipte" : "Elle atanmamis"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Secili aralikta personel bazli siparis verisi bulunmuyor.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
