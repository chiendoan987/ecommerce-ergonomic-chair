"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { formatPrice, products, type Product } from "@/lib/products";

type SortOption = "featured" | "price-asc" | "price-desc" | "rating";

const normalizeCategory = (value: string | null | undefined) => {
  const normalizedValue = value ?? "";
  if (normalizedValue === "Ghế lưng lưới") return "Ghế công thái học";
  if (normalizedValue === "Ghế cao cấp" || normalizedValue === "Phụ kiện") return "Ghế lãnh đạo";
  return normalizedValue;
};

const categories = ["Tất cả loại ghế", "Ghế công thái học", "Ghế văn phòng", "Ghế gaming", "Ghế lãnh đạo"];

const categoryMeta: Record<string, { title: string; emoji: string; description: string }> = {
  "Tất cả loại ghế": {
    title: "Ghế công thái học",
    emoji: "cho nhịp sống hiện đại.",
    description: "Khám phá những thiết kế được tạo ra để mang lại sự thoải mái và hỗ trợ tốt hơn trong từng giờ làm việc.",
  },
  "Ghế công thái học": {
    title: "Ghế công thái học",
    emoji: "thoáng khí và nhẹ nhàng.",
    description: "Thiết kế hỗ trợ tốt cho tư thế ngồi trong suốt cả ngày, kết hợp sự thoáng khí và độ chắc chắn tối ưu.",
  },
  "Ghế văn phòng": {
    title: "Ghế văn phòng",
    emoji: "đồng hành cùng công việc.",
    description: "Thiết kế ergonomic để bạn tập trung tốt nhất, ngồi thoải mái suốt ngày làm việc tại văn phòng.",
  },
  "Ghế gaming": {
    title: "Ghế gaming",
    emoji: "hiệu năng tối đa.",
    description: "Ghế chuyên biệt cho những phiên gaming dài, với hỗ trợ lưng và tay vịn tối ưu.",
  },
  "Ghế lãnh đạo": {
    title: "Ghế lãnh đạo",
    emoji: "sang trọng và tinh tế.",
    description: "Phiên bản premium với chất liệu tốt nhất, dành cho những không gian làm việc đẳng cấp.",
  },
};

function Rating({ rating, reviewCount }: Pick<Product, "rating" | "reviewCount">) {
  return <div className="catalog-rating"><span>★★★★★</span><strong>{rating.toFixed(1)}</strong><small>({reviewCount})</small></div>;
}

function ProductCard({ product, onAdded }: { product: Product; onAdded: (name: string) => void }) {
  const { addItem } = useCart();
  const salePercent = Math.round((1 - product.price / product.oldPrice) * 100);
  return <article className="catalog-card catalog-card-premium">
    <div className="catalog-image-wrapper">
      <Link className="catalog-image catalog-image-premium" href={`/products/${product.id}`}>
        <img src={product.image} alt={product.name} />
      </Link>
      {product.inStock && <span className="catalog-discount-badge">{-salePercent}%</span>}
      <button 
        className="catalog-wishlist-button" 
        type="button" 
        aria-label="Thêm vào danh sách yêu thích"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        ♡
      </button>
      {!product.inStock && <div className="catalog-sold-out">Tạm hết hàng</div>}
    </div>
    <div className="catalog-card-body">
      <p className="catalog-category">{product.category}</p>
      <Link href={`/products/${product.id}`} className="catalog-card-title-link"><h2>{product.name}</h2></Link>
      <Rating rating={product.rating} reviewCount={product.reviewCount} />
      <div className="catalog-price-section">
        <div className="catalog-price">
          <strong>{formatPrice(product.price)}</strong>
          <del>{formatPrice(product.oldPrice)}</del>
        </div>
      </div>
      <button 
        className="catalog-add-button" 
        type="button" 
        disabled={!product.inStock} 
        onClick={() => { addItem(product); onAdded(product.name); }} 
        aria-label={`Thêm ${product.name} vào giỏ hàng`}
      >
        {product.inStock ? "Thêm vào giỏ hàng" : "Hết hàng"}
      </button>
    </div>
  </article>;
}

