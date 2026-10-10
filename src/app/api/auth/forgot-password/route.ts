import { NextResponse } from "next/server";
import {
  createPasswordResetRequestInDb,
} from "@/lib/server/password-reset.repository";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, phone, note } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập địa chỉ email của bạn." },
        { status: 400 }
      );
    }

    const result = await createPasswordResetRequestInDb({
      email: email.trim(),
      phone: phone ? String(phone).trim() : undefined,
      note: note ? String(note).trim() : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Không thể gửi yêu cầu." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Lỗi POST /api/auth/forgot-password:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi máy chủ trong quá trình gửi yêu cầu." },
      { status: 500 }
    );
  }
}
