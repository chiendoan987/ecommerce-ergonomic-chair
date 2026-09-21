"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { formatPrice } from "@/lib/products";

type DeliveryForm = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  note: string;
};

type FormErrors = Partial<Record<keyof DeliveryForm, string>>;

const SHIPPING_FEE = 30000;
const initialForm: DeliveryForm = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  district: "",
  note: "",
};

function validateForm(form: DeliveryForm) {
  const errors: FormErrors = {};
  if (!form.fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên.";
  if (!form.phone.trim()) errors.phone = "Vui lòng nhập số điện thoại.";
  else {
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 11) errors.phone = "Vui lòng nhập số điện thoại hợp lệ.";
  }
  if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Vui lòng nhập email hợp lệ.";
  if (!form.address.trim()) errors.address = "Vui lòng nhập địa chỉ.";
  if (!form.city.trim()) errors.city = "Vui lòng nhập tỉnh/thành phố.";
  if (!form.district.trim()) errors.district = "Vui lòng nhập quận/huyện.";
  return errors;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const shippingFee = items.length > 0 ? SHIPPING_FEE : 0;
  const total = subtotal + shippingFee;

  const updateField = (field: keyof DeliveryForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (items.length === 0) return;
    const nextErrors = validateForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setSubmitting(true);
    clearCart();
    router.push(`/order-success?total=${total}`);
  };

  if (items.length === 0) {
    return <main className="checkout-page"><section className="checkout-empty"><p className="eyebrow">ERGOCHAIR</p><h1>Giỏ hàng của bạn<br /><em>đang trống.</em></h1><p>Thêm một sản phẩm trước khi tiến hành đặt hàng.</p><Link className="button button-dark" href="/products">Tiếp tục mua sắm <span>→</span></Link><Link className="text-link checkout-back-link" href="/cart">Quay lại giỏ hàng</Link></section></main>;
  }

  return <main className="checkout-page">
    <header className="checkout-hero"><div><p className="eyebrow">ERGOCHAIR / ĐẶT HÀNG</p><h1>Hoàn tất<br /><em>đơn hàng.</em></h1><p>Chỉ còn vài thông tin để chiếc ghế phù hợp đến với bạn.</p></div></header>
    <div className="checkout-layout">
      <form className="checkout-form" onSubmit={handleSubmit} noValidate>
        <div className="checkout-section-heading"><p className="eyebrow">THÔNG TIN GIAO HÀNG</p><h2>Nhận hàng ở đâu?</h2></div>
        <div className="checkout-fields">
          <label>Họ và tên<input type="text" value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} aria-invalid={Boolean(errors.fullName)} required />{errors.fullName && <small>{errors.fullName}</small>}</label>
          <label>Số điện thoại<input type="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} aria-invalid={Boolean(errors.phone)} required />{errors.phone && <small>{errors.phone}</small>}</label>
          <label>Email <span>(không bắt buộc)</span><input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} aria-invalid={Boolean(errors.email)} />{errors.email && <small>{errors.email}</small>}</label>
          <label>Địa chỉ<input type="text" value={form.address} onChange={(event) => updateField("address", event.target.value)} aria-invalid={Boolean(errors.address)} required />{errors.address && <small>{errors.address}</small>}</label>
          <label>Tỉnh/Thành phố<input type="text" value={form.city} onChange={(event) => updateField("city", event.target.value)} aria-invalid={Boolean(errors.city)} required />{errors.city && <small>{errors.city}</small>}</label>
          <label>Quận/Huyện<input type="text" value={form.district} onChange={(event) => updateField("district", event.target.value)} aria-invalid={Boolean(errors.district)} required />{errors.district && <small>{errors.district}</small>}</label>
          <label className="checkout-note-field">Ghi chú đơn hàng <span>(không bắt buộc)</span><textarea rows={4} value={form.note} onChange={(event) => updateField("note", event.target.value)} /></label>
        </div>
        <div className="checkout-payment"><p className="eyebrow">PHƯƠNG THỨC THANH TOÁN</p><div><span className="payment-radio" aria-hidden="true" /> <strong>Thanh toán khi nhận hàng (COD)</strong></div><p>Thanh toán khi nhận ghế. Đây là lựa chọn mô phỏng cho đơn hàng demo.</p></div>
        <button className="button button-dark checkout-submit" type="submit" disabled={submitting}>{submitting ? "Đang đặt hàng..." : "Đặt hàng"}<span>→</span></button>
      </form>
      <aside className="checkout-summary"><p className="eyebrow">TÓM TẮT ĐƠN HÀNG</p><div className="checkout-items">{items.map(({ product, quantity }) => <div className="checkout-item" key={product.id}><div className="checkout-item-image" style={{ backgroundImage: `url(${product.image})` }} /><div><strong>{product.name}</strong><span>{quantity} × {formatPrice(product.price)}</span></div><b>{formatPrice(product.price * quantity)}</b></div>)}</div><div className="checkout-totals"><div><span>Tạm tính</span><strong>{formatPrice(subtotal)}</strong></div><div><span>Phí vận chuyển</span><strong>{formatPrice(shippingFee)}</strong></div><div className="checkout-total"><span>Tổng cộng</span><strong>{formatPrice(total)}</strong></div></div></aside>
    </div>
  </main>;
}
