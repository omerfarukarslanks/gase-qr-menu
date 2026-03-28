export interface ApiMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: ApiMeta;
  message?: string;
  error?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: ApiMeta;
}
