import { NextResponse } from "next/server";
import {
  updateUserByAdminInDb,
  toggleUserStatusByAdminInDb,
  deleteUserByAdminInDb,
  changeUserPasswordInDb,
} from "@/lib/server/user.repository";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const body = await request.json().catch(() => ({}));

    if (action === "toggle-status") {
      const result = await toggleUserStatusByAdminInDb(id);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, newStatus: result.newStatus });
    }

    if (action === "reset-password") {
      const result = await changeUserPasswordInDb(id, undefined, body.newPassword);
      if (!result.success) {
        return NextResponse.json({ error: result.error || "Không thể đặt lại mật khẩu" }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    const result = await updateUserByAdminInDb(id, body);
    if (result.error || !result.user) {
      return NextResponse.json({ error: result.error || "Không thể cập nhật người dùng" }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: result.user });
  } catch (error) {
    console.error("Lỗi PATCH /api/auth/users/[id]:", error);
    return NextResponse.json(
      { error: "Lỗi khi xử lý người dùng", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const currentAdminId = searchParams.get("currentAdminId") || undefined;

    const result = await deleteUserByAdminInDb(id, currentAdminId);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Không thể xóa người dùng" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lỗi DELETE /api/auth/users/[id]:", error);
    return NextResponse.json(
      { error: "Lỗi khi xóa người dùng", details: String(error) },
      { status: 500 }
    );
  }
}
