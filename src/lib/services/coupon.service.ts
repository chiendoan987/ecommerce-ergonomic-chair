export interface CouponResult {
  valid: boolean;
  code: string;
  discountPercent?: number;
  discountAmount?: number;
  message: string;
}

const VALID_COUPONS: Record<string, { percent: number; description: string }> = {
  ERGO10: { percent: 10, description: "Giảm 10% cho đơn hàng đầu tiên" },
  VIP20: { percent: 20, description: "Giảm 20% cho khách hàng VIP" },
};

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<CouponResult> {
  const upper = code.trim().toUpperCase();

  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: upper, subtotal }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback to local calculation
    }
  }

  const coupon = VALID_COUPONS[upper];

  if (!coupon) {
    return {
      valid: false,
      code: upper,
      message: "Mã giảm giá không hợp lệ hoặc đã hết hạn.",
    };
  }

  const discountAmount = Math.round((subtotal * coupon.percent) / 100);

  return {
    valid: true,
    code: upper,
    discountPercent: coupon.percent,
    discountAmount,
    message: `Áp dụng thành công: ${coupon.description}`,
  };
}
