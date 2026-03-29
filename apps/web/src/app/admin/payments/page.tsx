"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ResponsiveDataTable } from "@/components/admin/responsive-data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCurrentStore } from "@/hooks/use-current-store";
import {
  type PaymentMethod,
  type PaymentStatus,
  usePayments,
  useRefundPayment,
} from "@/hooks/use-payments";
import type { AdminPageSize } from "@/lib/pagination";
import { formatCurrency, formatDate } from "@/lib/utils";

type FilterStatus = "ALL" | PaymentStatus;

const statusConfig: Record<
  PaymentStatus,
  { label: string; icon: typeof CheckCircle2; color: string; bg: string }
> = {
  COMPLETED: {
    label: "Tamamlandi",
    icon: CheckCircle2,
    color: "text-green-700",
    bg: "bg-green-100",
  },
  PENDING: {
    label: "Bekliyor",
    icon: Clock,
    color: "text-yellow-700",
    bg: "bg-yellow-100",
  },
  FAILED: {
    label: "Basarisiz",
    icon: XCircle,
    color: "text-red-700",
    bg: "bg-red-100",
  },
  REFUNDED: {
    label: "Iade edildi",
    icon: ArrowLeftRight,
    color: "text-blue-700",
    bg: "bg-blue-100",
  },
};

const methodConfig: Record<
  PaymentMethod,
  { label: string; icon: typeof CreditCard }
> = {
  CREDIT_CARD: { label: "Kredi karti", icon: CreditCard },
  CASH: { label: "Nakit", icon: Banknote },
  ONLINE: { label: "Online", icon: CreditCard },
};

export default function PaymentsPage() {
  const { activeStore, activeStoreId } = useCurrentStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(10);
  const refundPayment = useRefundPayment();

  const {
    data: paymentResult,
    isLoading,
    isError,
    error,
    refetch,
  } = usePayments(activeStoreId ?? "", {
    page,
    pageSize,
    search: search.trim() || undefined,
    status: filter === "ALL" ? undefined : filter,
  });

  const payments = paymentResult?.data ?? [];

  useEffect(() => {
    setPage(1);
  }, [activeStoreId, filter, search]);

  const totalCompleted = useMemo(
    () =>
      payments
        .filter((payment) => payment.status === "COMPLETED")
        .reduce((sum, payment) => sum + payment.amount, 0),
    [payments]
  );

  const totalCash = useMemo(
    () =>
      payments
        .filter(
          (payment) =>
            payment.status === "COMPLETED" && payment.method === "CASH"
        )
        .reduce((sum, payment) => sum + payment.amount, 0),
    [payments]
  );

  const totalCard = useMemo(
    () =>
      payments
        .filter(
          (payment) =>
            payment.status === "COMPLETED" && payment.method === "CREDIT_CARD"
        )
        .reduce((sum, payment) => sum + payment.amount, 0),
    [payments]
  );

  const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: "ALL", label: "Tumu" },
    { key: "COMPLETED", label: "Tamamlanan" },
    { key: "PENDING", label: "Bekleyen" },
    { key: "FAILED", label: "Basarisiz" },
    { key: "REFUNDED", label: "Iade" },
  ];

  const handleRefund = async (paymentId: string) => {
    const confirmed = window.confirm("Bu odeme icin iade islemi baslatilsin mi?");

    if (!confirmed) {
      return;
    }

    try {
      await refundPayment.mutateAsync(paymentId);
    } catch {
      // Backend hata durumu yeterli.
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Odemeler"
        description={
          activeStore?.name
            ? `${activeStore.name} odeme kayitlarini canli olarak izleyin.`
            : "Magazaya ait odeme kayitlarini yonetin."
        }
        action={
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Yenile
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tamamlanan odemeler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCompleted)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nakit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{formatCurrency(totalCash)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{formatCurrency(totalCard)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Siparis no veya masa ara..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <Button
              key={tab.key}
              variant={filter === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0 sm:p-0">
          {isLoading ? (
            <div className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Odemeler yukleniyor...
            </div>
          ) : isError ? (
            <div className="p-6 text-sm text-destructive">
              {error instanceof Error ? error.message : "Odemeler alinamadi."}
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Odeme kaydi bulunamadi.
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <ResponsiveDataTable
                data={payments}
                getKey={(payment) => payment.id}
                tableClassName="min-w-[760px]"
                columns={[
                  {
                    header: "Siparis",
                    className: "p-0 pr-4 align-top",
                    cell: (payment) => (
                      <span className="font-medium">
                        {payment.orderNumber
                          ? `#${String(payment.orderNumber).padStart(3, "0")}`
                          : "-"}
                      </span>
                    ),
                  },
                  {
                    header: "Masa",
                    className: "p-0 pr-4 align-top",
                    cell: (payment) => payment.tableName,
                  },
                  {
                    header: "Yontem",
                    className: "p-0 pr-4 align-top",
                    cell: (payment) => {
                      const method = methodConfig[payment.method];
                      const MethodIcon = method.icon;
                      return (
                        <div className="flex items-center gap-2 text-sm">
                          <MethodIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{method.label}</span>
                        </div>
                      );
                    },
                  },
                  {
                    header: "Tutar",
                    className: "p-0 pr-4 text-right align-top",
                    cell: (payment) => (
                      <span className="font-semibold">
                        {formatCurrency(payment.amount, payment.currency)}
                      </span>
                    ),
                  },
                  {
                    header: "Durum",
                    className: "p-0 pr-4 align-top",
                    cell: (payment) => {
                      const status = statusConfig[payment.status];
                      const StatusIcon = status.icon;
                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      );
                    },
                  },
                  {
                    header: "Tarih",
                    className: "p-0 pr-4 align-top",
                    cell: (payment) => (
                      <span className="text-sm text-muted-foreground">
                        {formatDate(payment.createdAt)}
                      </span>
                    ),
                  },
                  {
                    header: "Islem",
                    className: "p-0 text-right align-top",
                    cell: (payment) =>
                      payment.status === "COMPLETED" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleRefund(payment.id)}
                          disabled={refundPayment.isPending}
                        >
                          Iade
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      ),
                  },
                ]}
                mobileCard={(payment) => {
                  const status = statusConfig[payment.status];
                  const method = methodConfig[payment.method];
                  const StatusIcon = status.icon;
                  const MethodIcon = method.icon;

                  return (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {payment.orderNumber
                              ? `#${String(payment.orderNumber).padStart(3, "0")}`
                              : "Siparis baglanmadi"}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {payment.tableName}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.bg} ${status.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            Yontem
                          </p>
                          <p className="mt-1 flex items-center gap-2 font-medium text-foreground">
                            <MethodIcon className="h-4 w-4 text-muted-foreground" />
                            {method.label}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            Tutar
                          </p>
                          <p className="mt-1 font-semibold text-foreground">
                            {formatCurrency(payment.amount, payment.currency)}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            Tarih
                          </p>
                          <p className="mt-1 text-foreground">
                            {formatDate(payment.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        {payment.status === "COMPLETED" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRefund(payment.id)}
                            disabled={refundPayment.isPending}
                          >
                            Iade baslat
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Iade uygun degil</span>
                        )}
                      </div>
                    </div>
                  );
                }}
              />
              <AdminPagination
                meta={paymentResult?.meta}
                itemLabel="odeme"
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(nextPageSize) => {
                  setPageSize(nextPageSize);
                  setPage(1);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
