"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getOrderById, updateOrderPayment } from "@/lib/services/order.service";
import { formatPrice } from "@/lib/utils/format";
import { useToast } from "@/hooks/use-toast";
import type { Order, PaymentMethod } from "@/lib/types/order";
import "./payment.css";

function PaymentGatewayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const orderId = searchParams.get("orderId") || "";
  const initialMethod = (searchParams.get("method") as PaymentMethod) || "bank_transfer";
  const urlTotal = Number(searchParams.get("total")) || 0;

  const [order, setOrder] = useState<Order | null>(null);
  const [method, setMethod] = useState<PaymentMethod>(initialMethod);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(899); // 14 phút 59 giây

  // Tải thông tin đơn hàng
  useEffect(() => {
    let isMounted = true;
    if (orderId) {
      getOrderById(orderId)
        .then((data) => {
          if (!isMounted) return;
          if (data) {
            setOrder(data);
            setMethod(data.paymentMethod);
          }
          setLoading(false);
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  // Bộ đếm ngược thời gian hết hạn thanh toán
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const currentTotal = order ? order.total : urlTotal;

  // Sao chép thông tin
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${fieldName}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Xử lý xác nhận thanh toán (Mô phỏng Sandbox)
  const handleConfirmPayment = async (success: boolean) => {
    if (!orderId) {
      toast.error("Không tìm thấy mã đơn hàng");
      return;
    }

    setProcessing(true);

    if (success) {
      setProcessingMsg("Đang kết nối cổng thanh toán & xác thực chữ ký số...");
      setTimeout(async () => {
        try {
          setProcessingMsg("Ngân hàng đã phê duyệt. Đang cập nhật trạng thái đơn hàng...");
          await updateOrderPayment(orderId, "paid", method);
          toast.success("Thanh toán thành công qua cổng Sandbox!");

          setTimeout(() => {
            const carrierParam = encodeURIComponent(order?.carrier || "");
            const trackingParam = encodeURIComponent(order?.trackingCode || "");
            router.push(
              `/order-success?orderId=${orderId}&total=${currentTotal}&method=${method}&paymentStatus=paid&carrier=${carrierParam}&tracking=${trackingParam}`
            );
          }, 800);
        } catch {
          toast.error("Lỗi cập nhật thanh toán đơn hàng.");
          setProcessing(false);
        }
      }, 1200);
    } else {
      // Hủy giao dịch
      setProcessingMsg("Đang hủy giao dịch thanh toán...");
      setTimeout(() => {
        toast.info("Đã hủy giao dịch thanh toán trực tuyến. Đơn hàng chuyển sang thanh toán sau.");
        const carrierParam = encodeURIComponent(order?.carrier || "");
        const trackingParam = encodeURIComponent(order?.trackingCode || "");
        router.push(
          `/order-success?orderId=${orderId}&total=${currentTotal}&method=${method}&paymentStatus=unpaid&carrier=${carrierParam}&tracking=${trackingParam}`
        );
      }, 800);
    }
  };

  if (loading) {
    return (
      <main className="payment-gateway-page">
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p>Đang tải thông tin cổng thanh toán...</p>
        </div>
      </main>
    );
  }

  // Tạo URL QR VietQR chuẩn
  const vietQrUrl = `https://img.vietqr.io/image/vietcombank-9988776655-compact2.png?amount=${currentTotal}&addInfo=DH%20${orderId}&accountName=CONG%20TY%20ERGOCHAIR%20VIETNAM`;

  return (
    <main className="payment-gateway-page">
      {/* 1. Sandbox Demonstration Notice */}
      <div className="sandbox-alert-banner" data-reveal="fade">
        <div className="sandbox-alert-icon">💡</div>
        <div className="sandbox-alert-content">
          <h4>Môi trường thử nghiệm Sandbox (Demo Đồ Án)</h4>
          <p>
            Hệ thống đang chạy cổng thanh toán mô phỏng phục vụ mục đích kiểm thử và chấm bài.
            Bạn có thể quét mã QR thử nghiệm hoặc bấm nút <strong>"Xác nhận thanh toán thành công"</strong> bên dưới để đơn hàng tự động chuyển sang trạng thái <strong>ĐÃ THANH TOÁN (PAID)</strong> trong cơ sở dữ liệu.
          </p>
        </div>
      </div>

      {/* 2. Main Gateway Card */}
      <div className="payment-gateway-card" data-reveal="up">
        {/* Header Bar */}
        <header className="gateway-header">
          <div className="gateway-brand">
            {method === "bank_transfer" && (
              <div className="gateway-brand-name">
                <h3>🏦 Cổng Chuyển Khoản Ngân Hàng VietQR</h3>
                <span>Hệ thống chuyển khoản nhanh Napas 24/7</span>
              </div>
            )}
            {method === "vnpay" && (
              <div className="gateway-brand-name">
                <h3>💳 Cổng Thanh Toán Điện Tử VNPAY Sandbox</h3>
                <span>Cổng thanh toán bảo mật chuẩn VNPAY-QR & Thẻ Quốc tế</span>
              </div>
            )}
            {method === "momo" && (
              <div className="gateway-brand-name">
                <h3>📱 Cổng Thanh Toán Ví Điện Tử MoMo Sandbox</h3>
                <span>Thanh toán an toàn qua ứng dụng MoMo QR</span>
              </div>
            )}
          </div>

          <div className="gateway-countdown">
            <span>Thời gian còn lại:</span>
            <span className="countdown-timer">{formatTimer(countdown)}</span>
          </div>
        </header>

        {/* Order Summary Bar */}
        <div className="gateway-order-summary">
          <div className="order-meta-left">
            <div>Mã đơn hàng: <strong>#{orderId || "Chưa xác định"}</strong></div>
            <div>Khách hàng: <strong>{order?.shippingAddress.fullName || "Khách hàng ErgoChair"}</strong></div>
          </div>
          <div className="order-amount-right">
            <span>Số tiền thanh toán:</span>
            <strong>{formatPrice(currentTotal)}</strong>
          </div>
        </div>

        {/* Gateway Body */}
        <div className="gateway-body">
          {/* A. VIETQR VIEW */}
          {method === "bank_transfer" && (
            <div className="vietqr-grid">
              <div className="vietqr-code-box">
                <img
                  src={vietQrUrl}
                  alt="VietQR Code"
                  className="vietqr-img"
                  onError={(e) => {
                    // Fallback nếu không có internet
                    (e.target as HTMLImageElement).src =
                      "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=https://ergochair.vn/pay/" + orderId;
                  }}
                />
                <p className="vietqr-scan-guide">
                  Mở ứng dụng ngân hàng bất kỳ để quét mã VietQR tự động điền số tiền và nội dung.
                </p>
              </div>

              <div className="vietqr-info-list">
                <div className="vietqr-info-row">
                  <span className="vietqr-info-label">Ngân hàng thụ hưởng:</span>
                  <span className="vietqr-info-value">Vietcombank (Chi nhánh Thăng Long)</span>
                </div>
                <div className="vietqr-info-row">
                  <span className="vietqr-info-label">Số tài khoản:</span>
                  <div className="vietqr-info-value">
                    <span>9988 7766 55</span>
                    <button
                      type="button"
                      className="copy-mini-btn"
                      onClick={() => handleCopy("9988776655", "Số tài khoản")}
                    >
                      {copiedField === "Số tài khoản" ? "Đã chép ✓" : "Sao chép"}
                    </button>
                  </div>
                </div>
                <div className="vietqr-info-row">
                  <span className="vietqr-info-label">Tên chủ tài khoản:</span>
                  <span className="vietqr-info-value">CÔNG TY TNHH ERGOCHAIR VIỆT NAM</span>
                </div>
                <div className="vietqr-info-row">
                  <span className="vietqr-info-label">Số tiền chuyển:</span>
                  <div className="vietqr-info-value">
                    <strong style={{ color: "#8b7355" }}>{formatPrice(currentTotal)}</strong>
                    <button
                      type="button"
                      className="copy-mini-btn"
                      onClick={() => handleCopy(currentTotal.toString(), "Số tiền")}
                    >
                      {copiedField === "Số tiền" ? "Đã chép ✓" : "Sao chép"}
                    </button>
                  </div>
                </div>
                <div className="vietqr-info-row">
                  <span className="vietqr-info-label">Nội dung chuyển khoản:</span>
                  <div className="vietqr-info-value">
                    <strong style={{ color: "#b45309" }}>DH {orderId}</strong>
                    <button
                      type="button"
                      className="copy-mini-btn"
                      onClick={() => handleCopy(`DH ${orderId}`, "Nội dung chuyển khoản")}
                    >
                      {copiedField === "Nội dung chuyển khoản" ? "Đã chép ✓" : "Sao chép"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* B. VNPAY VIEW */}
          {method === "vnpay" && (
            <div className="vnpay-view">
              <p style={{ color: "#696056", fontSize: "14px", margin: "0 0 8px" }}>
                Quét mã <strong>VNPAY-QR</strong> bằng ứng dụng Mobile Banking hoặc ví điện tử VNPAY
              </p>
              <div className="vnpay-qr-wrap">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=VNPAY_SANDBOX_TXN_${orderId}_${currentTotal}`}
                  alt="VNPAY QR Sandbox"
                  className="vnpay-qr-img"
                />
              </div>
              <p style={{ fontSize: "12.5px", color: "#8c8276", margin: "0 0 16px" }}>
                Hỗ trợ thanh toán qua hơn 30+ ứng dụng ngân hàng tại Việt Nam:
              </p>
              <div className="vnpay-supported-banks">
                <span className="bank-tag">Vietcombank Digibank</span>
                <span className="bank-tag">BIDV SmartBanking</span>
                <span className="bank-tag">VietinBank iPay</span>
                <span className="bank-tag">MB Bank</span>
                <span className="bank-tag">Techcombank Mobile</span>
                <span className="bank-tag">ACB ONE</span>
                <span className="bank-tag">TPBank Mobile</span>
                <span className="bank-tag">Ví VNPAY</span>
              </div>
            </div>
          )}

          {/* C. MOMO VIEW */}
          {method === "momo" && (
            <div className="momo-view">
              <p style={{ color: "#696056", fontSize: "14px", margin: "0 0 8px" }}>
                Mở ứng dụng <strong>Ví MoMo</strong> trên điện thoại và chọn quét mã để hoàn tất thanh toán
              </p>
              <div className="momo-qr-wrap">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MOMO_SANDBOX_TXN_${orderId}_${currentTotal}`}
                  alt="MoMo QR Sandbox"
                  className="momo-qr-img"
                />
              </div>
              <p style={{ fontSize: "12.5px", color: "#a50064", fontWeight: 600 }}>
                ⚡ Thanh toán tức thì • Miễn phí giao dịch • Bảo mật tuyệt đối
              </p>
            </div>
          )}

          {/* 3. Sandbox Control Actions */}
          <div className="sandbox-action-panel">
            <span className="sandbox-action-title">
              Thao tác thử nghiệm Sandbox (Dành cho kiểm thử & thuyết trình)
            </span>
            <div className="sandbox-buttons-row">
              {method === "bank_transfer" && (
                <button
                  type="button"
                  className="btn-sandbox-success"
                  onClick={() => handleConfirmPayment(true)}
                  disabled={processing}
                >
                  ✓ Tôi đã chuyển khoản – Xác nhận đã nhận tiền (Mô phỏng)
                </button>
              )}
              {method === "vnpay" && (
                <button
                  type="button"
                  className="btn-sandbox-vnpay"
                  onClick={() => handleConfirmPayment(true)}
                  disabled={processing}
                >
                  ✓ Giả lập Thanh toán thành công (VNPAY Sandbox)
                </button>
              )}
              {method === "momo" && (
                <button
                  type="button"
                  className="btn-sandbox-momo"
                  onClick={() => handleConfirmPayment(true)}
                  disabled={processing}
                >
                  ✓ Giả lập Thanh toán thành công (Ví MoMo)
                </button>
              )}
              <button
                type="button"
                className="btn-sandbox-cancel"
                onClick={() => handleConfirmPayment(false)}
                disabled={processing}
              >
                Hủy giao dịch / Thanh toán sau
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Modal Overlay */}
      {processing && (
        <div className="payment-processing-overlay">
          <div className="payment-processing-card">
            <div className="payment-spinner" />
            <h3>Đang xử lý giao dịch...</h3>
            <p>{processingMsg}</p>
          </div>
        </div>
      )}
    </main>
  );
}

export default function PaymentGatewayPage() {
  return (
    <Suspense fallback={<main className="payment-gateway-page"><p>Đang tải cổng thanh toán...</p></main>}>
      <PaymentGatewayContent />
    </Suspense>
  );
}
