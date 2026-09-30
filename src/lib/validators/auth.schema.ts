import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập địa chỉ email.")
    .email("Địa chỉ email không đúng định dạng."),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu."),
});

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự.")
    .max(100, "Họ và tên không được vượt quá 100 ký tự."),
  email: z
    .string()
    .min(1, "Vui lòng nhập địa chỉ email.")
    .email("Địa chỉ email không đúng định dạng."),
  phone: z
    .string()
    .min(9, "Số điện thoại phải có ít nhất 9 số.")
    .max(12, "Số điện thoại không hợp lệ.")
    .regex(/^[0-9+\-\s]+$/, "Số điện thoại chỉ được chứa chữ số."),
  password: z
    .string()
    .min(6, "Mật khẩu phải có độ dài tối thiểu 6 ký tự."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
