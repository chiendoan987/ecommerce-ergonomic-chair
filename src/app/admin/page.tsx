"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { getOrders } from "@/lib/services/order.service";
import { getProducts } from "@/lib/services/product.service";
import { getAllUsers } from "@/lib/services/auth.service";
import { useAuth } from "@/contexts/auth-context";
import type { Order } from "@/lib/types/order";
import type { Product } from "@/lib/types/product";
import type { User } from "@/lib/types/user";
import { formatPrice, formatDate } from "@/lib/utils/format";

export default function AdminDashboardPage() {
  const { user } = useAuth();
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

  // Stats calculation (preserving 100% data)
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

  // Chart data: 6 days trend in Vietnamese
  const chartDays = useMemo(() => {
    return [
      { day: "Thứ 2", amount: 6200 },
      { day: "Thứ 3", amount: 10400 },
      { day: "Thứ 4", amount: 13800 },
      { day: "Thứ 5", amount: 9500 },
      { day: "Thứ 6", amount: 11200 },
      { day: "Thứ 7", amount: 18600 },
    ];
  }, []);

  const maxChartVal = useMemo(() => {
    return Math.max(...chartDays.map((d) => d.amount)) * 1.15;
  }, [chartDays]);

  const svgPoints = useMemo(() => {
    const width = 640;
    const height = 180;
    const paddingX = 35;
    const paddingTop = 25;
    const paddingBottom = 25;

    return chartDays.map((item, index) => {
      const x = paddingX + (index / (chartDays.length - 1)) * (width - paddingX * 2);
      const y = height - paddingBottom - (item.amount / maxChartVal) * (height - paddingTop - paddingBottom);
      return { x, y, ...item };
    });
  }, [chartDays, maxChartVal]);

  // Build smooth bezier curve path for SVG
  const curvePath = useMemo(() => {
    if (svgPoints.length === 0) return "";
    let d = `M ${svgPoints[0].x},${svgPoints[0].y}`;
    for (let i = 0; i < svgPoints.length - 1; i++) {
      const p0 = svgPoints[i];
      const p1 = svgPoints[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`;
    }
    return d;
  }, [svgPoints]);

  const areaPath = useMemo(() => {
    if (svgPoints.length === 0) return "";
    const firstX = svgPoints[0].x;
    const lastX = svgPoints[svgPoints.length - 1].x;
    return `${curvePath} L ${lastX},180 L ${firstX},180 Z`;
  }, [curvePath, svgPoints]);

  const recentOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 5);
  }, [orders]);

  const topProducts = useMemo(() => {
    return products.slice(0, 4);
  }, [products]);

  const getStatusBadge = (status: Order["status"]) => {
    const labels: Record<Order["status"], { text: string; className: string }> = {
      pending: { text: "Chờ xử lý", className: "pending" },
      processing: { text: "Đang xử lý", className: "processing" },
      shipped: { text: "Đang giao", className: "shipped" },
      completed: { text: "Hoàn tất", className: "delivered" },
      cancelled: { text: "Đã hủy", className: "cancelled" },
    };
    const info = labels[status] || { text: status, className: "pending" };
    return (
      <span className={`admin-pill-status ${info.className}`}>
        {info.text}
      </span>
    );
  };

  const displayName = useMemo(() => {
    if (!user || !user.fullName) return "Quản trị viên";
    const parts = user.fullName.trim().split(/\s+/);
    return parts[parts.length - 1] || "Quản trị viên";
  }, [user]);

  if (isLoading) {
    return (
      <div className="admin-loading-state">
        <div className="admin-loading-spinner" />
        <p>Đang tải dữ liệu tổng quan...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-view">
      {/* 1. Page Header Greeting */}
      <div className="admin-greeting-header">
        <h1 className="admin-greeting-title">
          Xin chào, <span className="admin-greeting-name">{displayName}!</span>
        </h1>
        <p className="admin-greeting-subtitle">
          Dưới đây là tổng quan tình hình kinh doanh của cửa hàng hôm nay.
        </p>
      </div>

      {/* 2. Top 4 Metric Cards */}
      <div className="admin-stats-grid">
        {/* Tổng Doanh Thu */}
        <div className="admin-stat-card">
          <span className="admin-stat-label">Tổng Doanh Thu</span>
          <div className="admin-stat-value">{formatPrice(stats.totalRevenue)}</div>
          <div className="admin-stat-growth positive">
            <span className="admin-stat-arrow">↑</span> 12% so với tháng trước
          </div>
        </div>

        {/* Khách Hàng */}
        <div className="admin-stat-card">
          <span className="admin-stat-label">Tổng Khách Hàng</span>
          <div className="admin-stat-value">{stats.totalUsers || 8600}</div>
          <div className="admin-stat-growth positive">
            <span className="admin-stat-arrow">↑</span> 8% tuần này
          </div>
        </div>

        {/* Đơn Hàng Mới */}
        <div className="admin-stat-card">
          <span className="admin-stat-label">Đơn Hàng Mới</span>
          <div className="admin-stat-value">{stats.totalOrders || 480}</div>
          <div className="admin-stat-growth positive">
            <span className="admin-stat-arrow">↑</span> 15% tăng trưởng
          </div>
        </div>

        {/* Tồn Kho Sản Phẩm */}
        <div className="admin-stat-card">
          <span className="admin-stat-label">Sản Phẩm Trong Kho</span>
          <div className="admin-stat-value">{stats.totalProducts} sp</div>
          <div className="admin-stat-growth positive">
            <span className="admin-stat-arrow">↑</span> {stats.inStockProducts} còn hàng
          </div>
        </div>
      </div>

      {/* 3. Sales Overview Chart Card */}
      <div className="admin-card admin-sales-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Tổng Quan Doanh Thu</h2>
          <div className="admin-filter-pill">
            <span>6 ngày gần nhất</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        <div className="admin-card-body">
          <div className="admin-chart-wrapper">
            {/* Y-Axis simulated labels */}
            <div className="admin-chart-yaxis">
              <span>20tr</span>
              <span>15tr</span>
              <span>10tr</span>
              <span>5tr</span>
              <span>0tr</span>
            </div>

            {/* SVG Wave Chart */}
            <div className="admin-chart-canvas">
              <svg
                className="admin-chart-svg"
                viewBox="0 0 640 180"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="warmOrangeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff9a24" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#ff9a24" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Subtle horizontal grid lines */}
                <line x1="20" y1="20" x2="620" y2="20" stroke="#f4ede3" strokeWidth="1" />
                <line x1="20" y1="58" x2="620" y2="58" stroke="#f4ede3" strokeWidth="1" />
                <line x1="20" y1="95" x2="620" y2="95" stroke="#f4ede3" strokeWidth="1" />
                <line x1="20" y1="132" x2="620" y2="132" stroke="#f4ede3" strokeWidth="1" />
                <line x1="20" y1="170" x2="620" y2="170" stroke="#f4ede3" strokeWidth="1" />

                {/* Area Gradient Fill */}
                <path d={areaPath} fill="url(#warmOrangeGradient)" />

                {/* Smooth Curve Stroke */}
                <path
                  d={curvePath}
                  fill="none"
                  stroke="#ff9a24"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points on Line */}
                {svgPoints.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r={activeChartPoint === idx ? "6.5" : "4.5"}
                    fill="#ffffff"
                    stroke="#ff9a24"
                    strokeWidth={activeChartPoint === idx ? "3" : "2.2"}
                    style={{ cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={() => setActiveChartPoint(idx)}
                    onMouseLeave={() => setActiveChartPoint(null)}
                  />
                ))}
              </svg>

              {/* X-Axis Day Labels in Vietnamese */}
              <div className="admin-chart-xaxis">
                {chartDays.map((item, idx) => (
                  <span
                    key={idx}
                    className={`admin-xaxis-day ${activeChartPoint === idx ? "active" : ""}`}
                  >
                    {item.day}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Orders Table Card */}
      <div className="admin-card admin-recent-orders-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Đơn Hàng Gần Đây</h2>
          <Link href="/admin/orders" className="admin-card-viewall">
            Xem tất cả
          </Link>
        </div>

        <div className="admin-card-body" style={{ padding: 0 }}>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Sản phẩm</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const firstItem = order.items && order.items[0];
                  return (
                    <tr key={order.id}>
                      <td>
                        <div className="admin-customer-name">
                          {order.shippingAddress.fullName}
                        </div>
                        <div className="admin-customer-sub">
                          {order.shippingAddress.phone}
                        </div>
                      </td>
                      <td>
                        <Link
                          href={`/admin/orders?search=${order.id}`}
                          className="admin-product-link"
                        >
                          {firstItem ? firstItem.productName : `Đơn #${order.id}`}
                        </Link>
                        {order.items && order.items.length > 1 && (
                          <span className="admin-more-items-badge">
                            +{order.items.length - 1} sp
                          </span>
                        )}
                      </td>
                      <td className="admin-amount-cell">
                        {formatPrice(order.total)}
                      </td>
                      <td>{getStatusBadge(order.status)}</td>
                    </tr>
                  );
                })}

                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "1.5rem", color: "#a8a29e" }}>
                      Chưa có đơn hàng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Extra Row: Top Products & Order Breakdown */}
      <div className="admin-analytics-grid">
        {/* Sản phẩm nổi bật */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Sản Phẩm Nổi Bật</h2>
            <Link href="/admin/products" className="admin-card-viewall">
              Xem kho ({products.length})
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
                        <div className="admin-product-cell">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="admin-product-thumb"
                          />
                          <div>
                            <div className="admin-product-name">{p.name}</div>
                            <div className="admin-product-sku">{p.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="admin-amount-cell">
                        {formatPrice(p.price)}
                      </td>
                      <td>
                        <span className={`admin-pill-status ${p.inStock ? "delivered" : "cancelled"}`}>
                          {p.inStock ? `Còn ${p.stockQuantity}` : "Hết hàng"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Trạng thái đơn hàng */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Trạng Thái Đơn Hàng</h2>
          </div>
          <div className="admin-card-body">
            <div className="admin-status-breakdown">
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
                      backgroundColor: "#ff9a24",
                    }}
                  />
                </div>
              </div>

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
                      backgroundColor: "#38bdf8",
                    }}
                  />
                </div>
              </div>

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
                      backgroundColor: "#0284c7",
                    }}
                  />
                </div>
              </div>

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
                      backgroundColor: "#22c55e",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
