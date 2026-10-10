import { NextResponse } from "next/server";
import {
  getPasswordResetRequestsFromDb,
  processPasswordResetByAdminInDb,
} from "@/lib/server/password-reset.repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";

    const requests = await getPasswordResetRequestsFromDb(status);
    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("Lỗi GET /api/admin/password-resets:", error);
    return NextResponse.json(
      { error: "Lỗi tải danh sách yêu cầu cấp lại mật khẩu." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { requestId, action = "approve", customPassword, adminNote, adminEmail } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: "Thiếu mã yêu cầu (requestId)." },
        { status: 400 }
      );
    }

    const result = await processPasswordResetByAdminInDb({
      requestId,
      action,
      adminEmail,
      customPassword,
      adminNote,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Không thể xử lý yêu cầu." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      newPassword: result.newPassword,
      message:
        action === "approve"
          ? `Đã cấp lại mật khẩu mới "${result.newPassword}" thành công cho người dùng!`
          : "Đã từ chối yêu cầu cấp lại mật khẩu.",
    });
  } catch (error: any) {
    console.error("Lỗi PATCH /api/admin/password-resets:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi xử lý cấp lại mật khẩu." },
      { status: 500 }
    );
  }
}
