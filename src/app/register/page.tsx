"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import "../login/login.css";

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

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  const loginHref = redirectUrl !== "/" ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login";

  const { user, isAuthenticated, register, logout } = useAuth();

  // Register form state
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!regFullName.trim()) {
      setErrorMsg("Vui lòng nhập họ và tên.");
      return;
    }

    if (!regEmail.trim()) {
      setErrorMsg("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }

    if (!regPhone.trim()) {
      setErrorMsg("Vui lòng nhập số điện thoại liên hệ.");
      return;
    }

    if (!regPassword.trim() || regPassword.length < 6) {
      setErrorMsg("Mật khẩu phải có độ dài tối thiểu 6 ký tự.");
      return;
    }

    if (confirmPassword && regPassword !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.");
      return;
    }

    setIsLoading(true);
    const result = await register({
      fullName: regFullName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      password: regPassword.trim(),
    });
    setIsLoading(false);

    if (result.success) {
      router.push(redirectUrl);
    } else {
      setErrorMsg(result.error || "Đăng ký không thành công.");
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
          <h1 className="auth-card-title">Tạo tài khoản mới</h1>
          <p className="auth-card-subtitle">
            Đăng ký thành viên để lưu sổ địa chỉ & theo dõi trạng thái đơn hàng
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs" role="tablist">
          <Link
            href={loginHref}
            role="tab"
            aria-selected={false}
            className="auth-tab-btn"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            role="tab"
            aria-selected={true}
            className="auth-tab-btn active"
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

        <form className="auth-form" onSubmit={handleRegisterSubmit}>
          <div className="auth-form-field">
            <label htmlFor="reg-fullname">Họ và tên *</label>
            <div className="auth-input-wrapper">
              <input
                id="reg-fullname"
                type="text"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          </div>

          <div className="auth-form-field">
            <label htmlFor="reg-email">Địa chỉ Email *</label>
            <div className="auth-input-wrapper">
              <input
                id="reg-email"
                type="email"
                placeholder="name@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-form-field">
            <label htmlFor="reg-phone">Số điện thoại *</label>
            <div className="auth-input-wrapper">
              <input
                id="reg-phone"
                type="tel"
                placeholder="0912 345 678"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                required
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="auth-form-field">
            <label htmlFor="reg-password">
              <span>Mật khẩu *</span>
              <span className="auth-mock-hint">(Tối thiểu 6 ký tự)</span>
            </label>
            <div className="auth-input-wrapper">
              <input
                id="reg-password"
                type={showRegPassword ? "text" : "password"}
                placeholder="Tạo mật khẩu an toàn"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="auth-password-input"
              />
              <button
                type="button"
                className="auth-password-toggle-btn"
                onClick={() => setShowRegPassword((prev) => !prev)}
                title={showRegPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                aria-label={showRegPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
              >
                <EyeIcon show={showRegPassword} />
              </button>
            </div>
            {regPassword.length > 0 && (
              <div
                className={`auth-char-counter ${
                  regPassword.length >= 6 ? "valid" : "warning"
                }`}
              >
                {regPassword.length >= 6
                  ? `✓ Đã đạt ${regPassword.length}/6 ký tự tối thiểu`
                  : `Đã nhập ${regPassword.length}/6 ký tự (cần thêm ${6 - regPassword.length} ký tự)`}
              </div>
            )}
          </div>

          <div className="auth-form-field">
            <label htmlFor="confirm-password">
              <span>Xác nhận mật khẩu *</span>
            </label>
            <div className="auth-input-wrapper">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Nhập lại mật khẩu vừa tạo"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="auth-password-input"
              />
              <button
                type="button"
                className="auth-password-toggle-btn"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
              >
                <EyeIcon show={showConfirmPassword} />
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <div
                className={`auth-char-counter ${
                  regPassword === confirmPassword ? "valid" : "warning"
                }`}
              >
                {regPassword === confirmPassword
                  ? `✓ Mật khẩu xác nhận trùng khớp`
                  : `Mật khẩu chưa khớp`}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? "Đang khởi tạo tài khoản..." : "Hoàn tất đăng ký"} <span>→</span>
          </button>

          {/* Switch link to Login */}
          <div className="auth-switch-box">
            Đã có tài khoản ErgoChair?
            <Link href={loginHref} className="auth-switch-link">
              Đăng nhập ngay →
            </Link>
          </div>

          <div className="auth-guest-link-wrapper">
            <Link href="/products" className="auth-guest-link">
              Duyệt xem danh mục sản phẩm (Khách vãng lai) <span>→</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="auth-page">
      <nav className="auth-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Trang chủ</Link>
        <span className="auth-breadcrumb-sep">/</span>
        <strong>Đăng ký tài khoản</strong>
      </nav>

      <main className="auth-main">
        <Suspense fallback={<div className="auth-loading">Đang tải biểu mẫu đăng ký...</div>}>
          <RegisterForm />
        </Suspense>
      </main>
    </div>
  );
}
