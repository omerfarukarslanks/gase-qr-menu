"use client";

import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Urunler</h1>
          <p className="text-muted-foreground">
            Urun ekleyin, duzenleyin, fiyatlandirin ve 3D modeller yukleyin.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Urun
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Urun ara..." className="pl-9" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Urun Listesi</CardTitle>
          <CardDescription>
            Tum urunlerinizi buradan yonetebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Henuz urun eklenmemis. &quot;Yeni Urun&quot; butonuna tiklayarak
            baslayabilirsiniz.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
