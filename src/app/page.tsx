"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { formatPrice, products, type Product } from "@/lib/products";

const categories = [
  { name: "Ghế công thái học", count: "Khám phá thiết kế", image: products[1].image },
  { name: "Ghế văn phòng", count: "Làm việc tập trung", image: products[7].image },
  { name: "Ghế gaming", count: "Chơi theo cách của bạn", image: products[4].image },
  { name: "Ghế lãnh đạo", count: "Phong cách lãnh đạo", image: products[2].image },
];

function Icon({ name }: { name: "arrow" | "bag" | "check" | "search" | "menu" }) {
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    bag: <><path d="M6 8h12l1 12H5L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
  };
  return <svg aria-hidden="true" className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function ProductCard({ product, index, onAdded }: { product: Product; index: number; onAdded: (name: string) => void }) {
  const { addItem } = useCart();
  const salePercent = Math.round((1 - product.price / product.oldPrice) * 100);

  return <article className="home-product-card" data-reveal="up" data-reveal-delay={String(index * 90)}>
    <Link className="home-product-image" href={`/products/${product.id}`}>
      <img src={product.image} alt={product.name} />
      <span className={product.inStock ? "home-badge" : "home-badge home-badge-muted"}>{index === 0 ? "Bán chạy" : product.inStock ? `-${salePercent}%` : "Tạm hết hàng"}</span>
      <span className="home-product-arrow"><Icon name="arrow" /></span>
    </Link>
    <div className="home-product-info">
      <p>{product.category}</p>
      <Link href={`/products/${product.id}`}><h3>{product.name}</h3></Link>
      <div className="home-rating"><span>★★★★★</span> {product.rating} <small>({product.reviewCount})</small></div>
      <div className="home-price">
        <strong>{formatPrice(product.price)}</strong>
        <del>{formatPrice(product.oldPrice)}</del>
        {product.inStock ? (
          <button type="button" onClick={() => { addItem(product); onAdded(product.name); }} aria-label={`Thêm ${product.name} vào giỏ hàng`}><Icon name="bag" /></button>
        ) : (
          <Link href={`/products/${product.id}`} className="home-sold-out-link" title="Xem chi tiết sản phẩm" aria-label={`Xem chi tiết ${product.name}`}><Icon name="arrow" /></Link>
        )}
      </div>
    </div>
  </article>;
}

