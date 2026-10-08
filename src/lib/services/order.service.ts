import type { Order, CreateOrderInput, OrderStatus } from "../types/order";

/**
 * Lấy danh sách đơn hàng từ Backend API (MySQL)
 */
export async function getOrders(userId?: string | null): Promise<Order[]> {
  try {
    const url = userId
      ? `/api/orders?userId=${encodeURIComponent(userId)}`
      : "/api/orders";

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Lỗi tải danh sách đơn hàng: HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Lỗi getOrders service:", error);
    return [];
  }
}

/**
 * Lấy thông tin chi tiết đơn hàng theo ID
 */
export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error(`Lỗi getOrderById service (${id}):`, error);
    return null;
  }
}

/**
 * Đặt hàng mới (Lưu trực tiếp vào MySQL Database và cập nhật kho hàng)
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Không thể tạo đơn hàng.");
  }

  const createdOrder = await res.json();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ergochair-orders-change"));
    window.dispatchEvent(new Event("ergochair-products-change"));
  }

  return createdOrder;
}

/**
 * Cập nhật trạng thái đơn hàng (Đồng bộ MySQL và kho hàng)
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  cancelReason?: string
): Promise<Order | null> {
  const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, cancelReason }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Không thể cập nhật trạng thái đơn hàng.");
  }

  const updatedOrder = await res.json();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ergochair-orders-change"));
    window.dispatchEvent(new Event("ergochair-products-change"));
  }

  return updatedOrder;
}

/**
 * Tra cứu công khai hành trình đơn hàng bằng mã đơn, mã vận đơn hoặc SĐT
 */
export async function trackOrder(query: string): Promise<Order | null> {
  try {
    const res = await fetch(`/api/orders/track?q=${encodeURIComponent(query.trim())}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Không tìm thấy thông tin đơn hàng.");
    }

    return await res.json();
  } catch (error) {
    console.error("Lỗi trackOrder service:", error);
    throw error;
  }
}

/**
 * Cập nhật trạng thái thanh toán (Giả lập thanh toán Sandbox)
 */
export async function updateOrderPayment(
  orderId: string,
  paymentStatus: "paid" | "unpaid" | "refunded",
  paymentMethod?: string
): Promise<Order> {
  const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentStatus, paymentMethod }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Không thể cập nhật thanh toán đơn hàng.");
  }

  const updated = await res.json();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ergochair-orders-change"));
  }

  return updated;
}
