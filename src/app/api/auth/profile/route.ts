import { NextResponse } from "next/server";
import {
  updateUserProfileInDb,
  changeUserPasswordInDb,
  addUserAddressInDb,
  updateUserAddressInDb,
  deleteUserAddressInDb,
} from "@/lib/server/user.repository";

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const body = await request.json();
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json({ error: "Thiếu thông tin userId" }, { status: 400 });
    }

    if (action === "change-password") {
      const result = await changeUserPasswordInDb(userId, body.currentPassword, body.newPassword);
      if (!result.success) {
        return NextResponse.json({ error: result.error || "Không thể đổi mật khẩu" }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "add-address") {
      const address = await addUserAddressInDb(userId, body.address);
      return NextResponse.json({ success: true, address });
    }

    if (action === "update-address") {
      const address = await updateUserAddressInDb(userId, body.addressId, body.updates);
      return NextResponse.json({ success: true, address });
    }

    if (action === "delete-address") {
      const success = await deleteUserAddressInDb(userId, body.addressId);
      return NextResponse.json({ success });
    }

    // Cập nhật thông tin cơ bản
    const updatedUser = await updateUserProfileInDb(userId, body);
    if (!updatedUser) {
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Lỗi PATCH /api/auth/profile:", error);
    return NextResponse.json(
      { error: "Lỗi cập nhật hồ sơ cá nhân", details: String(error) },
      { status: 500 }
    );
  }
}
