import { NextResponse } from "next/server";
import { getOrderById, updateOrderStatus } from "@/lib/services/order.service";
import { updateOrderStatusSchema } from "@/lib/validators/checkout.schema";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { error: `Không tìm thấy đơn hàng mã: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
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

    const updated = await updateOrderStatus(id, validation.data.status);
    if (!updated) {
      return NextResponse.json(
        { error: `Không tìm thấy đơn hàng mã: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Không thể cập nhật trạng thái đơn hàng", details: String(error) },
      { status: 500 }
    );
  }
}
