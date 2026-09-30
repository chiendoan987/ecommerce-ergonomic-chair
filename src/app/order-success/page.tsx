"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { formatPrice } from "@/lib/utils/format";
import { useAuth } from "@/hooks/use-auth";

const PAYMENT_NAMES: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "Chuyển khoản ngân hàng",
  vnpay: "VNPAY QR / Thẻ nội địa",
  momo: "Ví điện tử MoMo",
};

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const total = Number(searchParams.get("total"));
  const orderId = searchParams.get("orderId");
  const method = searchParams.get("method") || "cod";
  const orderTotal = Number.isFinite(total) && total > 0 ? total : 0;

  return (
    <main className="order-success-page">
      <section className="order-success-card" data-reveal="scale">
        <span className="order-success-mark">✓</span>
        <p className="eyebrow">ERGOCHAIR / CẢM ƠN BẠN</p>
        <h1>
          Đặt hàng<br />
          <em>thành công!</em>
        </h1>
        <p>Cảm ơn bạn đã lựa chọn ErgoChair. Đơn hàng của bạn đã được tiếp nhận và nhân viên hỗ trợ sẽ liên hệ xác nhận sớm nhất.</p>

        <div className="order-success-details">
          {orderId && (
            <div>
              <span>Mã đơn hàng</span>
              <strong>#{orderId}</strong>
            </div>
          )}
          <div>
            <span>Tổng tiền đơn hàng</span>
            <strong>{formatPrice(orderTotal)}</strong>
          </div>
          <div>
            <span>Phương thức thanh toán</span>
            <strong>{PAYMENT_NAMES[method] || method}</strong>
          </div>
        </div>

        <div className="order-success-actions">
          {isAuthenticated ? (
            <Link className="button button-dark" href="/account">
              Xem đơn hàng trong Tài khoản <span>→</span>
            </Link>
          ) : (
            <Link className="button button-dark" href="/products">
              Tiếp tục mua sắm <span>→</span>
            </Link>
          )}
          <Link className="text-link" href="/">
            Về trang chủ <span>→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<main className="order-success-page" aria-busy="true" />}>
      <OrderSuccessContent />
    </Suspense>
  );
}
