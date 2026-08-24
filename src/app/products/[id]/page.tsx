"use client";

import Link from "next/link";
import { use, useState } from "react";

type Product = {
  id: string;
  name: string;
  category: string;
  image: string;
  price: number;
  oldPrice: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  material: string;
  color: string;
  size: string;
  weight: string;
  capacity: string;
  warranty: string;
  description: string;
};

type Props = { params: Promise<{ id: string }> };

const images = [
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1596162954151-cdcb4c0f70a8?auto=format&fit=crop&w=900&q=85",
];

const products: Product[] = [
  { id: "ergo-pro-x1", name: "Ergo Pro X1", category: "Ghế văn phòng", image: images[0], price: 8490000, oldPrice: 9990000, rating: 4.9, reviewCount: 328, inStock: true, material: "Lưới AirFlex & hợp kim nhôm", color: "Đen than", size: "67 × 67 × 112–122 cm", weight: "18.5 kg", capacity: "150 kg", warranty: "5 năm", description: "Ergo Pro X1 là lựa chọn cân bằng giữa hiệu năng và thẩm mỹ. Tựa lưng AirFlex ôm sát đường cong tự nhiên, giúp bạn tập trung thoải mái trong suốt ngày dài." },
  { id: "cloud-mesh-air", name: "Cloud Mesh Air", category: "Ghế lưng lưới", image: images[2], price: 6290000, oldPrice: 7490000, rating: 4.8, reviewCount: 214, inStock: true, material: "Lưới AirFlex & nylon cao cấp", color: "Xám sương", size: "65 × 64 × 108–118 cm", weight: "16 kg", capacity: "135 kg", warranty: "5 năm", description: "Cloud Mesh Air mang đến cảm giác nhẹ thoáng và nâng đỡ linh hoạt. Thiết kế tối giản phù hợp với mọi góc làm việc hiện đại." },
  { id: "executive-oak", name: "Executive Oak", category: "Ghế cao cấp", image: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=90", price: 12990000, oldPrice: 14990000, rating: 5, reviewCount: 87, inStock: true, material: "Da PU & gỗ sồi tự nhiên", color: "Nâu gỗ", size: "72 × 70 × 115–125 cm", weight: "24 kg", capacity: "160 kg", warranty: "7 năm", description: "Executive Oak kết hợp vẻ đẹp ấm áp của gỗ sồi với hệ thống điều chỉnh công thái học tinh tế, dành cho những không gian làm việc có gu." },
  { id: "motion-lite", name: "Motion Lite", category: "Ghế văn phòng", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=90", price: 4890000, oldPrice: 5890000, rating: 4.7, reviewCount: 156, inStock: false, material: "Vải dệt & nylon", color: "Xanh olive", size: "64 × 63 × 104–114 cm", weight: "15 kg", capacity: "120 kg", warranty: "3 năm", description: "Motion Lite gọn nhẹ, linh hoạt và dễ làm quen. Đây là mẫu ghế thực dụng cho góc làm việc tại nhà." },
  { id: "play-seat-pro", name: "Play Seat Pro", category: "Ghế gaming", image: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=1200&q=90", price: 7290000, oldPrice: 8490000, rating: 4.8, reviewCount: 192, inStock: true, material: "Da PU & foam định hình", color: "Đen đỏ", size: "70 × 68 × 120–130 cm", weight: "21 kg", capacity: "150 kg", warranty: "5 năm", description: "Play Seat Pro hỗ trợ vững chắc cho những phiên làm việc và giải trí kéo dài, với phần tựa lưng ôm và đệm ngồi đàn hồi." },
    { id: "aero-support", name: "Aero Support", category: "Ghế lưng lưới", image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=1200&q=90", price: 5590000, oldPrice: 6790000, rating: 4.6, reviewCount: 119, inStock: true, material: "Lưới thoáng khí & thép sơn tĩnh điện", color: "Trắng kem", size: "65 × 64 × 109–119 cm", weight: "17 kg", capacity: "135 kg", warranty: "5 năm", description: "Aero Support là mẫu ghế thông thoáng với phần đỡ thắt lưng điều chỉnh được, giúp tư thế ngồi luôn cân bằng." },
    { id: "lounge-heritage", name: "Lounge Heritage", category: "Ghế cao cấp", image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=90", price: 10990000, oldPrice: 12490000, rating: 4.9, reviewCount: 64, inStock: false, material: "Vải boucle & gỗ sồi", color: "Be tự nhiên", size: "75 × 72 × 110–120 cm", weight: "23 kg", capacity: "150 kg", warranty: "7 năm", description: "Lounge Heritage tạo nên một góc làm việc mềm mại và trang nhã với chất liệu cao cấp cùng đường nét thư giãn." },
    { id: "focus-task", name: "Focus Task", category: "Ghế văn phòng", image: "https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=1200&q=90", price: 6790000, oldPrice: 7990000, rating: 4.8, reviewCount: 141, inStock: true, material: "Lưới AirFlex & nylon", color: "Xám graphite", size: "66 × 65 × 110–120 cm", weight: "17.5 kg", capacity: "140 kg", warranty: "5 năm", description: "Focus Task giữ cho bạn tỉnh táo và thoải mái với thiết kế hỗ trợ lưng chủ động, tối ưu cho công việc tập trung." },
  ];

  const reviews = [
    { initials: "NT", name: "Ngọc Trâm", role: "Designer, Hà Nội", text: "Sau 8 tiếng làm việc, lưng tôi vẫn nhẹ tênh. Chiếc ghế thực sự thay đổi cách tôi làm việc mỗi ngày." },
    { initials: "MQ", name: "Minh Quân", role: "Founder, TP. Hồ Chí Minh", text: "Thiết kế đẹp, lắp đặt nhanh và cảm giác ngồi rất chắc chắn. Đáng tiền hơn nhiều so với kỳ vọng." },
    { initials: "HL", name: "Hoài Linh", role: "Content Creator, Đà Nẵng", text: "Ghế vừa êm vừa thoáng, đặc biệt là vào những ngày hè. Góc làm việc của tôi trông hẳn khác đi." },
  ];

  function formatPrice(price: number) { return `${new Intl.NumberFormat("vi-VN").format(price)}đ`; }
  function Stars({ rating }: { rating: number }) { return <span className="detail-stars" aria-label={`${rating} trên 5 sao`}>★★★★★</span>; }

  export default function ProductDetailPage({ params }: Props) {
    const { id } = use(params);
    const product = products.find((item, index) => item.id === id || String(index + 1) === id);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);

    if (!product) return <main className="product-not-found"><p className="eyebrow">ERGOCHAIR</p><h1>Không tìm thấy sản phẩm</h1><p>Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã được cập nhật.</p><Link className="button button-dark" href="/products">Quay lại sản phẩm</Link></main>;

    const gallery = [product.image, ...images.filter((image) => image !== product.image)].slice(0, 3);
    const related = [...products.filter((item) => item.id !== product.id && item.category === product.category), ...products.filter((item) => item.id !== product.id && item.category !== product.category)].slice(0, 4);
    const salePercent = Math.round((1 - product.price / product.oldPrice) * 100);

    return <div className="detail-page">
      <div className="detail-breadcrumb"><Link href="/products">Sản phẩm</Link><span>/</span><span>{product.category}</span><span>/</span><strong>{product.name}</strong></div>
      <main>
        <section className="detail-intro"><div className="detail-gallery"><div className="detail-main-image" style={{ backgroundImage: `url(${gallery[selectedImage]})` }}><span className={product.inStock ? "stock-badge" : "stock-badge sold-out"}>{product.inStock ? "Còn hàng" : "Tạm hết hàng"}</span></div><div className="detail-thumbnails">{gallery.map((image, index) => <button className={selectedImage === index ? "selected" : ""} key={image} type="button" onClick={() => setSelectedImage(index)} aria-label={`Xem hình ${index + 1}`} style={{ backgroundImage: `url(${image})` }} />)}</div></div>
          <div className="detail-copy"><p className="catalog-category">{product.category}</p><h1>{product.name}</h1><div className="detail-rating"><Stars rating={product.rating} /><strong>{product.rating}</strong><Link href="#reviews">{product.reviewCount} đánh giá</Link></div><div className="detail-prices"><strong>{formatPrice(product.price)}</strong><del>{formatPrice(product.oldPrice)}</del><span>-{salePercent}%</span></div><p className="detail-description">{product.description}</p><div className="detail-status"><span className={product.inStock ? "status-dot" : "status-dot unavailable"} />{product.inStock ? "Sẵn sàng giao hàng" : "Tạm hết hàng"}</div><div className="purchase-row"><div className="quantity"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Giảm số lượng">−</button><span>{quantity}</span><button type="button" onClick={() => setQuantity(quantity + 1)} aria-label="Tăng số lượng">＋</button></div><button className="purchase-cart" type="button" disabled={!product.inStock}>Thêm vào giỏ hàng</button><button className="purchase-buy" type="button" disabled={!product.inStock}>Mua ngay <span>→</span></button></div><div className="detail-promises"><span><b>✓</b> Miễn phí lắp đặt</span><span><b>✓</b> Đổi trả trong 30 ngày</span></div></div>
        </section>
        <section className="detail-content"><div className="content-column"><div className="detail-section"><p className="eyebrow">CẢM HỨNG THIẾT KẾ</p><h2>Thoải mái là một<br /><em>lựa chọn thông minh.</em></h2><p>{product.description} Mọi chi tiết được tinh chỉnh để bạn có thể duy trì tư thế đúng và dành năng lượng cho những điều thực sự quan trọng.</p><ul className="feature-list"><li><span>01</span><div><strong>Nâng đỡ chủ động</strong><p>Tựa lưng chuyển động theo cơ thể, giữ cột sống ở vị trí tự nhiên.</p></div></li><li><span>02</span><div><strong>Điều chỉnh theo bạn</strong><p>Tùy chỉnh độ cao, độ ngả và tay vịn để tìm ra vị trí hoàn hảo.</p></div></li><li><span>03</span><div><strong>Thoáng khí cả ngày</strong><p>Vật liệu cao cấp giúp không khí lưu thông và giảm tích nhiệt.</p></div></li></ul></div><div className="detail-section specs-section"><p className="eyebrow">THÔNG TIN SẢN PHẨM</p><h2>Thông số kỹ thuật</h2><div className="spec-table"><div><span>Chất liệu</span><strong>{product.material}</strong></div><div><span>Màu sắc</span><strong>{product.color}</strong></div><div><span>Kích thước</span><strong>{product.size}</strong></div><div><span>Trọng lượng</span><strong>{product.weight}</strong></div><div><span>Tải trọng tối đa</span><strong>{product.capacity}</strong></div><div><span>Thời gian bảo hành</span><strong>{product.warranty}</strong></div></div></div><div className="detail-section warranty-section"><div><p className="eyebrow">AN TÂM SỬ DỤNG</p><h2>Bảo hành chính hãng</h2><p>ErgoChair đồng hành cùng bạn trong từng ngày sử dụng. Sản phẩm được bảo hành chính hãng, hỗ trợ tận nơi và có đội ngũ tư vấn sẵn sàng giải đáp.</p></div><span className="warranty-number">{product.warranty}</span></div></div></section>
        <section className="detail-reviews" id="reviews"><div className="reviews-heading"><div><p className="eyebrow">TRẢI NGHIỆM THỰC TẾ</p><h2>Khách hàng nói gì</h2></div><div className="detail-average"><strong>{product.rating}</strong><div><Stars rating={product.rating} /><small>{product.reviewCount} đánh giá</small></div></div></div><div className="detail-review-grid">{reviews.map((review) => <blockquote key={review.name}><Stars rating={product.rating} /><p>“{review.text}”</p><footer><span>{review.initials}</span><strong>{review.name}<small>{review.role}</small></strong></footer></blockquote>)}</div></section>
        {related.length > 0 && <section className="related-section"><div className="section-heading"><div><p className="eyebrow">CÓ THỂ BẠN SẼ THÍCH</p><h2>Sản phẩm liên quan</h2></div><Link className="text-link" href="/products">Xem tất cả <span>→</span></Link></div><div className="related-grid">{related.map((item) => <Link className="related-card" href={`/products/${item.id}`} key={item.id}><div style={{ backgroundImage: `url(${item.image})` }} /><p>{item.category}</p><h3>{item.name}</h3><strong>{formatPrice(item.price)}</strong></Link>)}</div></section>}
      </main>
    </div>;
  }
