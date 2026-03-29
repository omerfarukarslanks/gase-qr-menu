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

export const MOBILE_THEME = {
  radius: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
    pill: 999,
  },
  fonts: {
    sans: "PlusJakartaSans_500Medium",
    display: "Fraunces_600SemiBold",
  },
  colors: {
    light: {
      background: "#fcfcff",
      foreground: "#101828",
      card: "#ffffff",
      primary: "#4f46e5",
      primaryHover: "#4338ca",
      primaryForeground: "#ffffff",
      secondary: "#eef2ff",
      secondaryForeground: "#4338ca",
      muted: "#f4f7ff",
      mutedForeground: "#667085",
      border: "#d9def8",
      success: "#15803d",
      successSurface: "#e8f7ed",
      warm: "#c2410c",
      warmSurface: "#fff2e8",
    },
    dark: {
      background: "#0b1020",
      foreground: "#f5f7ff",
      card: "#141b31",
      primary: "#a5b4fc",
      primaryHover: "#818cf8",
      primaryForeground: "#0b1020",
      secondary: "#1e2743",
      secondaryForeground: "#f5f7ff",
      muted: "#1b2440",
      mutedForeground: "#b8c1e0",
      border: "#2a3455",
      success: "#4ade80",
      successSurface: "#0f2417",
      warm: "#f59e0b",
      warmSurface: "#2d1b07",
    },
  },
} as const;

export const STAFF_MOBILE_TABS = [
  "home",
  "orders",
  "tables",
  "kitchen",
  "more",
] as const;
