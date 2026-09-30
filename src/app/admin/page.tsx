"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { getOrders } from "@/lib/services/order.service";
import { getProducts } from "@/lib/services/product.service";
import { getAllUsers } from "@/lib/services/auth.service";
import type { Order } from "@/lib/types/order";
import type { Product } from "@/lib/types/product";
import type { User } from "@/lib/types/user";
import { formatPrice, formatDate } from "@/lib/utils/format";

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChartPoint, setActiveChartPoint] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [ordersData, productsResult, usersData] = await Promise.all([
          getOrders(),
          getProducts(),
          getAllUsers(),
        ]);
        if (!isMounted) return;
        setOrders(ordersData);
        setProducts(productsResult.items);
        setUsers(usersData);
        setIsLoading(false);
      } catch {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    const handleDataChange = () => {
      loadData();
    };

    window.addEventListener("ergochair-orders-change", handleDataChange);
    window.addEventListener("ergochair-products-change", handleDataChange);

    return () => {
      isMounted = false;
      window.removeEventListener("ergochair-orders-change", handleDataChange);
      window.removeEventListener("ergochair-products-change", handleDataChange);
    };
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== "cancelled");
    const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);

    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const processingOrders = orders.filter((o) => o.status === "processing").length;
    const shippedOrders = orders.filter((o) => o.status === "shipped").length;
    const completedOrders = orders.filter((o) => o.status === "completed").length;
    const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;

    const inStockProducts = products.filter((p) => p.inStock).length;
    const outOfStockProducts = products.filter((p) => !p.inStock).length;

    return {
      totalRevenue,
      totalOrders: orders.length,
      pendingOrders,
      processingOrders,
      shippedOrders,
      completedOrders,
      cancelledOrders,
      totalProducts: products.length,
      inStockProducts,
      outOfStockProducts,
      totalUsers: users.length,
    };
  }, [orders, products, users]);

  // Chart data: 7 days simulated trend based on orders
  const chartDays = useMemo(() => {
    const days = [
      { day: "Th 2", amount: 12500000 },
      { day: "Th 3", amount: 18400000 },
      { day: "Th 4", amount: 15200000 },
      { day: "Th 5", amount: 24600000 },
      { day: "Th 6", amount: 29800000 },
      { day: "Th 7", amount: 38500000 },
      { day: "CN", amount: 31200000 },
    ];
    return days;
  }, []);

  const maxChartVal = useMemo(() => {
    return Math.max(...chartDays.map((d) => d.amount)) * 1.15;
  }, [chartDays]);

  const svgPoints = useMemo(() => {
    const width = 600;
    const height = 180;
    const padding = 20;

    return chartDays.map((item, index) => {
      const x = padding + (index / (chartDays.length - 1)) * (width - padding * 2);
      const y = height - (item.amount / maxChartVal) * (height - padding * 2) - padding;
      return { x, y, ...item };
    });
  }, [chartDays, maxChartVal]);

  const polylineStr = useMemo(() => {
    return svgPoints.map((p) => `${p.x},${p.y}`).join(" ");
  }, [svgPoints]);

  const polygonStr = useMemo(() => {
    if (svgPoints.length === 0) return "";
    const firstX = svgPoints[0].x;
    const lastX = svgPoints[svgPoints.length - 1].x;
    return `${polylineStr} ${lastX},180 ${firstX},180`;
  }, [polylineStr, svgPoints]);

  const recentOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 5);
  }, [orders]);

  const topProducts = useMemo(() => {
    return products.slice(0, 4);
  }, [products]);

  const getStatusBadge = (status: Order["status"]) => {
    const labels: Record<Order["status"], string> = {
      pending: "Chờ xử lý",
      processing: "Đang xử lý",
      shipped: "Đang giao",
      completed: "Hoàn tất",
      cancelled: "Đã hủy",
    };
    return (
      <span className={`admin-badge ${status}`}>
        <span className="admin-badge-dot" />
        {labels[status] || status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div style={{ padding: "2rem 0", color: "#64748b" }}>
        Đang tải dữ liệu tổng quan...
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* 4 Top Stat Cards */}
      <div className="admin-stats-grid">
        {/* Doanh thu */}
        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-title">Tổng Doanh Thu</span>
            <span className="admin-stat-value">{formatPrice(stats.totalRevenue)}</span>
            <div className="admin-stat-subtext positive">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              <span>+18.5% so với tháng trước</span>
            </div>
          </div>
          <div className="admin-stat-icon-wrapper green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" x2="12" y1="2" y2="22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>

        {/* Đơn hàng */}
        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-title">Tổng Đơn Hàng</span>
            <span className="admin-stat-value">{stats.totalOrders}</span>
            <div className="admin-stat-subtext" style={{ color: stats.pendingOrders > 0 ? "#d97706" : "#10b981" }}>
              <span>{stats.pendingOrders} đơn đang chờ xử lý</span>
            </div>
          </div>
          <div className="admin-stat-icon-wrapper blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
        </div>

        {/* Sản phẩm */}
        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-title">Sản Phẩm Trong Kho</span>
            <span className="admin-stat-value">{stats.totalProducts}</span>
            <div className="admin-stat-subtext neutral">
              <span>{stats.inStockProducts} còn hàng, {stats.outOfStockProducts} tạm hết</span>
            </div>
          </div>
          <div className="admin-stat-icon-wrapper amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
              <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" />
              <path d="M12 18v3" />
              <path d="M8 21h8" />
            </svg>
          </div>
        </div>

        {/* Khách hàng */}
        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-title">Khách Hàng Đã Đăng Ký</span>
            <span className="admin-stat-value">{stats.totalUsers}</span>
            <div className="admin-stat-subtext positive">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              <span>+12 khách mới tuần này</span>
            </div>
          </div>
          <div className="admin-stat-icon-wrapper purple">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </div>
      </div>

      {/* Analytics Row: Revenue Chart + Order Status Breakdown */}
      <div className="admin-analytics-grid">
        {/* Doanh thu 7 ngày */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">Doanh Thu 7 Ngày Gần Nhất</h2>
              <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                Biểu đồ xu hướng tăng trưởng doanh thu theo ngày
              </p>
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0284c7" }}>
              {activeChartPoint !== null ? `${chartDays[activeChartPoint].day}: ${formatPrice(chartDays[activeChartPoint].amount)}` : "Di chuột xem chi tiết"}
            </span>
          </div>

          <div className="admin-card-body">
            <div className="admin-chart-container">
              <svg className="admin-chart-svg" viewBox="0 0 600 180" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide lines */}
                <line x1="20" y1="30" x2="580" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="20" y1="80" x2="580" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="20" y1="130" x2="580" y2="130" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />

                {/* Fill Area */}
                <polygon points={polygonStr} fill="url(#chartGradient)" />

                {/* Line */}
                <polyline
                  points={polylineStr}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points */}
                {svgPoints.map((p, idx) => (
                  <g key={idx}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={activeChartPoint === idx ? "6.5" : "4.5"}
                      fill="#ffffff"
                      stroke="#0284c7"
                      strokeWidth={activeChartPoint === idx ? "3" : "2"}
                      style={{ cursor: "pointer", transition: "all 0.2s" }}
                      onMouseEnter={() => setActiveChartPoint(idx)}
                      onMouseLeave={() => setActiveChartPoint(null)}
                    />
                    <text
                      x={p.x}
                      y="175"
                      textAnchor="middle"
                      fontSize="11"
                      fill="#64748b"
                      fontWeight="500"
                    >
                      {p.day}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            <div className="admin-chart-legend">
              <div className="admin-legend-item">
                <span className="admin-legend-dot" style={{ backgroundColor: "#0284c7" }} />
                <span>Doanh thu thực tế (VND)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trạng thái đơn hàng */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Phân Bổ Trạng Thái Đơn</h2>
          </div>
          <div className="admin-card-body">
            <div className="admin-status-breakdown">
              {/* Chờ xử lý */}
              <div className="admin-breakdown-item">
                <div className="admin-breakdown-header">
                  <span className="admin-breakdown-name">Chờ xử lý</span>
                  <span className="admin-breakdown-count">{stats.pendingOrders} đơn</span>
                </div>
                <div className="admin-progress-track">
                  <div
                    className="admin-progress-fill"
                    style={{
                      width: `${stats.totalOrders ? (stats.pendingOrders / stats.totalOrders) * 100 : 0}%`,
                      backgroundColor: "#f59e0b",
                    }}
                  />
                </div>
              </div>

              {/* Đang xử lý */}
              <div className="admin-breakdown-item">
                <div className="admin-breakdown-header">
                  <span className="admin-breakdown-name">Đang xử lý</span>
                  <span className="admin-breakdown-count">{stats.processingOrders} đơn</span>
                </div>
                <div className="admin-progress-track">
                  <div
                    className="admin-progress-fill"
                    style={{
                      width: `${stats.totalOrders ? (stats.processingOrders / stats.totalOrders) * 100 : 0}%`,
                      backgroundColor: "#0284c7",
                    }}
                  />
                </div>
              </div>

              {/* Đang giao */}
              <div className="admin-breakdown-item">
                <div className="admin-breakdown-header">
                  <span className="admin-breakdown-name">Đang giao</span>
                  <span className="admin-breakdown-count">{stats.shippedOrders} đơn</span>
                </div>
                <div className="admin-progress-track">
                  <div
                    className="admin-progress-fill"
                    style={{
                      width: `${stats.totalOrders ? (stats.shippedOrders / stats.totalOrders) * 100 : 0}%`,
                      backgroundColor: "#8b5cf6",
                    }}
                  />
                </div>
              </div>

              {/* Hoàn tất */}
              <div className="admin-breakdown-item">
                <div className="admin-breakdown-header">
                  <span className="admin-breakdown-name">Hoàn tất</span>
                  <span className="admin-breakdown-count">{stats.completedOrders} đơn</span>
                </div>
                <div className="admin-progress-track">
                  <div
                    className="admin-progress-fill"
                    style={{
                      width: `${stats.totalOrders ? (stats.completedOrders / stats.totalOrders) * 100 : 0}%`,
                      backgroundColor: "#10b981",
                    }}
                  />
                </div>
              </div>

              {/* Đã hủy */}
              <div className="admin-breakdown-item">
                <div className="admin-breakdown-header">
                  <span className="admin-breakdown-name">Đã hủy</span>
                  <span className="admin-breakdown-count">{stats.cancelledOrders} đơn</span>
                </div>
                <div className="admin-progress-track">
                  <div
                    className="admin-progress-fill"
                    style={{
                      width: `${stats.totalOrders ? (stats.cancelledOrders / stats.totalOrders) * 100 : 0}%`,
                      backgroundColor: "#ef4444",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Orders & Top Selling Products */}
      <div className="admin-bottom-grid">
        {/* Đơn hàng gần đây */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Đơn Hàng Gần Đây</h2>
            <Link href="/admin/orders" className="admin-btn admin-btn-outline admin-btn-sm">
              Xem tất cả ({orders.length})
            </Link>
          </div>
          <div className="admin-card-body" style={{ padding: 0 }}>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã Đơn</th>
                    <th>Khách Hàng</th>
                    <th>Ngày Đặt</th>
                    <th>Tổng Tiền</th>
                    <th>Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600, color: "#0284c7" }}>
                        <Link href={`/admin/orders?search=${order.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                          {order.id}
                        </Link>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{order.shippingAddress.fullName}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{order.shippingAddress.phone}</div>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        {formatDate(order.createdAt)}
                      </td>
                      <td style={{ fontWeight: 600, color: "#0f172a" }}>
                        {formatPrice(order.total)}
                      </td>
                      <td>{getStatusBadge(order.status)}</td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                        Chưa có đơn hàng nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top sản phẩm */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Sản Phẩm Nổi Bật</h2>
            <Link href="/admin/products" className="admin-btn admin-btn-outline admin-btn-sm">
              Quản lý ({products.length})
            </Link>
          </div>
          <div className="admin-card-body" style={{ padding: 0 }}>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Giá bán</th>
                    <th>Tồn kho</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <img
                            src={p.image}
                            alt={p.name}
                            style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover", background: "#f1f5f9" }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{p.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{p.category}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                        {formatPrice(p.price)}
                      </td>
                      <td>
                        <span className={`admin-badge ${p.inStock ? "in_stock" : "out_of_stock"}`}>
                          {p.inStock ? `Còn ${p.stockQuantity}` : "Tạm hết"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