export default function Home() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (name: string) => {
    setToast(`${name} đã được thêm vào giỏ hàng`);
    window.setTimeout(() => setToast(""), 2400);
  };

  return <div className="site-shell home-page">
    <header className="site-header"><Link className="logo" href="#top"><span className="logo-mark">e</span> ErgoChair</Link><nav className={menuOpen ? "open" : ""}><Link className="active" href="#top" onClick={() => setMenuOpen(false)}>Trang chủ</Link><Link href="#products" onClick={() => setMenuOpen(false)}>Sản phẩm</Link><Link href="#categories" onClick={() => setMenuOpen(false)}>Danh mục</Link><Link href="#about" onClick={() => setMenuOpen(false)}>Về chúng tôi</Link></nav><div className="header-actions"><button aria-label="Tìm kiếm"><Icon name="search" /></button><Link className="cart" href="/cart" aria-label="Giỏ hàng"><Icon name="bag" />{itemCount > 0 && <span key={itemCount}>{itemCount}</span>}</Link><Link className="login" href="/products">Mua sắm</Link><button className="mobile-menu" aria-label="Mở menu" onClick={() => setMenuOpen(!menuOpen)}><Icon name="menu" /></button></div></header>
    <main id="top">
      <section className="home-hero">
        <div className="home-hero-copy" data-reveal="up">
          <p className="eyebrow">BỘ SƯU TẬP 2026 / ERGOCHAIR</p>
          <h1>Ghế công thái học<br /><em>cho một ngày tốt hơn.</em></h1>
          <p>Thiết kế cho tư thế tốt hơn. Làm việc thoải mái hơn mỗi ngày.</p>
          <div className="home-hero-actions">
            <Link className="button button-dark" href="#products">Khám phá sản phẩm <Icon name="arrow" /></Link>
            <Link className="text-link" href="#categories">Xem theo danh mục <Icon name="arrow" /></Link>
          </div>
          <div className="home-stat">
            <strong>10.000+</strong>
            <span>người đang ngồi<br />thoải mái hơn</span>
          </div>
        </div>
        <div className="home-hero-visual" data-reveal="scale" data-reveal-delay="120">
          <img src={products[0].image} alt="Ghế Ergo Pro X1 trong không gian làm việc hiện đại" />
          <div>
            <span>01</span>
            <p>Ergo Pro X1<br /><small>Thiết kế chủ đạo</small></p>
          </div>
        </div>
      </section>

      <section className="home-trust" data-reveal="fade" data-reveal-delay="80">
        <span>Được lựa chọn bởi</span>
        <strong>nord</strong>
        <strong>monday</strong>
        <strong>vertex</strong>
        <strong>studio03</strong>
        <strong>MUZE</strong>
      </section>

      <section className="home-section" id="products">
        <div className="home-section-heading" data-reveal="up">
          <div>
            <p className="eyebrow">LỰA CHỌN CỦA BẠN</p>
            <h2>Sản phẩm nổi bật</h2>
          </div>
          <Link className="text-link" href="/products">Xem tất cả sản phẩm <Icon name="arrow" /></Link>
        </div>
        <div className="home-product-grid">
          {products.slice(0, 4).map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} onAdded={showToast} />
          ))}
        </div>
      </section>

      <section className="home-section home-categories" id="categories">
        <div className="home-section-heading" data-reveal="up">
          <div>
            <p className="eyebrow">TÌM THEO NHU CẦU</p>
            <h2>Không gian, phong cách<br />của riêng bạn</h2>
          </div>
          <p>Một chiếc ghế tốt bắt đầu<br />từ cách bạn muốn sống.</p>
        </div>
        <div className="home-category-grid">
          {categories.map((category, index) => (
            <Link
              className={`home-category home-category-${index + 1}`}
              href={`/products?category=${encodeURIComponent(category.name)}`}
              key={category.name}
              data-reveal="scale"
              data-reveal-delay={String(index * 90)}
            >
              <img src={category.image} alt={category.name} />
              <span>
                <strong>{category.name}</strong>
                <small>{category.count}</small>
              </span>
              <b><Icon name="arrow" /></b>
            </Link>
          ))}
        </div>
      </section>

      <section className="why-section" id="about">
        <div className="why-intro" data-reveal="right">
          <p className="eyebrow">LÝ DO BẠN SẼ YÊU</p>
          <h2>Không chỉ là<br /><em>một chiếc ghế.</em></h2>
          <p>Chúng tôi tin rằng cảm giác thoải mái là nền tảng cho những ý tưởng tuyệt vời.</p>
          <Link className="button button-light" href="/products">Câu chuyện ErgoChair <Icon name="arrow" /></Link>
        </div>
        <div className="benefit-grid">
          <div data-reveal="up" data-reveal-delay="60"><span>01</span><h3>Thiết kế<br />công thái học</h3><p>Hỗ trợ cột sống tự nhiên, giảm áp lực lên cơ thể.</p></div>
          <div data-reveal="up" data-reveal-delay="120"><span>02</span><h3>Bảo hành<br />chính hãng</h3><p>An tâm sử dụng với chính sách bảo hành 5 năm.</p></div>
          <div data-reveal="up" data-reveal-delay="180"><span>03</span><h3>Giao hàng<br />toàn quốc</h3><p>Miễn phí vận chuyển, lắp đặt tận nơi.</p></div>
          <div data-reveal="up" data-reveal-delay="240"><span>04</span><h3>Tư vấn<br />tận tâm</h3><p>Đội ngũ đồng hành để bạn chọn đúng chiếc ghế.</p></div>
        </div>
      </section>

      <section className="section reviews-section">
        <div className="section-heading" data-reveal="up">
          <div>
            <p className="eyebrow">KHÁCH HÀNG NÓI GÌ</p>
            <h2>Được tạo ra để<br />được yêu thích.</h2>
          </div>
          <div className="review-score">
            <strong>4.9</strong>
            <span>★★★★★<small>từ 2.400+ đánh giá</small></span>
          </div>
        </div>
        <div className="review-grid">
          <blockquote data-reveal="up" data-reveal-delay="60">
            <div>★★★★★</div>
            <p>“Sau 8 tiếng làm việc, lưng tôi vẫn nhẹ tênh. Ergo Pro X1 thực sự thay đổi cách tôi làm việc mỗi ngày.”</p>
            <footer><span>NT</span><strong>Ngọc Trâm<small>Designer, Hà Nội</small></strong></footer>
          </blockquote>
          <blockquote data-reveal="up" data-reveal-delay="130">
            <div>★★★★★</div>
            <p>“Thiết kế đẹp, lắp đặt nhanh và cảm giác ngồi rất chắc chắn. Đáng tiền hơn nhiều so với những gì tôi kỳ vọng.”</p>
            <footer><span>MQ</span><strong>Minh Quân<small>Founder, TP. Hồ Chí Minh</small></strong></footer>
          </blockquote>
          <blockquote data-reveal="up" data-reveal-delay="200">
            <div>★★★★★</div>
            <p>“Góc làm việc của tôi trông hẳn khác đi. Ghế vừa êm vừa thoáng, đặc biệt là vào những ngày hè.”</p>
            <footer><span>HL</span><strong>Hoài Linh<small>Content Creator, Đà Nẵng</small></strong></footer>
          </blockquote>
        </div>
      </section>
    </main>
    <footer className="site-footer" data-reveal="fade">
      <div className="footer-top">
        <div className="footer-brand">
          <Link className="logo" href="#top"><span className="logo-mark">e</span> ErgoChair</Link>
          <p>Ngồi đúng hôm nay,<br />sống khỏe mỗi ngày.</p>
          <div className="socials">
            <a href="#facebook" aria-label="Facebook">f</a>
            <a href="#instagram" aria-label="Instagram">◎</a>
            <a href="#linkedin" aria-label="LinkedIn">in</a>
          </div>
        </div>
        <div>
          <h4>Khám phá</h4>
          <Link href="/products">Tất cả sản phẩm</Link>
          <Link href="/products?category=Ghế+văn+phòng">Ghế văn phòng</Link>
          <Link href="/products?category=Ghế+gaming">Ghế gaming</Link>
          <Link href="/products?category=Ghế+lãnh+đạo">Ghế lãnh đạo</Link>
        </div>
        <div>
          <h4>Hỗ trợ</h4>
          <a href="#shipping">Vận chuyển & lắp đặt</a>
          <a href="#warranty">Chính sách bảo hành</a>
          <a href="#returns">Đổi trả sản phẩm</a>
          <a href="#faq">Câu hỏi thường gặp</a>
        </div>
        <div className="footer-contact">
          <h4>Ghé thăm chúng tôi</h4>
          <p>36 Nguyễn Cơ Thạch, Nam Từ Liêm<br />Hà Nội, Việt Nam</p>
          <a href="mailto:hello@ergochair.vn">hello@ergochair.vn</a>
          <a href="tel:18006868">1800 6868</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 ErgoChair. All rights reserved.</span>
        <span>Made for better living.</span>
      </div>
    </footer>
    {toast && <div className="cart-toast" role="status">Đã thêm sản phẩm vào giỏ hàng</div>}
  </div>;
}
