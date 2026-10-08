import type {
  Product,
  ProductFilters,
  PaginatedResult,
} from "../types/product";

export const CATEGORIES = [
  "Tất cả loại ghế",
  "Ghế công thái học",
  "Ghế văn phòng",
  "Ghế gaming",
  "Ghế lãnh đạo",
] as const;

export type CreateProductInput = {
  name: string;
  category: string;
  categoryId?: string;
  price: number;
  oldPrice?: number;
  compareAtPrice?: number;
  stockQuantity?: number;
  stockStatus?: "in_stock" | "out_of_stock" | "pre_order";
  inStock?: boolean;
  description?: string;
  image?: string;
  images?: string[];
  gallery?: string[];
  video?: string;
  specs?: Record<string, string>;
  material?: string;
  color?: string;
  size?: string;
  weight?: string;
  capacity?: string;
  warranty?: string;
  isFeatured?: boolean;
  id?: string;
  slug?: string;
  rating?: number;
  reviewCount?: number;
};

/**
 * Lấy danh sách sản phẩm từ Backend API (kết nối MySQL Database)
 */
export async function getProducts(
  filters: ProductFilters = {}
): Promise<PaginatedResult<Product>> {
  try {
    const params = new URLSearchParams();

    if (filters.category && filters.category !== CATEGORIES[0] && filters.category !== "all") {
      params.set("category", filters.category);
    }
    if (filters.search && filters.search.trim()) {
      params.set("search", filters.search.trim());
    }
    if (filters.priceRange && filters.priceRange !== "all") {
      params.set("priceRange", filters.priceRange);
    }
    if (filters.availability && filters.availability !== "all") {
      params.set("availability", filters.availability);
    }
    if (filters.sort) {
      params.set("sort", filters.sort);
    }
    if (filters.page) {
      params.set("page", String(filters.page));
    }
    if (filters.pageSize) {
      params.set("pageSize", String(filters.pageSize));
    }

    const queryString = params.toString();
    const url = `/api/products${queryString ? `?${queryString}` : ""}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Lỗi tải danh sách sản phẩm: HTTP ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Lỗi service getProducts:", error);
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: filters.pageSize || 20,
      totalPages: 0,
    };
  }
}

/**
 * Lấy chi tiết sản phẩm theo ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error(`Lỗi service getProductById (${id}):`, error);
    return null;
  }
}

/**
 * Lấy chi tiết sản phẩm theo Slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  return getProductById(slug);
}

/**
 * Tạo sản phẩm mới
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    let msg = err.error || "Không thể tạo sản phẩm mới.";
    if (err.details && typeof err.details === "object") {
      const fieldMsgs = Object.entries(err.details)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
        .join("; ");
      if (fieldMsgs) msg += ` (${fieldMsgs})`;
    }
    throw new Error(msg);
  }

  const created = await res.json();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ergochair-products-change"));
  }

  return created;
}

/**
 * Cập nhật sản phẩm
 */
export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<Product | null> {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    let msg = err.error || "Không thể cập nhật sản phẩm.";
    if (err.details && typeof err.details === "object") {
      const fieldMsgs = Object.entries(err.details)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
        .join("; ");
      if (fieldMsgs) msg += ` (${fieldMsgs})`;
    }
    throw new Error(msg);
  }

  const updated = await res.json();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ergochair-products-change"));
  }

  return updated;
}

/**
 * Xóa sản phẩm
 */
export async function deleteProduct(id: string): Promise<boolean> {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) return false;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ergochair-products-change"));
  }

  return true;
}

/**
 * Đổi trạng thái còn hàng / hết hàng
 */
export async function toggleProductStock(id: string): Promise<Product | null> {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}?action=toggle-stock`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) return null;

  const updated = await res.json();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ergochair-products-change"));
  }

  return updated;
}
