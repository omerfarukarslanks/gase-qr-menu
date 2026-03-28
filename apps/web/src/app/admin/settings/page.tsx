"use client";

import { useState } from "react";
import { Save, Store, CreditCard, Globe, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const tabs = [
  { key: "store", label: "Magaza Bilgileri", icon: Store },
  { key: "payment", label: "Odeme Ayarlari", icon: CreditCard },
  { key: "language", label: "Dil Ayarlari", icon: Globe },
  { key: "staff", label: "Personel", icon: Users },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("store");

  const [storeForm, setStoreForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    logo: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    iyzicoApiKey: "",
    iyzicoSecretKey: "",
    isSandbox: true,
  });

  const [languages, setLanguages] = useState([
    { code: "tr", name: "Turkce", isDefault: true, isActive: true },
    { code: "en", name: "English", isDefault: false, isActive: false },
    { code: "de", name: "Deutsch", isDefault: false, isActive: false },
    { code: "ar", name: "Arabic", isDefault: false, isActive: false },
  ]);

  function handleStoreSubmit(e: React.FormEvent) {
    e.preventDefault();
    // API call would go here
    alert("Magaza bilgileri kaydedildi.");
  }

  function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    // API call would go here
    alert("Odeme ayarlari kaydedildi.");
  }

  function toggleLanguage(code: string) {
    setLanguages(
      languages.map((lang) =>
        lang.code === code && !lang.isDefault
          ? { ...lang, isActive: !lang.isActive }
          : lang
      )
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-muted-foreground">
          Magaza, odeme ve dil ayarlarini yapilandirin.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon className="mr-2 h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Store Info Tab */}
      {activeTab === "store" && (
        <Card>
          <CardHeader>
            <CardTitle>Magaza Bilgileri</CardTitle>
            <CardDescription>
              Magazanizin temel bilgilerini guncelleyin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleStoreSubmit}
              className="space-y-4 max-w-lg"
              onInvalidCapture={(event) =>
                event.currentTarget.classList.add("form-validation-submitted")
              }
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">Magaza Adi</label>
                <Input
                  placeholder="orn. GASE Restaurant"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Adres</label>
                <Input
                  placeholder="Magaza adresi"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefon</label>
                  <Input
                    placeholder="+90 5xx xxx xx xx"
                    value={storeForm.phone}
                    onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="info@restoran.com"
                    value={storeForm.email}
                    onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Logo URL</label>
                <Input
                  placeholder="Logo dosya yolu veya URL"
                  value={storeForm.logo}
                  onChange={(e) => setStoreForm({ ...storeForm, logo: e.target.value })}
                />
              </div>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Kaydet
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Payment Settings Tab */}
      {activeTab === "payment" && (
        <Card>
          <CardHeader>
            <CardTitle>Odeme Ayarlari</CardTitle>
            <CardDescription>
              iyzico odeme entegrasyonu ayarlari. 3D Secure zorunludur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handlePaymentSubmit}
              className="space-y-4 max-w-lg"
              onInvalidCapture={(event) =>
                event.currentTarget.classList.add("form-validation-submitted")
              }
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">iyzico API Key</label>
                <Input
                  type="password"
                  placeholder="API anahtarinizi girin"
                  value={paymentForm.iyzicoApiKey}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, iyzicoApiKey: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">iyzico Secret Key</label>
                <Input
                  type="password"
                  placeholder="Secret anahtarinizi girin"
                  value={paymentForm.iyzicoSecretKey}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, iyzicoSecretKey: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sandbox"
                  checked={paymentForm.isSandbox}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, isSandbox: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="sandbox" className="text-sm font-medium">
                  Sandbox Modu (Test ortami)
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Sandbox: https://sandbox-api.iyzipay.com | Production:
                https://api.iyzipay.com
              </p>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Kaydet
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Language Settings Tab */}
      {activeTab === "language" && (
        <Card>
          <CardHeader>
            <CardTitle>Dil Ayarlari</CardTitle>
            <CardDescription>
              Menu ve arayuzde kullanilacak dilleri secin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-w-lg">
              {languages.map((lang) => (
                <div
                  key={lang.code}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono uppercase bg-muted px-2 py-1 rounded">
                      {lang.code}
                    </span>
                    <span className="text-sm font-medium">{lang.name}</span>
                    {lang.isDefault && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Varsayilan
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleLanguage(lang.code)}
                    disabled={lang.isDefault}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      lang.isActive ? "bg-primary" : "bg-muted"
                    } ${lang.isDefault ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        lang.isActive ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff Tab - Link to Staff Page */}
      {activeTab === "staff" && (
        <Card>
          <CardHeader>
            <CardTitle>Personel Yonetimi</CardTitle>
            <CardDescription>
              Personel ekleyin, rollerini ve sube atamalarini yonetin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/staff">
              <Button>
                <Users className="mr-2 h-4 w-4" />
                Personel Yonetim Sayfasina Git
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
