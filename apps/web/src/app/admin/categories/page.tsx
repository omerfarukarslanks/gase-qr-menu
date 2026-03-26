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

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kategoriler</h1>
          <p className="text-muted-foreground">
            Menu kategorilerini yonetin. Siralama ve alt kategoriler belirleyin.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Kategori
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kategori Listesi</CardTitle>
          <CardDescription>
            Surukle-birak ile siralama yapabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Henuz kategori eklenmemis. &quot;Yeni Kategori&quot; butonuna
            tiklayarak baslayabilirsiniz.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
