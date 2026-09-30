"use client";

import Link from "next/link";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { formatPrice } from "@/lib/utils/format";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/types/product";

interface RecentlyViewedProductsProps {
  currentProductId?: string;
  limit?: number;
}

export function RecentlyViewedProducts({
  currentProductId,
  limit = 4,
}: RecentlyViewedProductsProps) {
  const { items, isLoading, clear } = useRecentlyViewed(currentProductId, limit);
  const { addItem } = useCart();
  const toast = useToast();

  if (isLoading || items.length === 0) {
    return null;
  }

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng`);
  };

  return (
    <section className="recently-viewed-section" data-reveal="up">
      <div className="recently-viewed-header">
        <div>
          <p className="eyebrow">DÀNH RIÊNG CHO BẠN</p>
          <h2>Sản phẩm đã xem gần đây</h2>
        </div>
        <button
          type="button"
          className="recently-viewed-clear-btn"
          onClick={clear}
          title="Xóa lịch sử xem"
        >
          Xóa lịch sử xem
        </button>
      </div>

      <div className="recently-viewed-grid">
        {items.map((product) => (
          <article key={product.id} className="recent-product-card">
            <Link href={`/products/${product.id}`} className="recent-product-image">
              <img src={product.image} alt={product.name} />
              {!product.inStock && <span className="catalog-sold-out">Tạm hết hàng</span>}
            </Link>
            <div className="recent-product-info">
              <span className="recent-product-category">{product.category}</span>
              <h3>
                <Link href={`/products/${product.id}`}>{product.name}</Link>
              </h3>
              <div className="recent-product-price">
                <strong>{formatPrice(product.price)}</strong>
                {product.oldPrice > product.price && (
                  <del>{formatPrice(product.oldPrice)}</del>
                )}
              </div>
              {product.inStock ? (
                <button
                  type="button"
                  className="recent-add-cart-btn"
                  onClick={(e) => handleAddToCart(e, product)}
                >
                  Thêm giỏ hàng
                </button>
              ) : (
                <Link href={`/products/${product.id}`} className="recent-view-btn">
                  Xem chi tiết
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
