export interface CouponResult {
  valid: boolean;
  code: string;
  discountPercent?: number;
  discountAmount?: number;
  message: string;
}

/**
 * Kiểm tra tính hợp lệ và áp dụng mã giảm giá từ MySQL Database
 */
export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<CouponResult> {
  const upper = code.trim().toUpperCase();

  try {
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: upper, subtotal }),
    });

    if (res.ok) {
      return await res.json();
    }

    const err = await res.json().catch(() => ({}));
    return {
      valid: false,
      code: upper,
      message: err.error || "Mã giảm giá không hợp lệ hoặc đã hết hạn.",
    };
  } catch (error) {
    return {
      valid: false,
      code: upper,
      message: "Không thể kiểm tra mã giảm giá lúc này.",
    };
  }
}
