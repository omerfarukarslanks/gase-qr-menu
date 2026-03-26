"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function MenusPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menuler</h1>
          <p className="text-muted-foreground">
            Farkli menuler olusturun, urun ve kategorileri atayin, QR kodlari
            yonetin.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Menu
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menu Listesi</CardTitle>
          <CardDescription>
            Her menu icin benzersiz bir slug ve QR kodu olusturulur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Henuz menu eklenmemis. &quot;Yeni Menu&quot; butonuna tiklayarak
            baslayabilirsiniz.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
