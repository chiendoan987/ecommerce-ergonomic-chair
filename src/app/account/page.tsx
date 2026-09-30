"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getOrders } from "@/lib/services/order.service";
import { formatDate, formatPrice } from "@/lib/utils/format";
import type { Order } from "@/lib/types/order";
import "./account.css";

const STATUS_MAP: Record<Order["status"], { label: string; className: string }> = {
  pending: { label: "Chờ xác nhận", className: "status-pending" },
  processing: { label: "Đang chuẩn bị", className: "status-processing" },
  shipped: { label: "Đang giao hàng", className: "status-shipped" },
  completed: { label: "Đã hoàn thành", className: "status-completed" },
  cancelled: { label: "Đã hủy", className: "status-cancelled" },
};

const PAYMENT_MAP: Record<Order["paymentMethod"], string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "Chuyển khoản ngân hàng",
  vnpay: "Cổng thanh toán VNPAY",
  momo: "Ví điện tử MoMo",
};

export default function AccountPage() {
  const router = useRouter();
  const {
    user,
    isLoading: authLoading,
    isAuthenticated,
    logout,
    updateProfile,
    addAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"orders" | "profile" | "addresses">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Profile edit form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [prevUser, setPrevUser] = useState(user);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync profile fields during render when user changes
  if (user !== prevUser) {
    setPrevUser(user);
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phone);
    }
  }

  // New address form state
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrProvince, setAddrProvince] = useState("Hà Nội");
  const [addrDistrict, setAddrDistrict] = useState("");
  const [addrDetail, setAddrDetail] = useState("");
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Load orders
  useEffect(() => {
    let isMounted = true;
    if (user) {
      getOrders(user.id).then((data) => {
        if (!isMounted) return;
        setOrders(data);
        setOrdersLoading(false);
      }).catch(() => {
        if (isMounted) setOrdersLoading(false);
      });
    } else {
      const timer = window.setTimeout(() => {
        if (isMounted) setOrdersLoading(false);
      }, 0);
      return () => {
        isMounted = false;
        window.clearTimeout(timer);
      };
    }

    const handleOrdersChange = () => {
      if (user) {
        getOrders(user.id).then((data) => {
          if (isMounted) setOrders(data);
        });
      }
    };

    window.addEventListener("ergochair-orders-change", handleOrdersChange);
    return () => {
      isMounted = false;
      window.removeEventListener("ergochair-orders-change", handleOrdersChange);
    };
  }, [user]);

  if (authLoading) {
    return (
      <main className="account-loading-page" aria-busy="true">
        <div className="loading-spinner" />
        <p>Đang tải thông tin tài khoản...</p>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="account-page">
        <div className="catalog-breadcrumb" data-reveal="fade">
          <Link href="/">Trang chủ</Link>
          <span>/</span>
          <strong>Tài khoản người dùng</strong>
        </div>
        <main className="account-unauth-container" data-reveal="scale">
          <div className="unauth-icon" aria-hidden="true">🔒</div>
          <h2>Yêu cầu đăng nhập</h2>
          <p>Bạn cần đăng nhập để xem thông tin cá nhân, theo dõi đơn hàng và quản lý sổ địa chỉ.</p>
          <div className="unauth-actions">
            <Link href="/login?redirect=/account" className="button button-dark">
              Đăng nhập tài khoản <span>→</span>
            </Link>
            <Link href="/products" className="button button-outline">
              Khám phá sản phẩm
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    await updateProfile({ fullName, phone });
    setIsSavingProfile(false);
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrName.trim() || !addrPhone.trim() || !addrDistrict.trim() || !addrDetail.trim()) {
      toast.error("Vui lòng điền đầy đủ các thông tin địa chỉ.");
      return;
    }

    setIsSavingAddress(true);
    try {
      await addAddress({
        fullName: addrName.trim(),
        phone: addrPhone.trim(),
        province: addrProvince,
        district: addrDistrict.trim(),
        detail: addrDetail.trim(),
        isDefault: addrIsDefault,
      });
      setIsAddressFormOpen(false);
      setAddrName("");
      setAddrPhone("");
      setAddrDistrict("");
      setAddrDetail("");
      setAddrIsDefault(false);
    } catch {
      toast.error("Lỗi khi thêm địa chỉ.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="account-page">
      <div className="catalog-breadcrumb" data-reveal="fade">
        <Link href="/">Trang chủ</Link>
        <span>/</span>
        <strong>Trung tâm tài khoản</strong>
      </div>

      <main className="account-main">
        {/* User Hero Header */}
        <header className="account-hero-header" data-reveal="up">
          <div className="account-user-badge-wrap">
            <div className="account-avatar-large">
              {user.fullName.trim().charAt(0).toUpperCase()}
            </div>
            <div className="account-user-info">
              <div className="account-name-row">
                <h1>{user.fullName}</h1>
                <span className={`account-role-tag role-${user.role}`}>
                  {user.role === "admin" ? "Quản trị viên" : "Khách hàng thân thiết"}
                </span>
              </div>
              <p className="account-user-meta">
                <span>✉ {user.email}</span>
                <span>☎ {user.phone || "Chưa cập nhật"}</span>
                <span>📅 Tham gia: {formatDate(user.createdAt)}</span>
              </p>
            </div>
          </div>
          <button type="button" className="button button-outline logout-btn" onClick={handleLogout}>
            Đăng xuất
          </button>
        </header>

        {/* Account Nav Tabs */}
        <div className="account-tabs-bar" data-reveal="fade">
          <button
            type="button"
            className={`account-tab-item ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            Đơn hàng của tôi ({orders.length})
          </button>
          <button
            type="button"
            className={`account-tab-item ${activeTab === "addresses" ? "active" : ""}`}
            onClick={() => setActiveTab("addresses")}
          >
            Sổ địa chỉ ({user.addresses.length})
          </button>
          <button
            type="button"
            className={`account-tab-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Thông tin cá nhân
          </button>
        </div>

        {/* Tab 1: Orders */}
        {activeTab === "orders" && (
          <section className="account-tab-panel" data-reveal="up">
            {ordersLoading ? (
              <p className="account-empty-text">Đang tải lịch sử đơn hàng...</p>
            ) : orders.length === 0 ? (
              <div className="account-empty-state">
                <div className="empty-icon" aria-hidden="true">📦</div>
                <h3>Bạn chưa có đơn hàng nào</h3>
                <p>Hãy trải nghiệm các dòng ghế công thái học cao cấp với chính sách bảo hành 5 năm.</p>
                <Link href="/products" className="button button-dark">
                  Khám phá sản phẩm ngay <span>→</span>
                </Link>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] || {
                    label: order.status,
                    className: "status-pending",
                  };
                  return (
                    <article key={order.id} className="order-history-card">
                      <div className="order-card-header">
                        <div className="order-id-date">
                          <strong>Mã đơn: #{order.id}</strong>
                          <time>{formatDate(order.createdAt)}</time>
                        </div>
                        <span className={`order-status-badge ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="order-items-list">
                        {order.items.map((item) => (
                          <div key={item.id} className="order-item-row">
                            <img src={item.productImage} alt={item.productName} />
                            <div className="order-item-details">
                              <h4>
                                <Link href={`/products/${item.productId}`}>
                                  {item.productName}
                                </Link>
                              </h4>
                              <p>Số lượng: {item.quantity}</p>
                            </div>
                            <strong className="order-item-price">
                              {formatPrice(item.price * item.quantity)}
                            </strong>
                          </div>
                        ))}
                      </div>

                      <div className="order-card-footer">
                        <div className="order-meta-info">
                          <p>
                            <strong>Địa chỉ nhận hàng:</strong> {order.shippingAddress.fullName} – {order.shippingAddress.phone} ({order.shippingAddress.detail}, {order.shippingAddress.district}, {order.shippingAddress.province})
                          </p>
                          <p>
                            <strong>Phương thức:</strong> {PAYMENT_MAP[order.paymentMethod] || order.paymentMethod}
                          </p>
                        </div>
                        <div className="order-total-block">
                          <span>Tổng thanh toán:</span>
                          <strong>{formatPrice(order.total)}</strong>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Tab 2: Addresses */}
        {activeTab === "addresses" && (
          <section className="account-tab-panel" data-reveal="up">
            <div className="addresses-header">
              <div>
                <h3>Danh sách địa chỉ giao hàng</h3>
                <p>Quản lý các địa chỉ nhận hàng để thanh toán nhanh hơn khi đặt mua ghế.</p>
              </div>
              <button
                type="button"
                className="button button-dark"
                onClick={() => setIsAddressFormOpen(!isAddressFormOpen)}
              >
                {isAddressFormOpen ? "Đóng biểu mẫu" : "+ Thêm địa chỉ mới"}
              </button>
            </div>

            {/* New Address Form */}
            {isAddressFormOpen && (
              <form className="address-form-box" onSubmit={handleAddressSubmit} data-reveal="fade">
                <h4>Thêm địa chỉ giao hàng mới</h4>
                <div className="form-grid-2">
                  <div className="form-field">
                    <label htmlFor="addr-name">Họ và tên người nhận *</label>
                    <input
                      id="addr-name"
                      type="text"
                      placeholder="Ví dụ: Trần Minh Quân"
                      value={addrName}
                      onChange={(e) => setAddrName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="addr-phone">Số điện thoại *</label>
                    <input
                      id="addr-phone"
                      type="tel"
                      placeholder="0987 654 321"
                      value={addrPhone}
                      onChange={(e) => setAddrPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label htmlFor="addr-province">Tỉnh / Thành phố *</label>
                    <select
                      id="addr-province"
                      value={addrProvince}
                      onChange={(e) => setAddrProvince(e.target.value)}
                    >
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                      <option value="Hải Phòng">Hải Phòng</option>
                      <option value="Cần Thơ">Cần Thơ</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="addr-district">Quận / Huyện *</label>
                    <input
                      id="addr-district"
                      type="text"
                      placeholder="Ví dụ: Quận Cầu Giấy"
                      value={addrDistrict}
                      onChange={(e) => setAddrDistrict(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="addr-detail">Địa chỉ chi tiết (Số nhà, tên đường, tòa nhà) *</label>
                  <input
                    id="addr-detail"
                    type="text"
                    placeholder="Ví dụ: Tầng 6, Số 123 Duy Tân"
                    value={addrDetail}
                    onChange={(e) => setAddrDetail(e.target.value)}
                    required
                  />
                </div>

                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={addrIsDefault}
                    onChange={(e) => setAddrIsDefault(e.target.checked)}
                  />
                  <span>Đặt làm địa chỉ giao hàng mặc định</span>
                </label>

                <div className="address-form-actions">
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => setIsAddressFormOpen(false)}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="button button-dark"
                    disabled={isSavingAddress}
                  >
                    {isSavingAddress ? "Đang lưu..." : "Lưu địa chỉ"} <span>→</span>
                  </button>
                </div>
              </form>
            )}

            {/* Address Cards Grid */}
            {user.addresses.length === 0 ? (
              <div className="account-empty-state">
                <p>Bạn chưa lưu địa chỉ giao hàng nào. Hãy thêm địa chỉ để thanh toán thuận tiện hơn.</p>
              </div>
            ) : (
              <div className="address-cards-grid">
                {user.addresses.map((addr) => (
                  <article key={addr.id} className={`address-card ${addr.isDefault ? "is-default" : ""}`}>
                    <div className="address-card-top">
                      <strong>{addr.fullName}</strong>
                      {addr.isDefault && (
                        <span className="default-badge">Mặc định</span>
                      )}
                    </div>
                    <p className="address-phone">☎ {addr.phone}</p>
                    <p className="address-location">
                      {addr.detail}, {addr.district}, {addr.province}
                    </p>
                    <div className="address-card-actions">
                      {!addr.isDefault && addr.id && (
                        <button
                          type="button"
                          className="btn-set-default"
                          onClick={() => setDefaultAddress(addr.id!)}
                        >
                          Đặt mặc định
                        </button>
                      )}
                      {addr.id && (
                        <button
                          type="button"
                          className="btn-delete-addr"
                          onClick={() => deleteAddress(addr.id!)}
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Profile */}
        {activeTab === "profile" && (
          <section className="account-tab-panel" data-reveal="up">
            <div className="profile-form-container">
              <h3>Chỉnh sửa thông tin cá nhân</h3>
              <p className="profile-subtitle">Cập nhật thông tin liên hệ của bạn tại ErgoChair.</p>

              <form className="profile-form" onSubmit={handleProfileSubmit}>
                <div className="form-field">
                  <label htmlFor="profile-fullname">Họ và tên</label>
                  <input
                    id="profile-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="profile-email">Địa chỉ Email</label>
                  <input
                    id="profile-email"
                    type="email"
                    value={user.email}
                    disabled
                    readOnly
                    className="input-disabled"
                  />
                  <small className="field-hint">Email định danh tài khoản, không thể thay đổi.</small>
                </div>

                <div className="form-field">
                  <label htmlFor="profile-phone">Số điện thoại</label>
                  <input
                    id="profile-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912 345 678"
                  />
                </div>

                <div className="profile-actions">
                  <button
                    type="submit"
                    className="button button-dark"
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile ? "Đang lưu thay đổi..." : "Lưu thay đổi"} <span>→</span>
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
