import type { Product } from "./product";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled";

export type PaymentMethod = "cod" | "bank_transfer" | "vnpay" | "momo";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export type ShippingMethod = "standard" | "express" | "assembly";

export interface ShippingMethodOption {
  id: ShippingMethod;
  name: string;
  carrier: string;
  description: string;
  estimatedDays: string;
  baseFee: number;
  freeThreshold?: number;
}

export interface Address {
  id?: string;
  fullName: string;
  phone: string;
  email?: string;
  province: string;
  district: string;
  detail: string;
  note?: string;
  isDefault?: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  variantId?: string;
  variantName?: string;
}

export interface Order {
  id: string;
  userId: string | null;
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  paidAt?: string;
  shippingMethod?: ShippingMethod;
  carrier?: string;
  trackingCode?: string;
  estimatedDelivery?: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  userId?: string | null;
  items: Array<{
    product: Product;
    quantity: number;
    variantId?: string;
  }>;
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  shippingMethod?: ShippingMethod;
  shippingFee?: number;
  couponCode?: string;
}
