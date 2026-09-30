export interface Review {
  id: string;
  productId: string;
  authorName: string;
  authorRole?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  verifiedPurchase?: boolean;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface CreateReviewDTO {
  productId: string;
  authorName: string;
  authorRole?: string;
  rating: number;
  comment: string;
}
