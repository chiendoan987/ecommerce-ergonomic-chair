"use client";

import Link from "next/link";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils/format";
import type { Product } from "@/lib/types/product";

export default function WishlistPage() {
  const { items, isLoading, removeFromWishlist, clearWishlist } = useWishlist();
  const { addItem } = useCart();
  const toast = useToast();

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng`);
  };

  return (
    <div className="wishlist-page">
      <div className="catalog-breadcrumb" data-reveal="fade">
        <Link href="/">Trang chủ</Link>
        <span>/</span>
        <strong>Danh sách yêu thích</strong>
      </div>

      <main className="wishlist-main">
        <header className="wishlist-header" data-reveal="up">
          <div>
            <p className="eyebrow">BỘ SƯU TẬP CỦA BẠN</p>
            <h1>Sản phẩm đã lưu</h1>
            <p className="wishlist-subtitle">
              Lưu giữ những mẫu ghế bạn quan tâm nhất để theo dõi giá và đặt mua bất kỳ lúc nào.
            </p>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              className="wishlist-clear-all-btn"
              onClick={clearWishlist}
            >
              Xóa tất cả ({items.length})
            </button>
          )}
        </header>

        {isLoading ? (
          <div className="wishlist-loading" aria-busy="true">
            <div className="loading-spinner" />
            <p>Đang tải danh sách yêu thích...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="wishlist-empty" data-reveal="scale">
            <div className="empty-heart-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
              </svg>
            </div>
            <h2>Danh sách yêu thích còn trống</h2>
            <p>
              Bạn chưa lưu sản phẩm nào. Hãy bấm vào biểu tượng trái tim ở từng mẫu ghế để lưu lại và xem lại tại đây.
            </p>
            <Link href="/products" className="button button-dark">
              Khám phá bộ sưu tập ghế <span>→</span>
            </Link>
          </div>
        ) : (
          <div className="wishlist-grid" data-reveal="up">
            {items.map((product) => {
              const salePercent = Math.round((1 - product.price / product.oldPrice) * 100);
              return (
                <article key={product.id} className="wishlist-card">
                  <div className="wishlist-image-wrap">
                    <Link href={`/products/${product.id}`} className="wishlist-img-link">
                      <img src={product.image} alt={product.name} />
                      {!product.inStock && <span className="catalog-sold-out">Tạm hết hàng</span>}
                      {salePercent > 0 && (
                        <span className="catalog-discount-badge">-{salePercent}%</span>
                      )}
                    </Link>
                    <button
                      type="button"
                      className="wishlist-remove-btn"
                      onClick={() => removeFromWishlist(product.id)}
                      title="Xóa khỏi yêu thích"
                      aria-label={`Xóa ${product.name} khỏi danh sách yêu thích`}
                    >
                      ×
                    </button>
                  </div>
                  <div className="wishlist-card-content">
                    <p className="wishlist-card-category">{product.category}</p>
                    <h3>
                      <Link href={`/products/${product.id}`}>{product.name}</Link>
                    </h3>
                    <div className="wishlist-price">
                      <strong>{formatPrice(product.price)}</strong>
                      {product.oldPrice > product.price && (
                        <del>{formatPrice(product.oldPrice)}</del>
                      )}
                    </div>
                    <div className="wishlist-actions">
                      {product.inStock ? (
                        <button
                          type="button"
                          className="wishlist-add-cart-btn"
                          onClick={() => handleAddToCart(product)}
                        >
                          Thêm vào giỏ
                        </button>
                      ) : (
                        <Link href="/contact" className="wishlist-contact-btn">
                          Liên hệ tư vấn
                        </Link>
                      )}
                      <Link href={`/products/${product.id}`} className="wishlist-view-btn">
                        Chi tiết
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
