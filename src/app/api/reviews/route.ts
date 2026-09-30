import { NextResponse } from "next/server";
import { getReviews, addReview } from "@/lib/services/review.service";
import { createReviewSchema } from "@/lib/validators/review.schema";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId") || undefined;

    const reviews = await getReviews(productId);
    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json(
      { error: "Lỗi khi lấy danh sách đánh giá", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = createReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu đánh giá không hợp lệ",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { productId, author, rating, content } = validation.data;
    const newReview = await addReview({
      productId,
      authorName: author,
      rating,
      comment: content,
    });

    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Không thể gửi đánh giá", details: String(error) },
      { status: 500 }
    );
  }
}
