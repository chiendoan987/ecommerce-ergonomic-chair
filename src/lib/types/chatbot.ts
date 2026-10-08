export interface ChatMessage {
  id?: string;
  sender: "bot" | "user" | "system";
  text: string;
  time?: string;
}

export interface ChatbotProductSuggestion {
  id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number | null;
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
  stockStatus: "in_stock" | "out_of_stock" | "pre_order";
  inStock: boolean;
  material?: string | null;
  warranty?: string | null;
}

export interface ChatbotResponse {
  message: string;
  engine: "groq" | "database_fallback";
  suggestedProducts: ChatbotProductSuggestion[];
  quickReplies?: string[];
  orderInfo?: {
    id: string;
    status: string;
    statusLabel: string;
    carrier?: string | null;
    trackingCode?: string | null;
    total: number;
    paymentStatus: string;
  } | null;
}

export interface ChatUserContext {
  lastOrderId?: string | null;
  userId?: string | null;
  phone?: string | null;
}
