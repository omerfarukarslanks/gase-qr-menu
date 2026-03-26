"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Calendar } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Raporlar</h1>
          <p className="text-muted-foreground">
            Satis, urun ve musteri analizlerini inceleyin.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Tarih Araligi
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Rapor Indir
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Satis Grafigi</CardTitle>
            <CardDescription>Gunluk satis performansi</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Yeterli veri olustugunda grafik burada gorunecektir.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>En Cok Satan Urunler</CardTitle>
            <CardDescription>Populerlik sirasina gore</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Henuz veri bulunmuyor.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kategori Bazli Satis</CardTitle>
            <CardDescription>Kategorilere gore dagilim</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Henuz veri bulunmuyor.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saat Bazli Yogunluk</CardTitle>
            <CardDescription>Hangi saatlerde yogunsunuz?</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Henuz veri bulunmuyor.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
