import { NextResponse } from "next/server";
import {
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  toggleProductStock,
} from "@/lib/services/product.service";
import { updateProductSchema } from "@/lib/validators/product.schema";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    let product = await getProductById(id);
    if (!product) {
      product = await getProductBySlug(id);
    }

    if (!product) {
      return NextResponse.json(
        { error: `Không tìm thấy sản phẩm với id/slug: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
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

    const updated = await updateProduct(id, validation.data);
    if (!updated) {
      return NextResponse.json(
        { error: `Không tìm thấy sản phẩm id: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Không thể cập nhật sản phẩm", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const success = await deleteProduct(id);

    if (!success) {
      return NextResponse.json(
        { error: `Không tìm thấy sản phẩm id: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: `Đã xóa sản phẩm ${id}` });
  } catch (error) {
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
      const updated = await toggleProductStock(id);
      if (!updated) {
        return NextResponse.json(
          { error: `Không tìm thấy sản phẩm id: ${id}` },
          { status: 404 }
        );
      }
      return NextResponse.json(updated);
    }

    const body = await request.json().catch(() => ({}));
    const updated = await updateProduct(id, body);
    if (!updated) {
      return NextResponse.json(
        { error: `Không tìm thấy sản phẩm id: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Không thể cập nhật trạng thái sản phẩm", details: String(error) },
      { status: 500 }
    );
  }
}
