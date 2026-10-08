import { prisma } from "@/lib/prisma";
import type {
  Product,
  ProductFilters,
  PaginatedResult,
} from "@/lib/types/product";
import { StockStatus } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function saveBase64ToFile(dataUrl: string, prefix: string): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;
  try {
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return dataUrl;
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || (mimeType.startsWith("video") ? "mp4" : "jpg");
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${prefix}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    return `/uploads/${fileName}`;
  } catch (error) {
    console.error("Lỗi chuyển đổi base64 sang tệp:", error);
    return dataUrl.slice(0, 499);
  }
}

/**
 * Format Prisma Product model to application Product interface
 */
export function formatProduct(dbProduct: any): Product {
  const images = Array.isArray(dbProduct.images)
    ? dbProduct.images
    : typeof dbProduct.images === "string"
    ? JSON.parse(dbProduct.images)
    : [dbProduct.image];

  const gallery = Array.isArray(dbProduct.gallery)
    ? dbProduct.gallery
    : typeof dbProduct.gallery === "string"
    ? JSON.parse(dbProduct.gallery)
    : images.slice(1);

  const specs =
    dbProduct.specs && typeof dbProduct.specs === "object"
      ? (dbProduct.specs as Record<string, string>)
      : {};

  return {
    id: dbProduct.id,
    slug: dbProduct.slug,
    name: dbProduct.name,
    categoryId: dbProduct.categoryId ?? null,
    category: dbProduct.category,
    price: dbProduct.price,
    oldPrice: dbProduct.oldPrice ?? dbProduct.compareAtPrice ?? dbProduct.price,
    compareAtPrice: dbProduct.compareAtPrice ?? dbProduct.oldPrice,
    stockStatus: dbProduct.stockStatus as "in_stock" | "out_of_stock" | "pre_order",
    stockQuantity: dbProduct.stockQuantity,
    inStock: dbProduct.inStock,
    image: dbProduct.image,
    images: images.length > 0 ? images : [dbProduct.image],
    gallery,
    video: specs["video"] || specs["Video sản phẩm"] || "",
    description: dbProduct.description,
    specs,
    material: dbProduct.material || specs["Chất liệu"] || "",
    color: dbProduct.color || specs["Màu sắc"] || "",
    size: dbProduct.size || specs["Kích thước"] || "",
    weight: dbProduct.weight || specs["Trọng lượng"] || "",
    capacity: dbProduct.capacity || specs["Tải trọng tối đa"] || "",
    warranty: dbProduct.warranty || specs["Thời gian bảo hành"] || "3 năm",
    rating: Array.isArray(dbProduct.reviews)
      ? (dbProduct.reviews.length > 0
          ? Number((dbProduct.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / dbProduct.reviews.length).toFixed(1))
          : 5.0)
      : (dbProduct.rating ?? 5.0),
    reviewCount: Array.isArray(dbProduct.reviews)
      ? dbProduct.reviews.length
      : (dbProduct.reviewCount ?? 0),
    variants: (dbProduct.variants || []).map((v: any) => ({
      id: v.id,
      productId: v.productId,
      name: v.name,
      priceDelta: v.priceDelta,
      stockQuantity: v.stockQuantity,
      imageUrl: v.imageUrl || undefined,
    })),
    createdAt: dbProduct.createdAt instanceof Date ? dbProduct.createdAt.toISOString() : String(dbProduct.createdAt),
    updatedAt: dbProduct.updatedAt instanceof Date ? dbProduct.updatedAt.toISOString() : String(dbProduct.updatedAt),
  };
}

/**
 * Lấy danh sách sản phẩm theo bộ lọc (Phân trang, tìm kiếm, sắp xếp)
 */
