import { NextResponse } from "next/server";
import { getAdminDashboardStats } from "@/lib/server/stats.repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getAdminDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Lỗi GET /api/admin/dashboard/stats:", error);
    return NextResponse.json(
      { error: "Không thể lấy số liệu thống kê quản trị", details: String(error) },
      { status: 500 }
    );
  }
}
