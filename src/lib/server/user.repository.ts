import { prisma } from "@/lib/prisma";
import type { User, UserRole, UserStatus, RegisterData, UpdateProfileData } from "@/lib/types/user";
import type { Address } from "@/lib/types/order";
import { UserRole as DbUserRole, UserStatus as DbUserStatus } from "@prisma/client";
import { verifyPassword, hashPassword } from "@/lib/utils/password";

/**
 * Format Prisma User model sang User entity của app
 */
export function formatUser(dbUser: any): User {
  return {
    id: dbUser.id,
    fullName: dbUser.fullName,
    email: dbUser.email,
    phone: dbUser.phone || "",
    role: dbUser.role as UserRole,
    status: dbUser.status as UserStatus,
    avatar: dbUser.avatar || undefined,
    addresses: (dbUser.addresses || []).map((a: any) => ({
      id: a.id,
      fullName: a.fullName,
      phone: a.phone,
      province: a.province,
      district: a.district,
      detail: a.detail,
      isDefault: a.isDefault,
    })),
    createdAt: dbUser.createdAt instanceof Date ? dbUser.createdAt.toISOString() : String(dbUser.createdAt),
    updatedAt: dbUser.updatedAt instanceof Date ? dbUser.updatedAt.toISOString() : String(dbUser.updatedAt),
  };
}

/**
 * Tìm người dùng theo Email
 */
export async function findUserByEmailFromDb(email: string) {
  const normalized = email.trim().toLowerCase();
  return await prisma.user.findUnique({
    where: { email: normalized },
    include: { addresses: true },
  });
}

/**
 * Tìm người dùng theo ID
 */
export async function findUserByIdFromDb(id: string): Promise<User | null> {
  const dbUser = await prisma.user.findUnique({
    where: { id },
    include: { addresses: true },
  });
  return dbUser ? formatUser(dbUser) : null;
}

/**
 * Xác thực đăng nhập
 */
export async function authenticateUser(credentials: {
  email: string;
  password?: string;
}): Promise<{ user?: User; error?: string }> {
  const email = (credentials.email || "").trim().toLowerCase();
  const password = credentials.password || "";

  if (!email) {
    return { error: "Vui lòng nhập địa chỉ email." };
  }

  const dbUser = await findUserByEmailFromDb(email);
  if (!dbUser) {
    return { error: "Email hoặc tài khoản không tồn tại trên hệ thống." };
  }

  if (dbUser.status === DbUserStatus.blocked) {
    return { error: "Tài khoản của bạn đã bị khóa bởi Quản trị viên." };
  }

  if (!password) {
    return { error: "Vui lòng nhập mật khẩu." };
  }

  const isValid = verifyPassword(password, dbUser.password);
  if (!isValid) {
    return { error: "Mật khẩu không chính xác. Vui lòng thử lại." };
  }

  return { user: formatUser(dbUser) };
}

/**
 * Đăng ký tài khoản mới
 */
export async function registerUserInDb(data: RegisterData): Promise<{ user?: User; error?: string }> {
  const email = data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return { error: "Địa chỉ email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác." };
  }

  const hashedPassword = data.password ? hashPassword(data.password) : hashPassword("123456");

  const newUser = await prisma.user.create({
    data: {
      fullName: data.fullName.trim(),
      email,
      phone: data.phone.trim(),
      password: hashedPassword,
      role: DbUserRole.customer,
      status: DbUserStatus.active,
    },
    include: { addresses: true },
  });

  return { user: formatUser(newUser) };
}

/**
 * Cập nhật thông tin tài khoản cá nhân
 */
export async function updateUserProfileInDb(
  userId: string,
  data: UpdateProfileData
): Promise<User | null> {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) return null;

  const updateData: any = {};
  if (data.fullName !== undefined) updateData.fullName = data.fullName.trim();
  if (data.phone !== undefined) updateData.phone = data.phone.trim();
  if (data.avatar !== undefined) updateData.avatar = data.avatar;
  if (data.email !== undefined && data.email.trim().toLowerCase() !== existing.email) {
    const email = data.email.trim().toLowerCase();
    const duplicate = await prisma.user.findUnique({ where: { email } });
    if (!duplicate) {
      updateData.email = email;
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    include: { addresses: true },
  });

  return formatUser(updated);
}

/**
 * Đổi mật khẩu
 */
export async function changeUserPasswordInDb(
  userId: string,
  currentPassword?: string,
  newPassword?: string
): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, error: "Không tìm thấy thông tin tài khoản." };
  }

  if (currentPassword && !verifyPassword(currentPassword, user.password)) {
    return { success: false, error: "Mật khẩu hiện tại không chính xác." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashPassword(newPassword) },
  });

  return { success: true };
}

/**
 * Lấy danh sách toàn bộ người dùng (Dành cho Quản trị viên)
 */
