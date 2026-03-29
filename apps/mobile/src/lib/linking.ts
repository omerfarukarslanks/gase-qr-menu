import type { MobileMenuLink } from '@gase/shared';

function looksLikeQrToken(value: string) {
  return /^[a-z0-9-]{12,}$/i.test(value);
}

export function parseMenuLink(input: string): MobileMenuLink | null {
  const value = input.trim();

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const segments = url.pathname.split('/').filter(Boolean);

    if (segments[0] === 'm' && segments[1]) {
      return {
        qrToken: segments[1],
        tableId: url.searchParams.get('table'),
      };
    }
  } catch {
    if (looksLikeQrToken(value)) {
      return {
        qrToken: value,
      };
    }
  }

  return null;
}

export function buildWebPaymentCallbackUrl(params: {
  qrToken: string;
  orderId: string;
  amount: number;
  discount: number;
  webUrl: string;
}) {
  const base = params.webUrl.replace(/\/$/, '');
  const url = new URL(`/m/${params.qrToken}/payment/callback`, base);

  url.searchParams.set('orderId', params.orderId);
  url.searchParams.set('amount', String(params.amount));
  url.searchParams.set('discount', String(params.discount));

  return url.toString();
}