export async function getProductsFromDb(
  filters: ProductFilters = {}
): Promise<PaginatedResult<Product>> {
  const where: any = {
    isActive: true,
  };

  // 1. Danh mục (Hỗ trợ lọc theo Tên danh mục, Slug danh mục, hoặc Category ID)
  if (filters.category && filters.category !== "Tất cả loại ghế" && filters.category !== "all") {
    const catFilter = filters.category.trim();
    const matchedCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { id: catFilter },
          { name: catFilter },
          { slug: catFilter.toLowerCase() },
        ],
      },
    });

    if (matchedCategory) {
      where.OR = [
        { categoryId: matchedCategory.id },
        { category: matchedCategory.name },
        { category: matchedCategory.slug },
      ];
    } else {
      where.OR = [
        { category: catFilter },
        { categoryId: catFilter },
      ];
    }
  }

  // 2. Tìm kiếm từ khóa
  if (filters.search && filters.search.trim()) {
    const keyword = filters.search.trim();
    where.OR = [
      { name: { contains: keyword } },
      { description: { contains: keyword } },
      { category: { contains: keyword } },
    ];
  }

  // 3. Khoảng giá
  if (filters.priceRange && filters.priceRange !== "all") {
    switch (filters.priceRange) {
      case "under-5m":
        where.price = { lt: 5000000 };
        break;
      case "5m-8m":
        where.price = { gte: 5000000, lte: 8000000 };
        break;
      case "8m-12m":
        where.price = { gt: 8000000, lte: 12000000 };
        break;
      case "above-12m":
        where.price = { gt: 12000000 };
        break;
    }
  }

  // 4. Trạng thái tồn kho
  if (filters.availability && filters.availability !== "all") {
    if (filters.availability === "in-stock") {
      where.inStock = true;
    } else if (filters.availability === "sold-out") {
      where.inStock = false;
    }
  }

  // Sắp xếp
  let orderBy: any = [{ isFeatured: "desc" }, { createdAt: "desc" }];
  if (filters.sort) {
    switch (filters.sort) {
      case "price-asc":
        orderBy = { price: "asc" };
        break;
      case "price-desc":
        orderBy = { price: "desc" };
        break;
      case "rating":
        orderBy = { rating: "desc" };
        break;
      case "featured":
      default:
        orderBy = [{ isFeatured: "desc" }, { createdAt: "desc" }];
        break;
    }
  }

  const total = await prisma.product.count({ where });

  const page = Math.max(1, filters.page || 1);
  const pageSize = filters.pageSize ? Math.max(1, filters.pageSize) : (total > 0 ? total : 20);
  const skip = (page - 1) * pageSize;

  const dbProducts = await prisma.product.findMany({
    where,
    orderBy,
    skip: filters.pageSize ? skip : undefined,
    take: filters.pageSize ? pageSize : undefined,
    include: {
      variants: true,
      reviews: {
        where: { isApproved: true },
        select: { rating: true },
      },
    },
  });

  const items = dbProducts.map(formatProduct);
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1;

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Lấy chi tiết sản phẩm theo ID hoặc Slug
 */
export async function getProductByIdOrSlugFromDb(idOrSlug: string): Promise<Product | null> {
  const dbProduct = await prisma.product.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      variants: true,
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return dbProduct ? formatProduct(dbProduct) : null;
}

/**
 * Tự động tìm kiếm hoặc khởi tạo danh mục nếu chưa có trong DB
 * Đảm bảo liên kết categoryId và tên category luôn đồng bộ 100%
 */
async function resolveCategory(
  categoryNameOrId?: string,
  categoryIdInput?: string
): Promise<{ categoryId: string | null; categoryName: string }> {
  // 1. Nếu có categoryId cụ thể, ưu tiên tìm theo ID
  if (categoryIdInput) {
    const catById = await prisma.category.findUnique({ where: { id: categoryIdInput } });
    if (catById) {
      return { categoryId: catById.id, categoryName: catById.name };
    }
  }

  // 2. Tìm theo tên, slug hoặc id
  if (categoryNameOrId && categoryNameOrId.trim()) {
    const term = categoryNameOrId.trim();
    let cat = await prisma.category.findFirst({
      where: {
        OR: [
          { id: term },
          { name: term },
          { slug: term.toLowerCase() },
        ],
      },
    });

    if (!cat) {
      const allCats = await prisma.category.findMany();
      cat =
        allCats.find(
          (c) =>
            c.name.toLowerCase() === term.toLowerCase() ||
            c.slug.toLowerCase() === term.toLowerCase()
        ) || null;
    }

    if (cat) {
      return { categoryId: cat.id, categoryName: cat.name };
    }

    // 3. Nếu danh mục chưa tồn tại trong bảng Category, tự động tạo mới
    try {
      const slug = term
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

      const newCat = await prisma.category.create({
        data: {
          name: term,
          slug: slug || `cat-${Date.now()}`,
          sortOrder: 0,
          isActive: true,
        },
      });
      return { categoryId: newCat.id, categoryName: newCat.name };
    } catch {
      const fallback = await prisma.category.findFirst({ where: { name: term } });
      if (fallback) {
        return { categoryId: fallback.id, categoryName: fallback.name };
      }
    }

    return { categoryId: null, categoryName: term };
  }

  return { categoryId: null, categoryName: "Chưa phân loại" };
}

