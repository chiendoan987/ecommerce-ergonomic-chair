import { NextResponse } from "next/server";
import { trackOrderFromDb } from "@/lib/server/order.repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || searchParams.get("orderId") || searchParams.get("code") || "";

    if (!query.trim()) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp mã đơn hàng, mã vận đơn hoặc số điện thoại." },
        { status: 400 }
      );
    }

    const order = await trackOrderFromDb(query);

    if (!order) {
      return NextResponse.json(
        { error: `Không tìm thấy thông tin đơn hàng với từ khóa "${query}". Vui lòng kiểm tra lại.` },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Lỗi GET /api/orders/track:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tra cứu đơn hàng", details: String(error) },
      { status: 500 }
    );
  }
}
