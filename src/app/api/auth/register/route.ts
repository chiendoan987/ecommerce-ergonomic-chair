import { NextResponse } from "next/server";
import { registerUserInDb } from "@/lib/server/user.repository";
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

    const result = await registerUserInDb(validation.data);

    if (result.error || !result.user) {
      return NextResponse.json(
        { error: result.error || "Không thể tạo tài khoản" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: result.user,
        token: `auth-token-${result.user.id}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi POST /api/auth/register:", error);
    return NextResponse.json(
      { error: "Lỗi trong quá trình đăng ký", details: String(error) },
      { status: 500 }
    );
  }
}
