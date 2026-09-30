import { NextResponse } from "next/server";
import { getOrders, createOrder } from "@/lib/services/order.service";
import { createOrderSchema } from "@/lib/validators/checkout.schema";
import type { Product } from "@/lib/types/product";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;

    const orders = await getOrders(userId);
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json(
      { error: "Không thể lấy danh sách đơn hàng", details: String(error) },
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

    const { userId, items, shippingAddress, paymentMethod, couponCode } = validation.data;

    const newOrder = await createOrder({
      userId: userId ?? null,
      items: items.map((i) => ({
        product: i.product as unknown as Product,
        quantity: i.quantity,
        variantId: i.variantId,
      })),
      shippingAddress,
      paymentMethod,
      couponCode,
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Không thể tạo đơn hàng", details: String(error) },
      { status: 500 }
    );
  }
}
