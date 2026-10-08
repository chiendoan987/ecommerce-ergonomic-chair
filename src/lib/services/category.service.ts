export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * Lấy danh sách danh mục từ API
 */
export async function getCategories(includeInactive: boolean = false): Promise<Category[]> {
  try {
    const url = `/api/categories${includeInactive ? "?all=true" : ""}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Lỗi tải danh mục: HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Lỗi getCategories:", error);
    return [];
  }
}

/**
 * Tạo mới danh mục
 */
export async function createCategory(data: CreateCategoryPayload): Promise<Category | null> {
  const res = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Không thể tạo danh mục.");
  }

  const created = await res.json();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ergochair-categories-change"));
  }
  return created;
}

/**
 * Cập nhật danh mục
 */
export async function updateCategory(
  id: string,
  data: UpdateCategoryPayload
): Promise<Category | null> {
  const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Không thể cập nhật danh mục.");
  }

  const updated = await res.json();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ergochair-categories-change"));
  }
  return updated;
}

/**
 * Xóa danh mục
 */
export async function deleteCategory(id: string): Promise<boolean> {
  const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Không thể xóa danh mục.");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ergochair-categories-change"));
  }
  return true;
}
