import { prisma } from "@/lib/prisma";
import type { Review, ReviewSummary, CreateReviewDTO } from "@/lib/types/review";

export function formatReview(dbReview: any): Review {
  return {
    id: dbReview.id,
    productId: dbReview.productId,
    authorName: dbReview.authorName,
    authorRole: dbReview.authorRole || undefined,
    rating: dbReview.rating,
    comment: dbReview.comment,
    verifiedPurchase: dbReview.verifiedPurchase,
    createdAt: dbReview.createdAt instanceof Date ? dbReview.createdAt.toISOString() : String(dbReview.createdAt),
  };
}

export async function getReviewsFromDb(productId?: string): Promise<Review[]> {
  const where: any = { isApproved: true };
  if (productId) {
    where.productId = productId;
  }

  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return reviews.map(formatReview);
}

export async function getReviewSummaryFromDb(productId: string): Promise<ReviewSummary> {
  const reviews = await prisma.review.findMany({
    where: { productId, isApproved: true },
    select: { rating: true },
  });

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
  for (const r of reviews) {
    const score = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    ratingDistribution[score] = (ratingDistribution[score] || 0) + 1;
    totalScore += r.rating;
  }

  const averageRating = Number((totalScore / totalReviews).toFixed(1));

  return {
    averageRating,
    totalReviews,
    ratingDistribution,
  };
}

export async function recalculateProductRatingInDb(productId: string): Promise<{ rating: number; reviewCount: number }> {
  const allReviews = await prisma.review.findMany({
    where: { productId, isApproved: true },
    select: { rating: true },
  });

  const count = allReviews.length;
  const avg = count > 0 ? Number((allReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)) : 5.0;

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: avg,
      reviewCount: count,
    },
  });

  return { rating: avg, reviewCount: count };
}

export async function createReviewInDb(dto: Partial<CreateReviewDTO> & { productId: string; rating: number; comment: string; userId?: string }): Promise<Review> {
  const rating = Math.min(5, Math.max(1, dto.rating));

  let authorName = dto.authorName?.trim();
  if (!authorName && dto.userId) {
    const user = await prisma.user.findUnique({ where: { id: dto.userId } });
    authorName = user?.fullName;
  }
  if (!authorName) {
    authorName = "Khách hàng xác thực";
  }

  const created = await prisma.review.create({
    data: {
      productId: dto.productId,
      userId: dto.userId || null,
      authorName,
      authorRole: dto.authorRole?.trim() || "Khách hàng xác thực",
      rating,
      comment: (dto.comment || "").trim(),
      verifiedPurchase: true,
      isApproved: true,
    },
  });

  // Tự động tính toán lại điểm rating trung bình của sản phẩm
  await recalculateProductRatingInDb(dto.productId);

  return formatReview(created);
}
