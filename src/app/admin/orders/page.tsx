"use client";

import { useEffect, useState, useMemo } from "react";
import { getOrders, updateOrderStatus } from "@/lib/services/order.service";
import type { Order, OrderStatus } from "@/lib/types/order";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; badgeClass: string; color: string }
> = {
  pending: { label: "Chờ xử lý", badgeClass: "pending", color: "#b45309" },
  processing: { label: "Đang xử lý", badgeClass: "processing", color: "#0284c7" },
  shipped: { label: "Đang giao", badgeClass: "shipped", color: "#7c3aed" },
  completed: { label: "Hoàn tất", badgeClass: "completed", color: "#059669" },
  cancelled: { label: "Đã hủy", badgeClass: "cancelled", color: "#dc2626" },
};

const PAYMENT_LABELS: Record<Order["paymentMethod"], string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "Chuyển khoản ngân hàng",
  vnpay: "VNPay QR / Thẻ nội địa",
  momo: "Ví điện tử MoMo",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const toast = useToast();

  useEffect(() => {
    let isMounted = true;

    const loadOrdersData = async () => {
      try {
        const data = await getOrders();
        if (!isMounted) return;
        setOrders(data);
        setIsLoading(false);
      } catch {
        if (isMounted) setIsLoading(false);
      }
    };

    loadOrdersData();

    const handleOrdersChange = () => {
      loadOrdersData();
    };

    window.addEventListener("ergochair-orders-change", handleOrdersChange);
    return () => {
      isMounted = false;
      window.removeEventListener("ergochair-orders-change", handleOrdersChange);
    };
  }, [refreshKey]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchId = o.id.toLowerCase().includes(query);
        const matchName = o.shippingAddress.fullName.toLowerCase().includes(query);
        const matchPhone = o.shippingAddress.phone.toLowerCase().includes(query);
        const matchEmail = (o.shippingAddress.email || "").toLowerCase().includes(query);
        if (!matchId && !matchName && !matchPhone && !matchEmail) return false;
      }

      // Status
      if (statusFilter !== "all" && o.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [orders, search, statusFilter]);

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      const updated = await updateOrderStatus(orderId, nextStatus);
      if (updated) {
        toast.success(`Đã cập nhật trạng thái đơn ${orderId} thành: ${STATUS_CONFIG[nextStatus].label}`);
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(updated);
        }
        setRefreshKey((k) => k + 1);
      }
    } catch {
      toast.error("Không thể cập nhật trạng thái đơn hàng.");
    }
  };

  return (
    <div className="admin-orders-page">
      {/* Top filter bar */}
      <div className="admin-filter-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div className="admin-search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Tìm theo mã đơn, tên khách, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái ({orders.length})</option>
            <option value="pending">Chờ xử lý ({orders.filter((o) => o.status === "pending").length})</option>
            <option value="processing">Đang xử lý ({orders.filter((o) => o.status === "processing").length})</option>
            <option value="shipped">Đang giao ({orders.filter((o) => o.status === "shipped").length})</option>
            <option value="completed">Hoàn tất ({orders.filter((o) => o.status === "completed").length})</option>
            <option value="cancelled">Đã hủy ({orders.filter((o) => o.status === "cancelled").length})</option>
          </select>
        </div>
      </div>

      {/* Orders List Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            Danh Sách Đơn Hàng ({filteredOrders.length} / {orders.length})
          </h2>
        </div>

        <div className="admin-card-body" style={{ padding: 0 }}>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Sản phẩm</th>
                  <th>Tổng tiền</th>
                  <th>Thanh toán</th>
                  <th>Ngày đặt</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                      Đang tải danh sách đơn hàng...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                      Không tìm thấy đơn hàng nào phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <span style={{ fontWeight: 600, color: "#0284c7" }}>
                          {order.id}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>
                          {order.shippingAddress.fullName}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {order.shippingAddress.phone}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                          {order.shippingAddress.province}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          {order.items.slice(0, 2).map((item) => (
                            <img
                              key={item.id}
                              src={item.productImage}
                              alt={item.productName}
                              style={{ width: "32px", height: "32px", borderRadius: "4px", objectFit: "cover", background: "#f8fafc", border: "1px solid #e2e8f0" }}
                              title={`${item.productName} (x${item.quantity})`}
                            />
                          ))}
                          <span style={{ fontSize: "0.8rem", color: "#475569" }}>
                            {order.items.reduce((s, i) => s + i.quantity, 0)} món
                          </span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: "#0f172a" }}>
                        {formatPrice(order.total)}
                      </td>
                      <td>
                        <span style={{ fontSize: "0.78rem", color: "#475569" }}>
                          {order.paymentMethod.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        {formatDate(order.createdAt)}
                      </td>
                      <td>
                        <select
                          className={`admin-badge ${STATUS_CONFIG[order.status].badgeClass}`}
                          style={{ cursor: "pointer", outline: "none", border: "1px solid currentColor", padding: "0.25rem 0.5rem" }}
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        >
                          <option value="pending">Chờ xử lý</option>
                          <option value="processing">Đang xử lý</option>
                          <option value="shipped">Đang giao</option>
                          <option value="completed">Hoàn tất</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-outline admin-btn-sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal" style={{ maxWidth: "720px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Chi Tiết Đơn Hàng: {selectedOrder.id}</h3>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Đặt lúc: {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
                </span>
              </div>
              <button
                type="button"
                className="admin-btn-icon"
                onClick={() => setSelectedOrder(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Status and Action banner */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "1rem", borderRadius: "10px", marginBottom: "1.5rem" }}>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Trạng thái hiện tại: </span>
                  <span className={`admin-badge ${STATUS_CONFIG[selectedOrder.status].badgeClass}`}>
                    <span className="admin-badge-dot" />
                    {STATUS_CONFIG[selectedOrder.status].label}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155" }}>Chuyển sang:</span>
                  <select
                    className="admin-select"
                    style={{ padding: "0.35rem 1.8rem 0.35rem 0.6rem", fontSize: "0.8rem" }}
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                  >
                    <option value="pending">Chờ xử lý</option>
                    <option value="processing">Đang xử lý</option>
                    <option value="shipped">Đang giao</option>
                    <option value="completed">Hoàn tất</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
              </div>

              {/* Delivery Info */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.6rem", color: "#0f172a" }}>
                  Thông Tin Giao Hàng & Khách Hàng
                </h4>
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1rem", fontSize: "0.85rem", lineHeight: 1.6 }}>
                  <div><strong>Người nhận:</strong> {selectedOrder.shippingAddress.fullName}</div>
                  <div><strong>Số điện thoại:</strong> {selectedOrder.shippingAddress.phone}</div>
                  {selectedOrder.shippingAddress.email && (
                    <div><strong>Email:</strong> {selectedOrder.shippingAddress.email}</div>
                  )}
                  <div>
                    <strong>Địa chỉ nhận hàng:</strong> {selectedOrder.shippingAddress.detail}, {selectedOrder.shippingAddress.district}, {selectedOrder.shippingAddress.province}
                  </div>
                  <div><strong>Phương thức thanh toán:</strong> {PAYMENT_LABELS[selectedOrder.paymentMethod]}</div>
                </div>
              </div>

              {/* Products in Order */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.6rem", color: "#0f172a" }}>
                  Sản Phẩm Đã Mua ({selectedOrder.items.length})
                </h4>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Đơn giá</th>
                        <th>Số lượng</th>
                        <th style={{ textAlign: "right" }}>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover", background: "#f8fafc" }}
                              />
                              <div>
                                <div style={{ fontWeight: 600 }}>{item.productName}</div>
                                {item.variantName && (
                                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.variantName}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>{formatPrice(item.price)}</td>
                          <td>x{item.quantity}</td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>
                            {formatPrice(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Financial Summary */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1rem", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Tạm tính:</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#059669" }}>
                    <span>Giảm giá {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ""}:</span>
                    <span>-{formatPrice(selectedOrder.discount)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Phí vận chuyển:</span>
                  <span>{selectedOrder.shippingFee === 0 ? "Miễn phí" : formatPrice(selectedOrder.shippingFee)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e2e8f0", paddingTop: "0.5rem", marginTop: "0.2rem", fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                  <span>Tổng tiền thanh toán:</span>
                  <span style={{ color: "#0284c7" }}>{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => window.print()}
              >
                In Đơn Hàng
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => setSelectedOrder(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