/**
 * Tạo sản phẩm mới vào MySQL
 */
export async function createProductInDb(data: any): Promise<Product> {
  const slug =
    data.slug ||
    data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") +
      `-${Date.now().toString().slice(-4)}`;

  const inStock = data.inStock ?? (data.stockQuantity ? data.stockQuantity > 0 : true);
  const stockStatus = inStock ? StockStatus.in_stock : StockStatus.out_of_stock;

  const { categoryId, categoryName } = await resolveCategory(data.category, data.categoryId);

  let image = data.image || "/images/products/focus-task.png";
  if (image.startsWith("data:")) {
    image = await saveBase64ToFile(image, "cover");
  }

  let images = Array.isArray(data.images) && data.images.length > 0 ? data.images : [image];
  images = await Promise.all(
    images.map((img: string, idx: number) =>
      img && img.startsWith("data:") ? saveBase64ToFile(img, `img-${idx + 1}`) : Promise.resolve(img)
    )
  );

  let gallery = Array.isArray(data.gallery) && data.gallery.length > 0
    ? data.gallery
    : images.slice(1);
  gallery = await Promise.all(
    gallery.map((img: string, idx: number) =>
      img && img.startsWith("data:") ? saveBase64ToFile(img, `gallery-${idx + 1}`) : Promise.resolve(img)
    )
  );

  let video = data.video;
  if (video && video.startsWith("data:")) {
    video = await saveBase64ToFile(video, "video");
  }

  const newProduct = await prisma.product.create({
    data: {
      id: data.id || `prod-${Date.now()}`,
      slug,
      name: data.name,
      categoryId,
      category: categoryName,
      price: Math.round(Number(data.price)),
      oldPrice: data.oldPrice ? Math.round(Number(data.oldPrice)) : null,
      compareAtPrice: data.compareAtPrice ? Math.round(Number(data.compareAtPrice)) : data.oldPrice ? Math.round(Number(data.oldPrice)) : null,
      inStock,
      stockStatus,
      stockQuantity: data.stockQuantity !== undefined ? Math.max(0, Math.floor(Number(data.stockQuantity))) : 10,
      image,
      images,
      gallery,
      description: data.description || "",
      specs: {
        ...(data.specs || {}),
        ...(video ? { video } : {}),
      },
      material: data.material || null,
      color: data.color || null,
      size: data.size || null,
      weight: data.weight || null,
      capacity: data.capacity || null,
      warranty: data.warranty || "3 năm",
      rating: 5.0,
      reviewCount: 0,
      isFeatured: Boolean(data.isFeatured),
      isActive: true,
    },
    include: {
      variants: true,
    },
  });

  return formatProduct(newProduct);
}

/**
 * Cập nhật sản phẩm
 */
