import { NextResponse } from "next/server";
import { register } from "@/lib/services/auth.service";
import { registerSchema } from "@/lib/validators/auth.schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Thông tin đăng ký không hợp lệ",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const result = await register(validation.data);

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || "Không thể tạo tài khoản" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: result.user,
        token: `mock-jwt-token-${result.user.id}`,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Lỗi trong quá trình đăng ký", details: String(error) },
      { status: 500 }
    );
  }
}
