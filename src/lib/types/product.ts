export type ProductCategory =
  | "Tất cả loại ghế"
  | "Ghế công thái học"
  | "Ghế văn phòng"
  | "Ghế gaming"
  | "Ghế lãnh đạo"
  | string;

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  priceDelta: number;
  stockQuantity: number;
  imageUrl?: string;
}

export interface ProductRating {
  average: number;
  count: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  categoryId?: string | null;
  category: ProductCategory;
  price: number;
  compareAtPrice?: number;
  stockStatus: "in_stock" | "out_of_stock" | "pre_order";
  stockQuantity: number;
  variants?: ProductVariant[];
  images: string[];
  description: string;
  specs: Record<string, string>;
  rating: number | ProductRating;
  createdAt: string;
  updatedAt: string;

  // Thuộc tính tương thích ngược cho giao diện hiện tại
  image: string;
  gallery: string[];
  video?: string;
  oldPrice: number;
  inStock: boolean;
  material: string;
  color: string;
  size: string;
  weight: string;
  capacity: string;
  warranty: string;
  reviewCount: number;
}

export type SortOption = "featured" | "price-asc" | "price-desc" | "rating";

export interface ProductFilters {
  category?: string;
  search?: string;
  priceRange?: string; // "all" | "under-5m" | "5m-8m" | "8m-12m" | "above-12m"
  availability?: string; // "all" | "in-stock" | "sold-out"
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
