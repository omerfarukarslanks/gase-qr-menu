"use client";

import { useMemo, useState } from "react";
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
  const refundPayment = useRefundPayment();

  const {
    data: paymentResult,
    isLoading,
    isError,
    error,
    refetch,
  } = usePayments(activeStoreId ?? "", {
    pageSize: 100,
  });

  const allPayments = paymentResult?.data ?? [];
  const payments = useMemo(
    () =>
      allPayments.filter((payment) => {
        const matchesFilter = filter === "ALL" || payment.status === filter;
        const normalizedSearch = search.trim().toLowerCase();
        const matchesSearch =
          !normalizedSearch ||
          payment.tableName.toLowerCase().includes(normalizedSearch) ||
          String(payment.orderNumber ?? "").includes(normalizedSearch);

        return matchesFilter && matchesSearch;
      }),
    [allPayments, filter, search]
  );

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
    { key: "ALL", label: `Tumu (${allPayments.length})` },
    {
      key: "COMPLETED",
      label: `Tamamlanan (${allPayments.filter((item) => item.status === "COMPLETED").length})`,
    },
    {
      key: "PENDING",
      label: `Bekleyen (${allPayments.filter((item) => item.status === "PENDING").length})`,
    },
    {
      key: "FAILED",
      label: `Basarisiz (${allPayments.filter((item) => item.status === "FAILED").length})`,
    },
    {
      key: "REFUNDED",
      label: `Iade (${allPayments.filter((item) => item.status === "REFUNDED").length})`,
    },
  ];

  const handleRefund = async (paymentId: string) => {
    const confirmed = window.confirm(
      "Bu odeme icin iade islemi baslatilsin mi?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await refundPayment.mutateAsync(paymentId);
    } catch {
      // The backend error state is enough for now; keep the table responsive.
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Odemeler</h1>
          <p className="text-muted-foreground">
            {activeStore?.name
              ? `${activeStore.name} odeme kayitlarini canli olarak izleyin.`
              : "Magazaya ait odeme kayitlarini yonetin."}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Yenile
        </Button>
      </div>

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
              <span className="text-2xl font-bold">
                {formatCurrency(totalCash)}
              </span>
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
              <span className="text-2xl font-bold">
                {formatCurrency(totalCard)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
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
        <CardContent className="p-0">
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="p-4 font-medium">Siparis</th>
                    <th className="p-4 font-medium">Masa</th>
                    <th className="p-4 font-medium">Yontem</th>
                    <th className="p-4 font-medium text-right">Tutar</th>
                    <th className="p-4 font-medium">Durum</th>
                    <th className="p-4 font-medium">Tarih</th>
                    <th className="p-4 font-medium text-right">Islem</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const status = statusConfig[payment.status];
                    const method = methodConfig[payment.method];
                    const StatusIcon = status.icon;
                    const MethodIcon = method.icon;

                    return (
                      <tr
                        key={payment.id}
                        className="border-b align-top last:border-0 hover:bg-muted/40"
                      >
                        <td className="p-4 font-medium">
                          {payment.orderNumber
                            ? `#${String(payment.orderNumber).padStart(3, "0")}`
                            : "-"}
                        </td>
                        <td className="p-4 text-sm">{payment.tableName}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm">
                            <MethodIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{method.label}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-semibold">
                          {formatCurrency(payment.amount, payment.currency)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.color}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="p-4 text-right">
                          {payment.status === "COMPLETED" ? (
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
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
