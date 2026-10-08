"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/hooks/use-wishlist";
import { useToast } from "@/hooks/use-toast";
import { RecentlyViewedProducts } from "@/components/recently-viewed-products";
import { getProducts } from "@/lib/services/product.service";
import { formatPrice } from "@/lib/utils/format";
import type { Product } from "@/lib/types/product";

const FILTER_TABS = [
  { id: "all", label: "Tất cả sản phẩm" },
  { id: "Ghế công thái học", label: "Ghế công thái học" },
  { id: "Ghế văn phòng", label: "Ghế văn phòng" },
  { id: "Ghế lãnh đạo", label: "Ghế lãnh đạo" },
  { id: "Ghế gaming", label: "Ghế gaming" },
];

function Icon({ name }: { name: "arrow" | "bag" | "check" | "heart" | "shield" | "truck" | "refresh" | "clock" }) {
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    bag: <><path d="M6 8h12l1 12H5L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    truck: <><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>,
    refresh: <><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  };
  return (
    <svg
      aria-hidden="true"
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const toast = useToast();
  const isWishlisted = isInWishlist(product.id);
  const salePercent = Math.round((1 - product.price / product.oldPrice) * 100);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng`);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    router.push("/cart");
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <article className="minimal-product-card" data-reveal="up" data-reveal-delay={String((index % 4) * 80)}>
      <div className="product-card-thumb-wrap">
        <Link href={`/products/${product.id}`} className="product-card-image-link">
          <img src={product.image} alt={product.name} loading="lazy" />
          <div className="product-card-badge-wrap">
            {index === 0 ? (
              <span className="badge-best-seller">Bán chạy #1</span>
            ) : salePercent > 0 ? (
              <span className="badge-discount">-{salePercent}%</span>
            ) : (
              <span className="badge-new">Mới</span>
            )}
            {!product.inStock && <span className="badge-out-of-stock">Tạm hết</span>}
          </div>
        </Link>
        <button
          type="button"
          className={`product-wishlist-toggle ${isWishlisted ? "is-active" : ""}`}
          onClick={handleToggleWishlist}
          title={isWishlisted ? "Bỏ lưu yêu thích" : "Lưu vào yêu thích"}
          aria-label={isWishlisted ? `Bỏ lưu ${product.name}` : `Lưu ${product.name} vào yêu thích`}
        >
          <Icon name="heart" />
        </button>
      </div>

      <div className="product-card-details">
        <span className="product-card-category">{product.category}</span>
        <h3 className="product-card-title">
          <Link href={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        <div className="product-card-rating">
          <span className="rating-stars">★★★★★</span>
          <span className="rating-score">
            {typeof product.rating === "number" ? product.rating : product.rating.average}
          </span>
          <span className="rating-count">({product.reviewCount} đánh giá)</span>
        </div>
        <div className="product-card-bottom">
          <div className="product-price-box">
            <strong className="current-price">{formatPrice(product.price)}</strong>
            {product.oldPrice > product.price && (
              <del className="old-price">{formatPrice(product.oldPrice)}</del>
            )}
          </div>
        </div>
        <div className="catalog-cta">
          {product.inStock ? (
            <>
              <button
                type="button"
                className="catalog-add-button"
                onClick={handleAddToCart}
                aria-label={`Thêm ${product.name} vào giỏ hàng`}
              >
                Thêm vào giỏ
              </button>
              <button
                type="button"
                className="catalog-buy-button"
                onClick={handleBuyNow}
                aria-label={`Mua ngay ${product.name}`}
              >
                Mua ngay
              </button>
            </>
          ) : (
            <Link
              href={`/products/${product.id}`}
              className="catalog-view-detail-btn"
              aria-label={`Xem chi tiết ${product.name}`}
            >
              Xem chi tiết <span>→</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    let isMounted = true;
    const loadProducts = () => {
      getProducts({ pageSize: 16 }).then((res) => {
        if (isMounted) setAllProducts(res.items);
      });
    };

    loadProducts();

    window.addEventListener("ergochair-products-change", loadProducts);
    return () => {
      isMounted = false;
      window.removeEventListener("ergochair-products-change", loadProducts);
    };
  }, []);

  // Filtered products for Best Sellers section
  const displayedProducts =
    selectedCategory === "all"
      ? allProducts.slice(0, 8)
      : allProducts.filter((p) => p.category === selectedCategory).slice(0, 8);

  return (
    <div className="minimal-home-page">
      <main id="top">
        {/* =========================================================================
            1. HERO SECTION (Minimalist, Warm Cream Tone, Wood-grain CTA)
           ========================================================================= */}
        <section className="minimal-hero" aria-label="Giới thiệu không gian làm việc công thái học">
          <div className="hero-container">
            {/* Left Copy */}
            <div className="hero-copy" data-reveal="up">

              <h1 className="hero-headline">
                Không Gian Làm Việc<br />
                <span className="hero-headline-accent">Chuẩn Công Thái Học.</span>
              </h1>
              <p className="hero-description">
                Giải pháp bàn nâng hạ và ghế công thái học cao cấp, bảo vệ cột sống và
                nâng tầm cảm hứng sáng tạo suốt ngày dài làm việc.
              </p>

              {/* CTAs */}
              <div className="hero-actions">
                <Link className="btn-wood-accent" href="#products">
                  Khám phá sản phẩm
                  <Icon name="arrow" />
                </Link>
                <Link className="btn-clean-outline" href="#collections">
                  Tìm hiểu thêm
                </Link>
              </div>

              {/* Hero Stats */}
              <div className="hero-metrics">
                <div className="metric-item">
                  <strong>10.000+</strong>
                  <span>Khách hàng tin chọn</span>
                </div>
                <div className="metric-divider" />
                <div className="metric-item">
                  <strong>5 Năm</strong>
                  <span>Bảo hành chính hãng</span>
                </div>
                <div className="metric-divider" />
                <div className="metric-item">
                  <strong>100%</strong>
                  <span>Lưới tản nhiệt Wintex</span>
                </div>
              </div>
            </div>

            {/* Right Visual Scene */}
            <div className="hero-visual-scene" data-reveal="scale" data-reveal-delay="100">
              <div className="scene-image-card">
                <img
                  src="/images/hero-office-desk.jpg"
                  alt="Không gian phòng làm việc tối giản với ghế công thái học ErgoChair và bàn gỗ tự nhiên"
                  className="scene-main-image"
                />
                {/* Floating Zevora-style Badge */}
                <div className="scene-floating-badge" aria-label="Bộ sưu tập mùa hè mới">
                  <span className="badge-tag">NEW</span>
                  <span className="badge-title">BỘ SƯU TẬP<br />2026</span>
                  <span className="badge-sub">CHÍNH HÃNG</span>
                </div>
                {/* Scene Caption */}
                <div className="scene-bottom-caption">
                  <span className="caption-number">01</span>
                  <p className="caption-text">
                    Ergo Workspace Edition<br />
                    <small>Mặt gỗ sồi tự nhiên & Lưới công thái học thoáng khí</small>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. 4 PILLARS OF TRUST (Clean Features Strip)
           ========================================================================= */}
        <section className="features-strip-section" aria-label="Cam kết dịch vụ" data-reveal="fade">
          <div className="features-strip-container">
            <div className="feature-pillar" data-reveal="up" data-reveal-delay="0">
              <div className="feature-icon-bubble">
                <Icon name="truck" />
              </div>
              <div className="feature-content">
                <h4>Miễn phí giao hàng</h4>
                <p>Toàn quốc cho đơn từ 2.000.000đ</p>
              </div>
            </div>

            <div className="feature-pillar" data-reveal="up" data-reveal-delay="80">
              <div className="feature-icon-bubble">
                <Icon name="shield" />
              </div>
              <div className="feature-content">
                <h4>Bảo hành 5 năm</h4>
                <p>Chính hãng tận nhà tại HN & TP.HCM</p>
              </div>
            </div>

            <div className="feature-pillar" data-reveal="up" data-reveal-delay="160">
              <div className="feature-icon-bubble">
                <Icon name="refresh" />
              </div>
              <div className="feature-content">
                <h4>30 ngày đổi trả</h4>
                <p>1 đổi 1 nhanh chóng nếu lỗi NSX</p>
              </div>
            </div>

            <div className="feature-pillar" data-reveal="up" data-reveal-delay="240">
              <div className="feature-icon-bubble">
                <Icon name="clock" />
              </div>
              <div className="feature-content">
                <h4>Hỗ trợ 24/7</h4>
                <p>Hotline 1800 6868 miễn phí</p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. BEST SELLERS GRID (Sản Phẩm Bán Chạy)
           ========================================================================= */}
        <section className="home-products-section" id="products">
          <div className="section-container">
            <div className="section-header-row" data-reveal="up">
              <div>
                <span className="section-sub-eyebrow">DANH MỤC NỔI BẬT</span>
                <h2 className="section-main-title">Sản Phẩm Bán Chạy</h2>
                <p className="section-desc">
                  Tuyển chọn những mẫu ghế và bàn làm việc được hơn 10.000 chuyên gia tin dùng nhất.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="category-filter-pills" role="tablist">
                {FILTER_TABS.map((tab, idx) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selectedCategory === tab.id}
                    className={`filter-pill-btn ${selectedCategory === tab.id ? "is-active" : ""}`}
                    onClick={() => setSelectedCategory(tab.id)}
                    data-reveal="fade"
                    data-reveal-delay={String(idx * 50)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="minimal-product-grid">
              {displayedProducts.map((product, idx) => (
                <ProductCard key={product.id} product={product} index={idx} />
              ))}
            </div>

            {/* View All Button */}
            <div className="section-footer-cta" data-reveal="up">
              <Link href="/products" className="btn-view-all-products">
                Xem tất cả sản phẩm
                <Icon name="arrow" />
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. WHY CHOOSE ERGOCHAIR (Health & Science Benefits)
           ========================================================================= */}
        <section className="home-benefits-section" aria-label="Ưu thế công thái học ErgoChair">
          <div className="section-container">
            <div className="benefits-layout">
              <div className="benefits-left-copy" data-reveal="up">
                <span className="section-sub-eyebrow">CHUẨN MỰC CÔNG THÁI HỌC</span>
                <h2 className="benefits-title">
                  Vì Sao Sức Khỏe Của Bạn Cần Một Chiếc Ghế Đúng Chuẩn?
                </h2>
                <p className="benefits-text">
                  Ngồi sai tư thế trong thời gian dài là nguyên nhân hàng đầu gây thoái hóa cột sống,
                  đau mỏi vai gáy và giảm hiệu suất làm việc. ErgoChair mang đến giải pháp bảo vệ toàn diện.
                </p>
                <div className="benefits-badges">
                  <div className="benefit-badge-item">
                    <span className="benefit-check"><Icon name="check" /></span>
                    <span>Đạt tiêu chuẩn y học lao động BIFMA Hoa Kỳ</span>
                  </div>
                  <div className="benefit-badge-item">
                    <span className="benefit-check"><Icon name="check" /></span>
                    <span>Piston Samhongsa Class 4 bền bỉ 120.000 lần nâng hạ</span>
                  </div>
                  <div className="benefit-badge-item">
                    <span className="benefit-check"><Icon name="check" /></span>
                    <span>Hỗ trợ cân chỉnh tư thế tận nhà miễn phí</span>
                  </div>
                </div>
              </div>

              <div className="benefits-grid-cards">
                <div className="benefit-feature-card" data-reveal="up" data-reveal-delay="0">
                  <div className="feature-card-num">01</div>
                  <h4>Hỗ trợ đường cong S-Curve</h4>
                  <p>Bộ đỡ thắt lưng tự động điều chỉnh theo chuyển động của cơ thể, giải phóng áp lực đốt sống L4-L5.</p>
                </div>

                <div className="benefit-feature-card" data-reveal="up" data-reveal-delay="80">
                  <div className="feature-card-num">02</div>
                  <h4>Lưới tản nhiệt Wintex</h4>
                  <p>100% sợi polyester đàn hồi cao cấp nhập khẩu Hàn Quốc, không bai dão và thoáng khí suốt ngày dài.</p>
                </div>

                <div className="benefit-feature-card" data-reveal="up" data-reveal-delay="160">
                  <div className="feature-card-num">03</div>
                  <h4>Mâm ngả khóa đa góc</h4>
                  <p>Cho phép ngả lưng thư giãn từ 90° đến 135°, khóa vị trí linh hoạt khi nghỉ ngơi trưa tại văn phòng.</p>
                </div>

                <div className="benefit-feature-card" data-reveal="up" data-reveal-delay="240">
                  <div className="feature-card-num">04</div>
                  <h4>Bảo hành tận nơi 5 năm</h4>
                  <p>Dịch vụ hậu mãi số 1 Việt Nam với đội ngũ kỹ thuật viên phục vụ tận phòng tại Hà Nội & TP.HCM.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            6. RECENTLY VIEWED PRODUCTS
           ========================================================================= */}
        <RecentlyViewedProducts limit={4} />
      </main>

      {/* =========================================================================
          7. FOOTER (Clean, Minimalist E-Commerce Footer)
         ========================================================================= */}
      <footer className="minimal-site-footer" data-reveal="fade">
        <div className="footer-main-container">
          <div className="footer-columns-grid">
            {/* Brand Column */}
            <div className="footer-col-brand">
              <Link className="footer-logo" href="#top">
                <span className="logo-mark">e</span> ErgoChair
              </Link>
              <p className="footer-mission">
                Ngồi đúng hôm nay,<br />
                Sống khỏe mỗi ngày cùng chuẩn mực công thái học hàng đầu.
              </p>
              <div className="footer-social-links">
                <a href="#facebook" aria-label="Facebook">f</a>
                <a href="#instagram" aria-label="Instagram">◎</a>
                <a href="#linkedin" aria-label="LinkedIn">in</a>
              </div>
            </div>

            {/* Nav Column 1 */}
            <div className="footer-col">
              <h4>Khám phá</h4>
              <Link href="/products">Tất cả sản phẩm</Link>
              <Link href="/products?category=Ghế+công+thái+học">Ghế công thái học</Link>
              <Link href="/products?category=Ghế+văn+phòng">Ghế văn phòng</Link>
              <Link href="/products?category=Ghế+gaming">Ghế gaming</Link>
              <Link href="/products?category=Ghế+lãnh+đạo">Ghế lãnh đạo</Link>
            </div>

            {/* Nav Column 2 */}
            <div className="footer-col">
              <h4>Hỗ trợ khách hàng</h4>
              <Link href="/account">Đơn hàng của tôi</Link>
              <Link href="/contact">Vận chuyển & lắp đặt</Link>
              <Link href="/about">Chính sách bảo hành 5 năm</Link>
              <Link href="/contact">Chính sách đổi trả 30 ngày</Link>
              <Link href="/contact">Câu hỏi thường gặp (FAQ)</Link>
            </div>

            {/* Contact Column */}
            <div className="footer-col footer-contact-col">
              <h4>Liên hệ</h4>
              <p>Hotline: <strong>1800 6868</strong> (Miễn phí)</p>
              <p>Email: hello@ergochair.vn</p>
              <p>Địa chỉ: 36 Nguyễn Cơ Thạch, Nam Từ Liêm, Hà Nội</p>
              <p>Showroom TP.HCM: 120 Điện Biên Phủ, Quận 1, TP.HCM</p>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-bottom-bar">
            <p>© {new Date().getFullYear()} ErgoChair Vietnam. Mọi quyền được bảo lưu.</p>
            <div className="footer-badges">
              <span>Bảo hành chính hãng 5 năm</span>
              <span>•</span>
              <span>Đổi trả miễn phí 30 ngày</span>
              <span>•</span>
              <span>Giao hàng toàn quốc</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
