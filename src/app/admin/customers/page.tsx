"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  getAllUsers,
  createUserByAdmin,
  updateUserByAdmin,
  toggleUserStatusByAdmin,
  deleteUserByAdmin,
  resetUserPasswordByAdmin,
} from "@/lib/services/auth.service";
import { getOrders } from "@/lib/services/order.service";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import type { User, UserRole, UserStatus } from "@/lib/types/user";
import type { Order } from "@/lib/types/order";
import { formatPrice, formatDate } from "@/lib/utils/format";

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  processing: "Đang xử lý",
  shipped: "Đang giao hàng",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

export default function AdminCustomersPage() {
  const { user: currentAdmin } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);

  // Form states
  const [addForm, setAddForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "      ".trim() || "123456",
    role: "customer" as UserRole,
    status: "active" as UserStatus,
  });

  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "customer" as UserRole,
    status: "active" as UserStatus,
  });

  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("search");
      if (q) setSearch(q);
    }
  }, []);

  const loadData = async () => {
    try {
      const [usersData, ordersData] = await Promise.all([
        getAllUsers(),
        getOrders(),
      ]);
      setUsers(usersData);
      setOrders(ordersData);
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
        const matchId = u.id.toLowerCase().includes(query);
        if (!matchName && !matchEmail && !matchPhone && !matchId) return false;
      }

      if (roleFilter !== "all" && u.role !== roleFilter) {
        return false;
      }

      if (statusFilter !== "all") {
        const userStatus = u.status || "active";
        if (userStatus !== statusFilter) return false;
      }

      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  // Orders for currently selected user detail modal
  const selectedUserOrders = useMemo(() => {
    if (!selectedUser) return [];
    return orders.filter(
      (o) => o.userId === selectedUser.id || o.shippingAddress.email === selectedUser.email
    );
  }, [selectedUser, orders]);

  // Handler: Toggle Account Status (Active / Blocked)
  const handleToggleStatus = async (userToToggle: User) => {
    if (userToToggle.id === currentAdmin?.id) {
      toast.error("Bạn không thể khóa tài khoản của chính mình!");
      return;
    }

    const nextAction = userToToggle.status === "blocked" ? "Mở khóa" : "Tạm khóa";
    const confirmMsg = `Bạn có chắc chắn muốn ${nextAction.toLowerCase()} tài khoản "${userToToggle.fullName}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await toggleUserStatusByAdmin(userToToggle.id);
      if (res.success) {
        toast.success(`Đã ${nextAction.toLowerCase()} tài khoản thành công!`);
        await loadData();
      } else {
        toast.error(res.error || "Không thể đổi trạng thái tài khoản.");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi cập nhật.");
    }
  };

  // Handler: Delete User
  const handleDeleteUser = async (userToDelete: User) => {
    if (userToDelete.id === currentAdmin?.id) {
      toast.error("Bạn không thể tự xóa tài khoản của chính mình!");
      return;
    }

    const confirmMsg = `CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${userToDelete.fullName}" (${userToDelete.email}) khỏi hệ thống?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await deleteUserByAdmin(userToDelete.id, currentAdmin?.id);
      if (res.success) {
        toast.success(`Đã xóa tài khoản "${userToDelete.fullName}" thành công!`);
        await loadData();
      } else {
        toast.error(res.error || "Không thể xóa tài khoản.");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi xóa tài khoản.");
    }
  };

  // Handler: Open Edit Modal
  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setEditForm({
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status || "active",
    });
  };

  // Handler: Submit Edit User
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    try {
      const res = await updateUserByAdmin(editingUser.id, editForm);
      if (res.success) {
        toast.success(`Đã cập nhật thông tin tài khoản "${editForm.fullName}"!`);
        setEditingUser(null);
        await loadData();
      } else {
        toast.error(res.error || "Không thể cập nhật tài khoản.");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi lưu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Submit Add New User
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.fullName.trim() || !addForm.email.trim()) {
      toast.error("Vui lòng điền họ tên và email hợp lệ.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createUserByAdmin(addForm);
      if (res.success) {
        toast.success(`Đã tạo tài khoản "${addForm.fullName}" thành công!`);
        setIsAddModalOpen(false);
        setAddForm({
          fullName: "",
          email: "",
          phone: "",
          password: "123456",
          role: "customer",
          status: "active",
        });
        await loadData();
      } else {
        toast.error(res.error || "Không thể tạo tài khoản.");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi tạo tài khoản.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Submit Reset Password
  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;

    if (!newPasswordInput || newPasswordInput.length < 6) {
      toast.error("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetUserPasswordByAdmin(resettingUser.id, newPasswordInput);
      if (res.success) {
        toast.success(`Đã đặt lại mật khẩu cho tài khoản "${resettingUser.fullName}"!`);
        setResettingUser(null);
        setNewPasswordInput("");
        await loadData();
      } else {
        toast.error(res.error || "Không thể đặt lại mật khẩu.");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi đổi mật khẩu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-customers-page">
      {/* Page Header */}
      <div className="admin-greeting-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="admin-greeting-title">Quản Lý Tài Khoản Người Dùng</h1>
          <p className="admin-greeting-subtitle">
            Toàn quyền quản trị danh sách người dùng, vai trò, trạng thái khóa/mở khóa tài khoản và thiết lập người dùng.
          </p>
        </div>

        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={() => setIsAddModalOpen(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Thêm Tài Khoản Mới</span>
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-stat-card">
          <div className="admin-stat-content">
            <div className="admin-stat-label">Tổng Số Tài Khoản</div>
            <div className="admin-stat-value">{users.length}</div>
            <div className="admin-stat-desc">Thành viên trong hệ thống</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-content">
            <div className="admin-stat-label">Khách Hàng</div>
            <div className="admin-stat-value" style={{ color: "#0284c7" }}>
              {users.filter((u) => u.role === "customer").length}
            </div>
            <div className="admin-stat-desc">Tài khoản mua hàng</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-content">
            <div className="admin-stat-label">Quản Trị Viên</div>
            <div className="admin-stat-value" style={{ color: "#D97706" }}>
              {users.filter((u) => u.role === "admin").length}
            </div>
            <div className="admin-stat-desc">Quyền quản trị hệ thống</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-content">
            <div className="admin-stat-label">Trạng Thái Hoạt Động</div>
            <div className="admin-stat-value" style={{ color: "#059669" }}>
              {users.filter((u) => u.status !== "blocked").length}
            </div>
            <div className="admin-stat-desc">
              Tạm khóa: {users.filter((u) => u.status === "blocked").length} tài khoản
            </div>
          </div>
        </div>
      </div>

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
              placeholder="Tìm theo tên, email, SĐT, ID..."
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

          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động ({users.filter((u) => u.status !== "blocked").length})</option>
            <option value="blocked">Đã tạm khóa ({users.filter((u) => u.status === "blocked").length})</option>
          </select>
        </div>
      </div>

      {/* Users List Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            Danh Sách Tài Khoản ({filteredUsers.length} / {users.length})
          </h2>
        </div>

        <div className="admin-card-body" style={{ padding: 0 }}>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ minWidth: "180px" }}>Tài khoản</th>
                  <th style={{ minWidth: "100px" }}>Vai trò</th>
                  <th style={{ minWidth: "150px" }}>Liên hệ</th>
                  <th style={{ minWidth: "110px" }}>Trạng thái</th>
                  <th style={{ minWidth: "85px" }}>Đơn hàng</th>
                  <th style={{ minWidth: "95px" }}>Tổng chi</th>
                  <th style={{ minWidth: "95px" }}>Ngày tạo</th>
                  <th style={{ minWidth: "180px", textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "1.75rem", color: "#64748b" }}>
                      Đang tải danh sách tài khoản...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "1.75rem", color: "#64748b" }}>
                      Không tìm thấy tài khoản nào phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const stats = userStats[u.id] || { orderCount: 0, totalSpent: 0 };
                    const isBlocked = u.status === "blocked";
                    const isMe = currentAdmin?.id === u.id;

                    return (
                      <tr key={u.id} style={{ opacity: isBlocked ? 0.75 : 1 }}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                background: u.role === "admin" ? "#D97706" : "#64748b",
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
                              <div style={{ fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <span>{u.fullName}</span>
                                {isMe && (
                                  <span style={{ fontSize: "0.7rem", background: "#fef3c7", color: "#b45309", padding: "1px 6px", borderRadius: "4px" }}>
                                    Bạn
                                  </span>
                                )}
                              </div>
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
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`admin-badge ${isBlocked ? "out_of_stock" : "in_stock"}`}
                            style={{ cursor: isMe ? "default" : "pointer", border: "none" }}
                            title={isMe ? "Không thể đổi trạng thái tài khoản của chính mình" : (isBlocked ? "Bấm để MỞ KHÓA tài khoản" : "Bấm để TẠM KHÓA tài khoản")}
                            disabled={isMe}
                          >
                            <span className="admin-badge-dot" />
                            {isBlocked ? "Đã tạm khóa" : "Hoạt động"}
                          </button>
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

                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "0.35rem", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="admin-action-btn view"
                              onClick={() => setSelectedUser(u)}
                              title="Xem chi tiết hồ sơ & đơn hàng"
                            >
                              Chi tiết
                            </button>

                            <button
                              type="button"
                              className="admin-action-btn edit"
                              onClick={() => handleOpenEdit(u)}
                              title="Chỉnh sửa thông tin tài khoản"
                            >
                              Sửa
                            </button>

                            <button
                              type="button"
                              className="admin-action-btn"
                              style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}
                              onClick={() => {
                                setResettingUser(u);
                                setNewPasswordInput("123456");
                              }}
                              title="Đặt lại mật khẩu cho người dùng"
                            >
                              Đổi MK
                            </button>

                            <button
                              type="button"
                              className="admin-action-btn delete"
                              onClick={() => handleDeleteUser(u)}
                              disabled={isMe}
                              style={{ opacity: isMe ? 0.4 : 1, cursor: isMe ? "not-allowed" : "pointer" }}
                              title={isMe ? "Không thể xóa tài khoản đang đăng nhập" : "Xóa tài khoản người dùng"}
                            >
                              Xóa
                            </button>
                          </div>
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

      {/* MODAL 1: ADD NEW USER */}
      {isAddModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Thêm Tài Khoản Người Dùng Mới</h3>
              <button type="button" className="admin-modal-close" onClick={() => setIsAddModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="admin-modal-form">
              <div className="admin-modal-body">
                <div className="admin-form-grid">
                  <div className="admin-form-group admin-form-full">
                    <label className="admin-form-label">Họ và tên *</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Nguyễn Văn A"
                      value={addForm.fullName}
                      onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Địa chỉ Email *</label>
                    <input
                      type="email"
                      className="admin-input"
                      placeholder="nguyenvana@example.com"
                      value={addForm.email}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Số điện thoại</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="0987654321"
                      value={addForm.phone}
                      onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Mật khẩu khởi tạo *</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={addForm.password}
                      onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Vai trò tài khoản</label>
                    <select
                      className="admin-input"
                      value={addForm.role}
                      onChange={(e) => setAddForm({ ...addForm, role: e.target.value as UserRole })}
                    >
                      <option value="customer">Khách hàng</option>
                      <option value="admin">Quản trị viên (Toàn quyền)</option>
                    </select>
                  </div>

                  <div className="admin-form-group admin-form-full">
                    <label className="admin-form-label">Trạng thái kích hoạt</label>
                    <select
                      className="admin-input"
                      value={addForm.status}
                      onChange={(e) => setAddForm({ ...addForm, status: e.target.value as UserStatus })}
                    >
                      <option value="active">Đang hoạt động (Cho phép đăng nhập)</option>
                      <option value="blocked">Tạm khóa (Chặn đăng nhập)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang tạo..." : "Tạo Tài Khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER */}
      {editingUser && (
        <div className="admin-modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="admin-modal" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Chỉnh Sửa Tài Khoản: {editingUser.fullName}</h3>
              <button type="button" className="admin-modal-close" onClick={() => setEditingUser(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="admin-modal-form">
              <div className="admin-modal-body">
                <div className="admin-form-grid">
                  <div className="admin-form-group admin-form-full">
                    <label className="admin-form-label">Họ và tên *</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Địa chỉ Email *</label>
                    <input
                      type="email"
                      className="admin-input"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Số điện thoại</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Vai trò</label>
                    <select
                      className="admin-input"
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                      disabled={editingUser.id === currentAdmin?.id}
                    >
                      <option value="customer">Khách hàng</option>
                      <option value="admin">Quản trị viên (Admin)</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Trạng thái tài khoản</label>
                    <select
                      className="admin-input"
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as UserStatus })}
                      disabled={editingUser.id === currentAdmin?.id}
                    >
                      <option value="active">Đang hoạt động</option>
                      <option value="blocked">Tạm khóa</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setEditingUser(null)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu Thay Đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESET PASSWORD FOR USER */}
      {resettingUser && (
        <div className="admin-modal-overlay" onClick={() => setResettingUser(null)}>
          <div className="admin-modal" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Đặt Lại Mật Khẩu Người Dùng</h3>
              <button type="button" className="admin-modal-close" onClick={() => setResettingUser(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="admin-modal-form">
              <div className="admin-modal-body">
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 0.75rem 0" }}>
                  Bạn đang đặt lại mật khẩu mới cho tài khoản: <strong>{resettingUser.fullName}</strong> ({resettingUser.email}).
                </p>

                <div className="admin-form-group">
                  <label className="admin-form-label">Mật khẩu mới (Tối thiểu 6 ký tự) *</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    required
                  />
                  <small style={{ color: "#78716C", fontSize: "0.74rem" }}>
                    Người dùng sẽ dùng mật khẩu này để đăng nhập vào website.
                  </small>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setResettingUser(null)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang đổi..." : "Cập Nhật Mật Khẩu Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: USER DETAILS (Addresses & Orders) */}
      {selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div
            className="admin-modal"
            style={{ maxWidth: "600px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Hồ Sơ Tài Khoản: {selectedUser.fullName}</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedUser(null)}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {/* Profile summary */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#f8fafc", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    background: selectedUser.role === "admin" ? "#0284c7" : "#475569",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "1rem",
                    flexShrink: 0,
                  }}
                >
                  {selectedUser.fullName.trim().charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{selectedUser.fullName}</strong>
                    <span className="admin-badge" style={{
                      background: selectedUser.role === "admin" ? "#e0f2fe" : "#f1f5f9",
                      color: selectedUser.role === "admin" ? "#0369a1" : "#475569",
                      fontSize: "0.7rem",
                    }}>
                      {selectedUser.role === "admin" ? "Quản trị viên" : "Khách hàng"}
                    </span>
                    <span className={`admin-badge ${selectedUser.status === "blocked" ? "out_of_stock" : "in_stock"}`} style={{ fontSize: "0.7rem" }}>
                      {selectedUser.status === "blocked" ? "Tạm khóa" : "Hoạt động"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "1px" }}>
                    ID: {selectedUser.id} • Ngày tạo: {formatDate(selectedUser.createdAt)}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "0.25rem", fontSize: "0.78rem" }}>
                    <div>📧 <strong>{selectedUser.email}</strong></div>
                    <div>📞 <strong>{selectedUser.phone || "Chưa cập nhật SĐT"}</strong></div>
                  </div>
                </div>
              </div>

              {/* Stats overview */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.6rem 0.85rem" }}>
                  <div style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 500 }}>Tổng số đơn hàng</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                    {selectedUserOrders.length} đơn
                  </div>
                </div>
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.6rem 0.85rem" }}>
                  <div style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 500 }}>Tổng chi tiêu tích lũy</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#059669", marginTop: "2px" }}>
                    {formatPrice(
                      selectedUserOrders
                        .filter((o) => o.status !== "cancelled")
                        .reduce((sum, o) => sum + o.total, 0)
                    )}
                  </div>
                </div>
              </div>

              {/* Saved addresses */}
              <div>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem", color: "#0f172a" }}>
                  Sổ Địa Chỉ Giao Hàng ({selectedUser.addresses?.length || 0})
                </h4>
                {(!selectedUser.addresses || selectedUser.addresses.length === 0) ? (
                  <p style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic", background: "#f8fafc", padding: "0.75rem", borderRadius: "6px" }}>
                    Người dùng chưa lưu sổ địa chỉ nào trong hồ sơ.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {selectedUser.addresses.map((addr, idx) => (
                      <div
                        key={addr.id || idx}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          padding: "0.75rem 1rem",
                          fontSize: "0.85rem",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span>{addr.fullName}</span>
                            <span style={{ color: "#64748b", fontWeight: 400 }}>• {addr.phone}</span>
                            {addr.isDefault && (
                              <span style={{ fontSize: "0.7rem", background: "#dbeafe", color: "#1d4ed8", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                                Mặc định
                              </span>
                            )}
                          </div>
                          <div style={{ color: "#475569", marginTop: "2px" }}>
                            {addr.detail}, {addr.district}, {addr.province}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Orders */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                    Lịch Sử Mua Hàng ({selectedUserOrders.length})
                  </h4>
                  <Link
                    href={`/admin/orders?search=${encodeURIComponent(selectedUser.email)}`}
                    style={{ fontSize: "0.8rem", color: "#0284c7", fontWeight: 600, textDecoration: "none" }}
                  >
                    Xem tất cả trong Quản lý đơn hàng →
                  </Link>
                </div>

                {selectedUserOrders.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic", background: "#f8fafc", padding: "0.75rem", borderRadius: "6px" }}>
                    Tài khoản chưa có đơn hàng nào trong hệ thống.
                  </p>
                ) : (
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                    <table className="admin-table" style={{ fontSize: "0.82rem" }}>
                      <thead>
                        <tr>
                          <th>Mã đơn</th>
                          <th>Thời gian</th>
                          <th>Số SP</th>
                          <th>Tổng tiền</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUserOrders.slice(0, 5).map((ord) => (
                          <tr key={ord.id}>
                            <td style={{ fontWeight: 600 }}>{ord.id}</td>
                            <td style={{ color: "#64748b" }}>{formatDate(ord.createdAt)}</td>
                            <td>{ord.items.length} món</td>
                            <td style={{ fontWeight: 600, color: "#0f172a" }}>{formatPrice(ord.total)}</td>
                            <td>
                              <span className={`admin-badge ${ord.status}`}>
                                {ORDER_STATUS_LABELS[ord.status] || ord.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="admin-modal-footer">
              <Link
                href={`/admin/orders?search=${encodeURIComponent(selectedUser.email)}`}
                className="admin-btn admin-btn-outline"
                onClick={() => setSelectedUser(null)}
              >
                Tra cứu đơn hàng của khách
              </Link>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => setSelectedUser(null)}
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
