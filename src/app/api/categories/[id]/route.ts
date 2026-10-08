import { NextResponse } from "next/server";
import {
  getCategoryByIdOrSlugFromDb,
  updateCategoryInDb,
  deleteCategoryFromDb,
} from "@/lib/server/category.repository";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const category = await getCategoryByIdOrSlugFromDb(id);

    if (!category) {
      return NextResponse.json(
        { error: `Không tìm thấy danh mục: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Lỗi GET /api/categories/[id]:", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy thông tin danh mục", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const updated = await updateCategoryInDb(id, body);
    if (!updated) {
      return NextResponse.json(
        { error: `Không tìm thấy danh mục ID: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Lỗi PUT /api/categories/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Không thể cập nhật danh mục." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const success = await deleteCategoryFromDb(id);

    if (!success) {
      return NextResponse.json(
        { error: `Không tìm thấy danh mục ID: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: `Đã xóa danh mục ${id}` });
  } catch (error: any) {
    console.error("Lỗi DELETE /api/categories/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi khi xóa danh mục." },
      { status: 500 }
    );
  }
}
