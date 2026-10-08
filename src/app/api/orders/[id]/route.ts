import { NextResponse } from "next/server";
import { getOrderByIdFromDb, updateOrderStatusInDb } from "@/lib/server/order.repository";
import { updateOrderStatusSchema } from "@/lib/validators/checkout.schema";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const order = await getOrderByIdFromDb(id);

    if (!order) {
      return NextResponse.json(
        { error: `Không tìm thấy đơn hàng mã: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Lỗi GET /api/orders/[id]:", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy chi tiết đơn hàng", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const validation = updateOrderStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Trạng thái đơn hàng không hợp lệ",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updated = await updateOrderStatusInDb(id, validation.data.status, body.cancelReason);
    if (!updated) {
      return NextResponse.json(
        { error: `Không tìm thấy đơn hàng mã: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Lỗi PATCH /api/orders/[id]:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật trạng thái đơn hàng", details: String(error) },
      { status: 500 }
    );
  }
}