export async function updateProductInDb(idOrSlug: string, updates: any): Promise<Product | null> {
  const existing = await prisma.product.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
  });
  if (!existing) return null;
  const id = existing.id;

  const data: any = {};
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.category !== undefined || updates.categoryId !== undefined) {
    const { categoryId, categoryName } = await resolveCategory(
      updates.category ?? existing.category,
      updates.categoryId ?? (updates.category !== undefined ? undefined : existing.categoryId ?? undefined)
    );
    data.categoryId = categoryId;
    data.category = categoryName;
  }
  if (updates.price !== undefined) data.price = Number(updates.price);
  if (updates.oldPrice !== undefined) data.oldPrice = updates.oldPrice ? Number(updates.oldPrice) : null;
  if (updates.compareAtPrice !== undefined) data.compareAtPrice = updates.compareAtPrice ? Number(updates.compareAtPrice) : null;
  if (updates.inStock !== undefined) {
    data.inStock = Boolean(updates.inStock);
    data.stockStatus = data.inStock ? StockStatus.in_stock : StockStatus.out_of_stock;
  }
  if (updates.stockQuantity !== undefined) {
    data.stockQuantity = Number(updates.stockQuantity);
    if (updates.inStock === undefined) {
      data.inStock = data.stockQuantity > 0;
      data.stockStatus = data.inStock ? StockStatus.in_stock : StockStatus.out_of_stock;
    }
  }
  if (updates.image !== undefined) {
    data.image = updates.image.startsWith("data:")
      ? await saveBase64ToFile(updates.image, "cover")
      : updates.image;
  }
  if (updates.images !== undefined) {
    data.images = await Promise.all(
      (Array.isArray(updates.images) ? updates.images : [updates.images]).map((img: string, idx: number) =>
        img && img.startsWith("data:") ? saveBase64ToFile(img, `img-${idx + 1}`) : Promise.resolve(img)
      )
    );
  }
  if (updates.gallery !== undefined) {
    data.gallery = await Promise.all(
      (Array.isArray(updates.gallery) ? updates.gallery : []).map((img: string, idx: number) =>
        img && img.startsWith("data:") ? saveBase64ToFile(img, `gallery-${idx + 1}`) : Promise.resolve(img)
      )
    );
  }
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.video !== undefined) {
    const savedVideo = updates.video.startsWith("data:")
      ? await saveBase64ToFile(updates.video, "video")
      : updates.video;
    const currentSpecs = (existing.specs && typeof existing.specs === "object" ? existing.specs : {}) as Record<string, string>;
    data.specs = { ...currentSpecs, ...(updates.specs || {}), video: savedVideo };
  } else if (updates.specs !== undefined) {
    data.specs = updates.specs;
  }
  if (updates.material !== undefined) data.material = updates.material;
  if (updates.color !== undefined) data.color = updates.color;
  if (updates.size !== undefined) data.size = updates.size;
  if (updates.weight !== undefined) data.weight = updates.weight;
  if (updates.capacity !== undefined) data.capacity = updates.capacity;
  if (updates.warranty !== undefined) data.warranty = updates.warranty;
  if (updates.isFeatured !== undefined) data.isFeatured = Boolean(updates.isFeatured);

  const updated = await prisma.product.update({
    where: { id },
    data,
    include: {
      variants: true,
    },
  });

  return formatProduct(updated);
}

/**
 * Xóa sản phẩm khỏi database
 * - Nếu sản phẩm đã có lịch sử đơn hàng: ẩn sản phẩm (isActive = false) để bảo toàn dữ liệu lịch sử đơn hàng.
 * - Nếu sản phẩm chưa có đơn hàng: xóa sạch dữ liệu liên quan và xóa sản phẩm khỏi MySQL.
 */
export async function deleteProductFromDb(idOrSlug: string): Promise<boolean> {
  try {
    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
    if (!existing) return false;
    const id = existing.id;

    const orderItemsCount = await prisma.orderItem.count({ where: { productId: id } });

    if (orderItemsCount > 0) {
      await prisma.product.update({
        where: { id },
        data: {
          isActive: false,
          inStock: false,
          stockStatus: StockStatus.out_of_stock,
        },
      });
      return true;
    }

    // Xóa cascade các bản ghi phụ thuộc trước khi xóa sản phẩm
    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { productId: id } }),
      prisma.wishlistItem.deleteMany({ where: { productId: id } }),
      prisma.review.deleteMany({ where: { productId: id } }),
      prisma.productVariant.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    return true;
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm trong database:", error);
    return false;
  }
}

/**
 * Đổi nhanh trạng thái còn hàng / hết hàng
 */
export async function toggleProductStockInDb(idOrSlug: string): Promise<Product | null> {
  const existing = await prisma.product.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
  });
  if (!existing) return null;
  const id = existing.id;

  const nextInStock = !existing.inStock;
  const updated = await prisma.product.update({
    where: { id },
    data: {
      inStock: nextInStock,
      stockStatus: nextInStock ? StockStatus.in_stock : StockStatus.out_of_stock,
      stockQuantity: nextInStock ? (existing.stockQuantity > 0 ? existing.stockQuantity : 10) : 0,
    },
    include: {
      variants: true,
    },
  });

  return formatProduct(updated);
}

/**
 * Lấy các sản phẩm liên quan cùng danh mục
 */
export async function getRelatedProductsFromDb(
  productId: string,
  limit: number = 4
): Promise<Product[]> {
  const current = await prisma.product.findUnique({ where: { id: productId } });

  const dbProducts = await prisma.product.findMany({
    where: {
      id: { not: productId },
      ...(current?.category ? { category: current.category } : {}),
      isActive: true,
    },
    take: limit,
    include: {
      variants: true,
    },
  });

  return dbProducts.map(formatProduct);
}
