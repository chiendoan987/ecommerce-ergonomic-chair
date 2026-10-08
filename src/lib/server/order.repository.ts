import { prisma } from "@/lib/prisma";
import type { Order, OrderStatus, PaymentMethod, PaymentStatus, CreateOrderInput, ShippingMethod } from "@/lib/types/order";
import { OrderStatus as DbOrderStatus, PaymentMethod as DbPaymentMethod, PaymentStatus as DbPaymentStatus } from "@prisma/client";

/**
 * Chuyển đổi dữ liệu đơn hàng Prisma sang Order entity chuẩn của ứng dụng
 */
export function formatOrder(dbOrder: any): Order {
  return {
    id: dbOrder.id,
    userId: dbOrder.userId ?? null,
    items: (dbOrder.items || []).map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      price: item.price,
      quantity: item.quantity,
      variantId: item.variantId || undefined,
      variantName: item.variantName || undefined,
    })),
    shippingAddress: {
      fullName: dbOrder.recipientName,
      phone: dbOrder.recipientPhone,
      email: dbOrder.recipientEmail || undefined,
      province: dbOrder.province,
      district: dbOrder.district,
      detail: dbOrder.deliveryAddress,
      note: dbOrder.note || undefined,
    },
    paymentMethod: dbOrder.paymentMethod as PaymentMethod,
    paymentStatus: (dbOrder.paymentStatus as PaymentStatus) || "unpaid",
    shippingMethod: (dbOrder.shippingMethod as ShippingMethod) || "standard",
    carrier: dbOrder.carrier || undefined,
    trackingCode: dbOrder.trackingCode || undefined,
    estimatedDelivery: dbOrder.estimatedDelivery instanceof Date
      ? dbOrder.estimatedDelivery.toISOString()
      : dbOrder.estimatedDelivery ? String(dbOrder.estimatedDelivery) : undefined,
    status: dbOrder.status as OrderStatus,
    subtotal: dbOrder.subtotal,
    discount: dbOrder.discount,
    shippingFee: dbOrder.shippingFee,
    total: dbOrder.total,
    couponCode: dbOrder.couponCode || undefined,
    createdAt: dbOrder.createdAt instanceof Date ? dbOrder.createdAt.toISOString() : String(dbOrder.createdAt),
    updatedAt: dbOrder.updatedAt instanceof Date ? dbOrder.updatedAt.toISOString() : String(dbOrder.updatedAt),
  };
}

/**
 * Lấy danh sách đơn hàng từ database (có lọc theo user, trạng thái, tìm kiếm)
 */
export async function getOrdersFromDb(filters?: {
  userId?: string | null;
  status?: string;
  search?: string;
}): Promise<Order[]> {
  const where: any = {};

  if (filters?.userId) {
    where.userId = filters.userId;
  }

  if (filters?.status && filters.status !== "all") {
    where.status = filters.status as DbOrderStatus;
  }

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { id: { contains: q } },
      { recipientName: { contains: q } },
      { recipientPhone: { contains: q } },
      { recipientEmail: { contains: q } },
    ];
  }

  const dbOrders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
    },
  });

  return dbOrders.map(formatOrder);
}

/**
 * Lấy thông tin chi tiết một đơn hàng theo ID
 */
export async function getOrderByIdFromDb(id: string): Promise<Order | null> {
  const dbOrder = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return dbOrder ? formatOrder(dbOrder) : null;
}

/**
 * Mô phỏng phân bổ vận chuyển thông minh theo phương thức và khu vực địa lý
 */
