"use client";

import { useState } from "react";
import {
  Plus,
  Users,
  QrCode,
  Pencil,
  Trash2,
  Clock,
  ChefHat,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "OUT_OF_SERVICE";
type Section = "IC_MEKAN" | "DIS_MEKAN" | "TERAS" | "VIP";

interface RestaurantTable {
  id: string;
  number: number;
  name: string;
  capacity: number;
  section: Section;
  status: TableStatus;
  customerName?: string;
  sessionMinutes?: number;
  orderCount?: number;
}

const sectionLabels: Record<Section, string> = {
  IC_MEKAN: "Ic Mekan",
  DIS_MEKAN: "Dis Mekan",
  TERAS: "Teras",
  VIP: "VIP",
};

const sectionColors: Record<Section, string> = {
  IC_MEKAN: "bg-blue-100 text-blue-700",
  DIS_MEKAN: "bg-emerald-100 text-emerald-700",
  TERAS: "bg-amber-100 text-amber-700",
  VIP: "bg-purple-100 text-purple-700",
};

const statusConfig: Record<
  TableStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  AVAILABLE: {
    label: "Musait",
    color: "text-green-700",
    bg: "bg-green-100",
    border: "border-green-300",
  },
  OCCUPIED: {
    label: "Dolu",
    color: "text-red-700",
    bg: "bg-red-100",
    border: "border-red-300",
  },
  RESERVED: {
    label: "Rezerve",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
    border: "border-yellow-300",
  },
  OUT_OF_SERVICE: {
    label: "Hizmet Disi",
    color: "text-gray-700",
    bg: "bg-gray-100",
    border: "border-gray-300",
  },
};

const mockTables: RestaurantTable[] = [
  { id: "1", number: 1, name: "Pencere Kenari 1", capacity: 4, section: "IC_MEKAN", status: "OCCUPIED", customerName: "Ahmet Yilmaz", sessionMinutes: 45, orderCount: 3 },
  { id: "2", number: 2, name: "Pencere Kenari 2", capacity: 4, section: "IC_MEKAN", status: "AVAILABLE" },
  { id: "3", number: 3, name: "Orta Masa 1", capacity: 6, section: "IC_MEKAN", status: "RESERVED" },
  { id: "4", number: 4, name: "Orta Masa 2", capacity: 2, section: "IC_MEKAN", status: "AVAILABLE" },
  { id: "5", number: 5, name: "Bahce 1", capacity: 4, section: "DIS_MEKAN", status: "OCCUPIED", customerName: "Elif Demir", sessionMinutes: 20, orderCount: 1 },
  { id: "6", number: 6, name: "Bahce 2", capacity: 6, section: "DIS_MEKAN", status: "AVAILABLE" },
  { id: "7", number: 7, name: "Bahce 3", capacity: 8, section: "DIS_MEKAN", status: "OUT_OF_SERVICE" },
  { id: "8", number: 8, name: "Teras 1", capacity: 4, section: "TERAS", status: "OCCUPIED", customerName: "Mehmet Kara", sessionMinutes: 60, orderCount: 5 },
  { id: "9", number: 9, name: "Teras 2", capacity: 2, section: "TERAS", status: "AVAILABLE" },
  { id: "10", number: 10, name: "Teras 3", capacity: 4, section: "TERAS", status: "RESERVED" },
  { id: "11", number: 11, name: "VIP Salon 1", capacity: 8, section: "VIP", status: "OCCUPIED", customerName: "Ayse Ozturk", sessionMinutes: 90, orderCount: 8 },
  { id: "12", number: 12, name: "VIP Salon 2", capacity: 10, section: "VIP", status: "AVAILABLE" },
];

interface TableFormData {
  number: number;
  name: string;
  capacity: number;
  section: Section;
}

const emptyForm: TableFormData = {
  number: 0,
  name: "",
  capacity: 2,
  section: "IC_MEKAN",
};

type FilterSection = "ALL" | Section;

export default function TablesPage() {
  const [tables, setTables] = useState<RestaurantTable[]>(mockTables);
  const [activeFilter, setActiveFilter] = useState<FilterSection>("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TableFormData>(emptyForm);

  const filteredTables =
    activeFilter === "ALL"
      ? tables
      : tables.filter((t) => t.section === activeFilter);

  const filterTabs: { key: FilterSection; label: string }[] = [
    { key: "ALL", label: "Tumu" },
    { key: "IC_MEKAN", label: "Ic Mekan" },
    { key: "DIS_MEKAN", label: "Dis Mekan" },
    { key: "TERAS", label: "Teras" },
    { key: "VIP", label: "VIP" },
  ];

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      ...emptyForm,
      number: Math.max(0, ...tables.map((t) => t.number)) + 1,
    });
    setShowForm(true);
  };

  const handleEdit = (table: RestaurantTable) => {
    setEditingId(table.id);
    setFormData({
      number: table.number,
      name: table.name,
      capacity: table.capacity,
      section: table.section,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setTables(tables.filter((t) => t.id !== id));
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (editingId) {
      setTables(
        tables.map((t) =>
          t.id === editingId
            ? { ...t, number: formData.number, name: formData.name, capacity: formData.capacity, section: formData.section }
            : t
        )
      );
    } else {
      const newTable: RestaurantTable = {
        id: `new-${Date.now()}`,
        number: formData.number,
        name: formData.name,
        capacity: formData.capacity,
        section: formData.section,
        status: "AVAILABLE",
      };
      setTables([...tables, newTable]);
    }

    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Masalar</h1>
          <p className="text-muted-foreground">
            Masalari yonetin, QR kodlari olusturun ve masa durumlarini takip edin.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Masa Ekle
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filterTabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeFilter === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {editingId ? "Masa Duzenle" : "Yeni Masa Ekle"}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Masa Numarasi</label>
                <Input
                  type="number"
                  placeholder="1"
                  value={formData.number || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, number: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Masa Adi</label>
                <Input
                  placeholder="ornek: Pencere Kenari 1"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Kapasite (Kisi)</label>
                <Input
                  type="number"
                  placeholder="4"
                  min={1}
                  max={20}
                  value={formData.capacity || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: parseInt(e.target.value) || 2 })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bolum</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.section}
                  onChange={(e) =>
                    setFormData({ ...formData, section: e.target.value as Section })
                  }
                >
                  {Object.entries(sectionLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={handleSave}>
                {editingId ? "Guncelle" : "Kaydet"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                Iptal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const status = statusConfig[table.status];
          return (
            <Card
              key={table.id}
              className={`relative overflow-hidden border-2 ${status.border}`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 ${status.bg}`} />
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-bold">Masa {table.number}</div>
                    <div className="text-sm text-muted-foreground">{table.name}</div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.bg} ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {table.capacity} Kisi
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sectionColors[table.section]}`}
                  >
                    {sectionLabels[table.section]}
                  </span>
                </div>

                {table.status === "OCCUPIED" && (
                  <div className="rounded-md bg-muted/50 p-2 space-y-1">
                    <div className="text-sm font-medium">{table.customerName}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {table.sessionMinutes} dk
                      </span>
                      <span className="flex items-center gap-1">
                        <ChefHat className="h-3 w-3" />
                        {table.orderCount} siparis
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="QR Kod Indir"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(table)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(table.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
