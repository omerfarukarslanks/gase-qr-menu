import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function POST(
  request: NextRequest,
  context: { params: { menuSlug: string } }
) {
  const url = new URL(request.url);
  const formData = await request.formData();

  const payload = {
    paymentId: String(formData.get("paymentId") || ""),
    status: String(formData.get("status") || "failure"),
    mdStatus: String(formData.get("mdStatus") || ""),
    conversationId: String(formData.get("conversationId") || ""),
  };

  const orderId = url.searchParams.get("orderId") || "";
  const amount = url.searchParams.get("amount") || "0";
  const discount = url.searchParams.get("discount") || "0";

  let status = "failure";
  let message = "Odeme dogrulanamadi.";

  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/3d-secure/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const result = await response.json();

    if (result?.success) {
      status = "success";
      message = "Odeme basariyla tamamlandi.";
    } else {
      message = result?.message || message;
    }
  } catch {
    message = "Odeme callback islemi sirasinda hata olustu.";
  }

  const redirectUrl = new URL(
    `/m/${context.params.menuSlug}/payment`,
    url.origin
  );
  redirectUrl.searchParams.set("orderId", orderId);
  redirectUrl.searchParams.set("amount", amount);
  redirectUrl.searchParams.set("discount", discount);
  redirectUrl.searchParams.set("status", status);
  redirectUrl.searchParams.set("message", message);

  return NextResponse.redirect(redirectUrl, {
    status: 303,
  });
}
