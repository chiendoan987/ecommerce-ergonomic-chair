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
import { getCategories } from "@/lib/services/category.service";
import type { Product } from "@/lib/types/product";
import { formatPrice } from "@/lib/utils/format";
import { useToast } from "@/hooks/use-toast";

// Hàm hỗ trợ tải tệp tin (ảnh/video) lên máy chủ lưu trữ an toàn
const uploadFileToServer = async (file: File): Promise<string> => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Không thể tải tệp lên máy chủ.");
  }
  const data = await res.json();
  return data.url;
};

// Hỗ trợ xử lý kích thước sản phẩm: Dài, Rộng, Cao
const cleanDim = (val: string): string => val.replace(/\s*cm\s*$/i, "").trim();

const parseDimensions = (sizeStr: string): { length: string; width: string; height: string } => {
  if (!sizeStr) return { length: "", width: "", height: "" };

  const clean = sizeStr.replace(/\s*cm\s*$/i, "").trim();
  const matchNamed = clean.match(/dài[:\s]*([0-9\.\-]+)[^\d]*rộng[:\s]*([0-9\.\-]+)[^\d]*cao[:\s]*([0-9\.\-]+)/i);
  if (matchNamed) {
    return {
      length: cleanDim(matchNamed[1]),
      width: cleanDim(matchNamed[2]),
      height: cleanDim(matchNamed[3]),
    };
  }

  const parts = clean.split(/\s*[×xX*]\s*/);
  if (parts.length >= 3) {
    return {
      length: cleanDim(parts[0]),
      width: cleanDim(parts[1]),
      height: cleanDim(parts.slice(2).join(" × ")),
    };
  }
  if (parts.length === 2) {
    return {
      length: cleanDim(parts[0]),
      width: cleanDim(parts[1]),
      height: "",
    };
  }
  return { length: "", width: "", height: clean };
};

const formatDimensions = (length: string, width: string, height: string): string => {
  const l = cleanDim(length);
  const w = cleanDim(width);
  const h = cleanDim(height);
  if (l && w && h) return `${l} × ${w} × ${h} cm`;
  if (l && w) return `${l} × ${w} cm`;
  if (h) return `${h} cm`;
  if (l) return `${l} cm`;
  return "";
};

