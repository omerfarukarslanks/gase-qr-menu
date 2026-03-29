"use client";

import { useState } from "react";
import { CreditCard, Eye, Search, Star, Users, X } from "lucide-react";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ResponsiveDataTable } from "@/components/admin/responsive-data-table";
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
import type { AdminPageSize } from "@/lib/pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useCurrentStore } from "@/hooks/use-current-store";

export default function CustomersPage() {
  const { activeStoreId, activeStore } = useCurrentStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(10);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const { data, isLoading } = useCustomers(activeStoreId ?? "", {
    page,
    pageSize,
    search: search || undefined,
  });
  const { data: customerDetail, isLoading: detailLoading } = useCustomerDetails(
    selectedCustomerId ?? ""
  );

  const customers = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Musteriler"
        description={
          activeStore
            ? `${activeStore.name} icin musteri verilerini inceleyin.`
            : "Aktif magaza secimi bekleniyor."
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Musteri ara (isim, email, telefon)..."
          className="pl-10"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className={selectedCustomerId ? "lg:col-span-2" : "lg:col-span-3"}>
          <Card>
            <CardHeader>
              <CardTitle>Musteri listesi</CardTitle>
              <CardDescription>Kayitli tum musteriler ve istatistikleri.</CardDescription>
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
                  <ResponsiveDataTable
                    data={customers}
                    getKey={(customer) => customer.id}
                    rowClassName="cursor-pointer hover:bg-muted/40"
                    columns={[
                      {
                        header: "Isim",
                        cell: (customer) => (
                          <span className="font-medium">{customer.name}</span>
                        ),
                      },
                      {
                        header: "Email",
                        cell: (customer) => (
                          <span className="text-muted-foreground">
                            {customer.email || "-"}
                          </span>
                        ),
                      },
                      {
                        header: "Telefon",
                        cell: (customer) => (
                          <span className="text-muted-foreground">
                            {customer.phone || "-"}
                          </span>
                        ),
                      },
                      {
                        header: "Ziyaret",
                        className: "text-right",
                        cell: (customer) => customer.visitCount,
                      },
                      {
                        header: "Toplam harcama",
                        className: "text-right",
                        cell: (customer) => (
                          <span className="font-medium">
                            {formatCurrency(customer.totalSpent)}
                          </span>
                        ),
                      },
                      {
                        header: "Islemler",
                        className: "text-right",
                        cell: (customer) => (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedCustomerId(customer.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        ),
                      },
                    ]}
                    mobileCard={(customer) => (
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {customer.name}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {customer.email || customer.phone || "Iletisim bilgisi yok"}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedCustomerId(customer.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                              Ziyaret
                            </p>
                            <p className="mt-1 font-medium text-foreground">
                              {customer.visitCount}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                              Harcama
                            </p>
                            <p className="mt-1 font-medium text-foreground">
                              {formatCurrency(customer.totalSpent)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  />

                  <AdminPagination
                    meta={meta}
                    itemLabel="musteri"
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(nextPageSize) => {
                      setPageSize(nextPageSize);
                      setPage(1);
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {selectedCustomerId && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Musteri detayi</CardTitle>
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

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border p-3 text-center">
                        <Users className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                        <p className="text-lg font-bold">{customerDetail.visitCount}</p>
                        <p className="text-xs text-muted-foreground">Ziyaret</p>
                      </div>
                      <div className="rounded-lg border p-3 text-center">
                        <CreditCard className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                        <p className="text-lg font-bold">
                          {formatCurrency(customerDetail.totalSpent)}
                        </p>
                        <p className="text-xs text-muted-foreground">Harcama</p>
                      </div>
                    </div>

                    {customerDetail.loyalty && (
                      <div className="rounded-lg border p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <h4 className="text-sm font-medium">Sadakat programi</h4>
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

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Ziyaret gecmisi</h4>
                      {customerDetail.visits && customerDetail.visits.length > 0 ? (
                        <div className="max-h-64 space-y-2 overflow-y-auto">
                          {customerDetail.visits.map((visit) => (
                            <div
                              key={visit.id}
                              className="rounded-lg border p-3 text-sm space-y-1"
                            >
                              <div className="flex justify-between gap-3">
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
