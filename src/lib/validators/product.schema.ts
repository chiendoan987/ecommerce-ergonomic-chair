import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .min(2, "Tên sản phẩm phải có ít nhất 2 ký tự.")
    .max(200, "Tên sản phẩm quá dài."),
  category: z.string().min(1, "Vui lòng chọn danh mục sản phẩm."),
  price: z.number().positive("Giá bán phải lớn hơn 0đ."),
  oldPrice: z.number().nonnegative().optional(),
  stockQuantity: z.number().int().nonnegative("Số lượng tồn kho không được âm."),
  description: z.string().min(5, "Mô tả sản phẩm phải có ít nhất 5 ký tự."),
  image: z.string().optional(),
  material: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  weight: z.string().optional(),
  capacity: z.string().optional(),
  warranty: z.string().optional(),
  specs: z.record(z.string(), z.string()).optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  inStock: z.boolean().optional(),
  stockStatus: z.enum(["in_stock", "out_of_stock", "pre_order"]).optional(),
});

export type CreateProductSchemaInput = z.infer<typeof createProductSchema>;
export type UpdateProductSchemaInput = z.infer<typeof updateProductSchema>;
