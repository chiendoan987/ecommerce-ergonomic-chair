"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { formatPrice } from "@/lib/products";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const total = Number(searchParams.get("total"));
  const orderTotal = Number.isFinite(total) && total > 0 ? total : 0;

  return <main className="order-success-page"><section className="order-success-card" data-reveal="scale"><span className="order-success-mark">✓</span><p className="eyebrow">ERGOCHAIR / CẢM ƠN BẠN</p><h1>Đặt hàng<br /><em>thành công!</em></h1><p>Cảm ơn bạn đã mua hàng tại ErgoChair. Đơn hàng demo của bạn đã được ghi nhận.</p><div className="order-success-details"><div><span>Tổng tiền đơn hàng</span><strong>{formatPrice(orderTotal)}</strong></div><div><span>Phương thức thanh toán</span><strong>COD</strong></div></div><div className="order-success-actions"><Link className="button button-dark" href="/products">Tiếp tục mua sắm <span>→</span></Link><Link className="text-link" href="/">Về trang chủ <span>→</span></Link></div></section></main>;
}

export default function OrderSuccessPage() {
  return <Suspense fallback={<main className="order-success-page" aria-busy="true" />}><OrderSuccessContent /></Suspense>;
}
