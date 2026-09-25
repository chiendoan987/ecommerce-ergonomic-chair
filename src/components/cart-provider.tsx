"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { products, type Product } from "@/lib/products";

export type CartItem = { product: Product; quantity: number };

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "ergochair-cart";
const CartContext = createContext<CartContextValue | null>(null);

function normalizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];

  const normalizedItems: CartItem[] = [];
  for (const valueItem of value) {
    if (!valueItem || typeof valueItem !== "object") continue;

    const item = valueItem as { product?: { id?: unknown }; quantity?: unknown };
    const productId = item.product?.id;
    const product = typeof productId === "string" ? products.find(({ id }) => id === productId) : undefined;
    const quantity = item.quantity;
    if (!product || typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity <= 0) continue;

    const existing = normalizedItems.find(({ product: currentProduct }) => currentProduct.id === product.id);
    if (existing) {
      if (existing.quantity <= Number.MAX_SAFE_INTEGER - quantity) existing.quantity += quantity;
    }
    else normalizedItems.push({ product, quantity });
  }

  return normalizedItems;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) setItems(normalizeCartItems(JSON.parse(saved)));
      } catch {
        setItems([]);
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { }
    }
  }, [hydrated, items]);

  const value = useMemo(() => ({
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.product.price * item.quantity, 0),
    addItem: (product: Product, quantity = 1) => {
      if (!product.inStock) return;
      setItems((current) => {
        const existing = current.find((item) => item.product.id === product.id);
        return existing ? current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item) : [...current, { product, quantity }];
      });
    },
    updateQuantity: (id: string, quantity: number) => setItems((current) => quantity > 0 ? current.map((item) => item.product.id === id ? { ...item, quantity } : item) : current.filter((item) => item.product.id !== id)),
    removeItem: (id: string) => setItems((current) => current.filter((item) => item.product.id !== id)),
    clearCart: () => setItems([]),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}