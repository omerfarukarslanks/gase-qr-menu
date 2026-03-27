"use client";

import { useState } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Download,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DateRange = "today" | "week" | "month" | "last30" | "custom";

const dateRangeLabels: Record<DateRange, string> = {
  today: "Bugun",
  week: "Bu Hafta",
  month: "Bu Ay",
  last30: "Son 30 Gun",
  custom: "Ozel",
};

const topProducts = [
  { name: "Adana Kebap", count: 42, revenue: 5460 },
  { name: "Iskender", count: 38, revenue: 5700 },
  { name: "Lahmacun", count: 35, revenue: 2100 },
  { name: "Pide (Kiymali)", count: 31, revenue: 2790 },
  { name: "Kunefe", count: 28, revenue: 2520 },
  { name: "Ayran", count: 26, revenue: 390 },
  { name: "Mercimek Corbasi", count: 24, revenue: 1200 },
  { name: "Karisik Izgara", count: 22, revenue: 4400 },
  { name: "Baklava", count: 20, revenue: 2000 },
  { name: "Turk Kahvesi", count: 18, revenue: 720 },
];

const categoryDistribution = [
  { name: "Ana Yemekler", percentage: 45, revenue: 20354 },
  { name: "Icecekler", percentage: 20, revenue: 9046 },
  { name: "Baslangiclar", percentage: 18, revenue: 8141 },
  { name: "Tatlilar", percentage: 17, revenue: 7689 },
];

const dailyRevenue = [
  { day: "Pzt", amount: 5200 },
  { day: "Sal", amount: 4800 },
  { day: "Car", amount: 6100 },
  { day: "Per", amount: 7300 },
  { day: "Cum", amount: 8900 },
  { day: "Cmt", amount: 7430 },
  { day: "Paz", amount: 5500 },
];

const hourlyData = [
  { hour: "08", count: 3 },
  { hour: "09", count: 5 },
  { hour: "10", count: 8 },
  { hour: "11", count: 14 },
  { hour: "12", count: 28 },
  { hour: "13", count: 25 },
  { hour: "14", count: 16 },
  { hour: "15", count: 10 },
  { hour: "16", count: 8 },
  { hour: "17", count: 6 },
  { hour: "18", count: 12 },
  { hour: "19", count: 22 },
  { hour: "20", count: 26 },
  { hour: "21", count: 18 },
  { hour: "22", count: 10 },
  { hour: "23", count: 4 },
];

const maxDailyRevenue = Math.max(...dailyRevenue.map((d) => d.amount));
const maxProductCount = Math.max(...topProducts.map((p) => p.count));
const maxHourlyCount = Math.max(...hourlyData.map((h) => h.count));

export default function ReportsPage() {
  const [selectedRange, setSelectedRange] = useState<DateRange>("last30");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Raporlar</h1>
          <p className="text-muted-foreground">
            Satis, urun ve musteri analizlerini inceleyin.
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Excel Indir
        </Button>
      </div>

      {/* Date Range Selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(dateRangeLabels) as DateRange[]).map((range) => (
          <Button
            key={range}
            variant={selectedRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedRange(range)}
          >
            {range === "custom" && <Calendar className="mr-1.5 h-3.5 w-3.5" />}
            {dateRangeLabels[range]}
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ciro</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45.230 TL</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+12.5%</span> gecen aya gore
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Siparis
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">187</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+8.2%</span> gecen aya gore
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Ort. Siparis Tutari
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">241,87 TL</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+3.8%</span> gecen aya gore
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Musteri Sayisi
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">143</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+5.1%</span> gecen aya gore
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Daily Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Gunluk Ciro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailyRevenue.map((day) => (
                <div key={day.day} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-8 flex-shrink-0">
                    {day.day}
                  </span>
                  <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-md transition-all"
                      style={{
                        width: `${(day.amount / maxDailyRevenue) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-20 text-right flex-shrink-0">
                    {day.amount.toLocaleString("tr-TR")} TL
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>En Cok Satan 10 Urun</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-5 text-muted-foreground flex-shrink-0">
                    {index + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">
                        {product.name}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {product.count} adet
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded-full transition-all"
                        style={{
                          width: `${(product.count / maxProductCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Kategori Dagilimi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryDistribution.map((cat) => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{cat.name}</span>
                    <span className="text-sm text-muted-foreground">
                      %{cat.percentage} - {cat.revenue.toLocaleString("tr-TR")}{" "}
                      TL
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hourly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Saatlik Yogunluk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5 h-48">
              {hourlyData.map((h) => (
                <div
                  key={h.hour}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span className="text-[10px] text-muted-foreground">
                    {h.count}
                  </span>
                  <div
                    className="w-full bg-primary/70 rounded-t-sm transition-all"
                    style={{
                      height: `${(h.count / maxHourlyCount) * 140}px`,
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {h.hour}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
