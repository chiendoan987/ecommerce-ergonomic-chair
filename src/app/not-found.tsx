import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Không tìm thấy trang | ErgoChair",
  description: "Trang bạn tìm kiếm không tồn tại hoặc đã được di chuyển.",
};

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-container" data-reveal="scale">
        <p className="not-found-eyebrow">LỖI ĐIỀU HƯỚNG 404</p>
        <h1 className="not-found-code">404</h1>
        <h2>Không tìm thấy trang bạn yêu cầu</h2>
        <p className="not-found-desc">
          Trang bạn đang tìm kiếm có thể đã bị xóa, thay đổi đường dẫn hoặc tạm thời không khả dụng. Hãy quay lại hoặc tham khảo bộ sưu tập ghế công thái học của chúng tôi.
        </p>
        <div className="not-found-actions">
          <Link href="/" className="button button-dark">
            Trở về trang chủ <span>→</span>
          </Link>
          <Link href="/products" className="button button-outline">
            Xem danh mục sản phẩm
          </Link>
          <Link href="/contact" className="button button-text">
            Liên hệ hỗ trợ tư vấn
          </Link>
        </div>
      </div>
    </main>
  );
}
