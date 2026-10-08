"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useMemo } from "react";
import { useCart } from "@/components/cart-provider";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { createOrder } from "@/lib/services/order.service";
import { formatPrice } from "@/lib/utils/format";
import type { PaymentMethod, ShippingMethod } from "@/lib/types/order";
import { VIETNAM_PROVINCES } from "@/lib/constants/locations";
import "./checkout.css";

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

const initialForm: DeliveryForm = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  city: "Hà Nội",
  district: "Quận Cầu Giấy",
  note: "",
};

function validateForm(form: DeliveryForm) {
  const errors: FormErrors = {};
  if (!form.fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên người nhận.";
  if (!form.phone.trim()) {
    errors.phone = "Vui lòng nhập số điện thoại.";
  } else {
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 11) {
      errors.phone = "Số điện thoại phải từ 9 đến 11 chữ số (VD: 0987654321).";
    }
  }
  if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
    errors.email = "Vui lòng nhập email hợp lệ (VD: user@example.com).";
  }
  if (!form.address.trim()) errors.address = "Vui lòng nhập địa chỉ cụ thể (số nhà, tên đường).";
  if (!form.city.trim()) errors.city = "Vui lòng chọn tỉnh/thành phố.";
  if (!form.district.trim()) errors.district = "Vui lòng chọn hoặc nhập quận/huyện.";
  return errors;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");
  const [submitting, setSubmitting] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const currentProvinceData = useMemo(() => {
    return VIETNAM_PROVINCES.find((p) => p.name === form.city) || VIETNAM_PROVINCES[0];
  }, [form.city]);

  const isMajorCity = currentProvinceData?.isMajorCity ?? true;

  let shippingFee = 0;
  if (items.length > 0) {
    if (shippingMethod === "express") {
      shippingFee = 60000;
    } else if (shippingMethod === "assembly") {
      shippingFee = subtotal >= 5000000 ? 50000 : 120000;
    } else {
      shippingFee = subtotal >= 2000000 ? 0 : (isMajorCity ? 30000 : 45000);
    }
  }
  const total = subtotal + shippingFee;

  const shippingOptions: Array<{
    id: ShippingMethod;
    name: string;
    carrier: string;
    desc: string;
    time: string;
    fee: number;
  }> = [
    {
      id: "standard",
      name: "Giao hàng Tiêu chuẩn",
      carrier: isMajorCity ? "GHTK / Viettel Post" : "Viettel Post Liên tỉnh",
      desc: "Vận chuyển an toàn, giao tận nhà trên toàn quốc. Đơn từ 2.000.000đ được miễn cước.",
      time: isMajorCity ? "3 – 4 ngày làm việc" : "4 – 5 ngày làm việc",
      fee: subtotal >= 2000000 ? 0 : (isMajorCity ? 30000 : 45000),
    },
    {
      id: "express",
      name: "Giao Hỏa Tốc 2H",
      carrier: "Ahamove / GrabExpress Nội thành",
      desc: "Giao nhận siêu tốc trong ngày, đóng gói và ưu tiên xuất kho lập tức.",
      time: "2 – 4 tiếng (trong ngày)",
      fee: 60000,
    },
    {
      id: "assembly",
      name: "Giao & Lắp đặt tận phòng",
      carrier: "Kỹ thuật viên ErgoCare Logistics",
      desc: "Kỹ thuật viên giao tận phòng, bóc hộp lắp ráp và hướng dẫn cân chỉnh tư thế chuẩn công thái học.",
      time: "Hẹn giờ linh hoạt (1 – 2 ngày)",
      fee: subtotal >= 5000000 ? 50000 : 120000,
    },
  ];

  const [prevUser, setPrevUser] = useState(user);

  // Auto-fill from user profile when authenticated (during render)
  if (user !== prevUser) {
    setPrevUser(user);
    if (user) {
      const defaultAddr = user.addresses.find((a) => a.isDefault) || user.addresses[0];
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName,
        phone: prev.phone || user.phone || "",
        email: prev.email || user.email || "",
        address: prev.address || defaultAddr?.detail || "",
        city: prev.city || defaultAddr?.province || "Hà Nội",
        district: prev.district || defaultAddr?.district || "Quận Cầu Giấy",
      }));
      if (defaultAddr?.id) {
        setSelectedAddressId(defaultAddr.id);
      }
    }
  }

  const handleSelectSavedAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    if (!user) return;
    const addr = user.addresses.find((a) => a.id === addressId);
    if (addr) {
      setForm((prev) => ({
        ...prev,
        fullName: addr.fullName,
        phone: addr.phone,
        address: addr.detail,
        city: addr.province,
        district: addr.district,
      }));
      setErrors({});
    }
  };

  const updateField = (field: keyof DeliveryForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleCityChange = (newCity: string) => {
    const prov = VIETNAM_PROVINCES.find((p) => p.name === newCity);
    const defaultDistrict = prov && prov.districts.length > 0 ? prov.districts[0] : "";
    setForm((prev) => ({
      ...prev,
      city: newCity,
      district: defaultDistrict,
    }));
    setErrors((prev) => ({ ...prev, city: undefined, district: undefined }));
  };

  const handleFillDemoData = () => {
    setForm({
      fullName: "Nguyễn Văn An",
      phone: "0987654321",
      email: "khachhang.demo@gmail.com",
      address: "123 Đường Cầu Giấy, Phường Dịch Vọng",
      city: "Hà Nội",
      district: "Quận Cầu Giấy",
      note: "Giao giờ hành chính, gọi trước 15 phút",
    });
    setErrors({});
    toast.success("Đã điền thông tin nhận hàng mẫu để test nhanh!");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (items.length === 0) {
      toast.warning("Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm trước khi thanh toán.");
      router.push("/products");
      return;
    }

    const nextErrors = validateForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);

      const errorKeys = Object.keys(nextErrors) as (keyof DeliveryForm)[];
      const firstField = errorKeys[0];
      const errorMsg = nextErrors[firstField];

      toast.error(errorMsg || "Vui lòng điền đầy đủ thông tin nhận hàng trước khi thanh toán!");

      // Cuộn mượt đến input đầu tiên bị lỗi và focus
      setTimeout(() => {
        const targetInput = document.getElementById(`field-${firstField}`) || document.querySelector(`[name="${firstField}"]`);
        if (targetInput) {
          targetInput.scrollIntoView({ behavior: "smooth", block: "center" });
          (targetInput as HTMLElement).focus();
        }
      }, 50);
      return;
    }

    setSubmitting(true);

    try {
      const sanitizedPhone = form.phone.replace(/[^\d+]/g, "").trim();
      const order = await createOrder({
        userId: user?.id ?? null,
        items: items.map((i) => ({
          product: {
            id: i.product.id,
            name: i.product.name,
            price: i.product.price,
            image: i.product.image || i.product.images?.[0] || "/images/products/cloud-mesh-air.png",
          },
          quantity: i.quantity,
          variantId: (i as any).variantId || null,
        })),
        shippingAddress: {
          fullName: form.fullName.trim(),
          phone: sanitizedPhone || form.phone.trim(),
          email: form.email.trim(),
          detail: form.address.trim(),
          province: form.city.trim(),
          district: form.district.trim(),
          note: form.note.trim(),
        },
        paymentMethod,
        shippingMethod,
        shippingFee,
      });

      clearCart();
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("ergochair_last_order_id", order.id);
          localStorage.setItem("ergochair_last_order_phone", form.phone.trim());
        } catch {}
      }
      const carrierParam = encodeURIComponent(order.carrier || "");
      const trackingParam = encodeURIComponent(order.trackingCode || "");
      const estParam = encodeURIComponent(order.estimatedDelivery || "");

      if (paymentMethod === "cod") {
        toast.success("Đặt hàng thành công!");
        router.push(
          `/order-success?orderId=${order.id}&total=${order.total}&method=cod&shipping=${shippingMethod}&carrier=${carrierParam}&tracking=${trackingParam}&est=${estParam}&paymentStatus=unpaid`
        );
      } else {
        toast.info("Đang chuyển đến cổng thanh toán trực tuyến...");
        router.push(
          `/checkout/payment?orderId=${order.id}&method=${paymentMethod}&total=${order.total}&shipping=${shippingMethod}&carrier=${carrierParam}&tracking=${trackingParam}&est=${estParam}`
        );
      }
    } catch (err: any) {
      console.error("Lỗi khi tạo đơn hàng:", err);
      toast.error(err?.message || "Đã xảy ra lỗi khi tạo đơn hàng. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="checkout-page">
        <section className="checkout-empty" data-reveal="scale">
          <p className="eyebrow">ERGOCHAIR</p>
          <h1>Giỏ hàng của bạn<br /><em>đang trống.</em></h1>
          <p>Thêm một sản phẩm trước khi tiến hành đặt hàng.</p>
          <Link className="button button-dark" href="/products">
            Tiếp tục mua sắm <span>→</span>
          </Link>
          <Link className="text-link checkout-back-link" href="/cart">
            Quay lại giỏ hàng
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-top-header" data-reveal="fade">
        <div className="catalog-breadcrumb">
          <Link href="/">Trang chủ</Link>
          <span>/</span>
          <Link href="/cart">Giỏ hàng</Link>
          <span>/</span>
          <strong>Thanh toán</strong>
        </div>
        <div className="checkout-header-title-row">
          <h1>Thanh toán & Đặt hàng</h1>
          <p>Vui lòng điền thông tin giao hàng để chúng tôi xử lý đơn hàng của bạn.</p>
        </div>
      </div>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit} noValidate data-reveal="up" data-reveal-delay="80">
          {/* Auth Status Banner */}
          {isAuthenticated && user ? (
            <div className="checkout-auth-banner">
              <span className="auth-banner-avatar">{user.fullName.charAt(0).toUpperCase()}</span>
              <div>
                <strong>Đặt hàng với tài khoản: {user.fullName}</strong>
                <p>{user.email} • Thông tin đơn hàng sẽ được lưu vào lịch sử tài khoản của bạn.</p>
              </div>
            </div>
          ) : (
            <div className="checkout-guest-banner">
              <p>
                <strong>Bạn đang mua hàng với chế độ Khách (Guest Checkout).</strong>
                <br />
                Đã có tài khoản?{" "}
                <Link href="/login?redirect=/checkout" className="checkout-login-link">
                  Đăng nhập ngay
                </Link>{" "}
                để tự động điền địa chỉ giao hàng và tích lũy ưu đãi.
              </p>
            </div>
          )}

          {/* Saved Addresses Picker (if available) */}
          {isAuthenticated && user && user.addresses.length > 0 && (
            <div className="saved-addresses-selector">
              <label className="selector-title">Chọn từ sổ địa chỉ đã lưu:</label>
              <div className="saved-addr-chips">
                {user.addresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    className={`addr-chip ${selectedAddressId === addr.id ? "active" : ""}`}
                    onClick={() => handleSelectSavedAddress(addr.id!)}
                  >
                    <strong>{addr.fullName}</strong>
                    <span>{addr.detail}, {addr.district}, {addr.province}</span>
                    {addr.isDefault && <small>(Mặc định)</small>}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="checkout-section-heading checkout-section-heading-row">
            <div>
              <p className="eyebrow">THÔNG TIN GIAO HÀNG</p>
              <h2>Nhận hàng ở đâu?</h2>
            </div>
            <button
              type="button"
              className="checkout-demo-autofill-btn"
              onClick={handleFillDemoData}
              title="Điền nhanh họ tên, SĐT, địa chỉ mẫu để thử nghiệm đặt hàng & thanh toán"
            >
              ⚡ Điền nhanh thông tin mẫu để test
            </button>
          </div>

          <div className="checkout-fields">
            <label>
              Họ và tên *
              <input
                id="field-fullName"
                name="fullName"
                type="text"
                placeholder="Ví dụ: Nguyễn Văn An"
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                aria-invalid={Boolean(errors.fullName)}
                required
              />
              {errors.fullName && <small>{errors.fullName}</small>}
            </label>

            <label>
              Số điện thoại *
              <input
                id="field-phone"
                name="phone"
                type="tel"
                placeholder="Ví dụ: 0987654321"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                aria-invalid={Boolean(errors.phone)}
                required
              />
              {errors.phone && <small>{errors.phone}</small>}
            </label>

            <label>
              Email <span>(để nhận thông báo đơn hàng)</span>
              <input
                id="field-email"
                name="email"
                type="email"
                placeholder="Ví dụ: an.nguyen@example.com"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <small>{errors.email}</small>}
            </label>

            <label>
              Địa chỉ chi tiết (Số nhà, tên đường) *
              <input
                id="field-address"
                name="address"
                type="text"
                placeholder="Ví dụ: 123 Đường Cầu Giấy, Phường Dịch Vọng"
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                aria-invalid={Boolean(errors.address)}
                required
              />
              {errors.address && <small>{errors.address}</small>}
            </label>

            <label>
              Tỉnh/Thành phố *
              <select
                id="field-city"
                name="city"
                className="checkout-select"
                value={form.city}
                onChange={(event) => handleCityChange(event.target.value)}
                aria-invalid={Boolean(errors.city)}
                required
              >
                {VIETNAM_PROVINCES.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} {p.isMajorCity ? "(Trung tâm)" : ""}
                  </option>
                ))}
              </select>
              {errors.city && <small>{errors.city}</small>}
            </label>

            <label>
              Quận/Huyện *
              {currentProvinceData.districts.length > 0 ? (
                <select
                  id="field-district"
                  name="district"
                  className="checkout-select"
                  value={form.district}
                  onChange={(event) => updateField("district", event.target.value)}
                  aria-invalid={Boolean(errors.district)}
                  required
                >
                  {currentProvinceData.districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="field-district"
                  name="district"
                  type="text"
                  placeholder="Nhập quận/huyện của bạn"
                  value={form.district}
                  onChange={(event) => updateField("district", event.target.value)}
                  aria-invalid={Boolean(errors.district)}
                  required
                />
              )}
              {errors.district && <small>{errors.district}</small>}
            </label>

            <label className="checkout-note-field">
              Ghi chú đơn hàng <span>(không bắt buộc)</span>
              <textarea
                id="field-note"
                name="note"
                rows={3}
                placeholder="Yêu cầu giờ giao, lưu ý vị trí lắp đặt..."
                value={form.note}
                onChange={(event) => updateField("note", event.target.value)}
              />
            </label>
          </div>

          {/* =========================================================================
              HÌNH THỨC VẬN CHUYỂN (Mô phỏng Đơn vị vận chuyển thật)
             ========================================================================= */}
          <div className="checkout-shipping">
            <div className="checkout-section-heading">
              <p className="eyebrow">ĐƠN VỊ VẬN CHUYỂN</p>
              <h2>Chọn hình thức giao hàng</h2>
            </div>

            {/* Free shipping tracker */}
            <div className="free-shipping-tracker">
              <span className="free-shipping-icon">🚛</span>
              {subtotal >= 2000000 ? (
                <div>
                  <strong>Chúc mừng! Đơn hàng đủ điều kiện MIỄN PHÍ giao hàng tiêu chuẩn toàn quốc.</strong>
                </div>
              ) : (
                <div>
                  Mua thêm <strong>{formatPrice(2000000 - subtotal)}</strong> để nhận <strong>Miễn phí giao hàng tiêu chuẩn toàn quốc</strong>.
                </div>
              )}
            </div>

            <div className="shipping-options-grid">
              {shippingOptions.map((opt) => (
                <label
                  key={opt.id}
                  className={`shipping-option ${shippingMethod === opt.id ? "active" : ""}`}
                >
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingMethod === opt.id}
                    onChange={() => setShippingMethod(opt.id)}
                  />
                  <div className="shipping-option-content">
                    <div className="shipping-option-header">
                      <div className="shipping-option-name">
                        <strong>{opt.name}</strong>
                        <span className="shipping-carrier-pill">{opt.carrier}</span>
                      </div>
                      <span className={`shipping-option-price ${opt.fee === 0 ? "free" : ""}`}>
                        {opt.fee === 0 ? "MIỄN PHÍ" : formatPrice(opt.fee)}
                      </span>
                    </div>
                    <p className="shipping-option-desc">{opt.desc}</p>
                    <span className="shipping-option-time">
                      ⏱ Thời gian giao: {opt.time}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="checkout-payment">
            <p className="eyebrow">PHƯƠNG THỨC THANH TOÁN</p>
            <div className="payment-options-grid">
              <label className={`payment-option ${paymentMethod === "cod" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                <div>
                  <strong>Thanh toán khi nhận hàng (COD)</strong>
                  <p>Nhận ghế, kiểm tra và thanh toán trực tiếp cho nhân viên giao hàng.</p>
                </div>
              </label>

              <label className={`payment-option ${paymentMethod === "bank_transfer" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "bank_transfer"}
                  onChange={() => setPaymentMethod("bank_transfer")}
                />
                <div>
                  <strong>Chuyển khoản ngân hàng</strong>
                  <p>Quét mã VietQR chuyển khoản nhanh sau khi đặt hàng.</p>
                </div>
              </label>

              <label className={`payment-option ${paymentMethod === "vnpay" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "vnpay"}
                  onChange={() => setPaymentMethod("vnpay")}
                />
                <div>
                  <strong>Cổng thanh toán VNPAY</strong>
                  <p>Thẻ ATM nội địa, Visa, Mastercard, JCB (mô phỏng sandbox).</p>
                </div>
              </label>

              <label className={`payment-option ${paymentMethod === "momo" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "momo"}
                  onChange={() => setPaymentMethod("momo")}
                />
                <div>
                  <strong>Ví điện tử MoMo</strong>
                  <p>Quét mã MoMo QR tức thì trên điện thoại (mô phỏng sandbox).</p>
                </div>
              </label>
            </div>
          </div>

          <button className="button button-dark checkout-submit" type="submit" disabled={submitting}>
            {submitting ? (
              <>Đang xử lý đơn hàng...</>
            ) : paymentMethod === "cod" ? (
              <>
                Hoàn tất đặt hàng (Thanh toán COD) <span>→</span>
              </>
            ) : paymentMethod === "bank_transfer" ? (
              <>
                Tiếp tục quét mã VietQR <span>→</span>
              </>
            ) : paymentMethod === "vnpay" ? (
              <>
                Tiếp tục qua Cổng VNPAY <span>→</span>
              </>
            ) : (
              <>
                Tiếp tục qua Ví MoMo <span>→</span>
              </>
            )}
          </button>
        </form>

        <aside className="checkout-summary" data-reveal="scale" data-reveal-delay="120">
          <p className="eyebrow">TÓM TẮT ĐƠN HÀNG</p>
          <div className="checkout-items">
            {items.map(({ product, quantity }) => (
              <div className="checkout-item" key={product.id}>
                <div className="checkout-item-image" style={{ backgroundImage: `url(${product.image})` }} />
                <div>
                  <strong>{product.name}</strong>
                  <span>{quantity} × {formatPrice(product.price)}</span>
                </div>
                <b>{formatPrice(product.price * quantity)}</b>
              </div>
            ))}
          </div>
          <div className="checkout-totals">
            <div>
              <span>Tạm tính</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
            <div>
              <span>Phí vận chuyển ({shippingOptions.find((o) => o.id === shippingMethod)?.name})</span>
              <strong className={shippingFee === 0 ? "text-emerald-600" : ""}>
                {shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}
              </strong>
            </div>
            <div className="checkout-total">
              <span>Tổng cộng</span>
              <strong>{formatPrice(total)}</strong>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
