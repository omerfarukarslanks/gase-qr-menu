import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface Menu {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  storeId: string;
  categories?: {
    id: string;
    name: string;
    isActive: boolean;
    products?: { id: string; name: string; price: number; isActive: boolean }[];
  }[];
}

interface CreateMenuPayload {
  storeId: string;
  name: string;
  slug?: string;
  categoryIds?: string[];
}

interface UpdateMenuPayload {
  id: string;
  name?: string;
  slug?: string;
  isActive?: boolean;
  categoryIds?: string[];
}

export function useMenus(storeId: string) {
  return useQuery({
    queryKey: ['menus', storeId],
    queryFn: () =>
      api
        .get<{ success: boolean; data: Menu[] }>(
          `/api/menus?storeId=${storeId}`
        )
        .then((r) => r.data.data),
    enabled: !!storeId,
  });
}

export function useMenu(id: string) {
  return useQuery({
    queryKey: ['menus', 'detail', id],
    queryFn: () =>
      api
        .get<{ success: boolean; data: Menu }>(`/api/menus/${id}`)
        .then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMenuPayload) =>
      api.post('/api/menus', payload).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menus', variables.storeId] });
    },
  });
}

export function useUpdateMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateMenuPayload) =>
      api.patch(`/api/menus/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });
}

export function useDeleteMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/menus/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });
}

export function useMenuQrCode(id: string) {
  return useQuery({
    queryKey: ['menus', 'qr', id],
    queryFn: () =>
      api
        .get<{ success: boolean; data: { qrCodeUrl: string } }>(
          `/api/menus/${id}/qr-code`
        )
        .then((r) => r.data.data),
    enabled: !!id,
  });
}
