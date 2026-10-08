import { NextResponse } from "next/server";
import { getOrdersFromDb, createOrderInDb } from "@/lib/server/order.repository";
import { createOrderSchema } from "@/lib/validators/checkout.schema";
import type { Product } from "@/lib/types/product";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const orders = await getOrdersFromDb({ userId, status, search });
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Lỗi GET /api/orders:", error);
    return NextResponse.json(
      { error: "Không thể lấy danh sách đơn hàng từ cơ sở dữ liệu", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = createOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu đặt hàng không hợp lệ",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { userId, items, shippingAddress, paymentMethod, shippingMethod, shippingFee, couponCode } = validation.data;

    const newOrder = await createOrderInDb({
      userId: userId ?? null,
      items: items.map((i) => ({
        product: i.product as unknown as Product,
        quantity: i.quantity,
        variantId: i.variantId,
      })),
      shippingAddress,
      paymentMethod,
      shippingMethod,
      shippingFee,
      couponCode,
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Lỗi POST /api/orders:", error);
    return NextResponse.json(
      { error: "Không thể tạo đơn hàng", details: String(error) },
      { status: 500 }
    );
  }
}
