import { getProductById } from "./product.service";
import type { Product } from "../types/product";

const STORAGE_KEY = "ergochair-wishlist";

export function getWishlistIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function saveWishlistIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event("ergochair-wishlist-change"));
  } catch {
    // Ignore localStorage write error
  }
}

export function isInWishlist(productId: string): boolean {
  const ids = getWishlistIds();
  return ids.includes(productId);
}

export function addToWishlist(productId: string): string[] {
  const ids = getWishlistIds();
  if (!ids.includes(productId)) {
    const next = [...ids, productId];
    saveWishlistIds(next);
    return next;
  }
  return ids;
}

export function removeFromWishlist(productId: string): string[] {
  const ids = getWishlistIds();
  const next = ids.filter((id) => id !== productId);
  saveWishlistIds(next);
  return next;
}

export function toggleWishlist(productId: string): { isInWishlist: boolean; ids: string[] } {
  const ids = getWishlistIds();
  const exists = ids.includes(productId);
  const next = exists ? ids.filter((id) => id !== productId) : [...ids, productId];
  saveWishlistIds(next);
  return { isInWishlist: !exists, ids: next };
}

export async function getWishlistProducts(): Promise<Product[]> {
  const ids = getWishlistIds();
  if (ids.length === 0) return [];

  const promises = ids.map((id) => getProductById(id));
  const results = await Promise.all(promises);
  return results.filter((p): p is Product => p !== null);
}

export function clearWishlist(): void {
  saveWishlistIds([]);
}
