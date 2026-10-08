"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/hooks/use-wishlist";
import { useToast } from "@/hooks/use-toast";
import { addRecentlyViewed } from "@/lib/services/recently-viewed.service";
import { formatPrice } from "@/lib/utils/format";
import { ProductReviews } from "@/components/product-reviews";
import { RecentlyViewedProducts } from "@/components/recently-viewed-products";
import type { Product } from "@/lib/types/product";

interface ProductDetailClientProps {
  initialProduct: Product | null;
  initialRelated: Product[];
}

function Stars({ rating }: { rating: number | { average: number; count: number } }) {
  const score = typeof rating === "number" ? rating : rating.average;
  return <span className="detail-stars" aria-label={`${score} trên 5 sao`}>★★★★★</span>;
}

export function ProductDetailClient({ initialProduct, initialRelated }: ProductDetailClientProps) {
  const router = useRouter();
  const [product] = useState<Product | null>(initialProduct);
  const [related] = useState<Product[]>(initialRelated);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState({ productId: "", index: 0 });

  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const toast = useToast();

  useEffect(() => {
    if (product) {
      addRecentlyViewed(product.id);
    }
  }, [product]);

  if (!product) {
    return (
      <main className="product-not-found">
        <p className="eyebrow">ERGOCHAIR</p>
        <h1>Không tìm thấy sản phẩm</h1>
        <p>Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã được cập nhật đường dẫn mới.</p>
        <Link className="button button-dark" href="/products">
          Quay lại danh mục sản phẩm <span>→</span>
        </Link>
      </main>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const [showVideo, setShowVideo] = useState(false);
  const gallery = useMemo(() => {
    if (product.images && product.images.length > 0) return product.images;
    if (product.gallery && product.gallery.length > 0) return [product.image, ...product.gallery];
    return [product.image];
  }, [product]);
  const selectedImageIndex = selectedImage.productId === product.id ? selectedImage.index : 0;
  const salePercent = Math.round((1 - product.price / product.oldPrice) * 100);
  const ratingScore = typeof product.rating === "number" ? product.rating : product.rating.average;

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`Đã thêm ${quantity} "${product.name}" vào giỏ hàng`);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    router.push("/cart");
  };

  return (
    <div className="detail-page">
      <div className="detail-breadcrumb" data-reveal="fade">
        <Link href="/products">Sản phẩm</Link>
        <span>/</span>
        <span>{product.category}</span>
        <span>/</span>
        <strong>{product.name}</strong>
      </div>

      <main>
        <section className="detail-intro">
          <div className="detail-gallery" data-reveal="scale">
            <div
              className="detail-main-image"
              style={{
                backgroundImage: !showVideo ? `url(${gallery[selectedImageIndex] || product.image})` : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden"
              }}
            >
              {showVideo && product.video ? (
                product.video.includes("youtube.com") || product.video.includes("youtu.be") ? (
                  <iframe
                    src={product.video.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")}
                    title="Video giới thiệu sản phẩm"
                    style={{ width: "100%", height: "100%", border: "none" }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={product.video}
                    controls
                    autoPlay
                    style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
                  />
                )
              ) : (
                <>
                  <span className={product.inStock ? "stock-badge" : "stock-badge sold-out"}>
                    {product.inStock ? "Còn hàng" : "Tạm hết hàng"}
                  </span>
                  <button
                    type="button"
                    className={`detail-wishlist-toggle ${isWishlisted ? "active" : ""}`}
                    onClick={() => toggleWishlist(product.id)}
                    aria-label={isWishlisted ? "Xóa khỏi danh sách yêu thích" : "Lưu vào danh sách yêu thích"}
                  >
                    {isWishlisted ? "♥" : "♡"}
                  </button>
                </>
              )}
            </div>
            <div className="detail-thumbnails">
              {gallery.map((image, index) => (
                <button
                  className={selectedImageIndex === index && !showVideo ? "selected" : ""}
                  key={image}
                  type="button"
                  onClick={() => {
                    setSelectedImage({ productId: product.id, index });
                    setShowVideo(false);
                  }}
                  aria-label={`Xem hình ${index + 1}`}
                  style={{ backgroundImage: `url(${image})` }}
                />
              ))}

              {product.video && (
                <button
                  className={showVideo ? "selected" : ""}
                  type="button"
                  onClick={() => setShowVideo(true)}
                  aria-label="Xem video sản phẩm"
                  style={{
                    background: "#0f172a",
                    color: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "2px",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    borderRadius: "4px"
                  }}
                >
                  <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>▶</span>
                  <span>Video</span>
                </button>
              )}
            </div>
          </div>

          <div className="detail-copy" data-reveal="up" data-reveal-delay="80">
            <p className="catalog-category">{product.category}</p>
            <h1>{product.name}</h1>
            <div className="detail-rating">
              <Stars rating={product.rating} />
              <strong>{ratingScore}</strong>
              <Link href="#reviews">{product.reviewCount} đánh giá</Link>
            </div>
            <div className="detail-prices">
              <strong>{formatPrice(product.price)}</strong>
              <del>{formatPrice(product.oldPrice)}</del>
              <span>-{salePercent}%</span>
            </div>
            <p className="detail-description">{product.description}</p>
            <div className={`detail-status ${!product.inStock ? "is-sold-out" : ""}`}>
              <span className={product.inStock ? "status-dot" : "status-dot unavailable"} />
              <strong>{product.inStock ? "Sẵn sàng giao hàng" : "Tạm hết hàng tại kho"}</strong>
            </div>

            {!product.inStock && (
              <div className="detail-out-of-stock-alert" data-reveal="fade">
                <div className="alert-badge">THÔNG BÁO TẠM HẾT HÀNG</div>
                <p>
                  Mẫu ghế <strong>{product.name}</strong> hiện đang tạm thời hết hàng tại kho. Các chức năng thêm vào giỏ và đặt mua trực tuyến cho mẫu ghế này hiện đang tạm khóa. Quý khách vui lòng liên hệ để được ưu tiên nhận thông báo khi có đợt hàng mới.
                </p>
              </div>
            )}

            <div className="purchase-row">
              <div className={`quantity ${!product.inStock ? "quantity-disabled" : ""}`}>
                <button
                  type="button"
                  disabled={!product.inStock}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Giảm số lượng"
                >
                  −
                </button>
                <span>{product.inStock ? quantity : 0}</span>
                <button
                  type="button"
                  disabled={!product.inStock}
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Tăng số lượng"
                >
                  ＋
                </button>
              </div>

              {product.inStock ? (
                <>
                  <button className="purchase-cart" type="button" onClick={handleAddToCart}>
                    Thêm vào giỏ hàng
                  </button>
                  <button className="purchase-buy" type="button" onClick={handleBuyNow}>
                    Mua ngay <span>→</span>
                  </button>
                </>
              ) : (
                <>
                  <button className="purchase-cart purchase-disabled" type="button" disabled aria-disabled="true">
                    Tạm hết hàng
                  </button>
                  <Link href="/contact" className="purchase-contact-btn">
                    Liên hệ tư vấn <span>→</span>
                  </Link>
                </>
              )}

              <button
                type="button"
                className={`purchase-wishlist-btn ${isWishlisted ? "active" : ""}`}
                onClick={() => toggleWishlist(product.id)}
                title={isWishlisted ? "Bỏ lưu yêu thích" : "Lưu vào yêu thích"}
                aria-label={isWishlisted ? "Bỏ lưu yêu thích" : "Lưu vào yêu thích"}
              >
                {isWishlisted ? "♥" : "♡"}
              </button>
            </div>

            <div className="detail-promises">
              {product.inStock ? (
                <>
                  <span><b>✓</b> Miễn phí lắp đặt</span>
                  <span><b>✓</b> Đổi trả 30 ngày</span>
                  <span><b>✓</b> Giao hàng hỏa tốc</span>
                </>
              ) : (
                <>
                  <span><b>✓</b> Hỗ trợ đặt trước theo lô</span>
                  <span><b>✓</b> Bảo hành chính hãng 5 năm</span>
                  <span><b>✓</b> Tư vấn trải nghiệm tại showroom</span>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="detail-specs" data-reveal="up">
          <div className="specs-layout">
            <div className="detail-section highlight-section" data-reveal="up">
              <p className="eyebrow">TỐI ƯU CÔNG THÁI HỌC</p>
              <h2>Điểm chạm khác biệt</h2>
              <ul className="highlight-list">
                <li data-reveal="up" data-reveal-delay="60">
                  <span>01</span>
                  <div>
                    <strong>Nâng đỡ chủ động</strong>
                    <p>Tựa lưng chuyển động theo cơ thể, giữ cột sống ở vị trí tự nhiên.</p>
                  </div>
                </li>
                <li data-reveal="up" data-reveal-delay="120">
                  <span>02</span>
                  <div>
                    <strong>Điều chỉnh theo bạn</strong>
                    <p>Tùy chỉnh độ cao, độ ngả và tay vịn để tìm ra vị trí hoàn hảo.</p>
                  </div>
                </li>
                <li data-reveal="up" data-reveal-delay="180">
                  <span>03</span>
                  <div>
                    <strong>Thoáng khí cả ngày</strong>
                    <p>Vật liệu cao cấp giúp không khí lưu thông và giảm tích nhiệt.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="detail-section specs-section" data-reveal="up">
              <p className="eyebrow">THÔNG TIN SẢN PHẨM</p>
              <h2>Thông số kỹ thuật</h2>
              <div className="spec-table">
                <div><span>Chất liệu</span><strong>{product.material}</strong></div>
                <div><span>Màu sắc</span><strong>{product.color}</strong></div>
                <div><span>Kích thước</span><strong>{product.size}</strong></div>
                <div><span>Trọng lượng</span><strong>{product.weight}</strong></div>
                <div><span>Tải trọng tối đa</span><strong>{product.capacity}</strong></div>
                <div><span>Thời gian bảo hành</span><strong>{product.warranty}</strong></div>
              </div>
            </div>

            <div className="detail-section warranty-section" data-reveal="scale">
              <div>
                <p className="eyebrow">AN TÂM SỬ DỤNG</p>
                <h2>Bảo hành chính hãng</h2>
                <p>
                  ErgoChair đồng hành cùng bạn trong từng ngày sử dụng. Sản phẩm được bảo hành chính hãng, hỗ trợ tận nơi và có đội ngũ tư vấn sẵn sàng giải đáp.
                </p>
              </div>
              <span className="warranty-number">{product.warranty}</span>
            </div>
          </div>
        </section>

        {/* Product Reviews */}
        <ProductReviews productId={product.id} productName={product.name} />

        {/* Related Products */}
        {related.length > 0 && (
          <section className="related-section" data-reveal="up">
            <div className="section-heading">
              <div>
                <p className="eyebrow">CÓ THỂ BẠN SẼ THÍCH</p>
                <h2>Sản phẩm tương tự</h2>
              </div>
              <Link className="text-link" href="/products">
                Xem tất cả <span>→</span>
              </Link>
            </div>
            <div className="related-grid">
              {related.map((item, index) => (
                <Link
                  className="related-card"
                  href={`/products/${item.id}`}
                  key={item.id}
                  data-reveal="up"
                  data-reveal-delay={String(index * 80)}
                >
                  <div style={{ backgroundImage: `url(${item.image})` }} />
                  <p>{item.category}</p>
                  <h3>{item.name}</h3>
                  <strong>{formatPrice(item.price)}</strong>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recently Viewed Products */}
        <RecentlyViewedProducts currentProductId={product.id} limit={4} />
      </main>
    </div>
  );
}
