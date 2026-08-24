"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  image: string;
  price: number;
  oldPrice: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  category: string;
};

type SortOption = "featured" | "price-asc" | "price-desc" | "rating";

const products: Product[] = [
  { id: "ergo-pro-x1", name: "Ergo Pro X1", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=85", price: 8490000, oldPrice: 9990000, rating: 4.9, reviewCount: 328, inStock: true, category: "Ghế văn phòng" },
  { id: "cloud-mesh-air", name: "Cloud Mesh Air", image: "https://images.unsplash.com/photo-1596162954151-cdcb4c0f70a8?auto=format&fit=crop&w=900&q=85", price: 6290000, oldPrice: 7490000, rating: 4.8, reviewCount: 214, inStock: true, category: "Ghế lưng lưới" },
  { id: "executive-oak", name: "Executive Oak", image: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=85", price: 12990000, oldPrice: 14990000, rating: 5, reviewCount: 87, inStock: true, category: "Ghế cao cấp" },
  { id: "motion-lite", name: "Motion Lite", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85", price: 4890000, oldPrice: 5890000, rating: 4.7, reviewCount: 156, inStock: false, category: "Ghế văn phòng" },
  { id: "play-seat-pro", name: "Play Seat Pro", image: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=900&q=85", price: 7290000, oldPrice: 8490000, rating: 4.8, reviewCount: 192, inStock: true, category: "Ghế gaming" },
  { id: "aero-support", name: "Aero Support", image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=900&q=85", price: 5590000, oldPrice: 6790000, rating: 4.6, reviewCount: 119, inStock: true, category: "Ghế lưng lưới" },
  { id: "lounge-heritage", name: "Lounge Heritage", image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=85", price: 10990000, oldPrice: 12490000, rating: 4.9, reviewCount: 64, inStock: false, category: "Ghế cao cấp" },
  { id: "focus-task", name: "Focus Task", image: "https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=900&q=85", price: 6790000, oldPrice: 7990000, rating: 4.8, reviewCount: 141, inStock: true, category: "Ghế văn phòng" },
];

const categories = ["Tất cả loại ghế", "Ghế văn phòng", "Ghế gaming", "Ghế cao cấp", "Ghế lưng lưới"];

function formatPrice(price: number) {
  return `${new Intl.NumberFormat("vi-VN").format(price)}đ`;
}

function Rating({ rating, reviewCount }: Pick<Product, "rating" | "reviewCount">) {
  return <div className="catalog-rating"><span>★★★★★</span><strong>{rating.toFixed(1)}</strong><small>({reviewCount})</small></div>;
}

function ProductCard({ product }: { product: Product }) {
  return <article className="catalog-card">
    <div className="catalog-image" style={{ backgroundImage: `url(${product.image})` }}>
      <span className={product.inStock ? "stock-badge" : "stock-badge sold-out"}>{product.inStock ? "Còn hàng" : "Tạm hết hàng"}</span>
      <button className="wishlist-button" type="button" aria-label={`Thêm ${product.name} vào yêu thích`}>♡</button>
    </div>
    <div className="catalog-card-body">
      <p className="catalog-category">{product.category}</p>
      <h2>{product.name}</h2>
      <Rating rating={product.rating} reviewCount={product.reviewCount} />
      <div className="catalog-price"><strong>{formatPrice(product.price)}</strong><del>{formatPrice(product.oldPrice)}</del></div>
      <div className="catalog-actions">
        <Link className="detail-button" href={`/products/${product.id}`}>Xem chi tiết</Link>
        <button className="catalog-cart-button" type="button" disabled={!product.inStock} aria-label={`Thêm ${product.name} vào giỏ hàng`}>＋</button>
      </div>
    </div>
  </article>;
}

export default function ProductsPage() {
  const [category, setCategory] = useState(categories[0]);
  const [priceRange, setPriceRange] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState<SortOption>("featured");

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const categoryMatches = category === categories[0] || product.category === category;
      const priceMatches = priceRange === "all" || (priceRange === "under-6" ? product.price < 6000000 : priceRange === "6-to-10" ? product.price >= 6000000 && product.price <= 10000000 : product.price > 10000000);
      const availabilityMatches = availability === "all" || (availability === "in-stock" ? product.inStock : !product.inStock);
      return categoryMatches && priceMatches && availabilityMatches;
    });

    return [...filtered].sort((first, second) => sort === "price-asc" ? first.price - second.price : sort === "price-desc" ? second.price - first.price : sort === "rating" ? second.rating - first.rating : 0);
  }, [availability, category, priceRange, sort]);

  return <div className="catalog-page">
    <header className="catalog-hero"><div><p className="eyebrow">BỘ SƯU TẬP ERGOCHAIR</p><h1>Ghế công thái học<br /><em>cho nhịp sống hiện đại.</em></h1><p>Khám phá những thiết kế nâng đỡ cơ thể và tạo cảm hứng cho từng ngày làm việc.</p></div><span className="catalog-hero-mark">08<br /><small>THIẾT KẾ</small></span></header>
    <main className="catalog-main">
      <div className="catalog-toolbar"><p><strong>{visibleProducts.length}</strong> sản phẩm</p><label>Sắp xếp <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}><option value="featured">Nổi bật nhất</option><option value="price-asc">Giá thấp đến cao</option><option value="price-desc">Giá cao đến thấp</option><option value="rating">Đánh giá cao nhất</option></select></label></div>
      <div className="catalog-layout"><aside className="catalog-filters"><div className="filter-heading"><h2>Lọc sản phẩm</h2><button type="button" onClick={() => { setCategory(categories[0]); setPriceRange("all"); setAvailability("all"); }}>Xóa lọc</button></div><fieldset><legend>Loại ghế</legend>{categories.map((item) => <label className="filter-option" key={item}><input type="radio" name="category" checked={category === item} onChange={() => setCategory(item)} />{item}</label>)}</fieldset><fieldset><legend>Khoảng giá</legend><label className="filter-option"><input type="radio" name="price" checked={priceRange === "all"} onChange={() => setPriceRange("all")} />Tất cả mức giá</label><label className="filter-option"><input type="radio" name="price" checked={priceRange === "under-6"} onChange={() => setPriceRange("under-6")} />Dưới 6 triệu</label><label className="filter-option"><input type="radio" name="price" checked={priceRange === "6-to-10"} onChange={() => setPriceRange("6-to-10")} />6 - 10 triệu</label><label className="filter-option"><input type="radio" name="price" checked={priceRange === "over-10"} onChange={() => setPriceRange("over-10")} />Trên 10 triệu</label></fieldset><fieldset><legend>Tình trạng</legend><label className="filter-option"><input type="radio" name="stock" checked={availability === "all"} onChange={() => setAvailability("all")} />Tất cả sản phẩm</label><label className="filter-option"><input type="radio" name="stock" checked={availability === "in-stock"} onChange={() => setAvailability("in-stock")} />Còn hàng</label><label className="filter-option"><input type="radio" name="stock" checked={availability === "sold-out"} onChange={() => setAvailability("sold-out")} />Tạm hết hàng</label></fieldset></aside><section className="catalog-results" aria-live="polite">{visibleProducts.length > 0 ? visibleProducts.map((product) => <ProductCard key={product.id} product={product} />) : <div className="empty-results"><h2>Không tìm thấy sản phẩm</h2><p>Thử thay đổi bộ lọc để xem thêm lựa chọn.</p></div>}</section></div>
    </main>
  </div>;
}