// 5 vị trí ảnh sản phẩm chuẩn thương mại điện tử
const IMAGE_SLOTS = [
  { id: "cover", label: "Ảnh bìa (Chính)", desc: "Mặt trước của ghế", required: true },
  { id: "img2", label: "Ảnh 2", desc: "Góc chụp khác", required: false },
  { id: "img3", label: "Ảnh 3", desc: "Góc chụp khác", required: false },
  { id: "img4", label: "Ảnh 4", desc: "Góc chụp khác", required: false },
  { id: "img5", label: "Ảnh 5", desc: "Góc chụp khác", required: false },
];

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
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: string; name: string } | null>(null);

  // Media Upload State
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const activeSlotIndexRef = useRef<number>(0);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    price: number | string;
    oldPrice: number | string;
    stockQuantity: number | string;
    description: string;
    image: string;
    images: string[];
    video: string;
    material: string;
    color: string;
    sizeLength: string;
    sizeWidth: string;
    sizeHeight: string;
    weight: string;
    capacity: string;
    warranty: string;
  }>({
    name: "",
    category: "",
    price: "",
    oldPrice: "",
    stockQuantity: "",
    description: "",
    image: "",
    images: ["", "", "", "", ""],
    video: "",
    material: "",
    color: "",
    sizeLength: "",
    sizeWidth: "",
    sizeHeight: "",
    weight: "",
    capacity: "",
    warranty: "",
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>(
    CATEGORIES.filter((c) => c !== "Tất cả loại ghế")
  );
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [res, cats] = await Promise.all([
          getProducts(),
          getCategories().catch(() => []),
        ]);
        if (!isMounted) return;
        setProducts(res.items);
        if (cats && cats.length > 0) {
          setAvailableCategories(cats.map((c) => c.name));
        }
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
    window.addEventListener("ergochair-categories-change", handleProductsChange);
    return () => {
      isMounted = false;
      window.removeEventListener("ergochair-products-change", handleProductsChange);
      window.removeEventListener("ergochair-categories-change", handleProductsChange);
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
    setFormData({
      name: "",
      category: "",
      price: "",
      oldPrice: "",
      stockQuantity: "",
      description: "",
      image: "",
      images: ["", "", "", "", ""],
      video: "",
      material: "",
      color: "",
      sizeLength: "",
      sizeWidth: "",
      sizeHeight: "",
      weight: "",
      capacity: "",
      warranty: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    const dims = parseDimensions(product.size || "");
    const rawImages = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image, ...(product.gallery || [])].filter(Boolean);
    const slotImages = ["", "", "", "", ""];
    for (let i = 0; i < 5; i++) {
      slotImages[i] = rawImages[i] || "";
    }
    if (!slotImages[0] && product.image) {
      slotImages[0] = product.image;
    }
    const productVideo = product.video || (product.specs as any)?.["video"] || (product.specs as any)?.["Video sản phẩm"] || "";

    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      oldPrice: product.oldPrice || product.price,
      stockQuantity: product.stockQuantity,
      description: product.description,
      image: slotImages[0],
      images: slotImages,
      video: productVideo,
      material: product.material,
      color: product.color,
      sizeLength: dims.length,
      sizeWidth: dims.width,
      sizeHeight: dims.height,
      weight: product.weight,
      capacity: product.capacity,
      warranty: product.warranty,
    });
    setIsModalOpen(true);
  };

  // Upload ảnh cho 1 vị trí cụ thể lên máy chủ
  const handleSingleSlotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const slotIdx = activeSlotIndexRef.current;
    setIsProcessingMedia(true);
    toast.info(`Đang tải ảnh "${file.name}" lên hệ thống...`);
    try {
      const url = await uploadFileToServer(file);
      setFormData((prev) => {
        const next = [...prev.images];
        next[slotIdx] = url;
        return { ...prev, images: next, image: next[0] || "" };
      });
      toast.success(`Đã tải ảnh cho "${IMAGE_SLOTS[slotIdx]?.label || slotIdx + 1}" thành công!`);
    } catch (err: any) {
      toast.error(err.message || "Không thể tải hình ảnh.");
    } finally {
      setIsProcessingMedia(false);
      e.target.value = "";
    }
  };

  // Tải nhanh nhiều ảnh cùng lúc từ thiết bị lên máy chủ
  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsProcessingMedia(true);
    toast.info(`Đang tải ${Math.min(files.length, 5)} ảnh lên hệ thống...`);
    try {
      const uploaded = await Promise.all(
        files.slice(0, 5).map((f) => uploadFileToServer(f))
      );
      setFormData((prev) => {
        const next = [...prev.images];
        let fileIdx = 0;
        // Điền vào các ô còn trống, ưu tiên ảnh bìa nếu đang trống
        for (let i = 0; i < 5 && fileIdx < uploaded.length; i++) {
          if (!next[i] || (fileIdx === 0 && !next[0])) {
            next[i] = uploaded[fileIdx++];
          }
        }
        for (let i = 0; i < 5 && fileIdx < uploaded.length; i++) {
          next[i] = uploaded[fileIdx++];
        }
        return { ...prev, images: next, image: next[0] || "" };
      });
      toast.success(`Đã tải thành công ${Math.min(files.length, 5)} ảnh lên hệ thống!`);
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi tải nhiều ảnh.");
    } finally {
      setIsProcessingMedia(false);
      e.target.value = "";
    }
  };

  const handleUpdateSlotUrl = (index: number, url: string) => {
    setFormData((prev) => {
      const next = [...prev.images];
      next[index] = url;
      return { ...prev, images: next, image: next[0] || "" };
    });
  };

  const handleRemoveSlotImage = (index: number) => {
    setFormData((prev) => {
      const next = [...prev.images];
      next[index] = "";
      return { ...prev, images: next, image: next[0] || "" };
    });
  };

  // Tải lên tệp Video sản phẩm lên máy chủ
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Vui lòng chọn tệp video hợp lệ (.mp4, .webm, .mov).");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Kích thước video tối đa 50MB.");
      return;
    }
    setIsProcessingMedia(true);
    toast.info(`Đang tải video "${file.name}" lên máy chủ...`);
    try {
      const url = await uploadFileToServer(file);
      setFormData((prev) => ({ ...prev, video: url }));
      toast.success(`Đã tải video "${file.name}" thành công!`);
    } catch (err: any) {
      toast.error(err.message || "Không thể tải video lên máy chủ.");
    } finally {
      setIsProcessingMedia(false);
      e.target.value = "";
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formData.name.trim();
    if (!name) {
      toast.error("Vui lòng nhập tên sản phẩm.");
      return;
    }
    const category = formData.category.trim();
    if (!category) {
      toast.error("Vui lòng chọn hoặc nhập danh mục cho sản phẩm.");
      return;
    }
    const priceNum = Math.round(Number(formData.price));
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Giá bán phải lớn hơn 0đ.");
      return;
    }

    let coverImage = (formData.images[0] || formData.image || "").trim();
    if (!coverImage) {
      coverImage = "/images/products/focus-task.png";
    }

    const validImages = formData.images
      .map((img) => img.trim())
      .filter((img) => Boolean(img));
    if (validImages.length === 0) {
      validImages.push(coverImage);
    }
    const galleryImages = validImages.slice(1);
    const productVideo = formData.video?.trim() || undefined;

    const oldPriceNum = formData.oldPrice !== "" ? Math.round(Number(formData.oldPrice)) : priceNum;
    const stockNum = formData.stockQuantity !== "" ? Math.max(0, Math.floor(Number(formData.stockQuantity))) : 0;
    const formattedSize = formatDimensions(formData.sizeLength, formData.sizeWidth, formData.sizeHeight);
    const desc = formData.description?.trim();
    const finalDesc = desc && desc.length >= 5 ? desc : `Sản phẩm ${name} cao cấp từ ErgoChair`;

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name,
          category,
          price: priceNum,
          oldPrice: oldPriceNum,
          compareAtPrice: oldPriceNum,
          stockQuantity: stockNum,
          inStock: stockNum > 0,
          description: finalDesc,
          image: coverImage,
          images: validImages,
          gallery: galleryImages,
          video: productVideo,
          material: formData.material.trim(),
          color: formData.color.trim(),
          size: formattedSize,
          weight: formData.weight.trim(),
          capacity: formData.capacity.trim(),
          warranty: formData.warranty.trim() || "3 năm",
        });
        toast.success(`Cập nhật "${name}" thành công!`);
      } else {
        const input: CreateProductInput = {
          name,
          category,
          price: priceNum,
          oldPrice: oldPriceNum,
          stockQuantity: stockNum,
          description: finalDesc,
          image: coverImage,
          images: validImages,
          gallery: galleryImages,
          video: productVideo,
          material: formData.material.trim(),
          color: formData.color.trim(),
          size: formattedSize,
          weight: formData.weight.trim(),
          capacity: formData.capacity.trim(),
          warranty: formData.warranty.trim() || "3 năm",
        };
        await createProduct(input);
        toast.success(`Đã thêm sản phẩm mới "${name}" thành công!`);
      }
      setIsModalOpen(false);
      setRefreshKey((k) => k + 1);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("ergochair-categories-change"));
      }
    } catch (err: any) {
      console.error("Lỗi khi lưu sản phẩm:", err);
      toast.error(err?.message || "Có lỗi xảy ra khi lưu sản phẩm.");
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

  const handleDeleteProduct = (id: string, name: string) => {
    setDeleteConfirmTarget({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmTarget) return;
    const { id, name } = deleteConfirmTarget;
    setDeletingProductId(id);
    try {
      const ok = await deleteProduct(id);
      if (ok) {
        toast.success(`Đã xóa sản phẩm "${name}" thành công.`);
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setRefreshKey((k) => k + 1);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("ergochair-categories-change"));
        }
        setDeleteConfirmTarget(null);
      } else {
        toast.error(`Không thể xóa sản phẩm "${name}". Vui lòng thử lại.`);
      }
    } catch {
      toast.error("Lỗi khi kết nối máy chủ để xóa sản phẩm.");
    } finally {
      setDeletingProductId(null);
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
            {availableCategories.map((c) => (
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
          <div className="admin-modal" style={{ maxWidth: 880 }} onClick={(e) => e.stopPropagation()}>
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
                    <input
                      type="text"
                      className="admin-input"
                      required
                      list="admin-categories-datalist"
                      placeholder="VD: Ghế công thái học"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                    <datalist id="admin-categories-datalist">
                      {availableCategories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  {/* Số lượng tồn kho */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Số lượng tồn kho *</label>
                    <input
                      type="number"
                      min="0"
                      className="admin-input"
                      required
                      placeholder="VD: 20"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    />
                  </div>

                  {/* Giá bán */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Giá bán (VND) *</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="admin-input"
                      required
                      placeholder="VD: 5500000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>

                  {/* Giá so sánh (Giá gốc) */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Giá gốc trước giảm (VND)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="admin-input"
                      placeholder="VD: 6500000"
                      value={formData.oldPrice}
                      onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })}
                    />
                  </div>

                  {/* Phần Hình ảnh (5 ảnh) & Video sản phẩm (1 video) */}
                  <div className="admin-form-group admin-form-full" style={{ marginTop: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "0.6rem", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <label className="admin-form-label" style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                          Hình ảnh sản phẩm (Tối đa 5 ảnh) <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: 2 }}>
                          Gồm 1 ảnh bìa chính và 4 ảnh phụ khác (Ảnh 2, Ảnh 3, Ảnh 4, Ảnh 5)
                        </div>
                      </div>

                      <button
                        type="button"
                        className="admin-btn admin-btn-outline"
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", height: "auto" }}
                        disabled={isProcessingMedia}
                        onClick={() => multiFileInputRef.current?.click()}
                      >
                        📁 Chọn nhanh nhiều ảnh từ máy
                      </button>
                      <input
                        ref={multiFileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleMultiImageUpload}
                      />
                    </div>

                    {/* 5 Slots hình ảnh */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: "0.65rem",
                      marginBottom: "1rem"
                    }}>
                      {IMAGE_SLOTS.map((slot, index) => {
                        const imgUrl = formData.images[index] || "";
                        const isCover = index === 0;

                        return (
                          <div
                            key={slot.id}
                            style={{
                              border: `1.5px ${imgUrl ? "solid #3b82f6" : isCover ? "dashed #f59e0b" : "dashed #cbd5e1"}`,
                              borderRadius: "8px",
                              background: imgUrl ? "#f8fafc" : isCover ? "#fffbeb" : "#fafafa",
                              padding: "0.45rem",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              position: "relative",
                              minHeight: "185px",
                              transition: "all 0.15s ease"
                            }}
                          >
                            {/* Header Slot badge & Delete */}
                            <div style={{
                              alignSelf: "stretch",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "0.35rem"
                            }}>
                              <span style={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                padding: "0.15rem 0.4rem",
                                borderRadius: "4px",
                                background: isCover ? "#fef3c7" : "#f1f5f9",
                                color: isCover ? "#b45309" : "#475569",
                                border: isCover ? "1px solid #fde68a" : "1px solid #e2e8f0"
                              }}>
                                {isCover ? "⭐ " + slot.label : slot.label}
                              </span>
                              {imgUrl && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlotImage(index)}
                                  style={{
                                    border: "none",
                                    background: "#fee2e2",
                                    color: "#ef4444",
                                    borderRadius: "50%",
                                    width: "18px",
                                    height: "18px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.7rem",
                                    cursor: "pointer"
                                  }}
                                  title="Xóa ảnh này"
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            {/* Image Preview or Upload Placeholder */}
                            {imgUrl ? (
                              <div style={{ width: "100%", height: "100px", position: "relative", borderRadius: "6px", overflow: "hidden", background: "#fff", border: "1px solid #e2e8f0" }}>
                                <img
                                  src={imgUrl}
                                  alt={slot.label}
                                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    activeSlotIndexRef.current = index;
                                    singleFileInputRef.current?.click();
                                  }}
                                  style={{
                                    position: "absolute",
                                    bottom: 3,
                                    right: 3,
                                    background: "rgba(15, 23, 42, 0.75)",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "4px",
                                    padding: "0.12rem 0.35rem",
                                    fontSize: "0.65rem",
                                    cursor: "pointer"
                                  }}
                                >
                                  Đổi ảnh
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  activeSlotIndexRef.current = index;
                                  singleFileInputRef.current?.click();
                                }}
                                style={{
                                  width: "100%",
                                  height: "100px",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  borderRadius: "6px",
                                  gap: "0.2rem",
                                  color: "#64748b"
                                }}
                              >
                                <div style={{ fontSize: "1.3rem" }}>📷</div>
                                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#334155", textAlign: "center" }}>
                                  + Tải ảnh
                                </div>
                                <div style={{ fontSize: "0.64rem", color: "#94a3b8", textAlign: "center" }}>
                                  {slot.desc}
                                </div>
                              </div>
                            )}

                            {/* Dán URL ảnh nhanh */}
                            <input
                              type="text"
                              placeholder={imgUrl.startsWith("data:") ? "Ảnh từ thiết bị" : "Hoặc dán URL..."}
                              value={imgUrl.startsWith("data:") ? "" : imgUrl}
                              onChange={(e) => handleUpdateSlotUrl(index, e.target.value)}
                              style={{
                                width: "100%",
                                marginTop: "0.35rem",
                                fontSize: "0.68rem",
                                padding: "0.2rem 0.35rem",
                                borderRadius: "4px",
                                border: "1px solid #e2e8f0",
                                background: "#fff"
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Native Single File Input for specific slot */}
                    <input
                      ref={singleFileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleSingleSlotUpload}
                    />

                    {/* Video giới thiệu sản phẩm (1 video) */}
                    <div style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "0.75rem",
                      background: "#f8fafc"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.45rem" }}>
                        <label className="admin-form-label" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <span>🎥</span> Video sản phẩm (1 video giới thiệu / review)
                        </label>
                        {formData.video && (
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, video: "" }))}
                            style={{
                              border: "none",
                              background: "#fee2e2",
                              color: "#ef4444",
                              padding: "0.15rem 0.45rem",
                              borderRadius: "4px",
                              fontSize: "0.72rem",
                              cursor: "pointer",
                              fontWeight: 600
                            }}
                          >
                            ✕ Xóa video
                          </button>
                        )}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: formData.video ? "160px 1fr" : "1fr", gap: "0.75rem", alignItems: "center" }}>
                        {/* Video preview nếu có */}
                        {formData.video && (
                          <div style={{ borderRadius: "6px", overflow: "hidden", background: "#000", height: "95px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {formData.video.includes("youtube.com") || formData.video.includes("youtu.be") ? (
                              <div style={{ color: "#fff", fontSize: "0.72rem", textAlign: "center", padding: "0.4rem" }}>
                                <div style={{ fontSize: "1.3rem", marginBottom: 2 }}>▶️</div>
                                YouTube Video
                              </div>
                            ) : (
                              <video
                                src={formData.video}
                                controls
                                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                              />
                            )}
                          </div>
                        )}

                        {/* Input options for video */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <button
                              type="button"
                              className="admin-btn admin-btn-outline"
                              style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem", whiteSpace: "nowrap" }}
                              onClick={() => videoFileInputRef.current?.click()}
                            >
                              📹 Tải tệp video từ máy (.mp4, .webm)
                            </button>
                            <input
                              ref={videoFileInputRef}
                              type="file"
                              accept="video/*"
                              style={{ display: "none" }}
                              onChange={handleVideoUpload}
                            />
                            <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                              (Tối đa 50MB)
                            </span>
                          </div>

                          <div>
                            <input
                              type="text"
                              className="admin-input"
                              placeholder="Hoặc dán link video (VD: https://youtube.com/watch?v=... hoặc https://.../video.mp4)"
                              value={formData.video.startsWith("data:") ? "" : formData.video}
                              onChange={(e) => setFormData((prev) => ({ ...prev, video: e.target.value }))}
                              style={{ fontSize: "0.8rem", padding: "0.4rem 0.6rem" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mô tả */}
                  <div className="admin-form-group admin-form-full">
                    <label className="admin-form-label">Mô tả sản phẩm</label>
                    <textarea
                      className="admin-textarea"
                      rows={3}
                      placeholder="VD: Thiết kế công thái học cao cấp, lưới thoáng khí, hỗ trợ cột sống tối ưu..."
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
                      placeholder="VD: Lưới cao cấp & khung hợp kim nhôm"
                      value={formData.material}
                      onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Màu sắc</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="VD: Đen tiêu chuẩn, Xám bạc..."
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>

                  {/* Kích thước: Dài, Rộng, Cao */}
                  <div className="admin-form-group admin-form-full">
                    <label className="admin-form-label">
                      Kích thước (Dài × Rộng × Cao)
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
                      <div>
                        <label style={{ fontSize: "0.74rem", color: "#64748b", marginBottom: "0.2rem", display: "block" }}>
                          Chiều dài (cm)
                        </label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="VD: 65"
                          value={formData.sizeLength}
                          onChange={(e) => setFormData({ ...formData, sizeLength: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.74rem", color: "#64748b", marginBottom: "0.2rem", display: "block" }}>
                          Chiều rộng (cm)
                        </label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="VD: 65"
                          value={formData.sizeWidth}
                          onChange={(e) => setFormData({ ...formData, sizeWidth: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.74rem", color: "#64748b", marginBottom: "0.2rem", display: "block" }}>
                          Chiều cao (cm)
                        </label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="VD: 115 - 125"
                          value={formData.sizeHeight}
                          onChange={(e) => setFormData({ ...formData, sizeHeight: e.target.value })}
                        />
                      </div>
                    </div>
                    {(formData.sizeLength || formData.sizeWidth || formData.sizeHeight) && (
                      <div style={{ fontSize: "0.78rem", color: "#059669", marginTop: "0.3rem", fontWeight: 500 }}>
                        Xem trước hiển thị: <strong>{formatDimensions(formData.sizeLength, formData.sizeWidth, formData.sizeHeight)}</strong>
                      </div>
                    )}
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
                      placeholder="VD: 135 kg"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Bảo hành</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="VD: 3 năm, 5 năm..."
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

      {/* Confirmation Modal for Delete */}
      {deleteConfirmTarget && (
        <div className="admin-modal-overlay" onClick={() => !deletingProductId && setDeleteConfirmTarget(null)}>
          <div className="admin-modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
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
                  fontWeight: "bold"
                }}>
                  ⚠️
                </div>
                <h3 className="admin-modal-title" style={{ fontSize: "1.15rem", margin: 0 }}>
                  Xác nhận xóa sản phẩm
                </h3>
              </div>
              <button
                type="button"
                className="admin-btn-icon"
                onClick={() => !deletingProductId && setDeleteConfirmTarget(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body" style={{ padding: "0.5rem 1.5rem 1.5rem" }}>
              <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>
                Bạn có chắc chắn muốn xóa sản phẩm <strong>&ldquo;{deleteConfirmTarget.name}&rdquo;</strong>?
              </p>
              <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "0.5rem", marginBottom: 0 }}>
                Sản phẩm sẽ được gỡ khỏi danh sách bán hàng và trang khách hàng ngay lập tức.
              </p>
            </div>

            <div className="admin-modal-footer" style={{ borderTop: "1px solid #f1f5f9", padding: "1rem 1.5rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                disabled={Boolean(deletingProductId)}
                onClick={() => setDeleteConfirmTarget(null)}
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
                  cursor: deletingProductId ? "not-allowed" : "pointer",
                  opacity: deletingProductId ? 0.7 : 1,
                }}
                disabled={Boolean(deletingProductId)}
                onClick={handleConfirmDelete}
              >
                {deletingProductId ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
