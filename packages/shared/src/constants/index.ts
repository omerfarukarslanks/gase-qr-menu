// Order status flow
export const ORDER_STATUS_FLOW = [
  "DRAFT",
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "SERVED",
] as const;

// Supported currencies
export const CURRENCIES = ["TRY", "USD", "EUR", "GBP"] as const;

// Default pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Product image limits
export const MAX_PRODUCT_IMAGES = 5;
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_3D_MODEL_SIZE_MB = 50;

// Supported 3D model formats
export const SUPPORTED_3D_FORMATS = [".glb", ".gltf"] as const;

// Supported image formats
export const SUPPORTED_IMAGE_FORMATS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
] as const;

// EU 14 Allergen codes
export const EU_ALLERGEN_CODES = [
  "gluten",
  "crustaceans",
  "eggs",
  "fish",
  "peanuts",
  "soybeans",
  "milk",
  "nuts",
  "celery",
  "mustard",
  "sesame",
  "sulphites",
  "lupin",
  "molluscs",
] as const;

// Ingredient types
export const INGREDIENT_TYPES = [
  "VEGETABLE",
  "FRUIT",
  "MEAT",
  "DAIRY",
  "GRAIN",
  "SPICE",
  "SEAFOOD",
  "BEVERAGE",
  "OTHER",
] as const;

// WebSocket events
export const WS_EVENTS = {
  // Order events
  ORDER_NEW: "order:new",
  ORDER_STATUS: "order:status",
  ORDER_CANCELLED: "order:cancelled",

  // Waiter events
  WAITER_CALL: "waiter:call",
  WAITER_ACKNOWLEDGE: "waiter:acknowledge",

  // Kitchen events
  KITCHEN_NEW_ITEM: "kitchen:new-item",
  KITCHEN_ITEM_STATUS: "kitchen:item-status",

  // Notification events
  NOTIFICATION_NEW: "notification:new",
  NOTIFICATION_READ: "notification:read",

  // Stock events
  STOCK_LOW: "stock:low",

  // Connection
  JOIN_STORE: "store:join",
  LEAVE_STORE: "store:leave",
  JOIN_KITCHEN: "kitchen:join",
} as const;

// Notification sounds
export const NOTIFICATION_SOUNDS = {
  NEW_ORDER: "new-order",
  WAITER_CALL: "waiter-call",
  ORDER_READY: "order-ready",
  LOW_STOCK: "low-stock",
} as const;
