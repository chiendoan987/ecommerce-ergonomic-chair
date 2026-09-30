import { mockProducts } from "../data/mock-products";
import { normalizeSearchText } from "../search";
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

const PRODUCTS_STORAGE_KEY = "ergochair-products";

export function getStoredProducts(): Product[] {
  if (typeof window === "undefined") return [...mockProducts];
  try {
    const raw = window.localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(mockProducts));
      return [...mockProducts];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...mockProducts];
  } catch {
    return [...mockProducts];
  }
}

function saveProducts(products: Product[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new Event("ergochair-products-change"));
  } catch {
    // Ignore error
  }
}

export async function getProducts(
  filters: ProductFilters = {}
): Promise<PaginatedResult<Product>> {
  // If in browser, fetch through internal Next.js Route Handler /api/products
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams();
      if (filters.category && filters.category !== CATEGORIES[0]) {
        params.set("category", filters.category);
      }
      if (filters.search) params.set("search", filters.search);
      if (filters.priceRange) params.set("priceRange", filters.priceRange);
      if (filters.availability) params.set("availability", filters.availability);
      if (filters.sort) params.set("sort", filters.sort);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.pageSize) params.set("pageSize", String(filters.pageSize));

      const queryStr = params.toString();
      const url = queryStr ? `/api/products?${queryStr}` : "/api/products";
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback to local stored products calculation
    }
  }

  let items = getStoredProducts();

  // 1. Filter by category
  if (filters.category && filters.category !== CATEGORIES[0]) {
    items = items.filter((p) => p.category === filters.category);
  }

  // 2. Filter by search keyword
  if (filters.search && filters.search.trim()) {
    const query = normalizeSearchText(filters.search);
    items = items.filter((p) => {
      const name = normalizeSearchText(p.name);
      const cat = normalizeSearchText(p.category);
      const desc = normalizeSearchText(p.description);
      return name.includes(query) || cat.includes(query) || desc.includes(query);
    });
  }

  // 3. Filter by price range
  if (filters.priceRange && filters.priceRange !== "all") {
    switch (filters.priceRange) {
      case "under-5m":
        items = items.filter((p) => p.price < 5000000);
        break;
      case "5m-8m":
        items = items.filter((p) => p.price >= 5000000 && p.price <= 8000000);
        break;
      case "8m-12m":
        items = items.filter((p) => p.price > 8000000 && p.price <= 12000000);
        break;
      case "above-12m":
        items = items.filter((p) => p.price > 12000000);
        break;
    }
  }

  // 4. Filter by stock status
  if (filters.availability && filters.availability !== "all") {
    if (filters.availability === "in-stock") {
      items = items.filter((p) => p.inStock);
    } else if (filters.availability === "sold-out") {
      items = items.filter((p) => !p.inStock);
    }
  }

  // 5. Sort items
  const sort = filters.sort ?? "featured";
  switch (sort) {
    case "price-asc":
      items.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      items.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      items.sort((a, b) => {
        const ratingA = typeof a.rating === "number" ? a.rating : a.rating.average;
        const ratingB = typeof b.rating === "number" ? b.rating : b.rating.average;
        return ratingB - ratingA;
      });
      break;
    case "featured":
    default:
      // Keep natural priority / order in list
      break;
  }

  const total = items.length;
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? total; // default return all unless paginated
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedItems = items.slice(startIndex, startIndex + pageSize);

  return {
    items: paginatedItems,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export function getProductByIdSync(id: string): Product | null {
  const products = getStoredProducts();
  const found = products.find(
    (item, index) => item.id === id || String(index + 1) === id || item.slug === id
  );
  return found ? { ...found } : null;
}

export async function getProductById(id: string): Promise<Product | null> {
  return getProductByIdSync(id);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = getStoredProducts();
  const found = products.find((item) => item.slug === slug || item.id === slug);
  return found ? { ...found } : null;
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const products = getStoredProducts();
  return products.slice(0, limit);
}

export async function getRelatedProducts(
  productId: string,
  limit = 4
): Promise<Product[]> {
  const products = getStoredProducts();
  const current = products.find((p) => p.id === productId);
  if (!current) {
    return products.slice(0, limit);
  }

  const sameCategory = products.filter(
    (p) => p.id !== productId && p.category === current.category
  );
  const otherCategories = products.filter(
    (p) => p.id !== productId && p.category !== current.category
  );

  return [...sameCategory, ...otherCategories].slice(0, limit);
}

export async function getCategories(): Promise<string[]> {
  return [...CATEGORIES];
}

export interface CreateProductInput {
  name: string;
  category: Product["category"];
  price: number;
  oldPrice?: number;
  stockQuantity: number;
  description: string;
  image?: string;
  material?: string;
  color?: string;
  size?: string;
  weight?: string;
  capacity?: string;
  warranty?: string;
  specs?: Record<string, string>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const products = getStoredProducts();
  const baseSlug = slugify(input.name);
  let slug = baseSlug || `product-${Date.now()}`;
  let counter = 1;
  while (products.some((p) => p.slug === slug)) {
    slug = `${baseSlug}-${counter++}`;
  }

  const id = `prod-${Date.now()}`;
  const image = input.image || "/images/products/focus-task.png";
  const now = new Date().toISOString();
  const inStock = input.stockQuantity > 0;

  const newProduct: Product = {
    id,
    slug,
    name: input.name.trim(),
    category: input.category,
    price: input.price,
    oldPrice: input.oldPrice || Math.round(input.price * 1.15),
    compareAtPrice: input.oldPrice || Math.round(input.price * 1.15),
    stockStatus: inStock ? "in_stock" : "out_of_stock",
    stockQuantity: input.stockQuantity,
    inStock,
    image,
    images: [image],
    gallery: [image],
    rating: 5.0,
    reviewCount: 0,
    material: input.material || "Lưới cao cấp & khung hợp kim",
    color: input.color || "Đen tiêu chuẩn",
    size: input.size || "65 × 65 × 115–125 cm",
    weight: input.weight || "18 kg",
    capacity: input.capacity || "135 kg",
    warranty: input.warranty || "3 năm",
    description: input.description.trim(),
    specs: input.specs || {
      "Chất liệu": input.material || "Lưới cao cấp & khung hợp kim",
      "Màu sắc": input.color || "Đen tiêu chuẩn",
      "Kích thước": input.size || "65 × 65 × 115–125 cm",
      "Trọng lượng": input.weight || "18 kg",
      "Tải trọng tối đa": input.capacity || "135 kg",
      "Thời gian bảo hành": input.warranty || "3 năm",
    },
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newProduct, ...products];
  saveProducts(updated);
  return newProduct;
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<Product | null> {
  const products = getStoredProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const current = products[index];
  const stockQuantity = updates.stockQuantity !== undefined ? updates.stockQuantity : current.stockQuantity;
  const inStock = updates.inStock !== undefined ? updates.inStock : (stockQuantity > 0);

  const updatedProduct: Product = {
    ...current,
    ...updates,
    inStock,
    stockStatus: inStock ? "in_stock" : "out_of_stock",
    stockQuantity,
    updatedAt: new Date().toISOString(),
  };

  products[index] = updatedProduct;
  saveProducts(products);
  return updatedProduct;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = getStoredProducts();
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length === products.length) return false;

  saveProducts(filtered);
  return true;
}

export async function toggleProductStock(id: string): Promise<Product | null> {
  const products = getStoredProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const current = products[index];
  const nextInStock = !current.inStock;
  const updatedProduct: Product = {
    ...current,
    inStock: nextInStock,
    stockStatus: nextInStock ? "in_stock" : "out_of_stock",
    stockQuantity: nextInStock ? (current.stockQuantity > 0 ? current.stockQuantity : 10) : 0,
    updatedAt: new Date().toISOString(),
  };

  products[index] = updatedProduct;
  saveProducts(products);
  return updatedProduct;
}

