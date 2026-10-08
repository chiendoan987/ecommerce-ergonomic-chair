import { prisma } from "@/lib/prisma";

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
}

function formatCategory(c: any): CategoryData {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? null,
    image: c.image ?? null,
    sortOrder: c.sortOrder ?? 0,
    isActive: Boolean(c.isActive),
    productCount: c._count?.products ?? 0,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
    updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : String(c.updatedAt),
  };
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * Lấy toàn bộ danh mục từ MySQL Database
 */
export async function getCategoriesFromDb(includeInactive: boolean = false): Promise<CategoryData[]> {
  const where = includeInactive ? {} : { isActive: true };

  const categories = await prisma.category.findMany({
    where,
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  // Đếm bổ sung theo tên danh mục trong Product để đảm bảo số lượng sản phẩm chính xác 100%
  const nameCounts = await prisma.product.groupBy({
    by: ["category"],
    _count: { _all: true },
  });
  const nameCountMap = new Map(nameCounts.map((n) => [n.category.toLowerCase().trim(), n._count._all]));

  return categories.map((c) => {
    const relationCount = c._count?.products ?? 0;
    const nameCount = nameCountMap.get(c.name.toLowerCase().trim()) ?? 0;
    return {
      ...formatCategory(c),
      productCount: Math.max(relationCount, nameCount),
    };
  });
}

/**
 * Lấy chi tiết danh mục theo ID hoặc Slug
 */
export async function getCategoryByIdOrSlugFromDb(idOrSlug: string): Promise<CategoryData | null> {
  const cat = await prisma.category.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!cat) return null;

  const count = await prisma.product.count({
    where: {
      OR: [{ categoryId: cat.id }, { category: cat.name }],
    },
  });

  return {
    ...formatCategory(cat),
    productCount: Math.max(cat._count?.products ?? 0, count),
  };
}

/**
 * Tạo danh mục mới
 */
export async function createCategoryInDb(data: CreateCategoryInput): Promise<CategoryData> {
  const name = data.name.trim();
  const slug = (data.slug?.trim() || generateSlug(name)).toLowerCase();

  // Kiểm tra trùng lặp
  const existing = await prisma.category.findFirst({
    where: {
      OR: [{ name }, { slug }],
    },
  });

  if (existing) {
    throw new Error(`Danh mục với tên "${name}" hoặc đường dẫn "${slug}" đã tồn tại.`);
  }

  const newCat = await prisma.category.create({
    data: {
      name,
      slug,
      description: data.description?.trim() || null,
      image: data.image?.trim() || null,
      sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return formatCategory(newCat);
}

/**
 * Cập nhật danh mục
 */
export async function updateCategoryInDb(
  id: string,
  data: UpdateCategoryInput
): Promise<CategoryData | null> {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return null;

  const updateData: any = {};
  if (data.name !== undefined) {
    const trimmedName = data.name.trim();
    updateData.name = trimmedName;
    const newSlug = data.slug !== undefined ? data.slug.trim().toLowerCase() : generateSlug(trimmedName);
    updateData.slug = newSlug;

    const conflict = await prisma.category.findFirst({
      where: {
        id: { not: id },
        OR: [{ name: trimmedName }, { slug: newSlug }],
      },
    });
    if (conflict) {
      throw new Error(`Danh mục "${trimmedName}" đã tồn tại.`);
    }
  } else if (data.slug !== undefined) {
    updateData.slug = data.slug.trim().toLowerCase();
  }
  if (data.description !== undefined) {
    updateData.description = data.description.trim() || null;
  }
  if (data.image !== undefined) {
    updateData.image = data.image.trim() || null;
  }
  if (data.sortOrder !== undefined) {
    updateData.sortOrder = Number(data.sortOrder);
  }
  if (data.isActive !== undefined) {
    updateData.isActive = Boolean(data.isActive);
  }

  // Nếu cập nhật tên danh mục, đồng bộ tên dạng text trong bảng Product
  if (data.name && data.name.trim() !== existing.name) {
    await prisma.product.updateMany({
      where: { categoryId: id },
      data: { category: data.name.trim() },
    });
  }

  const updated = await prisma.category.update({
    where: { id },
    data: updateData,
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return formatCategory(updated);
}

/**
 * Xóa danh mục khỏi MySQL
 * - Tách liên kết các sản phẩm thuộc danh mục này (categoryId = null)
 * - Xóa bản ghi danh mục an toàn
 */
export async function deleteCategoryFromDb(id: string): Promise<boolean> {
  try {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return false;

    // Ngắt liên kết các sản phẩm thuộc danh mục
    await prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await prisma.category.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error("Lỗi xóa danh mục trong database:", error);
    return false;
  }
}
