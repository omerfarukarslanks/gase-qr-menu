import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@/lib/api-response";

export type StaffRole = "MANAGER" | "STAFF" | "WAITER" | "KITCHEN";

export interface StaffMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: StaffRole;
  storeId: string;
  storeName: string;
  isActive: boolean;
}

interface CreateStaffPayload {
  storeId: string;
  name: string;
  email: string;
  password?: string;
  role: StaffRole;
}

interface UpdateStaffPayload {
  id: string;
  name?: string;
  email?: string;
  password?: string;
  role?: StaffRole;
}

interface ToggleStaffStatusPayload {
  id: string;
  isActive: boolean;
}

export function useStaff(storeId: string) {
  return useQuery({
    queryKey: ["staff", storeId],
    queryFn: () =>
      api
        .get<ApiResponse<StaffMember[]>>(`/api/staff/store/${storeId}`)
        .then((response) => response.data.data ?? []),
    enabled: !!storeId,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStaffPayload) =>
      api.post<ApiResponse<StaffMember>>("/api/staff", payload).then((response) => response.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["staff", variables.storeId] });
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateStaffPayload) =>
      api.put<ApiResponse<StaffMember>>(`/api/staff/${id}`, payload).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useToggleStaffStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: ToggleStaffStatusPayload) =>
      api
        .patch<ApiResponse<StaffMember>>(`/api/staff/${id}/status`, { isActive })
        .then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}
