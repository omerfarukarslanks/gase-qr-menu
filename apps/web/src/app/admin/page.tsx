import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ShoppingBag,
  ClipboardList,
  Users,
  TrendingUp,
  DollarSign,
  ChefHat,
  QrCode,
  AlertTriangle,
} from "lucide-react";

const stats = [
  {
    title: "Bugunun Siparisleri",
    value: "0",
    description: "Toplam siparis",
    icon: ClipboardList,
  },
  {
    title: "Bugunun Cirosu",
    value: "0 TL",
    description: "Toplam gelir",
    icon: DollarSign,
  },
  {
    title: "Aktif Masalar",
    value: "0 / 0",
    description: "Dolu / Toplam",
    icon: QrCode,
  },
  {
    title: "Aktif Urunler",
    value: "0",
    description: "Menudeki urunler",
    icon: ShoppingBag,
  },
  {
    title: "Mutfak Bekleyen",
    value: "0",
    description: "Hazirlanan siparisler",
    icon: ChefHat,
  },
  {
    title: "Musteriler",
    value: "0",
    description: "Kayitli musteri",
    icon: Users,
  },
  {
    title: "Haftalik Buyume",
    value: "%0",
    description: "Gecen haftaya gore",
    icon: TrendingUp,
  },
  {
    title: "Dusuk Stok Uyarilari",
    value: "0",
    description: "Kritik seviye",
    icon: AlertTriangle,
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pano</h1>
        <p className="text-muted-foreground">
          Restoraninizin genel durumuna goz atin.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Son Siparisler</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Henuz siparis bulunmuyor.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Populer Urunler</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Henuz veri bulunmuyor.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
