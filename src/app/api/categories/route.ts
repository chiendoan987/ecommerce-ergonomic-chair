import { NextResponse } from "next/server";
import {
  getCategoriesFromDb,
  createCategoryInDb,
} from "@/lib/server/category.repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("all") === "true";

    const categories = await getCategoriesFromDb(includeInactive);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Lỗi GET /api/categories:", error);
    return NextResponse.json(
      { error: "Không thể lấy danh sách danh mục", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên danh mục." },
        { status: 400 }
      );
    }

    const created = await createCategoryInDb(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Lỗi POST /api/categories:", error);
    return NextResponse.json(
      { error: error.message || "Không thể tạo danh mục mới." },
      { status: 400 }
    );
  }
}
