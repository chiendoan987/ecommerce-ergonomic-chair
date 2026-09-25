"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { formatPrice, products } from "@/lib/products";

type Props = { params: Promise<{ id: string }> };

const reviews = [
    { initials: "NT", name: "Ngọc Trâm", role: "Designer, Hà Nội", text: "Sau 8 tiếng làm việc, lưng tôi vẫn nhẹ tênh. Chiếc ghế thực sự thay đổi cách tôi làm việc mỗi ngày." },
    { initials: "MQ", name: "Minh Quân", role: "Founder, TP. Hồ Chí Minh", text: "Thiết kế đẹp, lắp đặt nhanh và cảm giác ngồi rất chắc chắn. Đáng tiền hơn nhiều so với kỳ vọng." },
    { initials: "HL", name: "Hoài Linh", role: "Content Creator, Đà Nẵng", text: "Ghế vừa êm vừa thoáng, đặc biệt là vào những ngày hè. Góc làm việc của tôi trông hẳn khác đi." },
  ];

  function Stars({ rating }: { rating: number }) { return <span className="detail-stars" aria-label={`${rating} trên 5 sao`}>★★★★★</span>; }

  export default function ProductDetailPage({ params }: Props) {
    const { id } = use(params);
    const router = useRouter();
    const product = products.find((item, index) => item.id === id || String(index + 1) === id);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState({ productId: "", index: 0 });
    const { addItem } = useCart();

    if (!product) return <main className="product-not-found"><p className="eyebrow">ERGOCHAIR</p><h1>Không tìm thấy sản phẩm</h1><p>Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã được cập nhật.</p><Link className="button button-dark" href="/products">Quay lại sản phẩm</Link></main>;

    const gallery = product.gallery?.length ? product.gallery : [product.image];
    const selectedImageIndex = selectedImage.productId === product.id ? selectedImage.index : 0;
    const related = [...products.filter((item) => item.id !== product.id && item.category === product.category), ...products.filter((item) => item.id !== product.id && item.category !== product.category)].slice(0, 4);
    const salePercent = Math.round((1 - product.price / product.oldPrice) * 100);

    return <div className="detail-page">
      <div className="detail-breadcrumb" data-reveal="fade"><Link href="/products">Sản phẩm</Link><span>/</span><span>{product.category}</span><span>/</span><strong>{product.name}</strong></div>
      <main>
        <section className="detail-intro">
          <div className="detail-gallery" data-reveal="scale">
            <div className="detail-main-image" style={{ backgroundImage: `url(${gallery[selectedImageIndex]})` }}>
              <span className={product.inStock ? "stock-badge" : "stock-badge sold-out"}>{product.inStock ? "Còn hàng" : "Tạm hết hàng"}</span>
            </div>
            <div className="detail-thumbnails">
              {gallery.map((image, index) => (
                <button
                  className={selectedImageIndex === index ? "selected" : ""}
                  key={image}
                  type="button"
                  onClick={() => setSelectedImage({ productId: product.id, index })}
                  aria-label={`Xem hình ${index + 1}`}
                  style={{ backgroundImage: `url(${image})` }}
                />
              ))}
            </div>
          </div>
          <div className="detail-copy" data-reveal="up" data-reveal-delay="80">
            <p className="catalog-category">{product.category}</p>
            <h1>{product.name}</h1>
            <div className="detail-rating">
              <Stars rating={product.rating} />
              <strong>{product.rating}</strong>
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
                <button type="button" disabled={!product.inStock} onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Giảm số lượng">−</button>
                <span>{product.inStock ? quantity : 0}</span>
                <button type="button" disabled={!product.inStock} onClick={() => setQuantity(quantity + 1)} aria-label="Tăng số lượng">＋</button>
              </div>
              {product.inStock ? (
                <>
                  <button className="purchase-cart" type="button" onClick={() => addItem(product, quantity)}>Thêm vào giỏ hàng</button>
                  <button className="purchase-buy" type="button" onClick={() => { addItem(product, quantity); router.push("/cart"); }}>Mua ngay <span>→</span></button>
                </>
              ) : (
                <>
                  <button className="purchase-cart purchase-disabled" type="button" disabled aria-disabled="true">Tạm hết hàng</button>
                  <Link href="/contact" className="purchase-contact-btn">Liên hệ tư vấn <span>→</span></Link>
                </>
              )}
            </div>
            <div className="detail-promises">
              {product.inStock ? (
                <>
                  <span><b>✓</b> Miễn phí lắp đặt</span>
                  <span><b>✓</b> Đổi trả trong 30 ngày</span>
                </>
              ) : (
                <>
                  <span><b>ℹ</b> Nhận thông báo khi có hàng mới</span>
                  <span><b>✓</b> Hỗ trợ tư vấn kỹ thuật 24/7</span>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="detail-content">
          <div className="content-column">
            <div className="detail-section" data-reveal="up">
              <p className="eyebrow">CẢM HỨNG THIẾT KẾ</p>
              <h2>Thoải mái là một<br /><em>lựa chọn thông minh.</em></h2>
              <p>{product.description} Mọi chi tiết được tinh chỉnh để bạn có thể duy trì tư thế đúng và dành năng lượng cho những điều thực sự quan trọng.</p>
              <ul className="feature-list">
                <li data-reveal="up" data-reveal-delay="60"><span>01</span><div><strong>Nâng đỡ chủ động</strong><p>Tựa lưng chuyển động theo cơ thể, giữ cột sống ở vị trí tự nhiên.</p></div></li>
                <li data-reveal="up" data-reveal-delay="120"><span>02</span><div><strong>Điều chỉnh theo bạn</strong><p>Tùy chỉnh độ cao, độ ngả và tay vịn để tìm ra vị trí hoàn hảo.</p></div></li>
                <li data-reveal="up" data-reveal-delay="180"><span>03</span><div><strong>Thoáng khí cả ngày</strong><p>Vật liệu cao cấp giúp không khí lưu thông và giảm tích nhiệt.</p></div></li>
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
                <p>ErgoChair đồng hành cùng bạn trong từng ngày sử dụng. Sản phẩm được bảo hành chính hãng, hỗ trợ tận nơi và có đội ngũ tư vấn sẵn sàng giải đáp.</p>
              </div>
              <span className="warranty-number">{product.warranty}</span>
            </div>
          </div>
        </section>

        <section className="detail-reviews" id="reviews" data-reveal="up">
          <div className="reviews-heading">
            <div>
              <p className="eyebrow">TRẢI NGHIỆM THỰC TẾ</p>
              <h2>Khách hàng nói gì</h2>
            </div>
            <div className="detail-average">
              <strong>{product.rating}</strong>
              <div>
                <Stars rating={product.rating} />
                <small>{product.reviewCount} đánh giá</small>
              </div>
            </div>
          </div>
          <div className="detail-review-grid">
            {reviews.map((review, index) => (
              <blockquote key={review.name} data-reveal="up" data-reveal-delay={String(index * 90)}>
                <Stars rating={product.rating} />
                <p>“{review.text}”</p>
                <footer>
                  <span>{review.initials}</span>
                  <strong>{review.name}<small>{review.role}</small></strong>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section className="related-section" data-reveal="up">
            <div className="section-heading">
              <div>
                <p className="eyebrow">CÓ THỂ BẠN SẼ THÍCH</p>
                <h2>Sản phẩm liên quan</h2>
              </div>
              <Link className="text-link" href="/products">Xem tất cả <span>→</span></Link>
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
      </main>
    </div>;
  }
