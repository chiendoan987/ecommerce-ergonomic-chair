import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils/password";

export interface PasswordResetItem {
  id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  note: string | null;
  status: "pending" | "completed" | "rejected";
  newPassword: string | null;
  adminNote: string | null;
  processedBy: string | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Người dùng gửi yêu cầu cấp lại mật khẩu
 */
export async function createPasswordResetRequestInDb(data: {
  email: string;
  phone?: string;
  note?: string;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  const cleanEmail = data.email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "Địa chỉ email không hợp lệ." };
  }

  // 1. Kiểm tra tài khoản người dùng có tồn tại trong hệ thống không
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user) {
    return {
      success: false,
      error: `Không tìm thấy tài khoản với email "${cleanEmail}". Vui lòng kiểm tra lại hoặc đăng ký tài khoản mới.`,
    };
  }

  if (user.status === "blocked") {
    return {
      success: false,
      error: "Tài khoản này hiện đang bị khóa bởi Quản trị viên. Vui lòng liên hệ Hotline 0989 608 685 để được hỗ trợ.",
    };
  }

  // 2. Kiểm tra nếu vừa gửi yêu cầu tương tự đang chờ xử lý
  const recentPending = await prisma.passwordResetRequest.findFirst({
    where: {
      email: cleanEmail,
      status: "pending",
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentPending) {
    return {
      success: true,
      message: "Yêu cầu cấp lại mật khẩu của bạn đã được gửi trước đó và đang chờ Quản trị viên xử lý. Quản trị viên sẽ sớm liên hệ hoặc cấp lại mật khẩu cho bạn.",
    };
  }

  // 3. Tạo bản ghi yêu cầu mới
  await prisma.passwordResetRequest.create({
    data: {
      email: cleanEmail,
      phone: data.phone?.trim() || user.phone || null,
      fullName: user.fullName || null,
      note: data.note?.trim() || null,
      status: "pending",
    },
  });

  return {
    success: true,
    message: "Yêu cầu cấp lại mật khẩu của bạn đã được gửi thành công đến Quản trị viên. Quản trị viên sẽ kiểm tra và cấp mật khẩu mới cho bạn trong thời gian sớm nhất.",
  };
}

/**
 * Lấy danh sách các yêu cầu cấp lại mật khẩu cho Quản trị viên
 */
export async function getPasswordResetRequestsFromDb(
  statusFilter?: string
): Promise<PasswordResetItem[]> {
  const where: any = {};
  if (statusFilter && statusFilter !== "all") {
    where.status = statusFilter;
  }

  const list = await prisma.passwordResetRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return list as PasswordResetItem[];
}

/**
 * Quản trị viên duyệt và cấp lại mật khẩu mới cho người dùng
 */
export async function processPasswordResetByAdminInDb(params: {
  requestId: string;
  action: "approve" | "reject";
  adminEmail?: string;
  customPassword?: string;
  adminNote?: string;
}): Promise<{ success: boolean; newPassword?: string; error?: string }> {
  const { requestId, action, adminEmail, customPassword, adminNote } = params;

  const req = await prisma.passwordResetRequest.findUnique({
    where: { id: requestId },
  });

  if (!req) {
    return { success: false, error: "Không tìm thấy yêu cầu cấp lại mật khẩu." };
  }

  if (action === "reject") {
    await prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: {
        status: "rejected",
        adminNote: adminNote?.trim() || "Yêu cầu bị từ chối bởi Quản trị viên",
        processedBy: adminEmail || "Admin",
        processedAt: new Date(),
      },
    });
    return { success: true };
  }

  // Tạo mật khẩu mới an toàn
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const generatedPassword = customPassword?.trim() || `Ergo@${randomSuffix}`;

  // Tìm user theo email
  const user = await prisma.user.findUnique({
    where: { email: req.email },
  });

  if (!user) {
    return {
      success: false,
      error: `Người dùng có email "${req.email}" không còn tồn tại trong hệ thống.`,
    };
  }

  // Cập nhật mật khẩu băm mới cho user
  const hashedPassword = hashPassword(generatedPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  // Đánh dấu yêu cầu hoàn tất
  await prisma.passwordResetRequest.update({
    where: { id: requestId },
    data: {
      status: "completed",
      newPassword: generatedPassword,
      adminNote: adminNote?.trim() || `Đã cấp mật khẩu mới: ${generatedPassword}`,
      processedBy: adminEmail || "Admin",
      processedAt: new Date(),
    },
  });

  return {
    success: true,
    newPassword: generatedPassword,
  };
}
