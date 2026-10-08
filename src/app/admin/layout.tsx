"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { loginAsDefaultAdmin } from "@/lib/services/auth.service";
import "./admin.css";

function AdminIcon({
  name,
}: {
  name:
    | "dashboard"
    | "home"
    | "products"
    | "categories"
    | "orders"
    | "customers"
    | "user"
    | "analytics"
    | "reports"
    | "setting"
    | "store"
    | "logout"
    | "close"
    | "menu"
    | "lock"
    | "check";
}) {
  const icons = {
    dashboard: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    home: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    analytics: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    reports: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    products: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    categories: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
    orders: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
    customers: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    user: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    setting: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    store: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
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
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ergochair-sidebar-collapsed");
      if (saved === "true") setSidebarCollapsed(true);
    }
  }, []);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("ergochair-sidebar-collapsed", String(next));
      }
      return next;
    });
  };

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
      await loginAsDefaultAdmin();
      window.location.reload();
    } catch {
      setIsSwitching(false);
    }
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
      router.push("/login");
    } catch {
      setIsLoggingOut(false);
    }
  };

  // 1. Loading screen
  if (isLoading) {
    return (
      <div className="admin-guard-container">
        <div style={{ textAlign: "center", color: "#78716c" }}>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", color: "#1c1917" }}>
            Đang tải dữ liệu Quản trị...
          </div>
          <p style={{ margin: 0, fontSize: "0.88rem" }}>Vui lòng đợi giây lát.</p>
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
              style={{ padding: "0.85rem", fontSize: "0.95rem" }}
              onClick={handleAdminQuickLogin}
              disabled={isSwitching}
            >
              {isSwitching ? "Đang chuyển quyền..." : "⚡ Đăng nhập nhanh với quyền Admin (admin@ergochair.vn)"}
            </button>
            <Link
              href="/login?redirect=/admin"
              className="admin-btn admin-btn-outline"
              style={{ padding: "0.85rem" }}
            >
              Đăng nhập tài khoản khác
            </Link>
            <Link
              href="/"
              className="admin-btn admin-btn-outline"
              style={{ padding: "0.85rem" }}
            >
              Quay về Trang chủ Cửa hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Navigation Items matching the reference layout
  const navItems = [
    { href: "/admin", label: "Tổng quan", icon: "home" as const },
    { href: "/admin/products", label: "Sản phẩm", icon: "products" as const },
    { href: "/admin/categories", label: "Danh mục", icon: "categories" as const },
    { href: "/admin/orders", label: "Đơn hàng", icon: "orders" as const },
    { href: "/admin/customers", label: "Tài khoản người dùng", icon: "customers" as const },
  ];

  return (
    <div className="admin-layout">
      {/* Decorative Organic Blobs inspired by reference */}
      <div className="admin-decor-blob-1" aria-hidden="true" />
      <div className="admin-decor-blob-2" aria-hidden="true" />

      {/* Mobile Drawer Backdrop */}
      <div
        className={`admin-backdrop ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Admin Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""} ${sidebarCollapsed ? "collapsed" : ""}`} aria-label="Menu Quản trị">
        {/* Brand with 3-bar chart icon and Dashboard text */}
        <div className="admin-sidebar-header">
          <Link href="/admin" className="admin-brand" title="Bảng điều khiển">
            <div className="admin-brand-chart-icon" aria-hidden="true">
              <span className="bar bar-1" />
              <span className="bar bar-2" />
              <span className="bar bar-3" />
            </div>
            {!sidebarCollapsed && <span className="admin-brand-title">Bảng điều khiển</span>}
          </Link>

          {/* Desktop Arrow Toggle Button to Collapse / Expand Sidebar */}
          <button
            type="button"
            className="admin-sidebar-toggle-btn"
            onClick={toggleSidebarCollapse}
            title={sidebarCollapsed ? "Mở rộng thanh điều hướng" : "Thu nhỏ thanh điều hướng (Chỉ hiện icon)"}
            aria-label={sidebarCollapsed ? "Mở rộng thanh điều hướng" : "Thu nhỏ thanh điều hướng"}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: sidebarCollapsed ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.22s ease",
              }}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            className="admin-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Đóng menu"
          >
            <AdminIcon name="close" />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="admin-sidebar-nav">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${isActive ? "active" : ""}`}
                title={item.label}
              >
                <span className="admin-nav-icon">
                  <AdminIcon name={item.icon} />
                </span>
                <span className="admin-nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Profile */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-profile-widget" title={user.fullName}>
            <div className="admin-avatar-wrap">
              <img
                src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                alt={user.fullName}
                className="admin-avatar-img"
              />
            </div>
            <div className="admin-user-info">
              <div className="admin-user-name" title={user.fullName}>
                {user.fullName || "Quản trị viên"}
              </div>
              <div className="admin-user-role">Quản trị viên</div>
            </div>
          </div>

          <div className="admin-footer-actions">
            <Link
              href="/"
              className="admin-footer-btn store"
              title="Xem giao diện khách hàng"
              target="_blank"
            >
              <AdminIcon name="store" />
              <span>Cửa hàng</span>
            </Link>
            <button
              type="button"
              className="admin-footer-btn logout"
              onClick={() => setShowLogoutModal(true)}
              title="Đăng xuất khỏi tài khoản quản trị"
            >
              <AdminIcon name="logout" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="admin-main">
        {/* Topbar with wide rounded search and user avatar */}
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
          </div>

          <div className="admin-topbar-right">
            <Link
              href="/"
              className="admin-topbar-store-btn"
              target="_blank"
              title="Mở trang chủ khách hàng trong tab mới"
            >
              <AdminIcon name="store" />
              <span>Xem Cửa Hàng ↗</span>
            </Link>

            <div className="admin-topbar-avatar" title={`Tài khoản: ${user.fullName}`}>
              <img
                src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                alt={user.fullName}
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          {children}
        </main>
      </div>

      {/* Modal Xác Nhận Đăng Xuất */}
      {showLogoutModal && (
        <div className="admin-modal-overlay" onClick={() => !isLoggingOut && setShowLogoutModal(false)}>
          <div
            className="admin-modal"
            style={{ maxWidth: "380px" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
          >
            <div className="admin-modal-header">
              <h3 id="logout-modal-title" className="admin-modal-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#D97706" }}>⚠️</span>
                Xác Nhận Đăng Xuất
              </h3>
              <button
                type="button"
                className="admin-btn-icon"
                onClick={() => !isLoggingOut && setShowLogoutModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#78716C", fontSize: "0.95rem" }}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <p style={{ margin: "0 0 0.5rem 0", color: "#1C1917", fontSize: "0.82rem", lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn đăng xuất khỏi tài khoản Quản trị viên <strong>{user?.fullName || "Admin"}</strong> ({user?.email}) không?
              </p>
              <p style={{ margin: 0, color: "#78716C", fontSize: "0.76rem" }}>
                Sau khi đăng xuất, hệ thống sẽ chuyển hướng bạn về trang đăng nhập an toàn.
              </p>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                style={{ background: "#DC2626", borderColor: "#DC2626", color: "#FFFFFF" }}
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Đang đăng xuất..." : "Đăng Xuất Ngay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
