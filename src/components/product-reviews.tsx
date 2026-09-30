"use client";

import { useEffect, useState } from "react";
import type { Review, ReviewSummary } from "@/lib/types/review";
import { addReview, getInitials, getReviews, getReviewSummary } from "@/lib/services/review.service";
import { formatDate } from "@/lib/utils/format";
import { useToast } from "@/hooks/use-toast";

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const rounded = Math.round(rating);
  return (
    <span className={`star-rating-display star-${size}`} aria-label={`${rating} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rounded ? "star-filled" : "star-empty"}>
          ★
        </span>
      ))}
    </span>
  );
}

const STAR_LABELS: Record<number, string> = {
  5: "Tuyệt vời - Rất hài lòng",
  4: "Hài lòng",
  3: "Bình thường",
  2: "Chưa hài lòng",
  1: "Rất không hài lòng",
};

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [authorName, setAuthorName] = useState("");
  const [authorRole, setAuthorRole] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const toast = useToast();

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getReviews(productId),
      getReviewSummary(productId),
    ]).then(([list, sum]) => {
      if (!isMounted) return;
      setReviews(list);
      setSummary(sum);
      setIsLoading(false);
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!authorName.trim()) {
      setErrorMsg("Vui lòng nhập họ và tên của bạn.");
      return;
    }

    if (!comment.trim()) {
      setErrorMsg("Vui lòng nhập nội dung đánh giá trải nghiệm.");
      return;
    }

    if (comment.trim().length < 10) {
      setErrorMsg("Nội dung đánh giá nên có ít nhất 10 ký tự để hỗ trợ cộng đồng tốt hơn.");
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await addReview({
        productId,
        authorName: authorName.trim(),
        authorRole: authorRole.trim() || "Khách hàng",
        rating: formRating,
        comment: comment.trim(),
      });

      setReviews((prev) => [created, ...prev]);
      // Re-fetch summary
      const newSummary = await getReviewSummary(productId);
      setSummary(newSummary);

      toast.success("Cảm ơn bạn! Đánh giá đã được gửi thành công.");
      setIsFormOpen(false);
      setAuthorName("");
      setAuthorRole("");
      setComment("");
      setFormRating(5);
    } catch {
      setErrorMsg("Đã xảy ra lỗi khi gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="detail-reviews" id="reviews" data-reveal="up">
      <div className="reviews-heading">
        <div>
          <p className="eyebrow">TRẢI NGHIỆM THỰC TẾ</p>
          <h2>Đánh giá từ khách hàng</h2>
          <p className="reviews-subtitle">
            Những chia sẻ thực tế từ người dùng đang sử dụng {productName} hàng ngày.
          </p>
        </div>
        <button
          type="button"
          className="button button-dark open-review-btn"
          onClick={() => setIsFormOpen(!isFormOpen)}
        >
          {isFormOpen ? "Đóng form đánh giá" : "Viết đánh giá của bạn"} <span>✍</span>
        </button>
      </div>

      {/* Review Form */}
      {isFormOpen && (
        <form className="review-form-card" onSubmit={handleSubmit} data-reveal="fade">
          <div className="review-form-header">
            <h3>Đánh giá sản phẩm {productName}</h3>
            <p>Trải nghiệm chân thực của bạn giúp chúng tôi và các khách hàng khác có góc nhìn khách quan nhất.</p>
          </div>

          {errorMsg && <div className="review-form-error">{errorMsg}</div>}

          <div className="rating-select-group">
            <label className="rating-label">Mức độ hài lòng của bạn:</label>
            <div className="interactive-stars" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className={`star-pick-btn ${star <= (hoverRating || formRating) ? "active" : ""}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onClick={() => setFormRating(star)}
                  aria-label={`${star} sao`}
                >
                  ★
                </button>
              ))}
              <span className="star-feedback-text">
                {STAR_LABELS[hoverRating || formRating]}
              </span>
            </div>
          </div>

          <div className="review-form-grid">
            <div className="form-field">
              <label htmlFor="review-author-name">Họ và tên *</label>
              <input
                id="review-author-name"
                type="text"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="review-author-role">Chức danh / Nghề nghiệp</label>
              <input
                id="review-author-role"
                type="text"
                placeholder="Ví dụ: Lập trình viên / Hà Nội"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="review-comment">Nhận xét chi tiết *</label>
            <textarea
              id="review-comment"
              rows={4}
              placeholder="Chia sẻ về độ êm, lưới tản nhiệt, hỗ trợ thắt lưng, quá trình lắp ráp hoặc bảo hành..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>

          <div className="review-form-actions">
            <button
              type="button"
              className="button button-outline"
              onClick={() => setIsFormOpen(false)}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="button button-dark"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang gửi đánh giá..." : "Gửi đánh giá ngay"} <span>→</span>
            </button>
          </div>
        </form>
      )}

      {/* Review Summary Breakdown */}
      {summary && (
        <div className="reviews-summary-card">
          <div className="summary-left">
            <div className="summary-big-score">{summary.averageRating}</div>
            <div className="summary-stars-wrapper">
              <StarRating rating={summary.averageRating} size="lg" />
              <span>Dựa trên {summary.totalReviews} đánh giá</span>
            </div>
          </div>

          <div className="summary-breakdown">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = summary.ratingDistribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
              const percent = summary.totalReviews > 0 ? Math.round((count / summary.totalReviews) * 100) : 0;
              return (
                <div key={stars} className="breakdown-row">
                  <span className="breakdown-star-label">{stars} sao</span>
                  <div className="breakdown-progress-track">
                    <div
                      className="breakdown-progress-fill"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="breakdown-count-label">
                    {count} ({percent}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review List */}
      {isLoading ? (
        <p className="reviews-loading">Đang tải đánh giá...</p>
      ) : reviews.length === 0 ? (
        <div className="reviews-empty">
          <p>Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên trải nghiệm và để lại nhận xét!</p>
        </div>
      ) : (
        <div className="detail-review-grid">
          {reviews.map((review, index) => (
            <article key={review.id} className="review-item-card" data-reveal="up" data-reveal-delay={String(index * 60)}>
              <div className="review-item-top">
                <StarRating rating={review.rating} size="sm" />
                <time className="review-item-date">{formatDate(review.createdAt)}</time>
              </div>
              <p className="review-item-comment">“{review.comment}”</p>
              <footer className="review-item-footer">
                <span className="review-avatar" aria-hidden="true">
                  {getInitials(review.authorName)}
                </span>
                <div className="review-author-meta">
                  <strong>
                    {review.authorName}
                    {review.verifiedPurchase && (
                      <span className="verified-badge" title="Đã mua hàng chính hãng">
                        ✓ Đã mua hàng
                      </span>
                    )}
                  </strong>
                  {review.authorRole && <small>{review.authorRole}</small>}
                </div>
              </footer>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
