import { mockReviews } from "../data/mock-reviews";
import type { CreateReviewDTO, Review, ReviewSummary } from "../types/review";

const STORAGE_KEY = "ergochair-user-reviews";

function getUserReviews(): Review[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUserReviews(reviews: Review[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch {
    // Ignore error
  }
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 0 || !words[0]) return "KH";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export async function getReviews(productId?: string): Promise<Review[]> {
  if (typeof window !== "undefined") {
    try {
      const url = productId ? `/api/reviews?productId=${encodeURIComponent(productId)}` : "/api/reviews";
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback to local stored reviews
    }
  }

  const userReviews = getUserReviews();
  const allReviews = [...userReviews, ...mockReviews];

  if (productId) {
    const filtered = allReviews.filter((r) => r.productId === productId);
    // If no reviews for this product yet, fallback to general reviews with this productId
    if (filtered.length === 0) {
      return mockReviews.slice(0, 3).map((r) => ({ ...r, productId }));
    }
    return filtered;
  }

  return allReviews;
}

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

export async function addReview(dto: CreateReviewDTO): Promise<Review> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: dto.productId,
          author: dto.authorName,
          rating: dto.rating,
          content: dto.comment,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        const userReviews = getUserReviews();
        saveUserReviews([created, ...userReviews]);
        return created;
      }
    } catch {
      // fallback to local creation
    }
  }

  const newReview: Review = {
    id: `rev-user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    productId: dto.productId,
    authorName: dto.authorName.trim(),
    authorRole: dto.authorRole?.trim() || "Khách hàng xác thực",
    rating: Math.min(5, Math.max(1, dto.rating)),
    comment: dto.comment.trim(),
    createdAt: new Date().toISOString(),
    verifiedPurchase: true,
  };

  const userReviews = getUserReviews();
  const updated = [newReview, ...userReviews];
  saveUserReviews(updated);

  return newReview;
}
