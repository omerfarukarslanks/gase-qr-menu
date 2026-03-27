"use client";

import { useState } from "react";
import {
  CreditCard,
  Banknote,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeftRight,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";

type PaymentStatus = "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED";
type PaymentMethod = "CREDIT_CARD" | "CASH" | "ONLINE";

interface Payment {
  id: string;
  orderId: string;
  orderNumber: string;
  tableName: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  provider: string;
  createdAt: Date;
}

const statusConfig: Record<PaymentStatus, { label: string; icon: any; color: string; bg: string }> = {
  COMPLETED: { label: "Tamamlandi", icon: CheckCircle2, color: "text-green-700", bg: "bg-green-100" },
  PENDING: { label: "Bekliyor", icon: Clock, color: "text-yellow-700", bg: "bg-yellow-100" },
  FAILED: { label: "Basarisiz", icon: XCircle, color: "text-red-700", bg: "bg-red-100" },
  REFUNDED: { label: "Iade Edildi", icon: ArrowLeftRight, color: "text-blue-700", bg: "bg-blue-100" },
};

const methodLabels: Record<PaymentMethod, { label: string; icon: any }> = {
  CREDIT_CARD: { label: "Kredi Karti", icon: CreditCard },
  CASH: { label: "Nakit", icon: Banknote },
  ONLINE: { label: "Online", icon: CreditCard },
};

const mockPayments: Payment[] = [
  {
    id: "p1",
    orderId: "o1",
    orderNumber: "#001",
    tableName: "Masa 3",
    amount: 850,
    method: "CREDIT_CARD",
    status: "COMPLETED",
    provider: "IYZICO",
    createdAt: new Date(Date.now() - 30 * 60000),
  },
  {
    id: "p2",
    orderId: "o2",
    orderNumber: "#002",
    tableName: "Masa 7",
    amount: 520,
    method: "CASH",
    status: "COMPLETED",
    provider: "CASH",
    createdAt: new Date(Date.now() - 45 * 60000),
  },
  {
    id: "p3",
    orderId: "o3",
    orderNumber: "#003",
    tableName: "Masa 1",
    amount: 1200,
    method: "CREDIT_CARD",
    status: "PENDING",
    provider: "IYZICO",
    createdAt: new Date(Date.now() - 5 * 60000),
  },
  {
    id: "p4",
    orderId: "o4",
    orderNumber: "#004",
    tableName: "Masa 5",
    amount: 340,
    method: "CREDIT_CARD",
    status: "FAILED",
    provider: "IYZICO",
    createdAt: new Date(Date.now() - 60 * 60000),
  },
  {
    id: "p5",
    orderId: "o5",
    orderNumber: "#005",
    tableName: "Masa 12",
    amount: 680,
    method: "CASH",
    status: "COMPLETED",
    provider: "CASH",
    createdAt: new Date(Date.now() - 90 * 60000),
  },
  {
    id: "p6",
    orderId: "o6",
    orderNumber: "#006",
    tableName: "Masa 9",
    amount: 450,
    method: "CREDIT_CARD",
    status: "REFUNDED",
    provider: "IYZICO",
    createdAt: new Date(Date.now() - 120 * 60000),
  },
];

type FilterStatus = "ALL" | PaymentStatus;

export default function PaymentsPage() {
  const [payments] = useState<Payment[]>(mockPayments);
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [search, setSearch] = useState("");

  const filtered = payments
    .filter((p) => filter === "ALL" || p.status === filter)
    .filter(
      (p) =>
        !search ||
        p.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        p.tableName.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const totalCompleted = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCash = payments
    .filter((p) => p.status === "COMPLETED" && p.method === "CASH")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCard = payments
    .filter((p) => p.status === "COMPLETED" && p.method === "CREDIT_CARD")
    .reduce((sum, p) => sum + p.amount, 0);

  const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: "ALL", label: `Tumu (${payments.length})` },
    { key: "COMPLETED", label: `Tamamlanan (${payments.filter((p) => p.status === "COMPLETED").length})` },
    { key: "PENDING", label: `Bekleyen (${payments.filter((p) => p.status === "PENDING").length})` },
    { key: "FAILED", label: `Basarisiz (${payments.filter((p) => p.status === "FAILED").length})` },
    { key: "REFUNDED", label: `Iade (${payments.filter((p) => p.status === "REFUNDED").length})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Odemeler</h1>
          <p className="text-muted-foreground">
            Tum odeme islemlerini takip edin ve yonetin.
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Yenile
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Gelir (Bugun)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCompleted)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nakit Odemeler
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
              Kart Odemeler
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Siparis no veya masa ara..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
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

      {/* Payment List */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Odeme kaydi bulunamadi.
                  </td>
                </tr>
              ) : (
                filtered.map((payment) => {
                  const status = statusConfig[payment.status];
                  const method = methodLabels[payment.method];
                  const StatusIcon = status.icon;
                  const MethodIcon = method.icon;

                  return (
                    <tr key={payment.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-4 font-medium">{payment.orderNumber}</td>
                      <td className="p-4 text-sm">{payment.tableName}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm">
                          <MethodIcon className="h-4 w-4 text-muted-foreground" />
                          {method.label}
                        </div>
                      </td>
                      <td className="p-4 text-right font-semibold">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {payment.createdAt.toLocaleString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </td>
                      <td className="p-4 text-right">
                        {payment.status === "COMPLETED" && (
                          <Button variant="ghost" size="sm" className="text-xs">
                            Iade
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
