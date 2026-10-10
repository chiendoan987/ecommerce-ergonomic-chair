"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getOrders, getOrderById } from "@/lib/services/order.service";
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

const ORDER_STEPS = [
  { step: 1, label: "Đã đặt hàng" },
  { step: 2, label: "Đang đóng gói" },
  { step: 3, label: "Đang giao hàng" },
  { step: 4, label: "Hoàn tất" },
];

function getOrderStepIndex(status: Order["status"]): number {
  switch (status) {
    case "pending": return 1;
    case "processing": return 2;
    case "shipped": return 3;
    case "completed": return 4;
    default: return 0;
  }
}

/**
 * Component hiển thị Card đơn hàng chuẩn với thanh tiến trình trực quan
 */
function OrderCardItem({ order, isHighlighted }: { order: Order; isHighlighted?: boolean }) {
  const statusInfo = STATUS_MAP[order.status] || {
    label: order.status,
    className: "status-pending",
  };

  return (
    <article
      id={`order-${order.id}`}
      className={`order-history-card ${isHighlighted ? "is-highlighted" : ""}`}
      style={isHighlighted ? { border: "2px solid #8b7355", boxShadow: "0 6px 24px rgba(139, 115, 85, 0.12)" } : {}}
    >
      <div className="order-card-header">
        <div className="order-id-date">
          <strong>Mã đơn: #{order.id}</strong>
          <time>{formatDate(order.createdAt)}</time>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {isHighlighted && (
            <span style={{ fontSize: "11px", fontWeight: 700, background: "#8b7355", color: "#fff", padding: "3px 8px", borderRadius: "12px" }}>
              Đang xem
            </span>
          )}
          <span className={`order-status-badge ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Thanh tiến trình trực quan */}
      {order.status !== "cancelled" && (
        <div className="order-card-stepper">
          <div className="order-stepper-track">
            {ORDER_STEPS.map((stepItem, idx) => {
              const stepIdx = getOrderStepIndex(order.status);
              const isPassed = stepIdx > stepItem.step || (stepItem.step === 4 && stepIdx === 4);
              const isCurrent = stepIdx === stepItem.step;
              return (
                <div
                  key={stepItem.step}
                  className={`order-step-node ${isPassed ? "is-passed" : ""} ${isCurrent ? "is-current" : ""}`}
                >
                  <div className="node-dot">
                    {isPassed ? "✓" : stepItem.step}
                  </div>
                  <span className="node-label">{stepItem.label}</span>
                  {idx < ORDER_STEPS.length - 1 && (
                    <div
                      className={`node-connector ${stepIdx > stepItem.step ? "is-active" : ""}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="order-delivery-status-note">
            <span>
              🚚 Đơn vị: <strong>{order.carrier || "Giao Hàng Tiết Kiệm (GHTK)"}</strong>
              {order.trackingCode && <> • Vận đơn: <strong>{order.trackingCode}</strong></>}
            </span>
            {order.estimatedDelivery && (
              <span>
                📅 Dự kiến nhận: <strong>{formatDate(order.estimatedDelivery)}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Danh sách sản phẩm */}
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

      {/* Thông tin giao nhận và thanh toán */}
      <div className="order-card-footer">
        <div className="order-meta-info">
          <p>
            <strong>Địa chỉ nhận hàng:</strong> {order.shippingAddress.fullName} – {order.shippingAddress.phone} ({order.shippingAddress.detail}, {order.shippingAddress.district}, {order.shippingAddress.province})
          </p>
          <p>
            <strong>Vận chuyển:</strong> {order.carrier || "Giao Hàng Tiết Kiệm (GHTK)"}
            {order.trackingCode && <> • Mã vận đơn: <span style={{ color: "#8b7355", fontWeight: 600 }}>{order.trackingCode}</span></>}
          </p>
          <p>
            <strong>Thanh toán:</strong> {PAYMENT_MAP[order.paymentMethod] || order.paymentMethod}
            {order.paymentStatus === "paid" ? (
              <span style={{ marginLeft: "8px", color: "#15803d", fontWeight: 600, background: "#f0fdf4", padding: "2px 8px", borderRadius: "12px", border: "1px solid #bbf7d0", fontSize: "11.5px" }}>
                ✓ Đã thanh toán
              </span>
            ) : order.paymentMethod === "cod" ? (
              <span style={{ marginLeft: "8px", color: "#786e63", background: "#f7f5f2", padding: "2px 8px", borderRadius: "12px", border: "1px solid #ede5d8", fontSize: "11.5px" }}>
                Thu tiền khi nhận hàng (COD)
              </span>
            ) : (
              <span style={{ marginLeft: "8px", color: "#b45309", background: "#fef9ee", padding: "2px 8px", borderRadius: "12px", border: "1px solid #fde68a", fontSize: "11.5px" }}>
                ⏳ Chờ thanh toán
              </span>
            )}
          </p>
        </div>
        <div className="order-total-block">
          <span>Tổng thanh toán:</span>
          <strong>{formatPrice(order.total)}</strong>
          {order.paymentStatus !== "paid" && order.paymentMethod !== "cod" && order.status !== "cancelled" && (
            <Link
              href={`/checkout/payment?orderId=${encodeURIComponent(order.id)}&method=${order.paymentMethod}&total=${order.total}`}
              style={{
                display: "inline-block",
                marginTop: "6px",
                fontSize: "12px",
                color: "#8b7355",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              Quét mã thanh toán <span>→</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryOrderId = searchParams.get("orderId");
  const queryTab = searchParams.get("tab");

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
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");

  // Tra cứu đơn hàng cho khách (Guest / Chatbot link)
  const [lookupQuery, setLookupQuery] = useState(queryOrderId || "");
  const [guestOrders, setGuestOrders] = useState<Order[]>([]);
  const [guestLookupLoading, setGuestLookupLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentOrderId, setRecentOrderId] = useState<string | null>(null);

  // Profile edit form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [prevUser, setPrevUser] = useState(user);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Cập nhật activeTab khi có param ?tab=
  useEffect(() => {
    if (queryTab === "profile" || queryTab === "addresses") {
      setActiveTab(queryTab);
    } else {
      setActiveTab("orders");
    }
  }, [queryTab]);

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

  // Hàm tra cứu đơn hàng theo Mã đơn hoặc Số điện thoại
  const performLookup = async (query: string) => {
    const clean = query.trim();
    if (!clean) return;
    setGuestLookupLoading(true);
    setHasSearched(true);

    try {
      // 1. Thử tìm theo ID trước nếu chuỗi giống ID (VD: ord-...)
      if (clean.toLowerCase().startsWith("ord-") || clean.length >= 8) {
        const single = await getOrderById(clean);
        if (single) {
          setGuestOrders([single]);
          setGuestLookupLoading(false);
          return;
        }
      }

      // 2. Tra cứu qua API search
      const res = await fetch(`/api/orders?search=${encodeURIComponent(clean)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data: Order[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setGuestOrders(data);
          setGuestLookupLoading(false);
          return;
        }
      }

      // 3. Fallback thử lại ID
      const fallbackSingle = await getOrderById(clean);
      if (fallbackSingle) {
        setGuestOrders([fallbackSingle]);
      } else {
        setGuestOrders([]);
      }
    } catch (err) {
      console.error("Lỗi tra cứu đơn hàng:", err);
      setGuestOrders([]);
    } finally {
      setGuestLookupLoading(false);
    }
  };

  // Tự động tải đơn hàng khi có orderId trên URL hoặc có recentOrderId trong localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedLastOrder = localStorage.getItem("ergochair_last_order_id");
      if (storedLastOrder) {
        setRecentOrderId(storedLastOrder);
      }

      if (queryOrderId) {
        localStorage.setItem("ergochair_last_order_id", queryOrderId);
        setRecentOrderId(queryOrderId);
        setActiveTab("orders");
        setOrderStatusFilter("all");
      }

      const targetId = queryOrderId || storedLastOrder;
      if (targetId) {
        setLookupQuery(targetId);
        performLookup(targetId);
      }
    }
  }, [queryOrderId]);

  // Tự động cuộn đến đơn hàng được chọn
  useEffect(() => {
    if (queryOrderId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`order-${queryOrderId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [queryOrderId, orders, guestOrders]);

  // Load orders cho tài khoản đã đăng nhập
  useEffect(() => {
    let isMounted = true;
    if (user) {
      getOrders(user.id).then(async (data) => {
        if (!isMounted) return;
        let finalOrders = [...data];

        // Nếu có queryOrderId mà chưa có trong danh sách orders của user, fetch thêm để hiển thị ngay
        if (queryOrderId && !finalOrders.some((o) => o.id === queryOrderId)) {
          const extraOrder = await getOrderById(queryOrderId);
          if (extraOrder && isMounted) {
            finalOrders = [extraOrder, ...finalOrders];
          }
        }

        setOrders(finalOrders);
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
  }, [user, queryOrderId]);

  if (authLoading) {
    return (
      <main className="account-loading-page" aria-busy="true">
        <div className="loading-spinner" />
        <p>Đang tải thông tin tài khoản...</p>
      </main>
    );
  }

  // =========================================================================
  // GIAO DIỆN KHI NGƯỜI DÙNG CHƯA ĐĂNG NHẬP (GUEST / TRA CỨU ĐƠN HÀNG TRỰC TIẾP)
  // Đảm bảo khi bấm vào "[Đơn hàng của tôi](/account)" luôn vào thẳng trang Đơn hàng
  // =========================================================================
  if (!isAuthenticated || !user) {
    return (
      <div className="account-page guest-orders-view">
        <div className="catalog-breadcrumb" data-reveal="fade">
          <Link href="/">Trang chủ</Link>
          <span>/</span>
          <strong>Đơn hàng của tôi</strong>
        </div>

        <header className="guest-orders-header" data-reveal="up">
          <h1>Đơn hàng của tôi</h1>
          <p>
            Theo dõi tiến độ giao hàng trực quan, mã vận đơn và thông tin chi tiết sản phẩm của bạn trên hệ thống ErgoChair.
          </p>
        </header>

        {/* Hộp tra cứu đơn hàng nhanh */}
        <section className="order-lookup-box" data-reveal="up">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              performLookup(lookupQuery);
            }}
            className="order-lookup-form"
          >
            <div className="order-lookup-input-wrap">
              <span className="order-lookup-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                className="order-lookup-input"
                placeholder="Nhập mã đơn hàng (VD: ord-325051-655) hoặc số điện thoại..."
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="order-lookup-btn"
              disabled={guestLookupLoading || !lookupQuery.trim()}
            >
              {guestLookupLoading ? "Đang tra cứu..." : "Tra cứu đơn hàng"}
            </button>
          </form>

          {/* Gợi ý tra cứu nhanh đơn vừa đặt */}
          {recentOrderId && (
            <div className="order-lookup-hints">
              <span>Đơn vừa đặt trên thiết bị:</span>
              <button
                type="button"
                className="order-lookup-quick-chip"
                onClick={() => {
                  setLookupQuery(recentOrderId);
                  performLookup(recentOrderId);
                }}
              >
                📦 #{recentOrderId}
              </button>
            </div>
          )}
        </section>

        {/* Kết quả hiển thị đơn hàng */}
        {guestLookupLoading ? (
          <div className="account-loading-page" style={{ margin: "20px auto", padding: "30px" }}>
            <div className="loading-spinner" />
            <p>Đang tải thông tin đơn hàng...</p>
          </div>
        ) : guestOrders.length > 0 ? (
          <section className="guest-orders-results" data-reveal="up">
            <div className="order-highlight-banner">
              <span>
                ✓ Đã tìm thấy <strong>{guestOrders.length}</strong> đơn hàng tương ứng
              </span>
              <button
                type="button"
                onClick={() => {
                  setGuestOrders([]);
                  setLookupQuery("");
                  setHasSearched(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8b7355",
                  cursor: "pointer",
                  fontSize: "12px",
                  textDecoration: "underline",
                }}
              >
                Làm mới tìm kiếm
              </button>
            </div>
            <div className="orders-list">
              {guestOrders.map((order) => (
                <OrderCardItem
                  key={order.id}
                  order={order}
                  isHighlighted={queryOrderId === order.id}
                />
              ))}
            </div>
          </section>
        ) : hasSearched ? (
          <div className="account-empty-state" style={{ margin: "20px auto" }} data-reveal="up">
            <div className="empty-icon" aria-hidden="true">🔍</div>
            <h3>Không tìm thấy đơn hàng</h3>
            <p>Không có đơn hàng nào khớp với thông tin &ldquo;{lookupQuery}&rdquo;. Vui lòng kiểm tra lại mã đơn hàng hoặc số điện thoại.</p>
          </div>
        ) : (
          <div className="account-empty-state" style={{ margin: "20px auto" }} data-reveal="up">
            <div className="empty-icon" aria-hidden="true">📦</div>
            <h3>Nhập thông tin để xem đơn hàng</h3>
            <p>Hãy nhập mã đơn hàng (được cấp khi đặt hàng thành công hoặc từ trợ lý ErgoBot) vào thanh tìm kiếm phía trên để theo dõi lộ trình vận chuyển.</p>
          </div>
        )}

        {/* Banner Đăng nhập để đồng bộ lịch sử tài khoản */}
        <div className="guest-account-sync-banner" data-reveal="up">
          <div>
            <p>
              <strong>Bạn đã có tài khoản ErgoChair?</strong><br />
              Đăng nhập để xem toàn bộ danh sách đơn hàng đã mua, quản lý sổ địa chỉ và quyền lợi bảo hành chính hãng 5 năm.
            </p>
          </div>
          <Link href="/login?redirect=/account" className="button button-mocha" style={{ whiteSpace: "nowrap" }}>
            Đăng nhập tài khoản <span>→</span>
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // GIAO DIỆN TÀI KHOẢN ĐÃ ĐĂNG NHẬP
  // =========================================================================
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
                <Link href="/products" className="button button-mocha">
                  Khám phá sản phẩm ngay <span>→</span>
                </Link>
              </div>
            ) : (
              <>
                <div className="orders-filter-chips">
                  {[
                    { key: "all", label: "Tất cả", count: orders.length },
                    { key: "pending", label: "Chờ xác nhận", count: orders.filter((o) => o.status === "pending").length },
                    { key: "processing", label: "Đang chuẩn bị", count: orders.filter((o) => o.status === "processing").length },
                    { key: "shipped", label: "Đang giao", count: orders.filter((o) => o.status === "shipped").length },
                    { key: "completed", label: "Hoàn thành", count: orders.filter((o) => o.status === "completed").length },
                    { key: "cancelled", label: "Đã hủy", count: orders.filter((o) => o.status === "cancelled").length },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`filter-chip ${orderStatusFilter === tab.key ? "active" : ""}`}
                      onClick={() => setOrderStatusFilter(tab.key)}
                    >
                      {tab.label} {tab.count > 0 && `(${tab.count})`}
                    </button>
                  ))}
                </div>

                {orders.filter((o) => orderStatusFilter === "all" || o.status === orderStatusFilter).length === 0 ? (
                  <div className="account-empty-state" style={{ padding: "32px 16px" }}>
                    <p style={{ color: "#777", fontSize: "14px" }}>
                      Không tìm thấy đơn hàng nào ở trạng thái này.
                    </p>
                  </div>
                ) : (
                  <div className="orders-list">
                    {orders
                      .filter((o) => orderStatusFilter === "all" || o.status === orderStatusFilter)
                      .map((order) => (
                        <OrderCardItem
                          key={order.id}
                          order={order}
                          isHighlighted={queryOrderId === order.id}
                        />
                      ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Tab 2: Addresses */}
        {activeTab === "addresses" && (
          <section className="account-tab-panel" data-reveal="up">
            <div className="address-section-header">
              <div>
                <h2>Sổ địa chỉ nhận hàng</h2>
                <p>Quản lý các địa chỉ giao hàng để đặt hàng nhanh chóng hơn.</p>
              </div>
              <button
                type="button"
                className="button button-mocha"
                onClick={() => setIsAddressFormOpen(true)}
              >
                + Thêm địa chỉ mới
              </button>
            </div>

            {isAddressFormOpen && (
              <form className="address-form-modal" onSubmit={handleAddressSubmit}>
                <h3>Thêm địa chỉ giao hàng mới</h3>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Họ và tên người nhận *</label>
                    <input
                      type="text"
                      value={addrName}
                      onChange={(e) => setAddrName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Số điện thoại *</label>
                    <input
                      type="tel"
                      value={addrPhone}
                      onChange={(e) => setAddrPhone(e.target.value)}
                      placeholder="0912 345 678"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Tỉnh / Thành phố *</label>
                    <select
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
                    <label>Quận / Huyện *</label>
                    <input
                      type="text"
                      value={addrDistrict}
                      onChange={(e) => setAddrDistrict(e.target.value)}
                      placeholder="Quận Cầu Giấy"
                      required
                    />
                  </div>
                  <div className="form-field form-field-full">
                    <label>Địa chỉ chi tiết (Số nhà, tên đường, tòa nhà) *</label>
                    <input
                      type="text"
                      value={addrDetail}
                      onChange={(e) => setAddrDetail(e.target.value)}
                      placeholder="Số 123 Đường Cầu Giấy, Phường Dịch Vọng"
                      required
                    />
                  </div>
                  <div className="form-field form-field-checkbox form-field-full">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={addrIsDefault}
                        onChange={(e) => setAddrIsDefault(e.target.checked)}
                      />
                      <span>Đặt làm địa chỉ mặc định cho các đơn hàng tiếp theo</span>
                    </label>
                  </div>
                </div>

                <div className="address-form-actions">
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => setIsAddressFormOpen(false)}
                    disabled={isSavingAddress}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="button button-mocha"
                    disabled={isSavingAddress}
                  >
                    {isSavingAddress ? "Đang lưu..." : "Lưu địa chỉ"}
                  </button>
                </div>
              </form>
            )}

            {user.addresses.length === 0 ? (
              <div className="account-empty-state">
                <div className="empty-icon" aria-hidden="true">📍</div>
                <h3>Chưa có địa chỉ nào</h3>
                <p>Thêm địa chỉ giao hàng để tiện lợi hơn khi mua các sản phẩm công thái học.</p>
              </div>
            ) : (
              <div className="address-cards-grid">
                {user.addresses.map((addr) => (
                  <article key={addr.id} className={`address-card ${addr.isDefault ? "is-default" : ""}`}>
                    <div className="address-card-top">
                      <div className="address-card-name-phone">
                        <strong>{addr.fullName}</strong>
                        <span>{addr.phone}</span>
                      </div>
                      {addr.isDefault && (
                        <span className="default-badge">Mặc định</span>
                      )}
                    </div>
                    <p className="address-detail-text">
                      {addr.detail}, {addr.district}, {addr.province}
                    </p>
                    <div className="address-card-actions">
                      {!addr.isDefault && (
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => {
                            if (addr.id) setDefaultAddress(addr.id);
                          }}
                        >
                          Đặt làm mặc định
                        </button>
                      )}
                      <button
                        type="button"
                        className="link-btn text-danger"
                        onClick={() => {
                          if (addr.id) deleteAddress(addr.id);
                        }}
                      >
                        Xóa
                      </button>
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
            <div className="profile-edit-box">
              <h2>Thông tin tài khoản cá nhân</h2>
              <p>Cập nhật thông tin của bạn để chúng tôi phục vụ chu đáo nhất.</p>

              <form onSubmit={handleProfileSubmit} className="profile-form">
                <div className="form-field">
                  <label htmlFor="profile-name">Họ và tên</label>
                  <input
                    id="profile-name"
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
                    className="button button-mocha"
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

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <main className="account-loading-page" aria-busy="true">
          <div className="loading-spinner" />
          <p>Đang tải thông tin đơn hàng...</p>
        </main>
      }
    >
      <AccountPageContent />
    </Suspense>
  );
}
