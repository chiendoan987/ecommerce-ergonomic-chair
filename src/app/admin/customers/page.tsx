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
  getPasswordResetRequestsByAdmin,
  processPasswordResetByAdmin,
  type PasswordResetAdminItem,
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

  // View Tab & Password Reset Requests state
  const [activeTab, setActiveTab] = useState<"users" | "resets">("users");
  const [resetRequests, setResetRequests] = useState<PasswordResetAdminItem[]>([]);
  const [resetSearch, setResetSearch] = useState("");
  const [resetFilter, setResetFilter] = useState("all");
  const [isResetLoading, setIsResetLoading] = useState(false);

  // Password reset actions modal state
  const [processingRequest, setProcessingRequest] = useState<PasswordResetAdminItem | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [isProcessingReset, setIsProcessingReset] = useState(false);
  const [grantedResult, setGrantedResult] = useState<{
    email: string;
    fullName: string;
    newPassword: string;
  } | null>(null);
  const [viewingIssuedPasswordRequest, setViewingIssuedPasswordRequest] = useState<PasswordResetAdminItem | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const q = sp.get("search");
      if (q) setSearch(q);
      const tab = sp.get("tab");
      if (tab === "resets") setActiveTab("resets");
    }
  }, []);

  const loadResetData = async () => {
    setIsResetLoading(true);
    try {
      const list = await getPasswordResetRequestsByAdmin();
      setResetRequests(list);
    } catch {
      // ignore
    } finally {
      setIsResetLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [usersData, ordersData, resetsData] = await Promise.all([
        getAllUsers(),
        getOrders(),
        getPasswordResetRequestsByAdmin(),
      ]);
      setUsers(usersData);
      setOrders(ordersData);
      setResetRequests(resetsData);
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

  // Filter password reset requests
  const filteredResets = useMemo(() => {
    return resetRequests.filter((r) => {
      if (resetSearch.trim()) {
        const q = resetSearch.toLowerCase();
        const matchEmail = r.email.toLowerCase().includes(q);
        const matchName = (r.fullName || "").toLowerCase().includes(q);
        const matchPhone = (r.phone || "").toLowerCase().includes(q);
        const matchNote = (r.note || "").toLowerCase().includes(q);
        if (!matchEmail && !matchName && !matchPhone && !matchNote) return false;
      }

      if (resetFilter !== "all" && r.status !== resetFilter) {
        return false;
      }

      return true;
    });
  }, [resetRequests, resetSearch, resetFilter]);

  const pendingResetCount = useMemo(
    () => resetRequests.filter((r) => r.status === "pending").length,
    [resetRequests]
  );
  const completedResetCount = useMemo(
    () => resetRequests.filter((r) => r.status === "completed").length,
    [resetRequests]
  );
  const rejectedResetCount = useMemo(
    () => resetRequests.filter((r) => r.status === "rejected").length,
    [resetRequests]
  );

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

  const generateRandomPassword = () => {
    const prefixes = ["Ergo", "Chair", "Comfort", "Smart", "Office", "Pro"];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${randomPrefix}@${randomNum}`;
  };

  const handleOpenApproveModal = (req: PasswordResetAdminItem) => {
    setProcessingRequest(req);
    setGeneratedPassword(generateRandomPassword());
    setAdminNote("");
  };

  const handleConfirmApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingRequest) return;
    if (!generatedPassword.trim() || generatedPassword.length < 6) {
      toast.error("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }

    setIsProcessingReset(true);
    try {
      const res = await processPasswordResetByAdmin({
        requestId: processingRequest.id,
        action: "approve",
        adminEmail: currentAdmin?.email,
        customPassword: generatedPassword.trim(),
        adminNote: adminNote.trim() || undefined,
      });

      if (res.success && res.newPassword) {
        toast.success("Đã cấp lại mật khẩu thành công!");
        const currentReq = processingRequest;
        setProcessingRequest(null);
        setGrantedResult({
          email: currentReq.email,
          fullName: currentReq.fullName || currentReq.email,
          newPassword: res.newPassword,
        });
        await loadResetData();
        await loadData();
      } else {
        toast.error(res.error || "Không thể cấp lại mật khẩu.");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi cấp mật khẩu mới.");
    } finally {
      setIsProcessingReset(false);
    }
  };

  const handleRejectRequest = async (req: PasswordResetAdminItem) => {
    const reason = window.prompt(
      `Từ chối yêu cầu cấp lại mật khẩu của "${req.fullName || req.email}"?\nNhập lý do từ chối (tùy chọn):`,
      "Thông tin chưa xác minh hoặc email không chính xác"
    );
    if (reason === null) return;

    try {
      const res = await processPasswordResetByAdmin({
        requestId: req.id,
        action: "reject",
        adminEmail: currentAdmin?.email,
        adminNote: reason.trim() || "Bị từ chối bởi Quản trị viên",
      });

      if (res.success) {
        toast.success("Đã từ chối yêu cầu thành công!");
        await loadResetData();
      } else {
        toast.error(res.error || "Không thể từ chối yêu cầu.");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi từ chối yêu cầu.");
    }
  };

  const handleCopyPassword = (pwd: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(pwd);
      setCopiedPassword(true);
      toast.success("Đã sao chép mật khẩu vào bộ nhớ tạm!");
      setTimeout(() => setCopiedPassword(false), 2500);
    }
  };

  return (
    <div className="admin-customers-page">
      {/* Page Header */}
      <div className="admin-greeting-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="admin-greeting-title">Quản Lý Tài Khoản Người Dùng</h1>
          <p className="admin-greeting-subtitle">
            Toàn quyền quản trị danh sách người dùng, cấp lại mật khẩu cho khách hàng quên mật khẩu, phân quyền và khóa/mở khóa tài khoản.
          </p>
        </div>

        {activeTab === "users" ? (
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
        ) : (
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={loadResetData}
            disabled={isResetLoading}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>{isResetLoading ? "Đang làm mới..." : "Làm Mới Yêu Cầu"}</span>
          </button>
        )}
      </div>

      {/* View Tabs Selector */}
      <div
        style={{
          display: "flex",
          gap: "0.6rem",
          marginBottom: "1.35rem",
          borderBottom: "2px solid #EFE7DC",
          paddingBottom: "0.6rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.6rem 1.15rem",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "0.92rem",
            cursor: "pointer",
            border: activeTab === "users" ? "1px solid #FF9A24" : "1px solid #E5E7EB",
            background: activeTab === "users" ? "#FF9A24" : "#FFFFFF",
            color: activeTab === "users" ? "#FFFFFF" : "#4B5563",
            boxShadow: activeTab === "users" ? "0 2px 8px rgba(255, 154, 36, 0.28)" : "none",
            transition: "all 0.18s ease",
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Danh Sách Tài Khoản</span>
          <span
            style={{
              background: activeTab === "users" ? "rgba(255,255,255,0.28)" : "#F3F4F6",
              color: activeTab === "users" ? "#FFFFFF" : "#374151",
              fontSize: "0.75rem",
              padding: "2px 7px",
              borderRadius: "10px",
              fontWeight: 700,
            }}
          >
            {users.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("resets")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.6rem 1.15rem",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "0.92rem",
            cursor: "pointer",
            border: activeTab === "resets" ? "1px solid #FF9A24" : "1px solid #E5E7EB",
            background: activeTab === "resets" ? "#FF9A24" : "#FFFFFF",
            color: activeTab === "resets" ? "#FFFFFF" : "#4B5563",
            boxShadow: activeTab === "resets" ? "0 2px 8px rgba(255, 154, 36, 0.28)" : "none",
            transition: "all 0.18s ease",
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Yêu Cầu Quên Mật Khẩu</span>
          {pendingResetCount > 0 ? (
            <span
              style={{
                background: "#DC2626",
                color: "#FFFFFF",
                fontSize: "0.75rem",
                padding: "2px 8px",
                borderRadius: "10px",
                fontWeight: 700,
                boxShadow: "0 0 6px rgba(220, 38, 38, 0.4)",
              }}
            >
              {pendingResetCount} chờ cấp
            </span>
          ) : (
            <span
              style={{
                background: activeTab === "resets" ? "rgba(255,255,255,0.28)" : "#F3F4F6",
                color: activeTab === "resets" ? "#FFFFFF" : "#374151",
                fontSize: "0.75rem",
                padding: "2px 7px",
                borderRadius: "10px",
                fontWeight: 700,
              }}
            >
              {resetRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: USERS MANAGEMENT VIEW */}
      {activeTab === "users" && (
        <>
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
        </>
      )}

      {/* TAB 2: FORGOT PASSWORD REQUESTS VIEW */}
      {activeTab === "resets" && (
        <>
          {/* Resets Metric Cards */}
          <div className="admin-stats-grid" style={{ marginBottom: "1.5rem" }}>
            <div className="admin-stat-card">
              <div className="admin-stat-content">
                <div className="admin-stat-label">Tổng Số Yêu Cầu</div>
                <div className="admin-stat-value">{resetRequests.length}</div>
                <div className="admin-stat-desc">Đã tiếp nhận trong hệ thống</div>
              </div>
            </div>

            <div className="admin-stat-card" style={{ border: pendingResetCount > 0 ? "1.5px solid #F59E0B" : undefined }}>
              <div className="admin-stat-content">
                <div className="admin-stat-label">Chờ Cấp Mật Khẩu</div>
                <div className="admin-stat-value" style={{ color: "#D97706" }}>
                  {pendingResetCount}
                </div>
                <div className="admin-stat-desc">
                  {pendingResetCount > 0 ? "Cần Quản trị viên xử lý ngay" : "Không có yêu cầu tồn đọng"}
                </div>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-content">
                <div className="admin-stat-label">Đã Cấp Thành Công</div>
                <div className="admin-stat-value" style={{ color: "#059669" }}>
                  {completedResetCount}
                </div>
                <div className="admin-stat-desc">Đã tạo và cấp mật khẩu mới</div>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-content">
                <div className="admin-stat-label">Đã Từ Chối</div>
                <div className="admin-stat-value" style={{ color: "#64748B" }}>
                  {rejectedResetCount}
                </div>
                <div className="admin-stat-desc">Yêu cầu không hợp lệ / đã hủy</div>
              </div>
            </div>
          </div>

          {/* Resets Filter Bar */}
          <div className="admin-filter-bar">
            <div className="admin-filter-bar-left">
              <div className="admin-search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Tìm theo email, họ tên, SĐT, ghi chú..."
                  value={resetSearch}
                  onChange={(e) => setResetSearch(e.target.value)}
                />
              </div>

              <select
                className="admin-select"
                value={resetFilter}
                onChange={(e) => setResetFilter(e.target.value)}
              >
                <option value="all">Tất cả trạng thái ({resetRequests.length})</option>
                <option value="pending">⏳ Chờ cấp mật khẩu ({pendingResetCount})</option>
                <option value="completed">✅ Đã cấp lại mật khẩu ({completedResetCount})</option>
                <option value="rejected">❌ Đã từ chối ({rejectedResetCount})</option>
              </select>
            </div>
          </div>

          {/* Resets Table */}
          <div className="admin-card">
            <div className="admin-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <h2 className="admin-card-title">
                Danh Sách Yêu Cầu Cấp Lại Mật Khẩu ({filteredResets.length} / {resetRequests.length})
              </h2>
              {pendingResetCount > 0 && (
                <span style={{ fontSize: "0.82rem", background: "#FEF3C7", color: "#B45309", padding: "4px 12px", borderRadius: "12px", fontWeight: 600 }}>
                  ⚡ Có {pendingResetCount} yêu cầu đang chờ cấp mật khẩu
                </span>
              )}
            </div>

            <div className="admin-card-body" style={{ padding: 0 }}>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: "190px" }}>Khách hàng yêu cầu</th>
                      <th style={{ minWidth: "180px" }}>Ghi chú từ khách</th>
                      <th style={{ minWidth: "120px" }}>Trạng thái</th>
                      <th style={{ minWidth: "160px" }}>Mật khẩu đã cấp / Phản hồi</th>
                      <th style={{ minWidth: "110px" }}>Thời gian gửi</th>
                      <th style={{ minWidth: "160px", textAlign: "right" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isResetLoading ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                          Đang tải danh sách yêu cầu cấp lại mật khẩu...
                        </td>
                      </tr>
                    ) : filteredResets.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem 1rem", color: "#64748b" }}>
                          <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>📭</div>
                          <div style={{ fontWeight: 600, color: "#1E293B", marginBottom: "0.25rem" }}>
                            {resetFilter === "pending"
                              ? "Tuyệt vời! Không có yêu cầu cấp lại mật khẩu nào đang chờ duyệt."
                              : "Không tìm thấy yêu cầu nào phù hợp với bộ lọc."}
                          </div>
                          <p style={{ margin: 0, fontSize: "0.84rem" }}>
                            Khi khách hàng quên mật khẩu và gửi yêu cầu từ trang đăng nhập, các yêu cầu sẽ xuất hiện tại đây.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredResets.map((r) => {
                        const isPending = r.status === "pending";
                        const isCompleted = r.status === "completed";
                        const isRejected = r.status === "rejected";

                        return (
                          <tr key={r.id} style={{ background: isPending ? "#FFFDF9" : undefined }}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div
                                  style={{
                                    width: "38px",
                                    height: "38px",
                                    borderRadius: "50%",
                                    background: isPending ? "#FF9A24" : isCompleted ? "#059669" : "#94A3B8",
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    fontSize: "0.88rem",
                                    flexShrink: 0,
                                  }}
                                >
                                  {(r.fullName || r.email).trim().charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: "#0F172A", fontSize: "0.9rem" }}>
                                    {r.fullName || "Khách hàng"}
                                  </div>
                                  <div style={{ fontSize: "0.82rem", color: "#475569" }}>{r.email}</div>
                                  {r.phone && (
                                    <div style={{ fontSize: "0.75rem", color: "#64748B" }}>📞 {r.phone}</div>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td>
                              {r.note ? (
                                <div
                                  style={{
                                    fontSize: "0.84rem",
                                    color: "#334155",
                                    background: "#F8FAFC",
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid #E2E8F0",
                                    maxWidth: "260px",
                                    lineHeight: 1.4,
                                  }}
                                >
                                  &ldquo;{r.note}&rdquo;
                                </div>
                              ) : (
                                <span style={{ color: "#94A3B8", fontSize: "0.8rem", fontStyle: "italic" }}>
                                  (Không có ghi chú thêm)
                                </span>
                              )}
                            </td>

                            <td>
                              {isPending && (
                                <span
                                  className="admin-badge"
                                  style={{
                                    background: "#FEF3C7",
                                    color: "#B45309",
                                    border: "1px solid #FDE68A",
                                    fontWeight: 600,
                                  }}
                                >
                                  <span className="admin-badge-dot" style={{ background: "#D97706" }} />
                                  Chờ cấp MK
                                </span>
                              )}
                              {isCompleted && (
                                <span
                                  className="admin-badge in_stock"
                                  style={{ fontWeight: 600 }}
                                >
                                  <span className="admin-badge-dot" />
                                  Đã cấp lại MK
                                </span>
                              )}
                              {isRejected && (
                                <span
                                  className="admin-badge out_of_stock"
                                  style={{ fontWeight: 600 }}
                                >
                                  <span className="admin-badge-dot" />
                                  Đã từ chối
                                </span>
                              )}
                            </td>

                            <td>
                              {isCompleted && (
                                <div>
                                  {r.newPassword ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                      <code
                                        style={{
                                          background: "#ECFDF5",
                                          color: "#047857",
                                          padding: "3px 8px",
                                          borderRadius: "6px",
                                          fontWeight: 700,
                                          fontSize: "0.85rem",
                                          border: "1px solid #A7F3D0",
                                          letterSpacing: "0.5px",
                                        }}
                                      >
                                        {r.newPassword}
                                      </code>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyPassword(r.newPassword!)}
                                        style={{
                                          background: "none",
                                          border: "none",
                                          cursor: "pointer",
                                          color: "#059669",
                                          padding: "2px",
                                          fontSize: "0.85rem",
                                        }}
                                        title="Sao chép mật khẩu"
                                      >
                                        📋
                                      </button>
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: "0.8rem", color: "#059669" }}>Mật khẩu đã đổi</span>
                                  )}
                                  <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "2px" }}>
                                    Bởi: {r.processedBy || "Admin"}
                                  </div>
                                </div>
                              )}
                              {isRejected && (
                                <div>
                                  <div style={{ fontSize: "0.8rem", color: "#DC2626" }}>
                                    {r.adminNote || "Từ chối yêu cầu"}
                                  </div>
                                  <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "2px" }}>
                                    Bởi: {r.processedBy || "Admin"}
                                  </div>
                                </div>
                              )}
                              {isPending && (
                                <span style={{ color: "#94A3B8", fontSize: "0.8rem" }}>
                                  Chờ Admin thao tác cấp MK
                                </span>
                              )}
                            </td>

                            <td style={{ fontSize: "0.8rem", color: "#64748B" }}>
                              {formatDate(r.createdAt)}
                            </td>

                            <td style={{ textAlign: "right" }}>
                              {isPending ? (
                                <div style={{ display: "inline-flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                                  <button
                                    type="button"
                                    className="admin-btn admin-btn-primary"
                                    style={{
                                      padding: "0.4rem 0.75rem",
                                      fontSize: "0.8rem",
                                      fontWeight: 600,
                                      boxShadow: "none",
                                    }}
                                    onClick={() => handleOpenApproveModal(r)}
                                    title="Cấp lại mật khẩu mới cho khách hàng"
                                  >
                                    🔑 Cấp Mật Khẩu
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-action-btn delete"
                                    onClick={() => handleRejectRequest(r)}
                                    title="Từ chối yêu cầu cấp lại mật khẩu"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : isCompleted ? (
                                <button
                                  type="button"
                                  className="admin-action-btn view"
                                  onClick={() => setViewingIssuedPasswordRequest(r)}
                                  title="Xem lại mật khẩu đã cấp"
                                >
                                  👁️ Xem MK
                                </button>
                              ) : (
                                <span style={{ fontSize: "0.78rem", color: "#94A3B8" }}>Đã đóng</span>
                              )}
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
        </>
      )}

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

      {/* MODAL 5: APPROVE & ISSUE NEW PASSWORD */}
      {processingRequest && (
        <div className="admin-modal-overlay" onClick={() => !isProcessingReset && setProcessingRequest(null)}>
          <div className="admin-modal" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🔑</span>
                <span>Cấp Mật Khẩu Mới Cho Khách Hàng</span>
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => !isProcessingReset && setProcessingRequest(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmApprove} className="admin-modal-form">
              <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Requester Info Card */}
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "0.85rem 1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                    <div>
                      <strong style={{ fontSize: "0.95rem", color: "#0F172A" }}>
                        {processingRequest.fullName || "Khách hàng"}
                      </strong>
                      <div style={{ fontSize: "0.82rem", color: "#475569" }}>{processingRequest.email}</div>
                    </div>
                    {processingRequest.phone && (
                      <span style={{ fontSize: "0.8rem", background: "#EFF6FF", color: "#1D4ED8", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>
                        📞 {processingRequest.phone}
                      </span>
                    )}
                  </div>

                  {processingRequest.note && (
                    <div style={{ fontSize: "0.82rem", color: "#475569", background: "#FFFFFF", padding: "6px 10px", borderRadius: "6px", border: "1px solid #E2E8F0", marginTop: "0.5rem" }}>
                      <strong>Lý do từ khách:</strong> &ldquo;{processingRequest.note}&rdquo;
                    </div>
                  )}

                  <div style={{ fontSize: "0.74rem", color: "#94A3B8", marginTop: "0.4rem" }}>
                    Gửi yêu cầu lúc: {formatDate(processingRequest.createdAt)}
                  </div>
                </div>

                {/* Password Input & Generator */}
                <div className="admin-form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                    <label className="admin-form-label" style={{ margin: 0 }}>
                      Mật khẩu mới cấp cho người dùng *
                    </label>
                    <button
                      type="button"
                      onClick={() => setGeneratedPassword(generateRandomPassword())}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#FF9A24",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="Tạo mật khẩu ngẫu nhiên mới"
                    >
                      🎲 Đổi mật khẩu ngẫu nhiên
                    </button>
                  </div>

                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      className="admin-input"
                      value={generatedPassword}
                      onChange={(e) => setGeneratedPassword(e.target.value)}
                      placeholder="Nhập hoặc tạo mật khẩu mới"
                      required
                      style={{
                        fontFamily: "monospace",
                        fontSize: "1rem",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        color: "#0F172A",
                        paddingRight: "80px",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyPassword(generatedPassword)}
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "#F3F4F6",
                        border: "1px solid #E5E7EB",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#374151",
                        cursor: "pointer",
                      }}
                    >
                      📋 Copy
                    </button>
                  </div>
                  <small style={{ color: "#64748B", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>
                    Mật khẩu này sẽ được mã hóa và cập nhật trực tiếp vào cơ sở dữ liệu của tài khoản người dùng.
                  </small>
                </div>

                {/* Admin Note */}
                <div className="admin-form-group">
                  <label className="admin-form-label">Ghi chú lưu lịch sử (Tùy chọn)</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Ví dụ: Đã hỗ trợ qua điện thoại / Đã gửi qua Zalo"
                  />
                </div>

                <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "8px", padding: "0.65rem 0.85rem", fontSize: "0.8rem", color: "#92400E", lineHeight: 1.45 }}>
                  💡 <strong>Lưu ý:</strong> Sau khi bấm xác nhận, hãy sao chép mật khẩu mới này để thông báo cho khách hàng qua điện thoại, email hoặc Zalo.
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setProcessingRequest(null)}
                  disabled={isProcessingReset}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={isProcessingReset}
                >
                  {isProcessingReset ? "Đang cập nhật..." : "Xác Nhận & Cấp Mật Khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: GRANTED PASSWORD SUCCESS POPUP */}
      {grantedResult && (
        <div className="admin-modal-overlay" onClick={() => setGrantedResult(null)}>
          <div className="admin-modal" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ borderBottom: "none", paddingBottom: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.25rem" }}>🎉</span>
                <h3 className="admin-modal-title" style={{ color: "#059669" }}>
                  Đã Cấp Mật Khẩu Mới Thành Công!
                </h3>
              </div>
              <button type="button" className="admin-modal-close" onClick={() => setGrantedResult(null)}>
                ✕
              </button>
            </div>

            <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ margin: 0, fontSize: "0.86rem", color: "#475569" }}>
                Hệ thống đã cập nhật mật khẩu mới cho tài khoản: <strong>{grantedResult.fullName}</strong> (<code>{grantedResult.email}</code>).
              </p>

              {/* Highlighted Password Box */}
              <div
                style={{
                  background: "#ECFDF5",
                  border: "2px dashed #10B981",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "#047857", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  MẬT KHẨU MỚI ĐÃ CẤP
                </div>
                <div
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: 800,
                    fontFamily: "monospace",
                    color: "#065F46",
                    letterSpacing: "1px",
                  }}
                >
                  {grantedResult.newPassword}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyPassword(grantedResult.newPassword)}
                  className="admin-btn admin-btn-primary"
                  style={{
                    padding: "0.5rem 1.25rem",
                    fontSize: "0.85rem",
                    background: copiedPassword ? "#059669" : undefined,
                  }}
                >
                  {copiedPassword ? "✓ Đã sao chép vào bộ nhớ!" : "📋 Sao chép mật khẩu này"}
                </button>
              </div>

              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "0.75rem", fontSize: "0.82rem", color: "#64748B", lineHeight: 1.5 }}>
                📢 <strong>Bước tiếp theo:</strong> Bạn có thể sao chép mật khẩu trên và gửi ngay cho khách hàng qua <strong>Zalo / SMS / Email</strong> hoặc báo qua điện thoại để khách hàng có thể đăng nhập.
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => setGrantedResult(null)}
                style={{ width: "100%" }}
              >
                Hoàn Tất & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: VIEW ISSUED PASSWORD DETAILS */}
      {viewingIssuedPasswordRequest && (
        <div className="admin-modal-overlay" onClick={() => setViewingIssuedPasswordRequest(null)}>
          <div className="admin-modal" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Chi Tiết Mật Khẩu Đã Cấp</h3>
              <button type="button" className="admin-modal-close" onClick={() => setViewingIssuedPasswordRequest(null)}>
                ✕
              </button>
            </div>

            <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "0.85rem 1rem" }}>
                <div style={{ fontWeight: 600, color: "#0F172A", fontSize: "0.95rem" }}>
                  {viewingIssuedPasswordRequest.fullName || "Khách hàng"}
                </div>
                <div style={{ fontSize: "0.84rem", color: "#475569" }}>{viewingIssuedPasswordRequest.email}</div>
                {viewingIssuedPasswordRequest.phone && (
                  <div style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "2px" }}>
                    📞 {viewingIssuedPasswordRequest.phone}
                  </div>
                )}
                {viewingIssuedPasswordRequest.note && (
                  <div style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "#475569" }}>
                    <strong>Lý do từ khách:</strong> {viewingIssuedPasswordRequest.note}
                  </div>
                )}
              </div>

              {viewingIssuedPasswordRequest.newPassword && (
                <div
                  style={{
                    background: "#ECFDF5",
                    border: "1px solid #A7F3D0",
                    borderRadius: "10px",
                    padding: "1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#047857", fontWeight: 600 }}>MẬT KHẨU ĐÃ CẤP</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, fontFamily: "monospace", color: "#065F46" }}>
                      {viewingIssuedPasswordRequest.newPassword}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPassword(viewingIssuedPasswordRequest.newPassword!)}
                    className="admin-btn admin-btn-outline"
                    style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem" }}
                  >
                    📋 Sao chép
                  </button>
                </div>
              )}

              <div style={{ fontSize: "0.8rem", color: "#64748B" }}>
                <div>Người xử lý: <strong>{viewingIssuedPasswordRequest.processedBy || "Admin"}</strong></div>
                <div>Thời gian xử lý: {viewingIssuedPasswordRequest.processedAt ? formatDate(viewingIssuedPasswordRequest.processedAt) : "—"}</div>
                {viewingIssuedPasswordRequest.adminNote && (
                  <div style={{ marginTop: "0.25rem" }}>
                    Ghi chú Admin: <em>{viewingIssuedPasswordRequest.adminNote}</em>
                  </div>
                )}
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => setViewingIssuedPasswordRequest(null)}
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

