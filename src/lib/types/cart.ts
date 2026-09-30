import type { Product } from "./product";

export interface CartItem {
  product: Product;
  quantity: number;
  variantId?: string;
}

export interface CartSummary {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  appliedCoupon?: string;
}
