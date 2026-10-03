"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth";

function Icon({ name }: { name: "user" | "cart" | "bag" | "chevron" | "menu" | "close" | "heart" }) {
  const paths = {
    user: (
      <>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    cart: (
      <>
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.5 2.5h3l2.4 11.5a2 2 0 0 0 2 1.6h9.6a2 2 0 0 0 2-1.6l1.6-7.5H6.2" />
      </>
    ),
    bag: (
      <>
        <path d="M6 8h12l1 12H5L6 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </>
    ),
    heart: (
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    ),
    chevron: <path d="m6 9 6 6 6-6" />,
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
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
          setIsScrolled(window.scrollY > 15);
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
    const timer = window.setTimeout(() => {
      setMenuOpen(false);
      setCategoriesOpen(false);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pathname]);

  const isActive = (route: string) => (route === "/" ? pathname === "/" : pathname.startsWith(route));

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

  return (
    <div className={`site-header-wrapper ${isScrolled ? "is-scrolled" : ""}`}>
      <header className="site-header global-header minimal-brand-header">
        <div className="header-primary-group">
          {/* Logo with rounded warm mocha badge */}
          <Link className="logo" href="/" onClick={closeMenus}>
            <span className="logo-mark" aria-hidden="true">e</span>
            <span className="logo-text">ErgoChair</span>
          </Link>

          {/* Primary Navigation Links */}
          <nav className={`header-nav ${menuOpen ? "open" : ""}`} aria-label="Điều hướng chính">
            <Link
              className={`nav-item-link ${isActive("/") ? "active" : ""}`}
              href="/"
              onClick={closeMenus}
            >
              Trang chủ
            </Link>
            <Link
              className={`nav-item-link ${isActive("/products") ? "active" : ""}`}
              href="/products"
              onClick={closeMenus}
            >
              Sản phẩm
            </Link>

            {/* Dropdown Danh mục */}
            <div
              className={`nav-dropdown ${categoriesOpen ? "open" : ""}`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                className="nav-dropdown-btn"
                aria-expanded={categoriesOpen}
                onClick={() => setCategoriesOpen(!categoriesOpen)}
              >
                <span>Danh mục</span>
                <span className="dropdown-chevron"><Icon name="chevron" /></span>
              </button>
              <div className="nav-dropdown-menu">
                <Link scroll={false} href="/products?category=Ghế+công+thái+học" onClick={handleCategoryClick}>
                  Ghế công thái học
                </Link>
                <Link scroll={false} href="/products?category=Ghế+văn+phòng" onClick={handleCategoryClick}>
                  Ghế văn phòng
                </Link>
                <Link scroll={false} href="/products?category=Ghế+gaming" onClick={handleCategoryClick}>
                  Ghế gaming
                </Link>
                <Link scroll={false} href="/products?category=Ghế+lãnh+đạo" onClick={handleCategoryClick}>
                  Ghế lãnh đạo
                </Link>
              </div>
            </div>

            <Link
              className={`nav-item-link ${isActive("/about") ? "active" : ""}`}
              href="/about"
              onClick={closeMenus}
            >
              Về chúng tôi
            </Link>
            <Link
              className={`nav-item-link ${isActive("/contact") ? "active" : ""}`}
              href="/contact"
              onClick={closeMenus}
            >
              Liên hệ
            </Link>

            {user?.role === "admin" && (
              <Link
                className="nav-item-link admin-nav-shortcut"
                href="/admin"
                onClick={closeMenus}
                style={{ color: "#d97706", fontWeight: 600 }}
              >
                ⚙️ Quản trị
              </Link>
            )}

            {/* Mobile Auth and Extras */}
            <div className="mobile-nav-auth">
              {isAuthenticated ? (
                <Link className="nav-item-link" href="/account" onClick={closeMenus}>
                  Tài khoản ({user?.fullName ? user.fullName.trim().split(/\s+/).slice(-1)[0] : "Tôi"})
                </Link>
              ) : (
                <div className="mobile-auth-links">
                  <Link className="nav-item-link" href="/login" onClick={closeMenus}>
                    Đăng nhập
                  </Link>
                  <Link className="nav-item-link" href="/register" onClick={closeMenus}>
                    Đăng ký tài khoản
                  </Link>
                </div>
              )}
              {wishlistCount > 0 && (
                <Link className="nav-item-link" href="/wishlist" onClick={closeMenus}>
                  Yêu thích ({wishlistCount})
                </Link>
              )}
            </div>
          </nav>
        </div>

        {/* Right utility actions: Auth & Giỏ hàng */}
        <div className="header-actions">
          {!isAuthenticated ? (
            <div className="header-auth-buttons">
              <Link
                className="header-auth-link header-login-link"
                href="/login"
                aria-label="Đăng nhập"
              >
                <span className="action-icon"><Icon name="user" /></span>
                <span className="action-text">Đăng nhập</span>
              </Link>
              <span className="auth-separator" aria-hidden="true">/</span>
              <Link
                className="header-auth-btn header-register-btn"
                href="/register"
                aria-label="Đăng ký tài khoản"
              >
                Đăng ký
              </Link>
            </div>
          ) : (
            <Link
              className="header-action-item header-account-action is-logged-in"
              href="/account"
              aria-label="Tài khoản của tôi"
              title={`Tài khoản: ${user?.fullName || ""}`}
            >
              <span className="action-icon"><Icon name="user" /></span>
              <span className="action-text user-given-name">
                {user?.fullName ? user.fullName.trim().split(/\s+/).slice(-1)[0] : "Tài khoản"}
              </span>
            </Link>
          )}

          <Link className="header-action-item header-cart-action" href="/cart" aria-label="Giỏ hàng">
            <span className="action-icon"><Icon name="cart" /></span>
            <span className="action-text">Giỏ hàng</span>
            <span className="action-bag-wrap" aria-hidden="true">
              <Icon name="bag" />
              {itemCount > 0 && <span className="cart-badge-dot">{itemCount}</span>}
            </span>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-menu"
            type="button"
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? "close" : "menu"} />
          </button>
        </div>
      </header>
    </div>
  );
}
