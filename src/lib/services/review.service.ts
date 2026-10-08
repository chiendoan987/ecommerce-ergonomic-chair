import type { CreateReviewDTO, Review, ReviewSummary } from "../types/review";

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 0 || !words[0]) return "KH";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Lấy danh sách đánh giá từ MySQL Database qua API
 */
export async function getReviews(productId?: string): Promise<Review[]> {
  try {
    const url = productId
      ? `/api/reviews?productId=${encodeURIComponent(productId)}`
      : "/api/reviews";

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error("Lỗi getReviews service:", error);
    return [];
  }
}

/**
 * Lấy tổng hợp đánh giá và biểu đồ phân bổ sao từ dữ liệu thực tế
 */
export async function getReviewSummary(productId: string): Promise<ReviewSummary> {
  const reviews = await getReviews(productId);
  const totalReviews = reviews.length;

  const ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  if (totalReviews === 0) {
    return {
      averageRating: 5.0,
      totalReviews: 0,
      ratingDistribution,
    };
  }

  let totalScore = 0;
  for (const review of reviews) {
    const r = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
    ratingDistribution[r] = (ratingDistribution[r] || 0) + 1;
    totalScore += review.rating;
  }

  const averageRating = Number((totalScore / totalReviews).toFixed(1));

  return {
    averageRating,
    totalReviews,
    ratingDistribution,
  };
}

/**
 * Thêm đánh giá mới lưu vào MySQL Database
 */
export async function addReview(dto: CreateReviewDTO): Promise<Review> {
  const res = await fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: dto.productId,
      author: dto.authorName,
      authorRole: dto.authorRole,
      rating: dto.rating,
      content: dto.comment,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Không thể gửi đánh giá.");
  }

  return await res.json();
}
