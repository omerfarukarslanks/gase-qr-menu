"use client";

import { useState } from "react";
import {
  Tag,
  Percent,
  Clock,
  Calendar,
  Gift,
  Pencil,
  Trash2,
  Plus,
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

type CampaignType = "PERCENTAGE" | "FIXED_AMOUNT" | "BUY_X_GET_Y" | "HAPPY_HOUR";

interface Campaign {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  discountValue: number;
  buyX?: number;
  getY?: number;
  minOrderAmount: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  usageCount: number;
  usageLimit: number;
  isActive: boolean;
}

const mockCampaigns: Campaign[] = [
  {
    id: "1",
    name: "Yaz Indirimi",
    description: "Tum menude gecerli yaz kampanyasi",
    type: "PERCENTAGE",
    discountValue: 20,
    minOrderAmount: 100,
    startDate: "2026-03-01",
    endDate: "2026-06-30",
    startTime: "",
    endTime: "",
    usageCount: 45,
    usageLimit: 100,
    isActive: true,
  },
  {
    id: "2",
    name: "Hosgeldin Kuponu",
    description: "Ilk siparis icin ozel indirim",
    type: "FIXED_AMOUNT",
    discountValue: 50,
    minOrderAmount: 150,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    startTime: "",
    endTime: "",
    usageCount: 120,
    usageLimit: 500,
    isActive: true,
  },
  {
    id: "3",
    name: "2 Al 1 Ode - Icecekler",
    description: "Secili iceceklerde 2 al 1 ode firsati",
    type: "BUY_X_GET_Y",
    discountValue: 0,
    buyX: 2,
    getY: 1,
    minOrderAmount: 0,
    startDate: "2026-03-15",
    endDate: "2026-04-15",
    startTime: "",
    endTime: "",
    usageCount: 67,
    usageLimit: 200,
    isActive: true,
  },
  {
    id: "4",
    name: "Happy Hour",
    description: "Ogle saatlerinde ozel indirim",
    type: "HAPPY_HOUR",
    discountValue: 30,
    minOrderAmount: 0,
    startDate: "2026-03-01",
    endDate: "2026-09-30",
    startTime: "14:00",
    endTime: "17:00",
    usageCount: 230,
    usageLimit: 0,
    isActive: true,
  },
  {
    id: "5",
    name: "Kis Kampanyasi",
    description: "Kis menusune ozel sabit indirim",
    type: "PERCENTAGE",
    discountValue: 15,
    minOrderAmount: 200,
    startDate: "2025-11-01",
    endDate: "2026-02-28",
    startTime: "",
    endTime: "",
    usageCount: 89,
    usageLimit: 100,
    isActive: false,
  },
];

interface CampaignFormData {
  name: string;
  description: string;
  type: CampaignType;
  discountValue: number;
  buyX: number;
  getY: number;
  minOrderAmount: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  usageLimit: number;
  isActive: boolean;
}

const emptyForm: CampaignFormData = {
  name: "",
  description: "",
  type: "PERCENTAGE",
  discountValue: 0,
  buyX: 2,
  getY: 1,
  minOrderAmount: 0,
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  usageLimit: 0,
  isActive: true,
};

const typeConfig: Record<CampaignType, { label: string; color: string; icon: typeof Percent }> = {
  PERCENTAGE: { label: "%Indirim", color: "bg-blue-100 text-blue-700", icon: Percent },
  FIXED_AMOUNT: { label: "Sabit Tutar", color: "bg-green-100 text-green-700", icon: Tag },
  BUY_X_GET_Y: { label: "X Al Y Ode", color: "bg-purple-100 text-purple-700", icon: Gift },
  HAPPY_HOUR: { label: "Happy Hour", color: "bg-orange-100 text-orange-700", icon: Clock },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>(emptyForm);

  const handleAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingId(campaign.id);
    setFormData({
      name: campaign.name,
      description: campaign.description,
      type: campaign.type,
      discountValue: campaign.discountValue,
      buyX: campaign.buyX || 2,
      getY: campaign.getY || 1,
      minOrderAmount: campaign.minOrderAmount,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      startTime: campaign.startTime,
      endTime: campaign.endTime,
      usageLimit: campaign.usageLimit,
      isActive: campaign.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setCampaigns(campaigns.filter((c) => c.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setCampaigns(
      campaigns.map((c) =>
        c.id === id ? { ...c, isActive: !c.isActive } : c
      )
    );
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (editingId) {
      setCampaigns(
        campaigns.map((c) =>
          c.id === editingId
            ? {
                ...c,
                name: formData.name,
                description: formData.description,
                type: formData.type,
                discountValue: formData.discountValue,
                buyX: formData.buyX,
                getY: formData.getY,
                minOrderAmount: formData.minOrderAmount,
                startDate: formData.startDate,
                endDate: formData.endDate,
                startTime: formData.startTime,
                endTime: formData.endTime,
                usageLimit: formData.usageLimit,
                isActive: formData.isActive,
              }
            : c
        )
      );
    } else {
      const newCampaign: Campaign = {
        id: `new-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        discountValue: formData.discountValue,
        buyX: formData.buyX,
        getY: formData.getY,
        minOrderAmount: formData.minOrderAmount,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        usageCount: 0,
        usageLimit: formData.usageLimit,
        isActive: formData.isActive,
      };
      setCampaigns([...campaigns, newCampaign]);
    }

    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const formatDiscountValue = (campaign: Campaign) => {
    switch (campaign.type) {
      case "PERCENTAGE":
      case "HAPPY_HOUR":
        return `%${campaign.discountValue}`;
      case "FIXED_AMOUNT":
        return `${campaign.discountValue} TL`;
      case "BUY_X_GET_Y":
        return `${campaign.buyX} Al ${campaign.getY} Ode`;
      default:
        return "";
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kampanyalar</h1>
          <p className="text-muted-foreground">
            Indirim, promosyon ve ozel teklifler olusturun.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Kampanya
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {editingId ? "Kampanya Duzenle" : "Yeni Kampanya Olustur"}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Kampanya Adi</label>
                <Input
                  placeholder="ornek: Yaz Indirimi"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Kampanya Tipi</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as CampaignType,
                    })
                  }
                >
                  <option value="PERCENTAGE">Yuzde Indirim</option>
                  <option value="FIXED_AMOUNT">Sabit Tutar</option>
                  <option value="BUY_X_GET_Y">X Al Y Ode</option>
                  <option value="HAPPY_HOUR">Happy Hour</option>
                </select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Aciklama</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Kampanya aciklamasi"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              {formData.type === "BUY_X_GET_Y" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kac Al (X)</label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.buyX}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          buyX: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kac Ode (Y)</label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.getY}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          getY: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Indirim Degeri{" "}
                    {formData.type === "FIXED_AMOUNT" ? "(TL)" : "(%)"}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    placeholder={
                      formData.type === "FIXED_AMOUNT" ? "50" : "20"
                    }
                    value={formData.discountValue || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountValue: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Min. Siparis Tutari (TL)
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formData.minOrderAmount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minOrderAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Baslangic Tarihi</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bitis Tarihi</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>

              {formData.type === "HAPPY_HOUR" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Baslangic Saati
                    </label>
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bitis Saati</label>
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Kullanim Limiti (0 = Limitsiz)
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formData.usageLimit || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usageLimit: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <label className="text-sm font-medium">Aktif</label>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isActive ? "bg-primary" : "bg-gray-300"
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, isActive: !formData.isActive })
                  }
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => {
          const config = typeConfig[campaign.type];
          const TypeIcon = config.icon;

          return (
            <Card
              key={campaign.id}
              className={`relative ${!campaign.isActive ? "opacity-60" : ""}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {campaign.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {campaign.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(campaign)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(campaign.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
                  >
                    <TypeIcon className="h-3 w-3" />
                    {config.label}
                  </span>
                  <span className="text-sm font-semibold">
                    {formatDiscountValue(campaign)}
                  </span>
                </div>

                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      {formatDate(campaign.startDate)} -{" "}
                      {formatDate(campaign.endDate)}
                    </span>
                  </div>

                  {campaign.type === "HAPPY_HOUR" &&
                    campaign.startTime &&
                    campaign.endTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>
                          {campaign.startTime} - {campaign.endTime}
                        </span>
                      </div>
                    )}

                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      {campaign.usageCount} /{" "}
                      {campaign.usageLimit > 0
                        ? campaign.usageLimit
                        : "Limitsiz"}{" "}
                      kullanim
                    </span>
                  </div>

                  {campaign.minOrderAmount > 0 && (
                    <div className="text-xs">
                      Min. siparis: {campaign.minOrderAmount} TL
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">
                    {campaign.isActive ? "Aktif" : "Pasif"}
                  </span>
                  <button
                    type="button"
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      campaign.isActive ? "bg-primary" : "bg-gray-300"
                    }`}
                    onClick={() => handleToggleActive(campaign.id)}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        campaign.isActive ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
