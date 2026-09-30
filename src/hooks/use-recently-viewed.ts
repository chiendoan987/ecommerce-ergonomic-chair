"use client";

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/lib/types/product";
import {
  addRecentlyViewed as serviceAddRecentlyViewed,
  clearRecentlyViewed as serviceClearRecentlyViewed,
  getRecentlyViewedProducts,
} from "@/lib/services/recently-viewed.service";

export function useRecentlyViewed(excludeProductId?: string, limit = 4) {
  const [items, setItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadItems = () => {
      getRecentlyViewedProducts(excludeProductId, limit).then((products) => {
        if (!isMounted) return;
        setItems(products);
        setIsLoading(false);
      }).catch(() => {
        if (isMounted) setIsLoading(false);
      });
    };

    const timer = window.setTimeout(() => {
      loadItems();
    }, 0);

    const handleChange = () => {
      loadItems();
    };

    window.addEventListener("ergochair-recently-viewed-change", handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
      window.removeEventListener("ergochair-recently-viewed-change", handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, [excludeProductId, limit]);

  const recordView = useCallback((productId: string) => {
    serviceAddRecentlyViewed(productId);
  }, []);

  const clear = useCallback(() => {
    serviceClearRecentlyViewed();
    setItems([]);
  }, []);

  return {
    items,
    isLoading,
    recordView,
    clear,
  };
}
