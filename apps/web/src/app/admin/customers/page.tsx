"use client";

import { useState } from "react";
import { Search, Eye, X, Users, CreditCard, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCustomers, useCustomerDetails } from "@/hooks/use-customers";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useCurrentStore } from "@/hooks/use-current-store";

export default function CustomersPage() {
  const { activeStoreId, activeStore } = useCurrentStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const { data, isLoading } = useCustomers(activeStoreId ?? "", {
    page,
    search: search || undefined,
  });
  const { data: customerDetail, isLoading: detailLoading } = useCustomerDetails(
    selectedCustomerId ?? ""
  );

  const customers = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Musteriler</h1>
          <p className="text-muted-foreground">
            {activeStore
              ? `${activeStore.name} icin musteri verilerini inceleyin.`
              : "Aktif magaza secimi bekleniyor."}
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Musteri ara (isim, email, telefon)..."
          className="pl-10"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer List */}
        <div className={selectedCustomerId ? "lg:col-span-2" : "lg:col-span-3"}>
          <Card>
            <CardHeader>
              <CardTitle>Musteri Listesi</CardTitle>
              <CardDescription>
                Kayitli tum musteriler ve istatistikleri.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Yukleniyor...</p>
              ) : !activeStoreId ? (
                <p className="text-sm text-muted-foreground">
                  Devam etmek icin bir magaza secin.
                </p>
              ) : customers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Henuz musteri kaydi bulunmuyor.
                </p>
              ) : (
                <>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">Isim</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Telefon</th>
                        <th className="pb-3 font-medium text-right">Ziyaret</th>
                        <th className="pb-3 font-medium text-right">Toplam Harcama</th>
                        <th className="pb-3 font-medium text-right">Islemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => (
                        <tr
                          key={customer.id}
                          className={`border-b last:border-0 cursor-pointer transition-colors ${
                            selectedCustomerId === customer.id
                              ? "bg-accent"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => setSelectedCustomerId(customer.id)}
                        >
                          <td className="py-3 text-sm font-medium">{customer.name}</td>
                          <td className="py-3 text-sm text-muted-foreground">
                            {customer.email || "-"}
                          </td>
                          <td className="py-3 text-sm text-muted-foreground">
                            {customer.phone || "-"}
                          </td>
                          <td className="py-3 text-sm text-right">{customer.visitCount}</td>
                          <td className="py-3 text-sm text-right font-medium">
                            {formatCurrency(customer.totalSpent)}
                          </td>
                          <td className="py-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCustomerId(customer.id);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {meta && meta.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <p className="text-sm text-muted-foreground">
                        Toplam {meta.total} musteri, Sayfa {meta.page} / {meta.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage(page - 1)}
                        >
                          Onceki
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= meta.totalPages}
                          onClick={() => setPage(page + 1)}
                        >
                          Sonraki
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customer Detail Panel */}
        {selectedCustomerId && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Musteri Detayi</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedCustomerId(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {detailLoading ? (
                  <p className="text-sm text-muted-foreground">Yukleniyor...</p>
                ) : !customerDetail ? (
                  <p className="text-sm text-muted-foreground">
                    Musteri bilgisi bulunamadi.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold">{customerDetail.name}</h3>
                      {customerDetail.email && (
                        <p className="text-sm text-muted-foreground">
                          {customerDetail.email}
                        </p>
                      )}
                      {customerDetail.phone && (
                        <p className="text-sm text-muted-foreground">
                          {customerDetail.phone}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border p-3 text-center">
                        <Users className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
                        <p className="text-lg font-bold">{customerDetail.visitCount}</p>
                        <p className="text-xs text-muted-foreground">Ziyaret</p>
                      </div>
                      <div className="rounded-lg border p-3 text-center">
                        <CreditCard className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
                        <p className="text-lg font-bold">
                          {formatCurrency(customerDetail.totalSpent)}
                        </p>
                        <p className="text-xs text-muted-foreground">Harcama</p>
                      </div>
                    </div>

                    {/* Loyalty */}
                    {customerDetail.loyalty && (
                      <div className="rounded-lg border p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <h4 className="text-sm font-medium">Sadakat Programi</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Seviye:</span>{" "}
                            {customerDetail.loyalty.tier}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Puan:</span>{" "}
                            {customerDetail.loyalty.points}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Kazanilan:</span>{" "}
                            {customerDetail.loyalty.totalEarned}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Kullanilan:</span>{" "}
                            {customerDetail.loyalty.totalRedeemed}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Visit History */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Ziyaret Gecmisi</h4>
                      {customerDetail.visits && customerDetail.visits.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {customerDetail.visits.map((visit) => (
                            <div
                              key={visit.id}
                              className="rounded-lg border p-3 text-sm space-y-1"
                            >
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  {formatDate(visit.date)}
                                </span>
                                <span className="font-medium">
                                  {formatCurrency(visit.totalAmount)}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Masa: {visit.tableName} | {visit.orderCount} siparis
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Ziyaret gecmisi bulunamadi.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
