"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { loginAsAdminMock } from "@/lib/services/auth.service";
import "./admin.css";

function AdminIcon({ name }: { name: "dashboard" | "products" | "orders" | "customers" | "store" | "logout" | "close" | "menu" | "lock" | "check" }) {
  const icons = {
    dashboard: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
    products: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
        <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" />
        <path d="M12 18v3" />
        <path d="M8 21h8" />
      </svg>
    ),
    orders: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 16h6" />
        <path d="M19 13v6" />
        <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
        <path d="m7.5 4.27 9 5.15" />
        <polyline points="3.29 7 12 12 20.71 7" />
        <line x1="12" x2="12" y1="22" y2="12" />
      </svg>
    ),
    customers: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    store: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    logout: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" x2="9" y1="12" y2="12" />
      </svg>
    ),
    close: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" x2="6" y1="6" y2="18" />
        <line x1="6" x2="18" y1="6" y2="18" />
      </svg>
    ),
    menu: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" x2="20" y1="12" y2="12" />
        <line x1="4" x2="20" y1="6" y2="6" />
        <line x1="4" x2="20" y1="18" y2="18" />
      </svg>
    ),
    lock: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    check: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  };
  return icons[name] || null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      setSidebarOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleAdminQuickLogin = async () => {
    setIsSwitching(true);
    try {
      await loginAsAdminMock();
      window.location.reload();
    } catch {
      setIsSwitching(false);
    }
  };

  // 1. Loading screen
  if (isLoading) {
    return (
      <div className="admin-guard-container">
        <div style={{ textAlign: "center", color: "#94a3b8" }}>
          <div style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.5rem", color: "#f8fafc" }}>
            Đang tải dữ liệu Quản trị...
          </div>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>Vui lòng đợi giây lát.</p>
        </div>
      </div>
    );
  }

  // 2. Auth Guard: Check admin role
  const isAdmin = user && user.role === "admin";
  if (!isAdmin) {
    return (
      <div className="admin-guard-container">
        <div className="admin-guard-card">
          <div className="admin-guard-icon">
            <AdminIcon name="lock" />
          </div>
          <h1 className="admin-guard-title">Khu Vực Quản Trị Hệ Thống</h1>
          <p className="admin-guard-desc">
            Trang này chỉ dành cho tài khoản có quyền <strong>Quản trị viên (Admin)</strong>.
            {user ? (
              <> Bạn hiện đang đăng nhập bằng tài khoản <strong>{user.fullName}</strong> (Khách hàng thông thường).</>
            ) : (
              <> Bạn hiện chưa đăng nhập vào hệ thống.</>
            )}
          </p>

          <div className="admin-guard-actions">
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              style={{ padding: "0.8rem", fontSize: "0.95rem" }}
              onClick={handleAdminQuickLogin}
              disabled={isSwitching}
            >
              {isSwitching ? "Đang chuyển quyền..." : "⚡ Đăng nhập nhanh với quyền Admin (admin@ergochair.vn)"}
            </button>
            <Link
              href="/"
              className="admin-btn admin-btn-outline"
              style={{ padding: "0.8rem", color: "#cbd5e1", borderColor: "#475569", background: "transparent" }}
            >
              Quay về Trang chủ Cửa hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Navigation Items
  const navItems = [
    { href: "/admin", label: "Tổng quan", icon: "dashboard" as const },
    { href: "/admin/products", label: "Quản lý sản phẩm", icon: "products" as const },
    { href: "/admin/orders", label: "Quản lý đơn hàng", icon: "orders" as const },
    { href: "/admin/customers", label: "Quản lý khách hàng", icon: "customers" as const },
  ];

  const getPageTitle = () => {
    if (pathname === "/admin") return "Tổng quan Dashboard";
    if (pathname.startsWith("/admin/products")) return "Quản lý Sản phẩm";
    if (pathname.startsWith("/admin/orders")) return "Quản lý Đơn hàng";
    if (pathname.startsWith("/admin/customers")) return "Quản lý Khách hàng";
    return "Quản trị ErgoChair";
  };

  return (
    <div className="admin-layout">
      {/* Mobile Drawer Backdrop */}
      <div
        className={`admin-backdrop ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Admin Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`} aria-label="Menu Quản trị">
        <div className="admin-sidebar-header">
          <Link href="/admin" className="admin-brand">
            <span className="admin-brand-icon">e</span>
            <div>
              <h2 className="admin-brand-title">ErgoChair</h2>
              <span className="admin-brand-badge">Admin Portal</span>
            </div>
          </Link>
          <button
            type="button"
            className="admin-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Đóng menu"
          >
            <AdminIcon name="close" />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-nav-section-title">Hệ thống & Báo cáo</div>
          {navItems.map((item) => {
            const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${isActive ? "active" : ""}`}
              >
                <AdminIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-profile">
            <div className="admin-avatar">
              {user.fullName.trim().charAt(0).toUpperCase()}
            </div>
            <div className="admin-user-details">
              <div className="admin-user-name" title={user.fullName}>{user.fullName}</div>
              <div className="admin-user-role">
                <span className="admin-badge-dot" style={{ backgroundColor: "#38bdf8" }} />
                Quản trị viên
              </div>
            </div>
          </div>

          <div className="admin-footer-actions">
            <Link href="/" className="admin-store-link" title="Xem giao diện khách hàng">
              <AdminIcon name="store" />
              <span>Xem Web</span>
            </Link>
            <button
              type="button"
              className="admin-logout-btn"
              onClick={() => logout()}
              title="Đăng xuất khỏi tài khoản"
            >
              <AdminIcon name="logout" />
              <span>Thoát</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-mobile-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở menu quản trị"
            >
              <AdminIcon name="menu" />
            </button>
            <h1 className="admin-page-heading">{getPageTitle()}</h1>
          </div>

          <div className="admin-topbar-right">
            <Link href="/" className="admin-btn admin-btn-outline admin-btn-sm" target="_blank">
              <AdminIcon name="store" />
              <span>Xem Cửa Hàng</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
