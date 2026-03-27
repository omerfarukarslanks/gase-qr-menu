"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CreditCard, Banknote, Shield, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

type PaymentMethod = "CREDIT_CARD" | "CASH";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const amount = parseFloat(searchParams.get("amount") || "0");
  const discount = parseFloat(searchParams.get("discount") || "0");
  const finalAmount = amount - discount;

  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [threeDHtml, setThreeDHtml] = useState<string | null>(null);

  // Card form state
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expireMonth, setExpireMonth] = useState("");
  const [expireYear, setExpireYear] = useState("");
  const [cvc, setCvc] = useState("");

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(.{4})/g, "$1 ").trim();
  };

  const handleCashPayment = async () => {
    if (!orderId) return;
    setLoading(true);
    setError("");

    try {
      await api.post("/api/payments", {
        orderId,
        amount: finalAmount,
        method: "CASH",
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Odeme islemi basarisiz oldu");
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async () => {
    if (!orderId) return;
    if (!cardHolder || !cardNumber || !expireMonth || !expireYear || !cvc) {
      setError("Lutfen tum kart bilgilerini doldurun");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const callbackUrl = `${window.location.origin}/m/${params.menuSlug}/payment?orderId=${orderId}&amount=${amount}&discount=${discount}&callback=true`;

      const res = await api.post("/api/payments/3d-secure/initiate", {
        orderId,
        callbackUrl,
        cardHolderName: cardHolder,
        cardNumber: cardNumber.replace(/\s/g, ""),
        expireMonth,
        expireYear,
        cvc,
      });

      if (res.data?.htmlContent) {
        setThreeDHtml(res.data.htmlContent);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Kart islem basarisiz oldu");
    } finally {
      setLoading(false);
    }
  };

  // 3D Secure HTML render
  if (threeDHtml) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-lg mx-auto p-4">
          <div className="flex items-center gap-2 mb-4 text-sm text-blue-600">
            <Shield className="h-4 w-4" />
            <span>3D Secure dogrulama islemi</span>
          </div>
          <div
            dangerouslySetInnerHTML={{ __html: threeDHtml }}
            className="border rounded-lg overflow-hidden"
          />
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold">Odeme Basarili!</h2>
          <p className="text-muted-foreground">
            {finalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL odemeniz alindi.
          </p>
          <p className="text-sm text-muted-foreground">
            Tesekkur ederiz. Afiyet olsun!
          </p>
          <Button
            onClick={() => router.push(`/m/${params.menuSlug}`)}
            className="mt-4"
          >
            Menuye Don
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-3 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Odeme</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Order Summary */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="font-semibold">Siparis Ozeti</h3>
            <div className="flex justify-between text-sm">
              <span>Ara Toplam</span>
              <span>{amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Indirim</span>
                <span>-{discount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Toplam</span>
              <span>{finalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <h3 className="font-semibold">Odeme Yontemi</h3>

          <button
            onClick={() => setMethod("CREDIT_CARD")}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
              method === "CREDIT_CARD"
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="font-medium">Kredi / Banka Karti</div>
              <div className="text-xs text-muted-foreground">
                3D Secure ile guvenli odeme
              </div>
            </div>
          </button>

          <button
            onClick={() => setMethod("CASH")}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
              method === "CASH"
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-left">
              <div className="font-medium">Nakit</div>
              <div className="text-xs text-muted-foreground">
                Masada nakit odeme
              </div>
            </div>
          </button>
        </div>

        {/* Credit Card Form */}
        {method === "CREDIT_CARD" && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                <Shield className="h-4 w-4" />
                <span>iyzico 3D Secure ile korunmaktadir</span>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Kart Uzerindeki Isim</label>
                <Input
                  placeholder="AHMET YILMAZ"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Kart Numarasi</label>
                <Input
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Ay</label>
                  <Input
                    placeholder="MM"
                    value={expireMonth}
                    onChange={(e) => setExpireMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Yil</label>
                  <Input
                    placeholder="YY"
                    value={expireYear}
                    onChange={(e) => setExpireYear(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">CVC</label>
                  <Input
                    placeholder="123"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    maxLength={3}
                    type="password"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Pay Button */}
        {method && (
          <Button
            className="w-full h-12 text-base"
            onClick={method === "CASH" ? handleCashPayment : handleCardPayment}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Isleniyor...
              </>
            ) : (
              <>
                {method === "CASH" ? "Nakit Odeme Onayla" : "Guvenli Odeme Yap"}
                {" - "}
                {finalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
