import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/services/coupon.service";
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

    const result = await validateCoupon(validation.data.code, validation.data.subtotal);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Lỗi khi kiểm tra mã giảm giá", details: String(error) },
      { status: 500 }
    );
  }
}
