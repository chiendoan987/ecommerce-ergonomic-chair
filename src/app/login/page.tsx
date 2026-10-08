"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import "./login.css";

function EyeIcon({ show }: { show: boolean }) {
  if (show) {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  const registerHref = redirectUrl !== "/" ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : "/register";

  const { user, isAuthenticated, login, logout } = useAuth();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");


  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!loginEmail.trim()) {
      setErrorMsg("Vui lòng nhập địa chỉ email.");
      return;
    }

    if (!loginPassword.trim()) {
      setErrorMsg("Vui lòng nhập mật khẩu.");
      return;
    }

    setIsLoading(true);
    const result = await login({ email: loginEmail.trim(), password: loginPassword.trim() });
    setIsLoading(false);

    if (result.success) {
      router.push(redirectUrl);
    } else {
      setErrorMsg(result.error || "Đăng nhập không thành công.");
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="auth-card-logged-in">
        <div className="auth-avatar-circle">
          {user.fullName.trim().charAt(0).toUpperCase()}
        </div>
        <h2>Xin chào, {user.fullName}!</h2>
        <p className="auth-status-subtitle">
          Bạn hiện đang đăng nhập với email <strong>{user.email}</strong>
          <span className="auth-role-pill">
            {user.role === "admin" ? "Quản trị viên" : "Khách hàng"}
          </span>
        </p>
        <div className="auth-logged-actions">
          {user.role === "admin" && (
            <Link href="/admin" className="auth-btn-primary" style={{ background: "#D97706", borderColor: "#D97706" }}>
              Vào trang Quản trị Hệ thống ⚙️
            </Link>
          )}
          <Link href="/" className="auth-btn-primary">
            Khám phá trang chủ <span>→</span>
          </Link>
          <Link href="/account" className="auth-btn-secondary">
            Vào bảng quản lý tài khoản
          </Link>
          <button type="button" className="auth-btn-outline" onClick={() => logout()}>
            Đăng xuất tài khoản
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Card Header & Brand Identity */}
        <div className="auth-card-header">
          <div className="auth-brand-badge">
            <span>✧</span> ErgoChair Atelier <span>✧</span>
          </div>
          <h1 className="auth-card-title">Đăng nhập hệ thống</h1>
          <p className="auth-card-subtitle">
            Trải nghiệm không gian mua sắm nội thất công thái học cao cấp
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs" role="tablist">
          <Link
            href="/login"
            role="tab"
            aria-selected={true}
            className="auth-tab-btn active"
          >
            Đăng nhập
          </Link>
          <Link
            href={registerHref}
            role="tab"
            aria-selected={false}
            className="auth-tab-btn"
          >
            Đăng ký tài khoản
          </Link>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="auth-error-banner" role="alert">
            <svg className="auth-error-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleLoginSubmit}>
          <div className="auth-form-field">
            <label htmlFor="login-email">Địa chỉ Email</label>
            <div className="auth-input-wrapper">
              <input
                id="login-email"
                type="email"
                placeholder="name@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-form-field">
            <label htmlFor="login-password">
              <span>Mật khẩu</span>
              <span className="auth-mock-hint">(Mật khẩu mặc định: 123456)</span>
            </label>
            <div className="auth-input-wrapper">
              <input
                id="login-password"
                type={showLoginPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu của bạn"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="auth-password-input"
              />
              <button
                type="button"
                className="auth-password-toggle-btn"
                onClick={() => setShowLoginPassword((prev) => !prev)}
                title={showLoginPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                aria-label={showLoginPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
              >
                <EyeIcon show={showLoginPassword} />
              </button>
            </div>
            {loginPassword.length > 0 && (
              <div className="auth-char-counter">
                Đã nhập {loginPassword.length} ký tự
              </div>
            )}
          </div>

          <div className="auth-form-meta">
            <label className="auth-remember-label">
              <input type="checkbox" defaultChecked />
              <span>Ghi nhớ đăng nhập</span>
            </label>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? "Đang xử lý đăng nhập..." : "Đăng nhập ngay"} <span>→</span>
          </button>


          {/* Switch link to Register */}
          <div className="auth-switch-box">
            Chưa có tài khoản?
            <Link href={registerHref} className="auth-switch-link">
              Đăng ký tài khoản mới ngay →
            </Link>
          </div>


        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="auth-page">
      <nav className="auth-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Trang chủ</Link>
        <span className="auth-breadcrumb-sep">/</span>
        <strong>Đăng nhập</strong>
      </nav>

      <main className="auth-main">
        <Suspense fallback={<div className="auth-loading">Đang tải biểu mẫu đăng nhập...</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