function Filters({ 
  category, 
  setCategory, 
  priceRange, 
  setPriceRange, 
  availability, 
  setAvailability, 
  resetFilters,
  setFiltersOpen 
}: { 
  category: string; 
  setCategory: (value: string) => void; 
  priceRange: string; 
  setPriceRange: (value: string) => void; 
  availability: string; 
  setAvailability: (value: string) => void; 
  resetFilters: () => void;
  setFiltersOpen: (value: boolean) => void;
}) {
  const handleCategoryChange = (item: string) => {
    setCategory(item);
    setFiltersOpen(false);
  };

  return <aside className="catalog-filters catalog-filters-premium">
    <div className="filter-heading">
      <h2>Bộ lọc</h2>
      <button type="button" className="reset-filters-btn" onClick={resetFilters}>Xóa tất cả</button>
    </div>
    <fieldset className="filter-section">
      <legend>Danh mục</legend>
      {categories.map((item) => (
        <label className="filter-option" key={item}>
          <input 
            type="radio" 
            name="category" 
            checked={category === item} 
            onChange={() => handleCategoryChange(item)} 
          />
          <span>{item}</span>
        </label>
      ))}
    </fieldset>
    <fieldset className="filter-section">
      <legend>Khoảng giá</legend>
      <label className="filter-option">
        <input 
          type="radio" 
          name="price" 
          checked={priceRange === "all"} 
          onChange={() => setPriceRange("all")} 
        />
        <span>Tất cả mức giá</span>
      </label>
      <label className="filter-option">
        <input 
          type="radio" 
          name="price" 
          checked={priceRange === "under-6"} 
          onChange={() => setPriceRange("under-6")} 
        />
        <span>Dưới 6 triệu</span>
      </label>
      <label className="filter-option">
        <input 
          type="radio" 
          name="price" 
          checked={priceRange === "6-to-10"} 
          onChange={() => setPriceRange("6-to-10")} 
        />
        <span>6 - 10 triệu</span>
      </label>
      <label className="filter-option">
        <input 
          type="radio" 
          name="price" 
          checked={priceRange === "over-10"} 
          onChange={() => setPriceRange("over-10")} 
        />
        <span>Trên 10 triệu</span>
      </label>
    </fieldset>
    <fieldset className="filter-section">
      <legend>Tình trạng</legend>
      <label className="filter-option">
        <input 
          type="radio" 
          name="stock" 
          checked={availability === "all"} 
          onChange={() => setAvailability("all")} 
        />
        <span>Tất cả sản phẩm</span>
      </label>
      <label className="filter-option">
        <input 
          type="radio" 
          name="stock" 
          checked={availability === "in-stock"} 
          onChange={() => setAvailability("in-stock")} 
        />
        <span>Còn hàng</span>
      </label>
      <label className="filter-option">
        <input 
          type="radio" 
          name="stock" 
          checked={availability === "sold-out"} 
          onChange={() => setAvailability("sold-out")} 
        />
        <span>Tạm hết hàng</span>
      </label>
    </fieldset>
  </aside>;
}

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCategory = normalizeCategory(searchParams.get("category"));
  const category = categories.includes(requestedCategory ?? "") ? (requestedCategory ?? categories[0]) : categories[0];

  const [priceRange, setPriceRange] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState<SortOption>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, setToast] = useState("");
  const { itemCount } = useCart();

  const handleCategoryChange = (newCategory: string) => {
    if (newCategory !== categories[0]) {
      router.push(`/products?category=${encodeURIComponent(newCategory)}`);
    } else {
      router.push("/products");
    }
  };

  const resetFilters = () => { 
    setPriceRange("all"); 
    setAvailability("all");
    router.push("/products");
  };

  const showToast = (name: string) => { setToast(`${name} đã được thêm vào giỏ hàng`); window.setTimeout(() => setToast(""), 2400); };
  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const categoryMatches = category === categories[0] || product.category === category;
      const priceMatches = priceRange === "all" || (priceRange === "under-6" ? product.price < 6000000 : priceRange === "6-to-10" ? product.price >= 6000000 && product.price <= 10000000 : product.price > 10000000);
      const availabilityMatches = availability === "all" || (availability === "in-stock" ? product.inStock : !product.inStock);
      return categoryMatches && priceMatches && availabilityMatches;
    });
    return [...filtered].sort((first, second) => sort === "price-asc" ? first.price - second.price : sort === "price-desc" ? second.price - first.price : sort === "rating" ? second.rating - first.rating : 0);
  }, [availability, category, priceRange, sort]);

  const meta = categoryMeta[category] || categoryMeta["Tất cả loại ghế"];

  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!categoryDropdownOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(target)) {
        setCategoryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [categoryDropdownOpen]);

  const categoryDropdownItems = categories.filter(c => c !== categories[0]);

  return <div className="catalog-page catalog-page-premium">
    <header className="catalog-header"><Link className="logo" href="/"><span className="logo-mark">e</span> ErgoChair</Link><nav><Link href="/">Trang chủ</Link><Link className="active" href="/products">Sản phẩm</Link><div ref={categoryDropdownRef} className={`nav-dropdown ${categoryDropdownOpen ? "open" : ""}`} onMouseEnter={() => setCategoryDropdownOpen(true)} onMouseLeave={() => setCategoryDropdownOpen(false)}><button type="button" className="nav-dropdown-toggle" onClick={() => setCategoryDropdownOpen((prev) => !prev)} aria-expanded={categoryDropdownOpen}>Danh mục <span className="dropdown-arrow">▼</span></button><div className="nav-dropdown-menu">{categoryDropdownItems.map((cat) => <button key={cat} type="button" className="nav-dropdown-item" onClick={() => { handleCategoryChange(cat); setCategoryDropdownOpen(false); }}>{cat}</button>)}</div></div><Link href="/#about">Về chúng tôi</Link></nav><div className="catalog-header-actions"><button type="button" aria-label="Tìm kiếm"><span aria-hidden="true">⌕</span></button><Link className="catalog-cart" href="/cart" aria-label="Giỏ hàng"><span aria-hidden="true">⌑</span>{itemCount > 0 && <b key={itemCount}>{itemCount}</b>}</Link><Link className="catalog-shop-link" href="/products">Mua sắm</Link></div></header>
    <div className="catalog-breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><strong>Sản phẩm</strong></div>
    <header className="catalog-hero catalog-hero-premium"><div><p className="eyebrow">BỘ SƯU TẬP ERGOCHAIR / 2026</p><h1>{meta.title}<br /><em>{meta.emoji}</em></h1><p>{meta.description}</p></div><div className="catalog-hero-count"><strong>{visibleProducts.length}</strong><span>sản phẩm<br />được tuyển chọn</span></div></header>
    <main className="catalog-main catalog-main-premium">
      <div className="catalog-toolbar catalog-toolbar-premium"><p><strong>{visibleProducts.length}</strong> sản phẩm</p><button className="catalog-filter-toggle" type="button" onClick={() => setFiltersOpen(!filtersOpen)}>Bộ lọc <span>{filtersOpen ? "−" : "+"}</span></button><label>Sắp xếp <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}><option value="featured">Nổi bật nhất</option><option value="price-asc">Giá thấp đến cao</option><option value="price-desc">Giá cao đến thấp</option><option value="rating">Đánh giá cao nhất</option></select></label></div>
      <div className={`catalog-layout catalog-layout-premium ${filtersOpen ? "filters-visible" : ""}`}><Filters category={category} setCategory={handleCategoryChange} priceRange={priceRange} setPriceRange={setPriceRange} availability={availability} setAvailability={setAvailability} resetFilters={resetFilters} setFiltersOpen={setFiltersOpen} /><section className="catalog-results catalog-results-premium" aria-live="polite">{visibleProducts.length > 0 ? visibleProducts.map((product) => <ProductCard key={product.id} product={product} onAdded={showToast} />) : <div className="empty-results"><h2>Không tìm thấy sản phẩm</h2><p>Hãy thử thay đổi bộ lọc hoặc khoảng giá.</p><button className="button button-dark" type="button" onClick={resetFilters}>Xóa bộ lọc <span>→</span></button></div>}</section></div>
    </main>
    {toast && <div className="cart-toast" role="status">Đã thêm sản phẩm vào giỏ hàng</div>}
  </div>;
}

export default function ProductsPage() {
  return <Suspense fallback={<main className="catalog-page catalog-page-premium" aria-busy="true" />}><ProductsPageContent /></Suspense>;
}