export function generateShippingDetails(
  subtotal: number,
  shippingMethod: ShippingMethod = "standard",
  province: string = "Hà Nội"
): {
  carrier: string;
  trackingCode: string;
  shippingFee: number;
  estimatedDelivery: Date;
} {
  const isMajorCity = /hà nội|hồ chí minh|tp\. hcm|tphcm|đà nẵng/i.test(province);
  const now = new Date();

  if (shippingMethod === "express") {
    const carrier = isMajorCity ? "Ahamove Express" : "GHTK Fast Express";
    const trackingCode = `AHM-${Math.floor(100000 + Math.random() * 900000)}`;
    const shippingFee = 60000;
    const estimatedDelivery = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return { carrier, trackingCode, shippingFee, estimatedDelivery };
  }

  if (shippingMethod === "assembly") {
    const carrier = "Đội ngũ Kỹ thuật ErgoCare Logistics";
    const trackingCode = `ERGO-CARE-${Math.floor(1000 + Math.random() * 9000)}`;
    const shippingFee = subtotal >= 5000000 ? 50000 : 120000;
    const estimatedDelivery = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    return { carrier, trackingCode, shippingFee, estimatedDelivery };
  }

  // Mặc định: standard (Giao tiêu chuẩn)
  const carrier = isMajorCity ? "Giao Hàng Tiết Kiệm (GHTK)" : "Viettel Post (VTP)";
  const prefix = isMajorCity ? "GHTK-HN" : "VTP-";
  const trackingCode = `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;
  const shippingFee = subtotal >= 2000000 ? 0 : (isMajorCity ? 30000 : 45000);
  const estimatedDelivery = new Date(now.getTime() + (isMajorCity ? 3 : 4) * 24 * 60 * 60 * 1000);
  return { carrier, trackingCode, shippingFee, estimatedDelivery };
}

/**
 * Tạo đơn hàng mới trong MySQL sử dụng Prisma Transaction
 */
export async function createOrderInDb(input: CreateOrderInput): Promise<Order> {
  return await prisma.$transaction(async (tx) => {
    // 1. Tính toán giá trị đơn hàng
    let subtotal = 0;
    const itemsData: Array<{
      productId: string;
      productName: string;
      productImage: string;
      price: number;
      quantity: number;
      variantId?: string | null;
    }> = [];

    for (const item of input.items) {
      const targetId = item.product?.id || (item as any).productId;
      if (!targetId) {
        throw new Error("Không xác định được mã sản phẩm trong đơn hàng.");
      }

      // Tìm sản phẩm trong DB để lấy giá thực và kiểm tra tồn kho
      const product = await tx.product.findFirst({
        where: {
          OR: [{ id: targetId }, { slug: targetId }],
        },
      });

      if (!product) {
        throw new Error(`Sản phẩm với mã "${targetId}" không tồn tại.`);
      }

      const itemPrice = product.price;
      const quantity = Math.max(1, item.quantity);
      subtotal += itemPrice * quantity;

      itemsData.push({
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        price: itemPrice,
        quantity,
        variantId: item.variantId || null,
      });

      // Trừ số lượng tồn kho của sản phẩm
      const newStock = Math.max(0, product.stockQuantity - quantity);
      await tx.product.update({
        where: { id: product.id },
        data: {
          stockQuantity: newStock,
          inStock: newStock > 0,
          stockStatus: newStock > 0 ? product.stockStatus : "out_of_stock",
        },
      });
    }

    // 2. Tính mã giảm giá nếu có
    let discount = 0;
    let validCouponCode: string | null = null;
    if (input.couponCode) {
      const upperCode = input.couponCode.trim().toUpperCase();
      const coupon = await tx.coupon.findUnique({
        where: { code: upperCode },
      });

      if (coupon && coupon.isActive) {
        if (!coupon.minOrderValue || subtotal >= coupon.minOrderValue) {
          if (coupon.discountPercent) {
            discount = Math.round((subtotal * coupon.discountPercent) / 100);
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
              discount = coupon.maxDiscount;
            }
          } else if (coupon.discountAmount) {
            discount = coupon.discountAmount;
          }
          validCouponCode = coupon.code;

          // Cập nhật số lần sử dụng coupon
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }
    }

    // 3. Phí vận chuyển & Mô phỏng Logistics
    const method = input.shippingMethod || "standard";
    const shippingInfo = generateShippingDetails(subtotal, method, input.shippingAddress.province);
    const shippingFee = typeof input.shippingFee === "number" ? input.shippingFee : shippingInfo.shippingFee;
    const total = Math.max(0, subtotal - discount + shippingFee);

    const orderId = `ord-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // 4. Tạo Order
    const dbOrder = await tx.order.create({
      data: {
        id: orderId,
        userId: input.userId || null,
        status: DbOrderStatus.pending,
        paymentMethod: (input.paymentMethod as DbPaymentMethod) || DbPaymentMethod.cod,
        paymentStatus: DbPaymentStatus.unpaid,
        shippingMethod: method,
        carrier: shippingInfo.carrier,
        trackingCode: shippingInfo.trackingCode,
        estimatedDelivery: shippingInfo.estimatedDelivery,
        subtotal,
        discount,
        shippingFee,
        total,
        couponCode: validCouponCode,
        recipientName: input.shippingAddress.fullName.trim(),
        recipientPhone: input.shippingAddress.phone.trim(),
        recipientEmail: input.shippingAddress.email?.trim() || null,
        deliveryAddress: input.shippingAddress.detail.trim(),
        province: input.shippingAddress.province.trim(),
        district: input.shippingAddress.district.trim(),
        note: input.shippingAddress.note?.trim() || null,
        items: {
          create: itemsData.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            price: item.price,
            quantity: item.quantity,
            variantId: item.variantId,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return formatOrder(dbOrder);
  });
}

/**
 * Cập nhật trạng thái đơn hàng (và hoàn lại tồn kho nếu hủy đơn)
 */
export async function updateOrderStatusInDb(
  orderId: string,
  newStatus: OrderStatus,
  cancelReason?: string
): Promise<Order | null> {
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!existingOrder) return null;

  return await prisma.$transaction(async (tx) => {
    // Nếu đơn hàng chuyển sang trạng thái đã hủy (cancelled) và trước đó chưa hủy -> hoàn lại kho hàng
    if (newStatus === "cancelled" && existingOrder.status !== "cancelled") {
      for (const item of existingOrder.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
            inStock: true,
            stockStatus: "in_stock",
          },
        });
      }
    }

    // Nếu đơn hàng từ cancelled được mở lại (pending/processing) -> trừ kho lại
    if (existingOrder.status === "cancelled" && newStatus !== "cancelled") {
      for (const item of existingOrder.items) {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (prod) {
          const newQty = Math.max(0, prod.stockQuantity - item.quantity);
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: newQty,
              inStock: newQty > 0,
              stockStatus: newQty > 0 ? "in_stock" : "out_of_stock",
            },
          });
        }
      }
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: newStatus as DbOrderStatus,
        cancelReason: newStatus === "cancelled" ? (cancelReason || existingOrder.cancelReason) : null,
        paymentStatus: newStatus === "completed" ? DbPaymentStatus.paid : existingOrder.paymentStatus,
      },
      include: {
        items: true,
      },
    });

    return formatOrder(updated);
  });
}

