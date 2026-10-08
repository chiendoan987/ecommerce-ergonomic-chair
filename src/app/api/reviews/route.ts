import { NextResponse } from "next/server";
import { getReviewsFromDb, createReviewInDb } from "@/lib/server/review.repository";
import { createReviewSchema } from "@/lib/validators/review.schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId") || undefined;

    const reviews = await getReviewsFromDb(productId);
    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Lỗi GET /api/reviews:", error);
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

    const { productId, author, authorRole, rating, content } = validation.data;
    const newReview = await createReviewInDb({
      productId,
      authorName: author,
      authorRole,
      rating,
      comment: content,
    });

    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    console.error("Lỗi POST /api/reviews:", error);
    return NextResponse.json(
      { error: "Không thể gửi đánh giá", details: String(error) },
      { status: 500 }
    );
  }
}
