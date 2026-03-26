"use client";

import { Plus, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TablesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Masalar</h1>
          <p className="text-muted-foreground">
            Masalari yonetin, QR kodlari olusturun ve masa durumlarini takip
            edin.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <QrCode className="mr-2 h-4 w-4" />
            Toplu QR Olustur
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Masa
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Masa Listesi</CardTitle>
          <CardDescription>
            Her masa icin QR kodu olusturulur ve yazicidan bastirilabilir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Henuz masa eklenmemis. &quot;Yeni Masa&quot; butonuna tiklayarak
            baslayabilirsiniz.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
