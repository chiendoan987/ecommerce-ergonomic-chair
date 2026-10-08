import { z } from "zod";

export const createReviewSchema = z.object({
  productId: z.string().min(1, "Thiếu mã sản phẩm."),
  author: z.string().min(2, "Vui lòng nhập tên người đánh giá."),
  authorRole: z.string().optional(),
  rating: z.number().int().min(1, "Điểm đánh giá tối thiểu là 1.").max(5, "Điểm đánh giá tối đa là 5."),
  content: z.string().min(5, "Nội dung đánh giá phải có ít nhất 5 ký tự."),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
