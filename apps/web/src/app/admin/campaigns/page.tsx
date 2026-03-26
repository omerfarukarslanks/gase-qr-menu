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

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kampanyalar</h1>
          <p className="text-muted-foreground">
            Indirim, promosyon ve ozel teklifler olusturun.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Kampanya
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kampanya Listesi</CardTitle>
          <CardDescription>
            Aktif ve gecmis kampanyalarinizi buradan yonetebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Henuz kampanya eklenmemis. &quot;Yeni Kampanya&quot; butonuna
            tiklayarak baslayabilirsiniz.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
