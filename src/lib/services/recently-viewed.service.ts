import { getProductById } from "./product.service";
import type { Product } from "../types/product";

const STORAGE_KEY = "ergochair-recently-viewed";
const MAX_ITEMS = 8;

export function getRecentlyViewedIds(): string[] {
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

export function addRecentlyViewed(productId: string): void {
  if (typeof window === "undefined" || !productId) return;
  try {
    const current = getRecentlyViewedIds();
    const filtered = current.filter((id) => id !== productId);
    const updated = [productId, ...filtered].slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("ergochair-recently-viewed-change"));
  } catch {
    // Ignore error
  }
}

export async function getRecentlyViewedProducts(
  excludeProductId?: string,
  limit = 4
): Promise<Product[]> {
  const ids = getRecentlyViewedIds();
  const filteredIds = excludeProductId ? ids.filter((id) => id !== excludeProductId) : ids;
  const targetIds = filteredIds.slice(0, limit);

  if (targetIds.length === 0) return [];

  const promises = targetIds.map((id) => getProductById(id));
  const results = await Promise.all(promises);
  return results.filter((p): p is Product => p !== null);
}

export function clearRecentlyViewed(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("ergochair-recently-viewed-change"));
  } catch {
    // Ignore error
  }
}
