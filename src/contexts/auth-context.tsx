"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Address } from "@/lib/types/order";
import type {
  AuthContextValue,
  LoginCredentials,
  RegisterData,
  UpdateProfileData,
  User,
} from "@/lib/types/user";
import {
  addUserAddress as serviceAddAddress,
  deleteUserAddress as serviceDeleteAddress,
  getCurrentUser,
  login as serviceLogin,
  logout as serviceLogout,
  register as serviceRegister,
  setDefaultAddress as serviceSetDefaultAddress,
  updateUserAddress as serviceUpdateAddress,
  updateUserProfile as serviceUpdateProfile,
} from "@/lib/services/auth.service";
import { useToast } from "@/hooks/use-toast";

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    let isMounted = true;

    const loadSession = () => {
      getCurrentUser().then((currentUser) => {
        if (!isMounted) return;
        setUser(currentUser);
        setIsLoading(false);
      }).catch(() => {
        if (isMounted) setIsLoading(false);
      });
    };

    const timer = window.setTimeout(() => {
      loadSession();
    }, 0);

    const handleAuthChange = () => {
      loadSession();
    };

    window.addEventListener("ergochair-auth-change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
      window.removeEventListener("ergochair-auth-change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const res = await serviceLogin(credentials);
      if (res.success && res.user) {
        setUser(res.user);
        toast.success(`Chào mừng trở lại, ${res.user.fullName}!`);
        return { success: true };
      }
      return { success: false, error: res.error || "Đăng nhập thất bại" };
    },
    [toast]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      const res = await serviceRegister(data);
      if (res.success && res.user) {
        setUser(res.user);
        toast.success(`Đăng ký tài khoản thành công! Chào mừng bạn.`);
        return { success: true };
      }
      return { success: false, error: res.error || "Đăng ký thất bại" };
    },
    [toast]
  );

  const logout = useCallback(async () => {
    await serviceLogout();
    setUser(null);
    toast.info("Bạn đã đăng xuất tài khoản.");
  }, [toast]);

  const updateProfile = useCallback(
    async (data: UpdateProfileData) => {
      if (!user) return { success: false, error: "Chưa đăng nhập" };
      const updated = await serviceUpdateProfile(user.id, data);
      if (updated) {
        setUser(updated);
        toast.success("Cập nhật thông tin cá nhân thành công.");
        return { success: true };
      }
      return { success: false, error: "Cập nhật thất bại" };
    },
    [user, toast]
  );

  const addAddress = useCallback(
    async (address: Omit<Address, "id">) => {
      if (!user) throw new Error("Chưa đăng nhập");
      const created = await serviceAddAddress(user.id, address);
      const updatedUser = await getCurrentUser();
      setUser(updatedUser);
      toast.success("Thêm địa chỉ giao hàng thành công.");
      return created;
    },
    [user, toast]
  );

  const updateAddress = useCallback(
    async (addressId: string, updates: Partial<Address>) => {
      if (!user) return null;
      const updated = await serviceUpdateAddress(user.id, addressId, updates);
      const updatedUser = await getCurrentUser();
      setUser(updatedUser);
      toast.success("Cập nhật địa chỉ thành công.");
      return updated;
    },
    [user, toast]
  );

  const deleteAddress = useCallback(
    async (addressId: string) => {
      if (!user) return false;
      const ok = await serviceDeleteAddress(user.id, addressId);
      if (ok) {
        const updatedUser = await getCurrentUser();
        setUser(updatedUser);
        toast.info("Đã xóa địa chỉ.");
      }
      return ok;
    },
    [user, toast]
  );

  const setDefaultAddress = useCallback(
    async (addressId: string) => {
      if (!user) return false;
      const ok = await serviceSetDefaultAddress(user.id, addressId);
      if (ok) {
        const updatedUser = await getCurrentUser();
        setUser(updatedUser);
        toast.success("Đã đặt làm địa chỉ mặc định.");
      }
      return ok;
    },
    [user, toast]
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateProfile,
      addAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,
    }),
    [
      user,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      addAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
