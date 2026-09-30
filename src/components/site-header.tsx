"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth";
import { ProductSearch } from "@/components/product-search";

function Icon({ name }: { name: "search" | "bag" | "menu" | "close" | "chevron" | "heart" | "user" }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
    bag: <><path d="M6 8h12l1 12H5L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
    user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
    close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
  };
  return <svg aria-hidden="true" className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function SiteHeader() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { setMenuOpen(false); setCategoriesOpen(false); }, 0);
    return () => {
      window.clearTimeout(timer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pathname]);

  const isActive = (route: string) => route === "/" ? pathname === "/" : pathname.startsWith(route);
  const closeMenus = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMenuOpen(false);
    setCategoriesOpen(false);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCategoriesOpen(true);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setCategoriesOpen(false);
    }, 180);
  };

  const handleCategoryClick = () => {
    closeMenus();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("scroll-to-products", { detail: { delay: 300 } }));
    }
  };

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return <header className={`site-header global-header ${isScrolled ? "is-scrolled" : ""}`}>
    <Link className="logo" href="/" onClick={closeMenus}><span className="logo-mark">e</span> ErgoChair</Link>
    <nav className={menuOpen ? "open" : ""} aria-label="Điều hướng chính">
      <Link className={isActive("/") ? "active" : ""} href="/" onClick={closeMenus}>Trang chủ</Link>
      <Link className={isActive("/products") ? "active" : ""} href="/products" onClick={closeMenus}>Sản phẩm</Link>
      <div
        className={`nav-dropdown ${categoriesOpen ? "open" : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          type="button"
          aria-expanded={categoriesOpen}
          onClick={() => setCategoriesOpen(!categoriesOpen)}
        >
          Danh mục <Icon name="chevron" />
        </button>
        <div className="nav-dropdown-menu">
          <Link scroll={false} href="/products?category=Ghế+công+thái+học" onClick={handleCategoryClick}>Ghế công thái học</Link>
          <Link scroll={false} href="/products?category=Ghế+văn+phòng" onClick={handleCategoryClick}>Ghế văn phòng</Link>
          <Link scroll={false} href="/products?category=Ghế+gaming" onClick={handleCategoryClick}>Ghế gaming</Link>
          <Link scroll={false} href="/products?category=Ghế+lãnh+đạo" onClick={handleCategoryClick}>Ghế lãnh đạo</Link>
        </div>
      </div>
      <Link className={isActive("/about") ? "active" : ""} href="/about" onClick={closeMenus}>Về chúng tôi</Link>
      <Link className={isActive("/contact") ? "active" : ""} href="/contact" onClick={closeMenus}>Liên hệ</Link>
      {user?.role === "admin" && (
        <Link className="admin-portal-shortcut" href="/admin" onClick={closeMenus} style={{ color: "#d97706", fontWeight: 600 }}>
          ⚙️ Quản trị
        </Link>
      )}
      <div className="mobile-nav-auth">
        {isAuthenticated ? (
          <Link className={isActive("/account") ? "active" : ""} href="/account" onClick={closeMenus}>
            Tài khoản ({user?.fullName})
          </Link>
        ) : (
          <Link className={isActive("/login") ? "active" : ""} href="/login" onClick={closeMenus}>
            Đăng nhập / Đăng ký
          </Link>
        )}
      </div>
    </nav>
    <div className="header-actions">
      <Suspense fallback={<span className="product-search-placeholder" aria-hidden="true" />}>
        <ProductSearch inputId="global-product-search-input" />
      </Suspense>
      <Link className="wishlist-header-link" href="/wishlist" aria-label="Danh sách yêu thích">
        <Icon name="heart" />
        {wishlistCount > 0 && <span key={wishlistCount}>{wishlistCount}</span>}
      </Link>
      <Link
        className={`header-user-btn ${isAuthenticated ? "is-logged-in" : ""}`}
        href={isAuthenticated ? "/account" : "/login"}
        aria-label={isAuthenticated ? "Tài khoản của tôi" : "Đăng nhập"}
        title={isAuthenticated ? user?.fullName : "Đăng nhập"}
      >
        <Icon name="user" />
        {isAuthenticated && user && (
          <span className="user-short-name">{user.fullName.trim().split(" ").slice(-1)[0]}</span>
        )}
      </Link>
      <Link className="cart" href="/cart" aria-label="Giỏ hàng">
        <Icon name="bag" />
        {itemCount > 0 && <span key={itemCount}>{itemCount}</span>}
      </Link>
      <button className="mobile-menu" type="button" aria-label={menuOpen ? "Đóng menu" : "Mở menu"} onClick={() => setMenuOpen(!menuOpen)}>
        <Icon name={menuOpen ? "close" : "menu"} />
      </button>
    </div>
  </header>;
}
