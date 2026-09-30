"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { WishlistContextValue } from "@/lib/types/wishlist";
import type { Product } from "@/lib/types/product";
import {
  addToWishlist as serviceAddToWishlist,
  clearWishlist as serviceClearWishlist,
  getWishlistIds,
  getWishlistProducts,
  removeFromWishlist as serviceRemoveFromWishlist,
  toggleWishlist as serviceToggleWishlist,
} from "@/lib/services/wishlist.service";
import { useToast } from "@/contexts/toast-context";

export const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [items, setItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    let isMounted = true;

    const syncState = () => {
      const ids = getWishlistIds();
      if (!isMounted) return;
      setWishlistIds(ids);
      getWishlistProducts().then((products) => {
        if (!isMounted) return;
        setItems(products);
        setIsLoading(false);
      }).catch(() => {
        if (isMounted) setIsLoading(false);
      });
    };

    const timer = window.setTimeout(() => {
      syncState();
    }, 0);

    const handleWishlistChange = () => {
      syncState();
    };

    window.addEventListener("ergochair-wishlist-change", handleWishlistChange);
    window.addEventListener("storage", handleWishlistChange);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
      window.removeEventListener("ergochair-wishlist-change", handleWishlistChange);
      window.removeEventListener("storage", handleWishlistChange);
    };
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => {
      return wishlistIds.includes(productId);
    },
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    (productId: string) => {
      const { isInWishlist: nowInWishlist } = serviceToggleWishlist(productId);
      if (nowInWishlist) {
        toast.success("Đã thêm vào danh sách yêu thích");
      } else {
        toast.info("Đã xóa khỏi danh sách yêu thích");
      }
    },
    [toast]
  );

  const addToWishlist = useCallback(
    (productId: string) => {
      serviceAddToWishlist(productId);
      toast.success("Đã thêm vào danh sách yêu thích");
    },
    [toast]
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      serviceRemoveFromWishlist(productId);
      toast.info("Đã xóa khỏi danh sách yêu thích");
    },
    [toast]
  );

  const clearWishlist = useCallback(() => {
    serviceClearWishlist();
    toast.info("Đã xóa tất cả sản phẩm khỏi danh sách yêu thích");
  }, [toast]);

  const value = useMemo(
    () => ({
      wishlistIds,
      wishlistCount: wishlistIds.length,
      items,
      isLoading,
      isInWishlist,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
      clearWishlist,
    }),
    [wishlistIds, items, isLoading, isInWishlist, toggleWishlist, addToWishlist, removeFromWishlist, clearWishlist]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
