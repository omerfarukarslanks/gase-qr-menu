"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";

/**
 * Mutfak Ekrani - Tam ekran modunda kullanilmak uzere tasarlanmistir.
 * Siparisler WebSocket uzerinden canli olarak guncellenir.
 * Her siparis karti hazirlama suresiyle birlikte gosterilir.
 */
export default function KitchenDisplayPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mutfak Ekrani</h1>
          <p className="text-muted-foreground">
            Canli siparis takibi. Tam ekran modunda kullanmaniz onerilir.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            if (typeof document !== "undefined") {
              document.documentElement.requestFullscreen?.();
            }
          }}
        >
          <Maximize2 className="mr-2 h-4 w-4" />
          Tam Ekran
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Bekleyen Siparisler</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Henuz bekleyen siparis yok.
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Hazirlaniyor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Hazirlanan siparis yok.
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Hazir</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Servise hazir siparis yok.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
