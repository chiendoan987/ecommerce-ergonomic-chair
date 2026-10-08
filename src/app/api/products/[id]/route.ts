import { NextResponse } from "next/server";
import {
  getProductByIdOrSlugFromDb,
  updateProductInDb,
  deleteProductFromDb,
  toggleProductStockInDb,
} from "@/lib/server/product.repository";
import { updateProductSchema } from "@/lib/validators/product.schema";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const product = await getProductByIdOrSlugFromDb(id);

    if (!product) {
      return NextResponse.json(
        { error: `Không tìm thấy sản phẩm với id/slug: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Lỗi GET /api/products/[id]:", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy thông tin sản phẩm", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const validation = updateProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu cập nhật không hợp lệ",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updated = await updateProductInDb(id, validation.data);
    if (!updated) {
      return NextResponse.json(
        { error: `Không tìm thấy sản phẩm id: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Lỗi PUT /api/products/[id]:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật sản phẩm", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const success = await deleteProductFromDb(id);

    if (!success) {
      return NextResponse.json(
        { error: `Không tìm thấy hoặc không thể xóa sản phẩm id: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: `Đã xóa sản phẩm ${id}` });
  } catch (error) {
    console.error("Lỗi DELETE /api/products/[id]:", error);
    return NextResponse.json(
      { error: "Lỗi khi xóa sản phẩm", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "toggle-stock") {
      const updated = await toggleProductStockInDb(id);
      if (!updated) {
        return NextResponse.json(
          { error: `Không tìm thấy sản phẩm id: ${id}` },
          { status: 404 }
        );
      }
      return NextResponse.json(updated);
    }

    const body = await request.json().catch(() => ({}));
    const updated = await updateProductInDb(id, body);
    if (!updated) {
      return NextResponse.json(
        { error: `Không tìm thấy sản phẩm id: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Lỗi PATCH /api/products/[id]:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật trạng thái sản phẩm", details: String(error) },
      { status: 500 }
    );
  }
}
