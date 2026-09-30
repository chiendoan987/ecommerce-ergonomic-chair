import { mockUsers } from "../data/mock-users";
import type { Address } from "../types/order";
import type { LoginCredentials, RegisterData, UpdateProfileData, User } from "../types/user";

const USERS_STORAGE_KEY = "ergochair-users";
const SESSION_STORAGE_KEY = "ergochair-auth-session";

function getStoredUsers(): User[] {
  if (typeof window === "undefined") return [...mockUsers];
  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mockUsers));
      return [...mockUsers];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...mockUsers];
  } catch {
    return [...mockUsers];
  }
}

function saveUsers(users: User[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    // Ignore error
  }
}

function saveSession(user: User | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    window.dispatchEvent(new Event("ergochair-auth-change"));
  } catch {
    // Ignore error
  }
}

export async function getCurrentUser(): Promise<User | null> {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const sessionUser = JSON.parse(raw) as User;
    // Always refresh with the latest user object from stored users list
    const users = getStoredUsers();
    const found = users.find((u) => u.id === sessionUser.id);
    return found || sessionUser;
  } catch {
    return null;
  }
}

export async function login(credentials: LoginCredentials): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        saveSession(data.user);
        return { success: true, user: data.user };
      } else if (data.error) {
        return { success: false, error: data.error };
      }
    } catch {
      // fallback to local validation
    }
  }

  const users = getStoredUsers();
  const normalizedEmail = (credentials.email || "").trim().toLowerCase();
  const enteredPassword = credentials.password || "";

  if (!normalizedEmail) {
    return {
      success: false,
      error: "Vui lòng nhập địa chỉ email.",
    };
  }

  const found = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!found) {
    return {
      success: false,
      error: "Email hoặc tài khoản không tồn tại trên hệ thống.",
    };
  }

  if (!enteredPassword.trim()) {
    return {
      success: false,
      error: "Vui lòng nhập mật khẩu.",
    };
  }

  const expectedPassword = found.password || "123456";
  if (enteredPassword !== expectedPassword) {
    return {
      success: false,
      error: "Mật khẩu không chính xác. Vui lòng kiểm tra lại (Mật khẩu tài khoản mẫu là 123456).",
    };
  }

  saveSession(found);
  return {
    success: true,
    user: found,
  };
}

export async function register(data: RegisterData): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (res.ok && resData.user) {
        const users = getStoredUsers();
        saveUsers([resData.user, ...users]);
        saveSession(resData.user);
        return { success: true, user: resData.user };
      } else if (resData.error) {
        return { success: false, error: resData.error };
      }
    } catch {
      // fallback to local registration
    }
  }

  const users = getStoredUsers();
  const normalizedEmail = data.email.trim().toLowerCase();
  const enteredPassword = (data.password || "").trim();

  if (!data.fullName.trim()) {
    return {
      success: false,
      error: "Vui lòng nhập họ và tên.",
    };
  }

  if (!normalizedEmail) {
    return {
      success: false,
      error: "Vui lòng nhập địa chỉ email.",
    };
  }

  if (!data.phone.trim()) {
    return {
      success: false,
      error: "Vui lòng nhập số điện thoại.",
    };
  }

  if (!enteredPassword || enteredPassword.length < 6) {
    return {
      success: false,
      error: "Mật khẩu phải có ít nhất 6 ký tự.",
    };
  }

  const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return {
      success: false,
      error: "Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.",
    };
  }

  const newUser: User = {
    id: `usr-${Date.now()}`,
    fullName: data.fullName.trim(),
    email: normalizedEmail,
    phone: data.phone.trim(),
    role: "customer",
    password: enteredPassword,
    addresses: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedUsers = [newUser, ...users];
  saveUsers(updatedUsers);
  saveSession(newUser);

  return {
    success: true,
    user: newUser,
  };
}

export async function logout(): Promise<void> {
  saveSession(null);
}

export async function updateUserProfile(
  userId: string,
  data: UpdateProfileData
): Promise<User | null> {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const current = users[index];
  const updatedUser: User = {
    ...current,
    fullName: data.fullName?.trim() || current.fullName,
    phone: data.phone?.trim() || current.phone,
    avatar: data.avatar || current.avatar,
    updatedAt: new Date().toISOString(),
  };

  users[index] = updatedUser;
  saveUsers(users);
  saveSession(updatedUser);

  return updatedUser;
}

export async function addUserAddress(
  userId: string,
  address: Omit<Address, "id">
): Promise<Address> {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) throw new Error("User not found");

  const newAddress: Address = {
    ...address,
    id: `addr-${Date.now()}`,
    isDefault: address.isDefault ?? users[index].addresses.length === 0,
  };

  let addresses = [...users[index].addresses];
  if (newAddress.isDefault) {
    addresses = addresses.map((a) => ({ ...a, isDefault: false }));
  }
  addresses.push(newAddress);

  users[index].addresses = addresses;
  users[index].updatedAt = new Date().toISOString();
  saveUsers(users);
  saveSession(users[index]);

  return newAddress;
}

export async function updateUserAddress(
  userId: string,
  addressId: string,
  updates: Partial<Address>
): Promise<Address | null> {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  let addresses = [...users[index].addresses];
  const addrIndex = addresses.findIndex((a) => a.id === addressId);
  if (addrIndex === -1) return null;

  if (updates.isDefault) {
    addresses = addresses.map((a) => ({ ...a, isDefault: false }));
  }

  addresses[addrIndex] = {
    ...addresses[addrIndex],
    ...updates,
  };

  users[index].addresses = addresses;
  users[index].updatedAt = new Date().toISOString();
  saveUsers(users);
  saveSession(users[index]);

  return addresses[addrIndex];
}

export async function deleteUserAddress(
  userId: string,
  addressId: string
): Promise<boolean> {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return false;

  const currentAddresses = users[index].addresses;
  const filtered = currentAddresses.filter((a) => a.id !== addressId);

  // If deleted address was default and other addresses exist, make first one default
  if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
    filtered[0].isDefault = true;
  }

  users[index].addresses = filtered;
  users[index].updatedAt = new Date().toISOString();
  saveUsers(users);
  saveSession(users[index]);

  return true;
}

export async function setDefaultAddress(
  userId: string,
  addressId: string
): Promise<boolean> {
  return (await updateUserAddress(userId, addressId, { isDefault: true })) !== null;
}

export async function getAllUsers(): Promise<User[]> {
  return getStoredUsers();
}

export async function loginAsAdminMock(): Promise<User> {
  const users = getStoredUsers();
  let admin = users.find((u) => u.role === "admin");
  if (!admin) {
    admin = mockUsers.find((u) => u.role === "admin") || {
      id: "usr-admin-01",
      fullName: "Nguyễn Văn Quản Trị",
      email: "admin@ergochair.vn",
      phone: "0901234567",
      role: "admin",
      addresses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveUsers([admin, ...users.filter((u) => u.id !== admin!.id)]);
  }
  saveSession(admin);
  return admin;
}

