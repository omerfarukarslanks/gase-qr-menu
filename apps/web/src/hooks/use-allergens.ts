import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@/lib/api-response";

export interface Allergen {
  id: string;
  code: string;
  icon?: string | null;
  name: string;
  translations?: {
    languageCode?: string;
    name: string;
    description?: string | null;
  }[];
}

interface CreateAllergenPayload {
  name: string;
  icon?: string;
  translations?: { languageCode: string; name: string }[];
}

interface UpdateAllergenPayload {
  id: string;
  name?: string;
  icon?: string;
  translations?: { languageCode: string; name: string }[];
}

export function useAllergens() {
  return useQuery({
    queryKey: ["allergens"],
    queryFn: () =>
      api
        .get<ApiResponse<Allergen[]>>("/api/allergens")
        .then((response) => response.data.data ?? []),
  });
}

export function useCreateAllergen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAllergenPayload) =>
      api.post("/api/allergens", payload).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allergens"] });
    },
  });
}

export function useUpdateAllergen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateAllergenPayload) =>
      api.put(`/api/allergens/${id}`, payload).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allergens"] });
    },
  });
}

export function useDeleteAllergen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/allergens/${id}`).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allergens"] });
    },
  });
}
