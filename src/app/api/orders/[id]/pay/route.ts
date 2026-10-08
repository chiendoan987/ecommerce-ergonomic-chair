import { NextResponse } from "next/server";
import { updateOrderPaymentStatusInDb } from "@/lib/server/order.repository";
import type { PaymentMethod } from "@/lib/types/order";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { paymentStatus, paymentMethod } = body;

    if (!paymentStatus || !["paid", "unpaid", "refunded"].includes(paymentStatus)) {
      return NextResponse.json(
        { error: "Trạng thái thanh toán không hợp lệ" },
        { status: 400 }
      );
    }

    const updated = await updateOrderPaymentStatusInDb(
      id,
      paymentStatus,
      paymentMethod as PaymentMethod | undefined
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("API error /api/orders/[id]/pay:", error);
    return NextResponse.json(
      { error: "Lỗi cập nhật thanh toán đơn hàng" },
      { status: 500 }
    );
  }
}