export async function getAllUsersFromDb(): Promise<User[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { addresses: true },
  });
  return users.map(formatUser);
}

/**
 * Quản trị viên thêm người dùng mới
 */
export async function createUserByAdminInDb(data: {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
}): Promise<{ user?: User; error?: string }> {
  const email = data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email này đã tồn tại trên hệ thống." };
  }

  const rawPassword = data.password?.trim() || "123456";
  const hashedPassword = hashPassword(rawPassword);

  const newUser = await prisma.user.create({
    data: {
      fullName: data.fullName.trim(),
      email,
      phone: data.phone.trim(),
      password: hashedPassword,
      role: (data.role as DbUserRole) || DbUserRole.customer,
      status: (data.status as DbUserStatus) || DbUserStatus.active,
    },
    include: { addresses: true },
  });

  return { user: formatUser(newUser) };
}

/**
 * Quản trị viên cập nhật người dùng
 */
export async function updateUserByAdminInDb(
  userId: string,
  data: Partial<User>
): Promise<{ user?: User; error?: string }> {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    return { error: "Không tìm thấy người dùng." };
  }

  const updateData: any = {};
  if (data.fullName !== undefined) updateData.fullName = data.fullName.trim();
  if (data.phone !== undefined) updateData.phone = data.phone.trim();
  if (data.role !== undefined) updateData.role = data.role as DbUserRole;
  if (data.status !== undefined) updateData.status = data.status as DbUserStatus;
  if (data.email !== undefined) {
    const email = data.email.trim().toLowerCase();
    if (email !== existing.email) {
      const duplicate = await prisma.user.findUnique({ where: { email } });
      if (duplicate) {
        return { error: "Email này đã được sử dụng bởi người dùng khác." };
      }
      updateData.email = email;
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    include: { addresses: true },
  });

  return { user: formatUser(updated) };
}

/**
 * Quản trị viên đổi trạng thái khóa/mở khóa tài khoản
 */
export async function toggleUserStatusByAdminInDb(
  userId: string
): Promise<{ newStatus?: UserStatus; error?: string }> {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    return { error: "Không tìm thấy người dùng." };
  }

  const newStatus =
    existing.status === DbUserStatus.blocked ? DbUserStatus.active : DbUserStatus.blocked;

  await prisma.user.update({
    where: { id: userId },
    data: { status: newStatus },
  });

  return { newStatus: newStatus as UserStatus };
}

/**
 * Quản trị viên xóa người dùng
 */
export async function deleteUserByAdminInDb(
  userId: string,
  currentAdminId?: string
): Promise<{ success: boolean; error?: string }> {
  if (currentAdminId && userId === currentAdminId) {
    return { success: false, error: "Bạn không thể xóa tài khoản của chính mình." };
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    return { success: true };
  } catch (e) {
    return { success: false, error: "Không thể xóa người dùng." };
  }
}

/**
 * Thêm địa chỉ mới cho người dùng
 */
export async function addUserAddressInDb(
  userId: string,
  address: Omit<Address, "id">
): Promise<Address> {
  const count = await prisma.address.count({ where: { userId } });
  const isDefault = address.isDefault ?? count === 0;

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const created = await prisma.address.create({
    data: {
      userId,
      fullName: address.fullName,
      phone: address.phone,
      province: address.province,
      district: address.district,
      detail: address.detail,
      isDefault,
    },
  });

  return {
    id: created.id,
    fullName: created.fullName,
    phone: created.phone,
    province: created.province,
    district: created.district,
    detail: created.detail,
    isDefault: created.isDefault,
  };
}

/**
 * Cập nhật địa chỉ
 */
export async function updateUserAddressInDb(
  userId: string,
  addressId: string,
  updates: Partial<Address>
): Promise<Address | null> {
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) return null;

  if (updates.isDefault) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.address.update({
    where: { id: addressId },
    data: {
      fullName: updates.fullName,
      phone: updates.phone,
      province: updates.province,
      district: updates.district,
      detail: updates.detail,
      isDefault: updates.isDefault,
    },
  });

  return {
    id: updated.id,
    fullName: updated.fullName,
    phone: updated.phone,
    province: updated.province,
    district: updated.district,
    detail: updated.detail,
    isDefault: updated.isDefault,
  };
}

/**
 * Xóa địa chỉ
 */
export async function deleteUserAddressInDb(userId: string, addressId: string): Promise<boolean> {
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) return false;

  await prisma.address.delete({ where: { id: addressId } });

  // Nếu địa chỉ vừa xóa là mặc định, chuyển địa chỉ đầu tiên còn lại thành mặc định
  if (existing.isDefault) {
    const firstRemaining = await prisma.address.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    if (firstRemaining) {
      await prisma.address.update({
        where: { id: firstRemaining.id },
        data: { isDefault: true },
      });
    }
  }

  return true;
}
