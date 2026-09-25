"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { ProductSearch } from "@/components/product-search";

function Icon({ name }: { name: "search" | "bag" | "menu" | "close" | "chevron" }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
    bag: <><path d="M6 8h12l1 12H5L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
    close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
  };
  return <svg aria-hidden="true" className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function SiteHeader() {
  const pathname = usePathname();
  const { itemCount } = useCart();
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
          <Link scroll={false} href="/products?category=Ghế+công+thái+học" onClick={closeMenus}>Ghế công thái học</Link>
          <Link scroll={false} href="/products?category=Ghế+văn+phòng" onClick={closeMenus}>Ghế văn phòng</Link>
          <Link scroll={false} href="/products?category=Ghế+gaming" onClick={closeMenus}>Ghế gaming</Link>
          <Link scroll={false} href="/products?category=Ghế+lãnh+đạo" onClick={closeMenus}>Ghế lãnh đạo</Link>
        </div>
      </div>
      <Link className={isActive("/about") ? "active" : ""} href="/about" onClick={closeMenus}>Về chúng tôi</Link>
      <Link className={isActive("/contact") ? "active" : ""} href="/contact" onClick={closeMenus}>Liên hệ</Link>
    </nav>
    <div className="header-actions"><Suspense fallback={<span className="product-search-placeholder" aria-hidden="true" />}><ProductSearch inputId="global-product-search-input" /></Suspense><Link className="cart" href="/cart" aria-label="Giỏ hàng"><Icon name="bag" />{itemCount > 0 && <span key={itemCount}>{itemCount}</span>}</Link><button className="mobile-menu" type="button" aria-label={menuOpen ? "Đóng menu" : "Mở menu"} onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? "close" : "menu"} /></button></div>
  </header>;
}
