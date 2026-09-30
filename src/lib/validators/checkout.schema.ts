import { z } from "zod";

export const addressSchema = z.object({
  fullName: z.string().min(2, "Vui lòng nhập họ và tên."),
  phone: z
    .string()
    .min(9, "Số điện thoại phải từ 9 đến 11 số.")
    .max(12, "Số điện thoại không hợp lệ."),
  email: z.string().email("Email không hợp lệ.").optional().or(z.literal("")),
  province: z.string().min(1, "Vui lòng chọn tỉnh/thành phố."),
  district: z.string().min(1, "Vui lòng nhập quận/huyện."),
  detail: z.string().min(3, "Vui lòng nhập địa chỉ cụ thể."),
  note: z.string().optional(),
});

export const orderItemInputSchema = z.object({
  product: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    image: z.string(),
  }),
  quantity: z.number().int().positive("Số lượng phải lớn hơn 0."),
  variantId: z.string().optional(),
});

export const createOrderSchema = z.object({
  userId: z.string().nullable().optional(),
  items: z.array(orderItemInputSchema).min(1, "Giỏ hàng phải có ít nhất 1 sản phẩm."),
  shippingAddress: addressSchema,
  paymentMethod: z.enum(["cod", "bank_transfer", "vnpay", "momo"]),
  couponCode: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "completed", "cancelled"]),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type CreateOrderInputSchema = z.infer<typeof createOrderSchema>;
