import { prisma } from "@/lib/prisma";
import type { CouponResult } from "@/lib/services/coupon.service";

export async function validateCouponInDb(code: string, subtotal: number): Promise<CouponResult> {
  const upper = code.trim().toUpperCase();

  const coupon = await prisma.coupon.findUnique({
    where: { code: upper },
  });

  if (!coupon || !coupon.isActive) {
    return {
      valid: false,
      code: upper,
      message: "Mã giảm giá không tồn tại hoặc đã hết hiệu lực.",
    };
  }

  // Kiểm tra ngày bắt đầu / kết thúc nếu có
  const now = new Date();
  if (coupon.startDate && now < coupon.startDate) {
    return {
      valid: false,
      code: upper,
      message: "Mã giảm giá chưa đến ngày áp dụng.",
    };
  }

  if (coupon.endDate && now > coupon.endDate) {
    return {
      valid: false,
      code: upper,
      message: "Mã giảm giá đã hết hạn sử dụng.",
    };
  }

  // Kiểm tra giới hạn số lần dùng
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return {
      valid: false,
      code: upper,
      message: "Mã giảm giá đã đạt số lượng sử dụng tối đa.",
    };
  }

  // Kiểm tra giá trị đơn hàng tối thiểu
  if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
    return {
      valid: false,
      code: upper,
      message: `Mã giảm giá chỉ áp dụng cho đơn hàng từ ${coupon.minOrderValue.toLocaleString("vi-VN")}₫.`,
    };
  }

  let discountAmount = 0;
  if (coupon.discountPercent) {
    discountAmount = Math.round((subtotal * coupon.discountPercent) / 100);
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else if (coupon.discountAmount) {
    discountAmount = coupon.discountAmount;
  }

  return {
    valid: true,
    code: upper,
    discountPercent: coupon.discountPercent || undefined,
    discountAmount,
    message: `Áp dụng thành công: ${coupon.description}`,
  };
}
