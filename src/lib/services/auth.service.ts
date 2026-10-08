import type { Address } from "../types/order";
import type { LoginCredentials, RegisterData, UpdateProfileData, User, UserRole, UserStatus } from "../types/user";

const SESSION_STORAGE_KEY = "ergochair-auth-session";

function saveSession(user: User | null, notify: boolean = true): void {
  if (typeof window === "undefined") return;
  try {
    const prevRaw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    const newRaw = user ? JSON.stringify(user) : null;

    // Nếu dữ liệu không thay đổi, không ghi lại và không bắn event
    if (prevRaw === newRaw) return;

    if (newRaw) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, newRaw);
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }

    if (notify) {
      window.dispatchEvent(new Event("ergochair-auth-change"));
    }
  } catch {
    // Ignore error
  }
}

/**
 * Lấy thông tin phiên đăng nhập người dùng hiện tại (đồng bộ từ MySQL Database)
 */
export async function getCurrentUser(): Promise<User | null> {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const sessionUser = JSON.parse(raw) as User;

    // Refresh dữ liệu mới nhất từ server database
    const res = await fetch(`/api/auth/me?id=${encodeURIComponent(sessionUser.id)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        // Cập nhật session ngầm mà không kích hoạt event để tránh vòng lặp vô tận
        saveSession(data.user, false);
        return data.user;
      }
    }

    return sessionUser;
  } catch {
    return null;
  }
}

/**
 * Đăng nhập hệ thống (Xác thực với MySQL Database)
 */
export async function login(credentials: LoginCredentials): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();

    if (!res.ok || !data.user) {
      return {
        success: false,
        error: data.error || "Email hoặc mật khẩu không chính xác.",
      };
    }

    saveSession(data.user);
    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    return {
      success: false,
      error: "Không thể kết nối đến máy chủ xác thực.",
    };
  }
}

/**
 * Đăng ký tài khoản người dùng mới vào MySQL
 */
export async function register(data: RegisterData): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const resData = await res.json();

    if (!res.ok || !resData.user) {
      return {
        success: false,
        error: resData.error || "Không thể tạo tài khoản.",
      };
    }

    saveSession(resData.user);
    return {
      success: true,
      user: resData.user,
    };
  } catch (error) {
    return {
      success: false,
      error: "Lỗi kết nối khi đăng ký tài khoản.",
    };
  }
}

/**
 * Đăng xuất
 */
export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {}
  saveSession(null);
}

/**
 * Cập nhật hồ sơ cá nhân
 */
export async function updateUserProfile(
  userId: string,
  data: UpdateProfileData
): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...data }),
    });

    if (!res.ok) return null;

    const resData = await res.json();
    if (resData.user) {
      saveSession(resData.user);
      return resData.user;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Đổi mật khẩu cá nhân
 */
export async function changeUserPassword(
  userId: string,
  currentPassword?: string,
  newPassword?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/auth/profile?action=change-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, currentPassword, newPassword }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Đổi mật khẩu thất bại." };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

/**
 * Thêm địa chỉ mới
 */
export async function addUserAddress(
  userId: string,
  address: Omit<Address, "id">
): Promise<Address> {
  const res = await fetch("/api/auth/profile?action=add-address", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, address }),
  });

  if (!res.ok) {
    throw new Error("Không thể thêm địa chỉ.");
  }

  const data = await res.json();
  // Refresh current user session
  await getCurrentUser();
  return data.address;
}

/**
 * Cập nhật địa chỉ
 */
export async function updateUserAddress(
  userId: string,
  addressId: string,
  updates: Partial<Address>
): Promise<Address | null> {
  const res = await fetch("/api/auth/profile?action=update-address", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, addressId, updates }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  await getCurrentUser();
  return data.address;
}

/**
 * Xóa địa chỉ
 */
export async function deleteUserAddress(
  userId: string,
  addressId: string
): Promise<boolean> {
  const res = await fetch("/api/auth/profile?action=delete-address", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, addressId }),
  });

  if (!res.ok) return false;

  await getCurrentUser();
  return true;
}

/**
 * Đặt địa chỉ mặc định
 */
export async function setDefaultAddress(
  userId: string,
  addressId: string
): Promise<boolean> {
  return (await updateUserAddress(userId, addressId, { isDefault: true })) !== null;
}

/**
 * Lấy danh sách người dùng cho Quản trị viên (MySQL Database)
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const res = await fetch("/api/auth/users", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Lỗi getAllUsers service:", error);
    return [];
  }
}

/**
 * Đăng nhập nhanh quyền Admin (dùng tài khoản quản trị thực tế trong MySQL)
 */
export async function loginAsDefaultAdmin(): Promise<User> {
  const loginRes = await login({
    email: "admin@ergochair.vn",
    password: "123456",
  });

  if (loginRes.success && loginRes.user) {
    return loginRes.user;
  }

  throw new Error("Không thể đăng nhập quyền Admin.");
}

export const loginAsAdminMock = loginAsDefaultAdmin;

/**
 * Quản trị viên tạo người dùng
 */
export async function createUserByAdmin(data: {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
}): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch("/api/auth/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const resData = await res.json();
    if (!res.ok) {
      return { success: false, error: resData.error || "Không thể tạo người dùng." };
    }

    return { success: true, user: resData.user };
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

/**
 * Quản trị viên cập nhật người dùng
 */
export async function updateUserByAdmin(
  userId: string,
  data: Partial<User>
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch(`/api/auth/users/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const resData = await res.json();
    if (!res.ok) {
      return { success: false, error: resData.error || "Không thể cập nhật người dùng." };
    }

    return { success: true, user: resData.user };
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

/**
 * Quản trị viên đổi trạng thái khóa/mở khóa
 */
export async function toggleUserStatusByAdmin(
  userId: string
): Promise<{ success: boolean; newStatus?: UserStatus; error?: string }> {
  try {
    const res = await fetch(`/api/auth/users/${encodeURIComponent(userId)}?action=toggle-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });

    const resData = await res.json();
    if (!res.ok) {
      return { success: false, error: resData.error || "Không thể đổi trạng thái." };
    }

    return { success: true, newStatus: resData.newStatus };
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

/**
 * Quản trị viên đặt lại mật khẩu cho người dùng
 */
export async function resetUserPasswordByAdmin(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/auth/users/${encodeURIComponent(userId)}?action=reset-password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });

    const resData = await res.json();
    if (!res.ok) {
      return { success: false, error: resData.error || "Không thể đặt lại mật khẩu." };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

/**
 * Quản trị viên xóa người dùng
 */
export async function deleteUserByAdmin(
  userId: string,
  currentAdminId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = currentAdminId
      ? `/api/auth/users/${encodeURIComponent(userId)}?currentAdminId=${encodeURIComponent(currentAdminId)}`
      : `/api/auth/users/${encodeURIComponent(userId)}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    const resData = await res.json();
    if (!res.ok) {
      return { success: false, error: resData.error || "Không thể xóa người dùng." };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}
