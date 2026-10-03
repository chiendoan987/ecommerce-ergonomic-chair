"use client";

import { useEffect, useState, useMemo } from "react";
import { getAllUsers } from "@/lib/services/auth.service";
import { getOrders } from "@/lib/services/order.service";
import type { User } from "@/lib/types/user";
import type { Order } from "@/lib/types/order";
import { formatPrice, formatDate } from "@/lib/utils/format";

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [usersData, ordersData] = await Promise.all([
          getAllUsers(),
          getOrders(),
        ]);
        if (!isMounted) return;
        setUsers(usersData);
        setOrders(ordersData);
        setIsLoading(false);
      } catch {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute stats for each user
  const userStats = useMemo(() => {
    const statsMap: Record<
      string,
      { orderCount: number; totalSpent: number; lastOrderDate?: string }
    > = {};

    users.forEach((u) => {
      const userOrders = orders.filter((o) => o.userId === u.id || o.shippingAddress.email === u.email);
      const orderCount = userOrders.length;
      const totalSpent = userOrders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + o.total, 0);

      statsMap[u.id] = {
        orderCount,
        totalSpent,
      };
    });

    return statsMap;
  }, [users, orders]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = u.fullName.toLowerCase().includes(query);
        const matchEmail = u.email.toLowerCase().includes(query);
        const matchPhone = u.phone.toLowerCase().includes(query);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }

      if (roleFilter !== "all" && u.role !== roleFilter) {
        return false;
      }

      return true;
    });
  }, [users, search, roleFilter]);

  return (
    <div className="admin-customers-page">
      {/* Top Filter Bar */}
      <div className="admin-filter-bar">
        <div className="admin-filter-bar-left">
          <div className="admin-search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Tìm theo tên, email, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="admin-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Tất cả vai trò ({users.length})</option>
            <option value="customer">Khách hàng ({users.filter((u) => u.role === "customer").length})</option>
            <option value="admin">Quản trị viên ({users.filter((u) => u.role === "admin").length})</option>
          </select>
        </div>
      </div>

      {/* Customers List Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            Danh Sách Khách Hàng ({filteredUsers.length} / {users.length})
          </h2>
        </div>

        <div className="admin-card-body" style={{ padding: 0 }}>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Vai trò</th>
                  <th>Liên hệ</th>
                  <th>Địa chỉ mặc định</th>
                  <th>Số đơn hàng</th>
                  <th>Tổng chi tiêu</th>
                  <th>Ngày tham gia</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                      Đang tải danh sách khách hàng...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                      Không tìm thấy khách hàng nào.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const stats = userStats[u.id] || { orderCount: 0, totalSpent: 0 };
                    const defaultAddress = u.addresses?.find((a) => a.isDefault) || u.addresses?.[0];

                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                background: u.role === "admin" ? "#0284c7" : "#64748b",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                flexShrink: 0,
                              }}
                            >
                              {u.fullName.trim().charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: "#0f172a" }}>{u.fullName}</div>
                              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>ID: {u.id}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {u.role === "admin" ? (
                            <span className="admin-badge" style={{ background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }}>
                              Quản trị viên
                            </span>
                          ) : (
                            <span className="admin-badge" style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>
                              Khách hàng
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: "0.85rem" }}>{u.email}</div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{u.phone || "—"}</div>
                        </td>
                        <td>
                          {defaultAddress ? (
                            <div style={{ fontSize: "0.8rem", color: "#334155", maxWidth: "200px" }}>
                              {defaultAddress.detail}, {defaultAddress.district}, {defaultAddress.province}
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Chưa có địa chỉ</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: "#0f172a" }}>{stats.orderCount}</span> đơn
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: stats.totalSpent > 0 ? "#059669" : "#64748b" }}>
                            {formatPrice(stats.totalSpent)}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          {formatDate(u.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
