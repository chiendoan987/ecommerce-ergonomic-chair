import { prisma } from "@/lib/prisma";
import { formatOrder } from "./order.repository";
import { formatProduct } from "./product.repository";

export async function getAdminDashboardStats() {
  const [
    allOrders,
    allProducts,
    allUsers,
  ] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "customer" },
    }),
  ]);

  const validOrders = allOrders.filter((o) => o.status !== "cancelled");
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrdersCount = allOrders.filter((o) => o.status === "pending").length;
  const completedOrdersCount = allOrders.filter((o) => o.status === "completed").length;
  const lowStockCount = allProducts.filter((p) => p.stockQuantity <= 5).length;

  return {
    totalRevenue,
    totalOrders: allOrders.length,
    completedOrders: completedOrdersCount,
    pendingOrders: pendingOrdersCount,
    totalCustomers: allUsers.length,
    totalProducts: allProducts.length,
    lowStockCount,
    recentOrders: allOrders.slice(0, 5).map(formatOrder),
    lowStockProducts: allProducts.filter((p) => p.stockQuantity <= 5).map(formatProduct),
  };
}
