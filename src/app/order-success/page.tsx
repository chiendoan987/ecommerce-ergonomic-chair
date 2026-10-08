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

const SHIPPING_NAMES: Record<string, string> = {
  standard: "Giao hàng Tiêu chuẩn (3-5 ngày)",
  express: "Giao Hỏa Tốc 2H (Trong ngày)",
  assembly: "Giao & Lắp đặt tận phòng (ErgoCare)",
};

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const total = Number(searchParams.get("total"));
  const orderId = searchParams.get("orderId");
  const method = searchParams.get("method") || "cod";
  const shipping = searchParams.get("shipping") || "standard";
  const carrier = searchParams.get("carrier") || "Giao Hàng Tiết Kiệm (GHTK)";
  const tracking = searchParams.get("tracking") || (orderId ? `GHTK-${orderId.slice(-6).toUpperCase()}` : "");
  const orderTotal = Number.isFinite(total) && total > 0 ? total : 0;
  const paymentStatus = searchParams.get("paymentStatus") || (method === "cod" ? "unpaid" : "unpaid");

  return (
    <main className="order-success-page">
      <section className="order-success-card" data-reveal="scale">
        <span className="order-success-mark">✓</span>
        <p className="eyebrow">ERGOCHAIR / CẢM ƠN BẠN</p>
        <h1>
          Đặt hàng<br />
          <em>thành công!</em>
        </h1>
        <p>Cảm ơn bạn đã lựa chọn ErgoChair. Đơn hàng của bạn đã được tiếp nhận và mã vận đơn đã được khởi tạo tự động.</p>

        <div className="order-success-details">
          {orderId && (
            <div>
              <span>Mã đơn hàng</span>
              <strong>#{orderId}</strong>
            </div>
          )}
          {tracking && (
            <div>
              <span>Mã vận đơn (Tracking Code)</span>
              <strong style={{ color: "#8b7355", letterSpacing: "0.5px" }}>{tracking}</strong>
            </div>
          )}
          <div>
            <span>Đơn vị vận chuyển</span>
            <strong>{carrier}</strong>
          </div>
          <div>
            <span>Gói giao hàng</span>
            <strong>{SHIPPING_NAMES[shipping] || shipping}</strong>
          </div>
          <div>
            <span>Tổng tiền thanh toán</span>
            <strong>{formatPrice(orderTotal)}</strong>
          </div>
          <div>
            <span>Phương thức thanh toán</span>
            <strong>{PAYMENT_NAMES[method] || method}</strong>
          </div>
          <div>
            <span>Trạng thái thanh toán</span>
            {paymentStatus === "paid" ? (
              <strong style={{ color: "#15803d", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                ✓ ĐÃ THANH TOÁN THÀNH CÔNG
              </strong>
            ) : method === "cod" ? (
              <strong style={{ color: "#786e63" }}>
                Thanh toán tiền mặt khi nhận hàng (COD)
              </strong>
            ) : (
              <strong style={{ color: "#b45309" }}>
                ⏳ Chờ thanh toán chuyển khoản
              </strong>
            )}
          </div>
        </div>

        <div className="order-success-actions">
          <Link
            className="button"
            style={{
              background: "#8b7355",
              color: "#fff",
              border: "1px solid #8b7355",
              padding: "12px 24px",
              borderRadius: "8px",
              fontWeight: 600,
            }}
            href="/account"
          >
            Xem đơn hàng của bạn <span>→</span>
          </Link>
          <Link
            className="button"
            style={{
              border: "1px solid #d9ded7",
              color: "#555",
              padding: "12px 20px",
              borderRadius: "8px",
            }}
            href="/products"
          >
            Tiếp tục mua sắm
          </Link>
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