/**
 * Tra cứu đơn hàng theo mã đơn (ID), mã vận đơn (trackingCode) hoặc số điện thoại
 */
export async function trackOrderFromDb(query: string): Promise<Order | null> {
  const clean = query.trim();
  if (!clean) return null;

  const dbOrder = await prisma.order.findFirst({
    where: {
      OR: [
        { id: clean },
        { trackingCode: clean },
        { recipientPhone: clean },
      ],
    },
    include: {
      items: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return dbOrder ? formatOrder(dbOrder) : null;
}

/**
 * Cập nhật trạng thái thanh toán của đơn hàng (Mô phỏng Sandbox Payment)
 */
export async function updateOrderPaymentStatusInDb(
  orderId: string,
  paymentStatus: "paid" | "unpaid" | "refunded",
  paymentMethod?: PaymentMethod
): Promise<Order | null> {
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!existingOrder) return null;

  // Khi thanh toán thành công (paid) và đơn đang ở trạng thái pending -> tự động chuyển sang processing (đang đóng gói)
  const nextStatus =
    paymentStatus === "paid" && existingOrder.status === "pending"
      ? DbOrderStatus.processing
      : existingOrder.status;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: paymentStatus as DbPaymentStatus,
      status: nextStatus,
      ...(paymentMethod ? { paymentMethod: paymentMethod as DbPaymentMethod } : {}),
    },
    include: {
      items: true,
    },
  });

  return formatOrder(updated);
}
