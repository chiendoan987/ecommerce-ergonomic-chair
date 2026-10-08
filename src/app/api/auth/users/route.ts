import { NextResponse } from "next/server";
import { getAllUsersFromDb, createUserByAdminInDb } from "@/lib/server/user.repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await getAllUsersFromDb();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Lỗi GET /api/auth/users:", error);
    return NextResponse.json(
      { error: "Không thể lấy danh sách người dùng", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createUserByAdminInDb(body);

    if (result.error || !result.user) {
      return NextResponse.json(
        { error: result.error || "Không thể tạo người dùng" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, user: result.user }, { status: 201 });
  } catch (error) {
    console.error("Lỗi POST /api/auth/users:", error);
    return NextResponse.json(
      { error: "Không thể tạo người dùng", details: String(error) },
      { status: 500 }
    );
  }
}
