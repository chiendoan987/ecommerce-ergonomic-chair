"use client";

import { useEffect, useState, useMemo } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from "@/lib/services/category.service";
import { useToast } from "@/hooks/use-toast";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const toast = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Chỉ cần duy nhất 1 trường: Tên danh mục
  const [categoryName, setCategoryName] = useState("");

  // Tải danh sách danh mục từ database
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const data = await getCategories(true);
        if (!isMounted) return;
        setCategories(data);
        setIsLoading(false);
      } catch {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    const handleCategoriesChange = () => {
      loadData();
    };

    window.addEventListener("ergochair-categories-change", handleCategoriesChange);
    return () => {
      isMounted = false;
      window.removeEventListener("ergochair-categories-change", handleCategoriesChange);
    };
  }, [refreshKey]);

  // Tìm kiếm danh mục theo tên
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter((cat) => cat.name.toLowerCase().includes(q));
  }, [categories, search]);

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setCategoryName("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = categoryName.trim();
    if (!trimmed) {
      toast.error("Vui lòng nhập tên danh mục.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name: trimmed });
        toast.success(`Cập nhật danh mục "${trimmed}" thành công!`);
      } else {
        await createCategory({ name: trimmed });
        toast.success(`Đã thêm danh mục "${trimmed}" thành công!`);
      }

      setIsModalOpen(false);
      setCategoryName("");
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err.message || "Không thể lưu danh mục.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const ok = await deleteCategory(deleteTarget.id);
      if (ok) {
        toast.success(`Đã xóa danh mục "${deleteTarget.name}" thành công.`);
        setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setRefreshKey((k) => k + 1);
        setDeleteTarget(null);
      } else {
        toast.error(`Không thể xóa danh mục "${deleteTarget.name}".`);
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xóa danh mục.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="admin-products-page">
      {/* Header */}
      <div className="admin-greeting-header">
        <h1 className="admin-greeting-title">Danh mục sản phẩm</h1>
        <p className="admin-greeting-subtitle">
          Quản lý các danh mục để phân loại và sắp xếp sản phẩm trên cửa hàng.
        </p>
      </div>

      {/* Toolbar & Filter */}
      <div className="admin-filter-bar">
        <div className="admin-filter-bar-left">
          <div className="admin-search-box" style={{ maxWidth: 360 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm danh mục..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
          </div>
        </div>

        <div className="admin-filter-bar-right">
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={handleOpenCreateModal}
          >
            <span style={{ fontSize: "1.15rem", lineHeight: 1 }}>+</span>
            Thêm danh mục
          </button>
        </div>
      </div>

      {/* Categories Table Card */}
      <div className="admin-card">
        <div className="admin-card-body" style={{ padding: 0 }}>
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: "60%" }}>Tên danh mục</th>
                  <th style={{ width: "25%" }}>Số lượng sản phẩm</th>
                  <th style={{ width: "15%", textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                      Đang tải danh sách danh mục...
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                      Không tìm thấy danh mục nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => (
                    <tr key={cat.id}>
                      {/* Tên danh mục */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: "#f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.2rem",
                            flexShrink: 0
                          }}>
                            📁
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.98rem" }}>
                              {cat.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Số lượng sản phẩm */}
                      <td>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "0.3rem 0.75rem",
                          borderRadius: 9999,
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          background: cat.productCount > 0 ? "#eff6ff" : "#f8fafc",
                          color: cat.productCount > 0 ? "#2563eb" : "#64748b",
                          border: `1px solid ${cat.productCount > 0 ? "#bfdbfe" : "#e2e8f0"}`,
                        }}>
                          {cat.productCount} sản phẩm
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="admin-action-btn edit"
                            onClick={() => handleOpenEditModal(cat)}
                            title="Sửa tên danh mục"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="admin-action-btn delete"
                            onClick={() => setDeleteTarget(cat)}
                            title="Xóa danh mục"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Thêm / Chỉnh Sửa Danh Mục - Chỉ duy nhất 1 trường Tên Danh Mục */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {editingCategory ? "Đổi Tên Danh Mục" : "Thêm Danh Mục Mới"}
              </h3>
              <button
                type="button"
                className="admin-btn-icon"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "1.1rem" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="admin-modal-form">
              <div className="admin-modal-body" style={{ padding: "1.5rem" }}>
                <div className="admin-form-group admin-form-full">
                  <label className="admin-form-label" style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.5rem", display: "block" }}>
                    Tên danh mục <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    required
                    autoFocus
                    placeholder="VD: Ghế Gaming, Ghế văn phòng..."
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    style={{ fontSize: "1rem", padding: "0.75rem 1rem" }}
                  />
                  <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.5rem", marginBottom: 0 }}>
                    Hệ thống sẽ tự động tối ưu đường dẫn và hiển thị cho danh mục này.
                  </p>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang lưu..." : editingCategory ? "Lưu Thay Đổi" : "Thêm Danh Mục"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Xóa */}
      {deleteTarget && (
        <div className="admin-modal-overlay" onClick={() => !isDeleting && setDeleteTarget(null)}>
          <div className="admin-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ borderBottom: "none", paddingBottom: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#fee2e2",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                }}>
                  ⚠️
                </div>
                <h3 className="admin-modal-title" style={{ fontSize: "1.15rem", margin: 0 }}>
                  Xác nhận xóa danh mục
                </h3>
              </div>
              <button
                type="button"
                className="admin-btn-icon"
                onClick={() => !isDeleting && setDeleteTarget(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body" style={{ padding: "0.5rem 1.5rem 1.5rem" }}>
              <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>
                Bạn có chắc chắn muốn xóa danh mục <strong>&ldquo;{deleteTarget.name}&rdquo;</strong>?
              </p>
              {deleteTarget.productCount > 0 && (
                <div style={{
                  marginTop: "0.75rem",
                  padding: "0.6rem 0.85rem",
                  borderRadius: 6,
                  background: "#fffbeb",
                  border: "1px solid #fef3c7",
                  color: "#92400e",
                  fontSize: "0.85rem",
                  lineHeight: 1.5,
                }}>
                  ℹ️ Danh mục này hiện có <strong>{deleteTarget.productCount} sản phẩm</strong>. Khi xóa danh mục, các sản phẩm sẽ không bị xóa mà chỉ được bỏ gán danh mục này.
                </div>
              )}
            </div>

            <div className="admin-modal-footer" style={{ borderTop: "1px solid #f1f5f9", padding: "1rem 1.5rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="admin-btn"
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  opacity: isDeleting ? 0.7 : 1,
                }}
                disabled={isDeleting}
                onClick={handleConfirmDelete}
              >
                {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
