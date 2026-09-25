"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { ProductSearch } from "@/components/product-search";
import { formatPrice, products, type Product } from "@/lib/products";
import { normalizeSearchText } from "@/lib/search";

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

function ProductCard({ product, index = 0, onAdded }: { product: Product; index?: number; onAdded: (name: string) => void }) {
  const router = useRouter();
  const { addItem } = useCart();
  const salePercent = Math.round((1 - product.price / product.oldPrice) * 100);
  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    addItem(product);
    onAdded(product.name);
  };
  const handleBuyNow = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    addItem(product);
    router.push("/cart");
  };
  return <article className="catalog-card catalog-card-premium" data-reveal="up" data-reveal-delay={String((index % 6) * 70)} suppressHydrationWarning>
    <div className="catalog-image-wrapper">
      <Link className="catalog-image catalog-image-premium" href={`/products/${product.id}`}>
        <img src={product.image} alt={product.name} />
        {!product.inStock && <span className="catalog-sold-out">Tạm hết hàng</span>}
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
      <div className="catalog-cta">
        {product.inStock ? (
          <>
            <button className="catalog-add-button" type="button" onClick={handleAddToCart} aria-label={`Thêm ${product.name} vào giỏ hàng`}>
              Thêm vào giỏ
            </button>
            <button className="catalog-buy-button" type="button" onClick={handleBuyNow} aria-label={`Mua ngay ${product.name}`}>
              Mua ngay
            </button>
          </>
        ) : (
          <Link href={`/products/${product.id}`} className="catalog-view-detail-btn" aria-label={`Xem chi tiết ${product.name}`}>
            Xem chi tiết <span>→</span>
          </Link>
        )}
      </div>
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
  const initialCategory = categories.includes(requestedCategory ?? "") ? (requestedCategory ?? categories[0]) : categories[0];
  const initialSearch = searchParams.get("search")?.trim() ?? "";
  const initialPrice = searchParams.get("price") ?? "all";
  const initialStock = searchParams.get("stock") ?? "all";
  const initialSort = (searchParams.get("sort") as SortOption) ?? "featured";

  const [category, setCategory] = useState(initialCategory);
  const [searchKeyword, setSearchKeyword] = useState(initialSearch);
  const [priceRange, setPriceRange] = useState(initialPrice);
  const [availability, setAvailability] = useState(initialStock);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, setToast] = useState("");
  const { itemCount } = useCart();

  const normalizedSearch = normalizeSearchText(searchKeyword);
  const isInitialMount = useRef(true);
  const prevCategoryRef = useRef(initialCategory);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollAnimRef = useRef<number | null>(null);

  // Silky smooth, gentle slow scrolling with cubic easing
  const slowSmoothScrollTo = (targetY: number, duration = 900) => {
    if (typeof window === "undefined") return;
    if (scrollAnimRef.current) {
      cancelAnimationFrame(scrollAnimRef.current);
      scrollAnimRef.current = null;
    }

    const startY = window.pageYOffset || document.documentElement.scrollTop;
    const distance = targetY - startY;
    if (Math.abs(distance) < 4) return;

    const originalScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";

    const startTime = performance.now();

    const easeInOutCubic = (t: number) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const cleanup = () => {
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
      window.removeEventListener("wheel", cancelScroll);
      window.removeEventListener("touchstart", cancelScroll);
    };

    const cancelScroll = () => {
      if (scrollAnimRef.current) {
        cancelAnimationFrame(scrollAnimRef.current);
        scrollAnimRef.current = null;
      }
      cleanup();
    };

    window.addEventListener("wheel", cancelScroll, { passive: true });
    window.addEventListener("touchstart", cancelScroll, { passive: true });

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);

      window.scrollTo(0, Math.round(startY + distance * eased));

      if (progress < 1) {
        scrollAnimRef.current = requestAnimationFrame(step);
      } else {
        scrollAnimRef.current = null;
        cleanup();
      }
    };

    scrollAnimRef.current = requestAnimationFrame(step);
  };

  const scrollToProducts = (delay = 350) => {
    if (typeof window === "undefined") return;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      const target = document.getElementById("catalog-products") || document.querySelector(".catalog-main");
      if (target) {
        const headerOffset = window.innerWidth <= 800 ? 76 : 94;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        slowSmoothScrollTo(Math.max(0, offsetPosition), 900);
      }
    }, delay);
  };

  // Auto scroll down to products after short delay if landing with a category selected
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const initialCat = normalizeCategory(searchParams.get("category"));
      if (initialCat && initialCat !== categories[0] && categories.includes(initialCat)) {
        scrollToProducts(450);
      }
    }
  }, [searchParams]);

  // Listen for custom trigger to scroll to products
  useEffect(() => {
    const handleScrollEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ delay?: number }>;
      scrollToProducts(customEvent.detail?.delay ?? 200);
    };
    window.addEventListener("scroll-to-products", handleScrollEvent);
    return () => {
      window.removeEventListener("scroll-to-products", handleScrollEvent);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    };
  }, []);

  // Sync state when URL searchParams changes externally (e.g. Navigation from Header)
  useEffect(() => {
    const cat = normalizeCategory(searchParams.get("category"));
    const validCat = categories.includes(cat ?? "") ? (cat ?? categories[0]) : categories[0];
    const s = searchParams.get("search")?.trim() ?? "";
    const p = searchParams.get("price") ?? "all";
    const st = searchParams.get("stock") ?? "all";
    const so = (searchParams.get("sort") as SortOption) ?? "featured";

    if (!isInitialMount.current && prevCategoryRef.current !== validCat) {
      prevCategoryRef.current = validCat;
      if (validCat !== categories[0]) {
        scrollToProducts(250);
      }
    }

    setCategory(validCat);
    setSearchKeyword(s);
    setPriceRange(p);
    setAvailability(st);
    setSort(so);
  }, [searchParams]);

  // Sync state on browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const cat = normalizeCategory(params.get("category"));
      const validCat = categories.includes(cat ?? "") ? (cat ?? categories[0]) : categories[0];
      const s = params.get("search")?.trim() ?? "";
      const p = params.get("price") ?? "all";
      const st = params.get("stock") ?? "all";
      const so = (params.get("sort") as SortOption) ?? "featured";

      if (prevCategoryRef.current !== validCat) {
        prevCategoryRef.current = validCat;
        if (validCat !== categories[0]) {
          scrollToProducts(250);
        }
      }

      setCategory(validCat);
      setSearchKeyword(s);
      setPriceRange(p);
      setAvailability(st);
      setSort(so);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Update browser URL query params quietly without triggering Next.js page reload or scroll-to-top
  const updateUrlParams = (
    newCategory: string,
    newSearch: string,
    newPrice: string,
    newStock: string,
    newSort: string
  ) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (newCategory && newCategory !== categories[0]) {
      url.searchParams.set("category", newCategory);
    } else {
      url.searchParams.delete("category");
    }
    if (newSearch) {
      url.searchParams.set("search", newSearch);
    } else {
      url.searchParams.delete("search");
    }
    if (newPrice && newPrice !== "all") {
      url.searchParams.set("price", newPrice);
    } else {
      url.searchParams.delete("price");
    }
    if (newStock && newStock !== "all") {
      url.searchParams.set("stock", newStock);
    } else {
      url.searchParams.delete("stock");
    }
    if (newSort && newSort !== "featured") {
      url.searchParams.set("sort", newSort);
    } else {
      url.searchParams.delete("sort");
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  };

  const handleCategoryChange = (newCategory: string) => {
    prevCategoryRef.current = newCategory;
    setCategory(newCategory);
    updateUrlParams(newCategory, searchKeyword, priceRange, availability, sort);
    if (newCategory !== categories[0]) {
      scrollToProducts(200);
    }
  };

  const handlePriceRangeChange = (newPrice: string) => {
    setPriceRange(newPrice);
    updateUrlParams(category, searchKeyword, newPrice, availability, sort);
  };

  const handleAvailabilityChange = (newStock: string) => {
    setAvailability(newStock);
    updateUrlParams(category, searchKeyword, priceRange, newStock, sort);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    updateUrlParams(category, searchKeyword, priceRange, availability, newSort);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearchKeyword(newSearch);
    updateUrlParams(category, newSearch, priceRange, availability, sort);
  };

  const resetFilters = () => { 
    setCategory(categories[0]);
    setPriceRange("all"); 
    setAvailability("all");
    setSort("featured");
    updateUrlParams(categories[0], searchKeyword, "all", "all", "featured");
  };

  const clearSearch = () => {
    setSearchKeyword("");
    updateUrlParams(category, "", priceRange, availability, sort);
  };

  const showToast = (name: string) => { setToast(`${name} đã được thêm vào giỏ hàng`); window.setTimeout(() => setToast(""), 2400); };
  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const searchMatches = !normalizedSearch || [product.name, product.category, product.description, product.material, product.color].some((field) => normalizeSearchText(field).includes(normalizedSearch));
      const categoryMatches = category === categories[0] || product.category === category;
      const priceMatches = priceRange === "all" || (priceRange === "under-6" ? product.price < 6000000 : priceRange === "6-to-10" ? product.price >= 6000000 && product.price <= 10000000 : product.price > 10000000);
      const availabilityMatches = availability === "all" || (availability === "in-stock" ? product.inStock : !product.inStock);
      return searchMatches && categoryMatches && priceMatches && availabilityMatches;
    });
    return [...filtered].sort((first, second) => sort === "price-asc" ? first.price - second.price : sort === "price-desc" ? second.price - first.price : sort === "rating" ? second.rating - first.rating : 0);
  }, [availability, category, normalizedSearch, priceRange, sort]);

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
    <header className="catalog-header"><Link className="logo" href="/"><span className="logo-mark">e</span> ErgoChair</Link><nav><Link href="/">Trang chủ</Link><Link scroll={false} className="active" href="/products">Sản phẩm</Link><div ref={categoryDropdownRef} className={`nav-dropdown ${categoryDropdownOpen ? "open" : ""}`} onMouseEnter={() => setCategoryDropdownOpen(true)} onMouseLeave={() => setCategoryDropdownOpen(false)}><button type="button" className="nav-dropdown-toggle" onClick={() => setCategoryDropdownOpen((prev) => !prev)} aria-expanded={categoryDropdownOpen}>Danh mục <span className="dropdown-arrow">▼</span></button><div className="nav-dropdown-menu">{categoryDropdownItems.map((cat) => <button key={cat} type="button" className="nav-dropdown-item" onClick={() => { handleCategoryChange(cat); setCategoryDropdownOpen(false); }}>{cat}</button>)}</div></div><Link href="/#about">Về chúng tôi</Link></nav><div className="catalog-header-actions"><ProductSearch key={searchKeyword} inputId="catalog-product-search-input" onSearch={handleSearchChange} /><Link className="catalog-cart" href="/cart" aria-label="Giỏ hàng"><span aria-hidden="true">⌑</span>{itemCount > 0 && <b key={itemCount}>{itemCount}</b>}</Link><Link className="catalog-shop-link" href="/products">Mua sắm</Link></div></header>
    <div className="catalog-breadcrumb" data-reveal="fade" suppressHydrationWarning><Link href="/">Trang chủ</Link><span>/</span><strong>Sản phẩm</strong></div>
    <header className="catalog-hero catalog-hero-premium" data-reveal="up" suppressHydrationWarning><div><p className="eyebrow">{searchKeyword ? "TÌM KIẾM SẢN PHẨM" : "BỘ SƯU TẬP ERGOCHAIR / 2026"}</p><h1>{searchKeyword ? <>Kết quả tìm kiếm<br /><em>cho “{searchKeyword}”.</em></> : <>{meta.title}<br /><em>{meta.emoji}</em></>}</h1><p>{searchKeyword ? `${visibleProducts.length} sản phẩm phù hợp với từ khóa của bạn.` : meta.description}</p></div><div className="catalog-hero-count" data-reveal="scale" data-reveal-delay="120" suppressHydrationWarning><strong>{visibleProducts.length}</strong><span>sản phẩm<br />được tuyển chọn</span></div></header>
    <main id="catalog-products" className="catalog-main catalog-main-premium">
      <div className="catalog-toolbar catalog-toolbar-premium" data-reveal="fade" suppressHydrationWarning><p><strong>{visibleProducts.length}</strong> sản phẩm {searchKeyword && <button className="catalog-clear-search" type="button" onClick={clearSearch}>Xóa tìm kiếm</button>}</p><button className="catalog-filter-toggle" type="button" onClick={() => setFiltersOpen(!filtersOpen)}>Bộ lọc <span>{filtersOpen ? "−" : "+"}</span></button><label>Sắp xếp <select value={sort} onChange={(event) => handleSortChange(event.target.value as SortOption)}><option value="featured">Nổi bật nhất</option><option value="price-asc">Giá thấp đến cao</option><option value="price-desc">Giá cao đến thấp</option><option value="rating">Đánh giá cao nhất</option></select></label></div>
      <div className={`catalog-layout catalog-layout-premium ${filtersOpen ? "filters-visible" : ""}`}><Filters category={category} setCategory={handleCategoryChange} priceRange={priceRange} setPriceRange={handlePriceRangeChange} availability={availability} setAvailability={handleAvailabilityChange} resetFilters={resetFilters} setFiltersOpen={setFiltersOpen} /><section className="catalog-results catalog-results-premium" aria-live="polite">{visibleProducts.length > 0 ? visibleProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} onAdded={showToast} />) : <div className="empty-results" data-reveal="scale" suppressHydrationWarning><h2>Không tìm thấy sản phẩm</h2><p>{searchKeyword ? "Hãy thử từ khóa khác hoặc xem toàn bộ sản phẩm." : "Hãy thử thay đổi bộ lọc hoặc khoảng giá."}</p><button className="button button-dark" type="button" onClick={searchKeyword ? clearSearch : resetFilters}>{searchKeyword ? "Xóa tìm kiếm" : "Xóa bộ lọc"} <span>→</span></button>{searchKeyword && <button type="button" className="text-link" onClick={() => { clearSearch(); resetFilters(); }}>Xem tất cả sản phẩm</button>}</div>}</section></div>
    </main>
    {toast && <div className="cart-toast" role="status">Đã thêm sản phẩm vào giỏ hàng</div>}
  </div>;
}

export default function ProductsPage() {
  return <Suspense fallback={<main className="catalog-page catalog-page-premium" aria-busy="true" />}><ProductsPageContent /></Suspense>;
}
