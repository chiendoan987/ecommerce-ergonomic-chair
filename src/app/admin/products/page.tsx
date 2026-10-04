"use client";

import Link from "next/link";
import { useEffect, useState, useMemo, useRef } from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStock,
  CATEGORIES,
  type CreateProductInput,
} from "@/lib/services/product.service";
import type { Product } from "@/lib/types/product";
import { formatPrice } from "@/lib/utils/format";
import { useToast } from "@/hooks/use-toast";

// Hàm hỗ trợ nén và tối ưu hóa ảnh tải lên từ thiết bị
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP, GIF)."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lỗi khi đọc file ảnh từ thiết bị."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Không thể xử lý hình ảnh này."));
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const MAX_DIMENSION = 1200;
          let { width, height } = img;

          if (width > height) {
            if (width > MAX_DIMENSION) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const outputFormat = file.type === "image/png" ? "image/png" : "image/jpeg";
          const dataUrl = canvas.toDataURL(outputFormat, 0.85);
          resolve(dataUrl);
        } catch {
          resolve(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStock, setSelectedStock] = useState("all");
  const toast = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    category: Product["category"];
    price: number;
    oldPrice: number;
    stockQuantity: number;
    description: string;
    image: string;
    material: string;
    color: string;
    size: string;
    weight: string;
    capacity: string;
    warranty: string;
  }>({
    name: "",
    category: "Ghế công thái học",
    price: 5500000,
    oldPrice: 6500000,
    stockQuantity: 20,
    description: "",
    image: "",
    material: "Lưới cao cấp & khung hợp kim",
    color: "Đen tiêu chuẩn",
    size: "65 × 65 × 115–125 cm",
    weight: "18 kg",
    capacity: "135 kg",
    warranty: "3 năm",
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const res = await getProducts();
        if (!isMounted) return;
        setProducts(res.items);
        setIsLoading(false);
      } catch {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    const handleProductsChange = () => {
      loadData();
    };

    window.addEventListener("ergochair-products-change", handleProductsChange);
    return () => {
      isMounted = false;
      window.removeEventListener("ergochair-products-change", handleProductsChange);
    };
  }, [refreshKey]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = p.name.toLowerCase().includes(query);
        const matchSlug = p.slug.toLowerCase().includes(query);
        const matchCat = p.category.toLowerCase().includes(query);
        if (!matchName && !matchSlug && !matchCat) return false;
      }

      // Category
      if (selectedCategory !== "all" && p.category !== selectedCategory) {
        return false;
      }

      // Stock
      if (selectedStock === "in-stock" && !p.inStock) return false;
      if (selectedStock === "out-of-stock" && p.inStock) return false;

      return true;
    });
  }, [products, search, selectedCategory, selectedStock]);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setUploadFileName("");
    setFormData({
      name: "",
      category: "Ghế công thái học",
      price: 5500000,
      oldPrice: 6500000,
      stockQuantity: 20,
      description: "",
      image: "",
      material: "Lưới cao cấp & khung hợp kim",
      color: "Đen tiêu chuẩn",
      size: "65 × 65 × 115–125 cm",
      weight: "18 kg",
      capacity: "135 kg",
      warranty: "3 năm",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setUploadFileName(product.name ? `Ảnh hiện tại: ${product.name}` : "Ảnh sản phẩm");
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      oldPrice: product.oldPrice || product.price,
      stockQuantity: product.stockQuantity,
      description: product.description,
      image: product.image,
      material: product.material,
      color: product.color,
      size: product.size,
      weight: product.weight,
      capacity: product.capacity,
      warranty: product.warranty,
    });
    setIsModalOpen(true);
  };

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP, GIF).");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Kích thước tệp quá lớn (tối đa 20MB).");
      return;
    }

    setIsProcessingImage(true);
    try {
      const dataUrl = await compressImageFile(file);
      setFormData((prev) => ({ ...prev, image: dataUrl }));
      setUploadFileName(file.name);
      toast.success(`Đã chọn ảnh "${file.name}" thành công!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể xử lý hình ảnh.";
      toast.error(message);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm.");
      return;
    }
    if (formData.price <= 0) {
      toast.error("Giá bán phải lớn hơn 0đ.");
      return;
    }
    if (!formData.image || !formData.image.trim()) {
      toast.error("Vui lòng chọn hoặc tải lên ảnh sản phẩm từ thiết bị của bạn.");
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: formData.name,
          category: formData.category,
          price: Number(formData.price),
          oldPrice: Number(formData.oldPrice),
          compareAtPrice: Number(formData.oldPrice),
          stockQuantity: Number(formData.stockQuantity),
          inStock: Number(formData.stockQuantity) > 0,
          description: formData.description,
          image: formData.image,
          images: [formData.image],
          material: formData.material,
          color: formData.color,
          size: formData.size,
          weight: formData.weight,
          capacity: formData.capacity,
          warranty: formData.warranty,
        });
        toast.success(`Cập nhật "${formData.name}" thành công!`);
      } else {
        const input: CreateProductInput = {
          name: formData.name,
          category: formData.category,
          price: Number(formData.price),
          oldPrice: Number(formData.oldPrice),
          stockQuantity: Number(formData.stockQuantity),
          description: formData.description || `Sản phẩm ${formData.name} cao cấp từ ErgoChair`,
          image: formData.image,
          material: formData.material,
          color: formData.color,
          size: formData.size,
          weight: formData.weight,
          capacity: formData.capacity,
          warranty: formData.warranty,
        };
        await createProduct(input);
        toast.success(`Đã thêm sản phẩm mới "${formData.name}" thành công!`);
      }
      setIsModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error("Có lỗi xảy ra khi lưu sản phẩm.");
    }
  };

  const handleToggleStock = async (id: string, name: string) => {
    try {
      const updated = await toggleProductStock(id);
      if (updated) {
        toast.info(`Đã đổi trạng thái "${name}": ${updated.inStock ? "Còn hàng" : "Tạm hết hàng"}`);
        setRefreshKey((k) => k + 1);
      }
    } catch {
      toast.error("Không thể thay đổi trạng thái tồn kho.");
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" khỏi hệ thống?`)) {
      setDeletingProductId(id);
      try {
        const ok = await deleteProduct(id);
        if (ok) {
          toast.success(`Đã xóa sản phẩm "${name}" thành công.`);
          setRefreshKey((k) => k + 1);
        }
      } catch {
        toast.error("Lỗi khi xóa sản phẩm.");
      } finally {
        setDeletingProductId(null);
      }
    }
  };

  return (
    <div className="admin-products-page">
      {/* Page Greeting Header */}
      <div className="admin-greeting-header">
        <h1 className="admin-greeting-title">Sản phẩm</h1>
        <p className="admin-greeting-subtitle">
          Quản lý danh mục, số lượng tồn kho, giá bán và thông tin sản phẩm.
        </p>
      </div>

      {/* Top action header */}
      <div className="admin-filter-bar">
        <div className="admin-filter-bar-left">
          <div className="admin-search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Tìm theo tên, danh mục..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="admin-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Tất cả danh mục ({products.length})</option>
            {CATEGORIES.filter((c) => c !== "Tất cả loại ghế").map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="admin-select"
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
          >
            <option value="all">Tất cả trạng thái kho</option>
            <option value="in-stock">Còn hàng</option>
            <option value="out-of-stock">Tạm hết hàng</option>
          </select>
        </div>

        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={handleOpenCreateModal}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Thêm Sản Phẩm Mới</span>
        </button>
      </div>

      {/* Product List Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            <span>Danh Sách Sản Phẩm</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "#64748b" }}>
              ({filteredProducts.length} / {products.length})
            </span>
          </h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <span className="admin-badge in_stock">
              Còn hàng: {products.filter((p) => p.inStock).length}
            </span>
            <span className="admin-badge out_of_stock">
              Tạm hết: {products.filter((p) => !p.inStock).length}
            </span>
          </div>
        </div>

        <div className="admin-card-body" style={{ padding: 0 }}>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ minWidth: "220px" }}>Sản phẩm</th>
                  <th style={{ minWidth: "120px" }}>Danh mục</th>
                  <th style={{ minWidth: "105px" }}>Giá bán</th>
                  <th style={{ minWidth: "90px" }}>Giá gốc</th>
                  <th style={{ minWidth: "80px" }}>Tồn kho</th>
                  <th style={{ minWidth: "105px" }}>Trạng thái kho</th>
                  <th style={{ minWidth: "130px", textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "1.75rem", color: "#64748b" }}>
                      Đang tải danh sách sản phẩm...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "1.75rem", color: "#64748b" }}>
                      Không tìm thấy sản phẩm nào phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="admin-product-cell">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="admin-product-thumb"
                          />
                          <div className="admin-product-meta">
                            <div className="admin-product-name">{p.name}</div>
                            <div className="admin-product-sku" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                              <span>Mã: {p.id}</span>
                              {p.rating ? (
                                <span style={{ color: "#d97706", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                                  ★ {typeof p.rating === "number" ? p.rating.toFixed(1) : p.rating.average.toFixed(1)}
                                  <span style={{ color: "#94a3b8" }}>({p.reviewCount || 0})</span>
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-category-badge">
                          {p.category}
                        </span>
                      </td>
                      <td>
                        <span className="admin-price-main">
                          {formatPrice(p.price)}
                        </span>
                      </td>
                      <td>
                        <span className="admin-price-old">
                          {p.oldPrice ? formatPrice(p.oldPrice) : "—"}
                        </span>
                      </td>
                      <td>
                        <span className="admin-stock-qty">{p.stockQuantity}</span> chiếc
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleStock(p.id, p.name)}
                          className={`admin-badge ${p.inStock ? "in_stock" : "out_of_stock"}`}
                          style={{ cursor: "pointer", border: "none" }}
                          title="Bấm để đổi nhanh trạng thái kho"
                        >
                          <span className="admin-badge-dot" />
                          {p.inStock ? "Còn hàng" : "Tạm hết"}
                        </button>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                          <Link
                            href={`/products/${p.id}`}
                            target="_blank"
                            className="admin-action-btn view"
                            title="Xem trang sản phẩm ngoài website"
                          >
                            Xem
                          </Link>
                          <button
                            type="button"
                            className="admin-action-btn edit"
                            onClick={() => handleOpenEditModal(p)}
                            title="Chỉnh sửa sản phẩm"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="admin-action-btn delete"
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            disabled={deletingProductId === p.id}
                            title="Xóa sản phẩm"
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

      {/* Modal Add / Edit Product */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {editingProduct ? `Chỉnh Sửa: ${editingProduct.name}` : "Thêm Sản Phẩm Mới"}
              </h3>
              <button
                type="button"
                className="admin-btn-icon"
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="admin-modal-form">
              <div className="admin-modal-body">
                <div className="admin-form-grid">
                  {/* Tên sản phẩm */}
                  <div className="admin-form-group admin-form-full">
                    <label className="admin-form-label">Tên sản phẩm *</label>
                    <input
                      type="text"
                      className="admin-input"
                      required
                      placeholder="VD: Ergo Air Pro X"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  {/* Danh mục */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Danh mục *</label>
                    <select
                      className="admin-input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {CATEGORIES.filter((c) => c !== "Tất cả loại ghế").map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Số lượng tồn kho */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Số lượng tồn kho *</label>
                    <input
                      type="number"
                      min="0"
                      className="admin-input"
                      required
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                    />
                  </div>

                  {/* Giá bán */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Giá bán (VND) *</label>
                    <input
                      type="number"
                      min="1000"
                      step="10000"
                      className="admin-input"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    />
                  </div>

                  {/* Giá so sánh (Giá gốc) */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Giá gốc trước giảm (VND)</label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      className="admin-input"
                      value={formData.oldPrice}
                      onChange={(e) => setFormData({ ...formData, oldPrice: Number(e.target.value) })}
                    />
                  </div>

                  {/* Tải ảnh từ thiết bị */}
                  <div className="admin-form-group admin-form-full">
                    <label className="admin-form-label">
                      Hình ảnh sản phẩm *{" "}
                      <span style={{ color: "#78716C", fontWeight: "normal", fontSize: "0.85rem" }}>
                        (Chọn tệp ảnh từ máy tính hoặc điện thoại của bạn)
                      </span>
                    </label>

                    {/* Hidden Native File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFileInputChange}
                    />

                    {formData.image ? (
                      <div className="admin-upload-preview-box">
                        <img
                          src={formData.image}
                          alt="Ảnh sản phẩm đã chọn"
                          className="admin-upload-preview-img"
                        />
                        <div className="admin-upload-preview-info">
                          <div className="admin-upload-file-name">
                            {uploadFileName || "Ảnh sản phẩm đã tải lên"}
                          </div>
                          <div className="admin-upload-file-status">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Đã tải ảnh thành công - Sẵn sàng lưu
                          </div>
                          <div className="admin-upload-preview-actions">
                            <button
                              type="button"
                              className="admin-upload-change-btn"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                              Đổi ảnh từ thiết bị
                            </button>
                            <button
                              type="button"
                              className="admin-upload-remove-btn"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, image: "" }));
                                setUploadFileName("");
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                              Xóa ảnh
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`admin-upload-zone ${isDragging ? "dragover" : ""}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="admin-upload-icon-circle">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </div>
                        <p className="admin-upload-main-text">
                          {isProcessingImage
                            ? "Đang xử lý và nén hình ảnh..."
                            : "Kéo thả ảnh vào đây hoặc nhấp để chọn ảnh từ thiết bị"}
                        </p>
                        <p className="admin-upload-sub-text">
                          Hỗ trợ định dạng PNG, JPG, JPEG, WEBP, GIF (Tự động nén mượt mà)
                        </p>
                        <button
                          type="button"
                          className="admin-upload-select-btn"
                          disabled={isProcessingImage}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          Chọn ảnh từ thiết bị
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Hoặc liên kết ảnh URL nếu có */}
                  <div className="admin-form-group admin-form-full">
                    <label className="admin-form-label">
                      Hoặc dán liên kết URL ảnh (tùy chọn)
                    </label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="https://... hoặc /images/products/..."
                      value={formData.image.startsWith("data:") ? "" : formData.image}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({ ...prev, image: val }));
                        setUploadFileName(val ? "Ảnh từ đường dẫn URL" : "");
                      }}
                    />
                  </div>

                  {/* Mô tả */}
                  <div className="admin-form-group admin-form-full">
                    <label className="admin-form-label">Mô tả sản phẩm</label>
                    <textarea
                      className="admin-textarea"
                      rows={3}
                      placeholder="Mô tả các đặc điểm nổi bật của ghế..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* Thông số kỹ thuật bổ sung */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Chất liệu</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={formData.material}
                      onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Màu sắc</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Kích thước</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="VD: 65 × 65 × 115–125 cm"
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Trọng lượng</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="VD: 18 kg"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Tải trọng tối đa</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Bảo hành</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={formData.warranty}
                      onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {editingProduct ? "Lưu Thay Đổi" : "Thêm Sản Phẩm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
