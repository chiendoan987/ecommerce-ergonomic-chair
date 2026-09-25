"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { formatPrice } from "@/lib/products";

const SHIPPING_FEE = 30000;

export default function CartPage() {
  const { items, itemCount, subtotal, updateQuantity, removeItem } = useCart();
  const shippingFee = items.length > 0 ? SHIPPING_FEE : 0;
  const total = subtotal + shippingFee;

  return <div className="cart-page">
    <header className="cart-hero" data-reveal="up"><div><p className="eyebrow">ERGOCHAIR</p><h1>Giỏ hàng<br /><em>của bạn.</em></h1><p>Những lựa chọn thoải mái cho không gian làm việc của bạn.</p></div><span className="cart-hero-mark" data-reveal="scale" data-reveal-delay="100">{String(itemCount).padStart(2, "0")}<small>SẢN PHẨM</small></span></header>
    <main className="cart-main">
      <div className="cart-heading" data-reveal="fade"><div><p className="eyebrow">TÓM TẮT ĐƠN HÀNG</p><h2>{itemCount} sản phẩm</h2></div><Link className="text-link" href="/products">Tiếp tục mua sắm <span>→</span></Link></div>
      {items.length === 0 ? <section className="cart-empty" data-reveal="scale"><p className="eyebrow">CHƯA CÓ SẢN PHẨM</p><h2>Chiếc ghế phù hợp<br /><em>đang chờ bạn.</em></h2><p>Khám phá bộ sưu tập ErgoChair và tìm người bạn đồng hành cho những ngày làm việc dài.</p><Link className="button button-dark" href="/products">Khám phá sản phẩm <span>→</span></Link></section> : <div className="cart-layout"><section className="cart-items" aria-label="Sản phẩm trong giỏ hàng">{items.map(({ product, quantity }, index) => <article className="cart-item" key={product.id} data-reveal="up" data-reveal-delay={String(index * 80)}><Link className="cart-item-image" href={`/products/${product.id}`} style={{ backgroundImage: `url(${product.image})` }} aria-label={`Xem ${product.name}`} /><div className="cart-item-info"><p className="catalog-category">{product.category}</p><h3>{product.name}</h3><p className="cart-item-price">{formatPrice(product.price)}</p><div className="cart-item-actions"><div className="quantity"><button type="button" onClick={() => updateQuantity(product.id, quantity - 1)} aria-label={`Giảm số lượng ${product.name}`}>−</button><span>{quantity}</span><button type="button" onClick={() => updateQuantity(product.id, quantity + 1)} aria-label={`Tăng số lượng ${product.name}`}>＋</button></div><button className="remove-button" type="button" onClick={() => removeItem(product.id)}>Xóa</button></div></div><strong className="cart-item-total">{formatPrice(product.price * quantity)}</strong></article>)}</section><aside className="cart-summary" data-reveal="scale" data-reveal-delay="120"><p className="eyebrow">CHI TIẾT THANH TOÁN</p><div><span>Tạm tính</span><strong>{formatPrice(subtotal)}</strong></div><div><span>Vận chuyển</span><strong>{formatPrice(shippingFee)}</strong></div><div className="cart-total"><span>Tổng cộng</span><strong>{formatPrice(total)}</strong></div><Link className="button button-dark cart-checkout" href="/checkout">Tiến hành đặt hàng <span>→</span></Link><p className="cart-note">Thanh toán khi nhận hàng (COD).</p></aside></div>}
    </main>
  </div>;
}