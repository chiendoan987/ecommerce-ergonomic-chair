import type { Product } from "./product";

export interface WishlistItem {
  productId: string;
  addedAt: string;
}

export interface WishlistContextValue {
  wishlistIds: string[];
  wishlistCount: number;
  items: Product[];
  isLoading: boolean;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
}
