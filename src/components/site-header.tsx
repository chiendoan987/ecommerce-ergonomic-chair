"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";

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

  useEffect(() => {
    const timer = window.setTimeout(() => { setMenuOpen(false); setCategoriesOpen(false); }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  const isActive = (route: string) => route === "/" ? pathname === "/" : pathname.startsWith(route);
  const closeMenus = () => { setMenuOpen(false); setCategoriesOpen(false); };

  return <header className="site-header global-header">
    <Link className="logo" href="/" onClick={closeMenus}><span className="logo-mark">e</span> ErgoChair</Link>
    <nav className={menuOpen ? "open" : ""} aria-label="Điều hướng chính">
      <Link className={isActive("/") ? "active" : ""} href="/" onClick={closeMenus}>Trang chủ</Link>
      <Link className={isActive("/products") ? "active" : ""} href="/products" onClick={closeMenus}>Sản phẩm</Link>
      <div className={`nav-dropdown ${categoriesOpen ? "open" : ""}`} onMouseEnter={() => setCategoriesOpen(true)} onMouseLeave={() => setCategoriesOpen(false)}>
        <button type="button" aria-expanded={categoriesOpen} onClick={() => setCategoriesOpen(!categoriesOpen)}>Danh mục <Icon name="chevron" /></button>
        <div className="nav-dropdown-menu"><Link href="/products?category=Ghế+công+thái+học" onClick={closeMenus}>Ghế công thái học</Link><Link href="/products?category=Ghế+văn+phòng" onClick={closeMenus}>Ghế văn phòng</Link><Link href="/products?category=Ghế+gaming" onClick={closeMenus}>Ghế gaming</Link><Link href="/products" onClick={closeMenus}>Phụ kiện</Link></div>
      </div>
      <Link className={isActive("/about") ? "active" : ""} href="/about" onClick={closeMenus}>Về chúng tôi</Link>
      <Link className={isActive("/contact") ? "active" : ""} href="/contact" onClick={closeMenus}>Liên hệ</Link>
    </nav>
    <div className="header-actions"><button type="button" aria-label="Tìm kiếm"><Icon name="search" /></button><Link className="cart" href="/cart" aria-label="Giỏ hàng"><Icon name="bag" />{itemCount > 0 && <span key={itemCount}>{itemCount}</span>}</Link><button className="mobile-menu" type="button" aria-label={menuOpen ? "Đóng menu" : "Mở menu"} onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? "close" : "menu"} /></button></div>
  </header>;
}
