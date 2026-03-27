import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  provider: string;
  createdAt: string;
}

interface Initiate3DSecurePayload {
  orderId: string;
  callbackUrl: string;
  cardHolderName: string;
  cardNumber: string;
  expireMonth: string;
  expireYear: string;
  cvc: string;
  currency?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
}

interface Initiate3DSecureResponse {
  paymentId: string;
  htmlContent: string;
}

export function usePaymentsByOrder(orderId: string) {
  return useQuery({
    queryKey: ['payments', 'order', orderId],
    queryFn: () =>
      api.get<Payment[]>(`/api/payments/order/${orderId}`).then((r) => r.data),
    enabled: !!orderId,
  });
}

export function useCreatePayment() {
  return useMutation({
    mutationFn: (data: { orderId: string; amount: number; method: string; currency?: string }) =>
      api.post<Payment>('/api/payments', data).then((r) => r.data),
  });
}

export function useInitiate3DSecure() {
  return useMutation({
    mutationFn: (data: Initiate3DSecurePayload) =>
      api
        .post<Initiate3DSecureResponse>('/api/payments/3d-secure/initiate', data)
        .then((r) => r.data),
  });
}

export function useRefundPayment() {
  return useMutation({
    mutationFn: (paymentId: string) =>
      api.post(`/api/payments/${paymentId}/refund`).then((r) => r.data),
  });
}
