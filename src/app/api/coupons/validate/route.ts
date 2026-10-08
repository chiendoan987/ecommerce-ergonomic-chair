import { NextResponse } from "next/server";
import { validateCouponInDb } from "@/lib/server/coupon.repository";
import { z } from "zod";

const validateCouponBodySchema = z.object({
  code: z.string().min(1, "Vui lòng nhập mã giảm giá."),
  subtotal: z.number().nonnegative(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateCouponBodySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu không hợp lệ",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const result = await validateCouponInDb(validation.data.code, validation.data.subtotal);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Lỗi POST /api/coupons/validate:", error);
    return NextResponse.json(
      { error: "Lỗi khi kiểm tra mã giảm giá", details: String(error) },
      { status: 500 }
    );
  }
}
