"use client";

import { Suspense, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  Shield,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

type PaymentMethod = "CREDIT_CARD" | "CASH";

function PaymentPageContent() {
  const params = useParams<{ menuSlug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const amount = Number(searchParams.get("amount") || "0");
  const discount = Number(searchParams.get("discount") || "0");
  const callbackStatus = searchParams.get("status");
  const callbackMessage = searchParams.get("message");
  const finalAmount = Math.max(0, amount - discount);

  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(callbackStatus === "success");
  const [error, setError] = useState(
    callbackStatus === "failure" ? callbackMessage || "Odeme tamamlanamadi." : ""
  );
  const [threeDHtml, setThreeDHtml] = useState<string | null>(null);
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expireMonth, setExpireMonth] = useState("");
  const [expireYear, setExpireYear] = useState("");
  const [cvc, setCvc] = useState("");

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(.{4})/g, "$1 ").trim();
  };

  const buildCallbackUrl = () => {
    if (!orderId || !params?.menuSlug || typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/m/${params.menuSlug}/payment/callback?orderId=${encodeURIComponent(
      orderId
    )}&amount=${encodeURIComponent(String(amount))}&discount=${encodeURIComponent(
      String(discount)
    )}`;
  };

  const handleCashPayment = async () => {
    if (!orderId) {
      setError("Siparis baglami bulunamadi.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/api/payments/cash", {
        orderId,
        amount: finalAmount,
      });
      setSuccess(true);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message || "Odeme islemi basarisiz oldu."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async () => {
    if (!orderId) {
      setError("Siparis baglami bulunamadi.");
      return;
    }

    if (!cardHolder || !cardNumber || !expireMonth || !expireYear || !cvc) {
      setError("Lutfen tum kart bilgilerini doldurun.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const callbackUrl = buildCallbackUrl();

      if (!callbackUrl) {
        throw new Error("Odeme callback adresi olusturulamadi.");
      }

      const response = await api.post("/api/payments/3d-secure/initiate", {
        orderId,
        callbackUrl,
        cardHolderName: cardHolder,
        cardNumber: cardNumber.replace(/\s/g, ""),
        expireMonth,
        expireYear,
        cvc,
      });

      const payload = response.data?.data ?? response.data;

      if (payload?.htmlContent) {
        setThreeDHtml(payload.htmlContent);
      } else {
        setError("3D Secure baslatilamadi.");
      }
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message || "Kart islemi basarisiz oldu."
      );
    } finally {
      setLoading(false);
    }
  };

  if (threeDHtml) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-lg p-4">
          <div className="mb-4 flex items-center gap-2 text-sm text-blue-600">
            <Shield className="h-4 w-4" />
            <span>3D Secure dogrulama islemi</span>
          </div>
          <div
            dangerouslySetInnerHTML={{ __html: threeDHtml }}
            className="overflow-hidden rounded-lg border"
          />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold">Odeme basarili</h2>
          <p className="text-muted-foreground">
            {finalAmount.toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
            })}{" "}
            TL odemeniz alindi.
          </p>
          <p className="text-sm text-muted-foreground">Tesekkur ederiz. Afiyet olsun.</p>
          <Button onClick={() => router.push(`/m/${params.menuSlug}`)}>
            Menuye don
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Odeme</h1>
      </div>

      <div className="space-y-4 p-4">
        <Card>
          <CardContent className="space-y-2 p-4">
            <h3 className="font-semibold">Siparis ozeti</h3>
            <div className="flex justify-between text-sm">
              <span>Ara toplam</span>
              <span>
                {amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Indirim</span>
                <span>
                  -{discount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Toplam</span>
              <span>
                {finalAmount.toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                })}{" "}
                TL
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="font-semibold">Odeme yontemi</h3>

          <button
            onClick={() => setMethod("CREDIT_CARD")}
            className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
              method === "CREDIT_CARD"
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium">Kredi / banka karti</div>
              <div className="text-xs text-muted-foreground">
                3D Secure ile guvenli odeme
              </div>
            </div>
          </button>

          <button
            onClick={() => setMethod("CASH")}
            className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
              method === "CASH"
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Banknote className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium">Nakit</div>
              <div className="text-xs text-muted-foreground">
                Masada nakit odeme
              </div>
            </div>
          </button>
        </div>

        {method === "CREDIT_CARD" && (
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-blue-600">
                <Shield className="h-4 w-4" />
                <span>iyzico 3D Secure ile korunmaktadir</span>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Kart uzerindeki isim
                </label>
                <Input
                  placeholder="AHMET YILMAZ"
                  value={cardHolder}
                  onChange={(event) =>
                    setCardHolder(event.target.value.toUpperCase())
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Kart numarasi
                </label>
                <Input
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(event) =>
                    setCardNumber(formatCardNumber(event.target.value))
                  }
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Ay</label>
                  <Input
                    placeholder="MM"
                    value={expireMonth}
                    onChange={(event) =>
                      setExpireMonth(
                        event.target.value.replace(/\D/g, "").slice(0, 2)
                      )
                    }
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Yil</label>
                  <Input
                    placeholder="YY"
                    value={expireYear}
                    onChange={(event) =>
                      setExpireYear(
                        event.target.value.replace(/\D/g, "").slice(0, 2)
                      )
                    }
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">CVC</label>
                  <Input
                    placeholder="123"
                    value={cvc}
                    onChange={(event) =>
                      setCvc(event.target.value.replace(/\D/g, "").slice(0, 3))
                    }
                    maxLength={3}
                    type="password"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            <XCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {method && (
          <Button
            className="h-12 w-full text-base"
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
                {method === "CASH" ? "Nakit odemeyi onayla" : "Guvenli odeme yap"}
                {" - "}
                {finalAmount.toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                })}{" "}
                TL
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={null}>
      <PaymentPageContent />
    </Suspense>
  );
}
