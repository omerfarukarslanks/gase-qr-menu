import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@/lib/api-response";

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  defaultCurrency?: string;
}

interface CreateOrganizationPayload {
  name: string;
  slug?: string;
  logo?: string;
  defaultCurrency?: string;
}

export function useCreateOrganization() {
  return useMutation({
    mutationFn: (payload: CreateOrganizationPayload) =>
      api
        .post<ApiResponse<OrganizationSummary>>("/api/organizations", payload)
        .then((response) => response.data.data),
  });
}
