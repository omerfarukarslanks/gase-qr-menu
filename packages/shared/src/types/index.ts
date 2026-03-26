// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ============================================================
// Auth Types
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  organizationId?: string;
  storeId?: string;
}

// ============================================================
// Menu Filter Types
// ============================================================

export interface MenuFilterParams {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  allergenCodes?: string[];
  ingredientIds?: string[];
  excludeAllergens?: string[];
  language?: string;
}

// ============================================================
// Cart Types
// ============================================================

export interface CartItem {
  productId: string;
  quantity: number;
  notes?: string;
  removedIngredients?: string[];
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  id: string;
  tableId: string;
  sessionId: string;
  items: CartItem[];
  totalAmount: number;
  status: "draft" | "submitted";
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Payment Types
// ============================================================

export interface PaymentInitiateRequest {
  orderId: string;
  method: "CREDIT_CARD" | "ONLINE";
  cardHolderName?: string;
}

export interface PaymentCallbackData {
  status: "success" | "failure";
  transactionId: string;
  amount: number;
  providerData: Record<string, unknown>;
}

// ============================================================
// WebSocket Event Types
// ============================================================

export interface WsOrderEvent {
  orderId: string;
  storeId: string;
  tableId: string;
  tableName: string;
  status: string;
  items?: Array<{
    productName: string;
    quantity: number;
    notes?: string;
  }>;
}

export interface WsWaiterCallEvent {
  storeId: string;
  tableId: string;
  tableName: string;
  message?: string;
}

export interface WsKitchenEvent {
  orderId: string;
  orderItemId: string;
  productName: string;
  quantity: number;
  status: string;
  notes?: string;
}

export interface WsNotificationEvent {
  id: string;
  type: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface WsStockAlert {
  ingredientId: string;
  ingredientName: string;
  currentQuantity: number;
  minLevel: number;
  storeId: string;
}

// ============================================================
// Report Types
// ============================================================

export interface DailyReportData {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    revenue: number;
    orderCount: number;
  }>;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  returningCustomers: number;
  averageVisitFrequency: number;
  averageSpendPerVisit: number;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    visitCount: number;
    totalSpent: number;
  }>;
}
