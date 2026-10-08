import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/server/user.repository";
import { loginSchema } from "@/lib/validators/auth.schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Thông tin đăng nhập không hợp lệ",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const result = await authenticateUser(validation.data);

    if (result.error || !result.user) {
      return NextResponse.json(
        { error: result.error || "Email hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      token: `auth-token-${result.user.id}`,
    });
  } catch (error) {
    console.error("Lỗi POST /api/auth/login:", error);
    return NextResponse.json(
      { error: "Lỗi trong quá trình xác thực", details: String(error) },
      { status: 500 }
    );
  }
}
