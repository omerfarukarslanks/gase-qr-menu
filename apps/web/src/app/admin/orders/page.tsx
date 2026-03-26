"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const statusTabs = [
  { key: "all", label: "Tumunu" },
  { key: "pending", label: "Bekleyen" },
  { key: "preparing", label: "Hazirlaniyor" },
  { key: "ready", label: "Hazir" },
  { key: "served", label: "Servis Edildi" },
  { key: "paid", label: "Odendi" },
  { key: "cancelled", label: "Iptal" },
];

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Siparisler</h1>
        <p className="text-muted-foreground">
          Gelen siparisleri takip edin, durumlarini guncelleyin.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statusTabs.map((tab) => (
          <Button
            key={tab.key}
            variant={tab.key === "all" ? "default" : "outline"}
            size="sm"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Siparis Listesi</CardTitle>
          <CardDescription>
            Canli siparis takibi. Yeni siparisler otomatik olarak gorunur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Henuz siparis bulunmuyor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
