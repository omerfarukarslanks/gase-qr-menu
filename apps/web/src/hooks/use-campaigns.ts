import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

type CampaignType = 'PERCENTAGE' | 'FIXED' | 'HAPPY_HOUR' | 'BUY_X_GET_Y';

interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  value: number;
  minOrderAmount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  storeId: string;
  description?: string;
}

interface CreateCampaignPayload {
  storeId: string;
  name: string;
  type: CampaignType;
  value: number;
  minOrderAmount?: number;
  startDate: string;
  endDate: string;
  description?: string;
}

interface UpdateCampaignPayload {
  id: string;
  name?: string;
  type?: CampaignType;
  value?: number;
  minOrderAmount?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  description?: string;
}

export function useCampaigns(storeId: string) {
  return useQuery({
    queryKey: ['campaigns', storeId],
    queryFn: () =>
      api
        .get<{ success: boolean; data: Campaign[] }>(
          `/api/v1/campaigns?storeId=${storeId}`
        )
        .then((r) => r.data.data),
    enabled: !!storeId,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCampaignPayload) =>
      api.post('/api/v1/campaigns', payload).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.storeId] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCampaignPayload) =>
      api.patch(`/api/v1/campaigns/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/v1/campaigns/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}
