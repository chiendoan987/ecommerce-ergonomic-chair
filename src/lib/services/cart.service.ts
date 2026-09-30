import type { CartItem, CartSummary } from "../types/cart";

const STORAGE_KEY = "ergochair-cart";
const DEFAULT_SHIPPING_FEE = 30000;

export const cartService = {
  getStoredItems(): CartItem[] {
    if (typeof window === "undefined") return [];
    try {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (item): item is CartItem =>
          Boolean(item && item.product && typeof item.quantity === "number" && item.quantity > 0)
      );
    } catch {
      return [];
    }
  },

  saveStoredItems(items: CartItem[]): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage error ignore
    }
  },

  clearStoredItems(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage error ignore
    }
  },

  calculateSummary(items: CartItem[], discountAmount = 0, appliedCoupon?: string): CartSummary {
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);
    const subtotal = items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
    const shippingFee = items.length > 0 ? DEFAULT_SHIPPING_FEE : 0;
    const finalDiscount = Math.min(discountAmount, subtotal);
    const total = Math.max(0, subtotal - finalDiscount + shippingFee);

    return {
      items,
      itemCount,
      subtotal,
      shippingFee,
      discount: finalDiscount,
      total,
      appliedCoupon,
    };
  },

  mergeCart(localItems: CartItem[], serverItems: CartItem[]): CartItem[] {
    const map = new Map<string, CartItem>();

    for (const item of serverItems) {
      const key = `${item.product.id}_${item.variantId ?? "default"}`;
      map.set(key, { ...item });
    }

    for (const item of localItems) {
      const key = `${item.product.id}_${item.variantId ?? "default"}`;
      const existing = map.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        map.set(key, { ...item });
      }
    }

    return Array.from(map.values());
  },
};
