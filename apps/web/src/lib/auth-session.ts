export const AUTH_STORAGE_KEY = "auth-storage";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  organizationId?: string | null;
}

export interface StoreSummary {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  currency?: string;
  timezone?: string;
}

export interface AuthSessionPayload {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}
