import type { Address } from "./order";

export type UserRole = "customer" | "admin" | "staff";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string;
  avatar?: string;
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: User | null;
  token: string | null;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
}

export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  avatar?: string;
}

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<{ success: boolean; error?: string }>;
  addAddress: (address: Omit<Address, "id">) => Promise<Address>;
  updateAddress: (addressId: string, address: Partial<Address>) => Promise<Address | null>;
  deleteAddress: (addressId: string) => Promise<boolean>;
  setDefaultAddress: (addressId: string) => Promise<boolean>;
}
