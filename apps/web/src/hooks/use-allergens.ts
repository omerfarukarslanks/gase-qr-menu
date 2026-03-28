import { useQuery } from "@tanstack/react-query";
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

export function useAllergens() {
  return useQuery({
    queryKey: ["allergens"],
    queryFn: () =>
      api
        .get<ApiResponse<Allergen[]>>("/api/allergens")
        .then((response) => response.data.data ?? []),
  });
}
