import { mockOrders } from "../data/mock-orders";
import type { Order, CreateOrderInput } from "../types/order";

const ORDERS_STORAGE_KEY = "ergochair-orders";

function getStoredOrders(): Order[] {
  if (typeof window === "undefined") return [...mockOrders];
  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(mockOrders));
      return [...mockOrders];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...mockOrders];
  } catch {
    return [...mockOrders];
  }
}

function saveOrders(orders: Order[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    window.dispatchEvent(new Event("ergochair-orders-change"));
  } catch {
    // Ignore error
  }
}

export async function getOrders(userId?: string | null): Promise<Order[]> {
  if (typeof window !== "undefined") {
    try {
      const url = userId ? `/api/orders?userId=${encodeURIComponent(userId)}` : "/api/orders";
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback to local stored orders
    }
  }

  const allOrders = getStoredOrders();
  if (userId) {
    return allOrders.filter((o) => o.userId === userId);
  }
  return allOrders;
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback to local stored orders
    }
  }

  const allOrders = getStoredOrders();
  const found = allOrders.find((o) => o.id === id);
  return found ? { ...found } : null;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shippingFee = 30000;
  const discount = input.couponCode === "ERGO10" ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount + shippingFee;

  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    userId: input.userId ?? null,
    items: input.items.map((i, index) => ({
      id: `item-${Date.now()}-${index}`,
      productId: i.product.id,
      productName: i.product.name,
      productImage: i.product.image,
      price: i.product.price,
      quantity: i.quantity,
      variantId: i.variantId,
    })),
    shippingAddress: input.shippingAddress,
    paymentMethod: input.paymentMethod,
    status: "pending",
    subtotal,
    discount,
    shippingFee,
    total,
    couponCode: input.couponCode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const currentOrders = getStoredOrders();
  const updatedOrders = [newOrder, ...currentOrders];
  saveOrders(updatedOrders);

  return newOrder;
}

export async function updateOrderStatus(
  orderId: string,
  status: Order["status"]
): Promise<Order | null> {
  const orders = getStoredOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1) return null;

  orders[index].status = status;
  orders[index].updatedAt = new Date().toISOString();
  saveOrders(orders);

  return orders[index];
}
