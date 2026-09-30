import { NextResponse } from "next/server";
import { getProducts, createProduct } from "@/lib/services/product.service";
import { createProductSchema } from "@/lib/validators/product.schema";
import type { SortOption } from "@/lib/types/product";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const priceRange = searchParams.get("priceRange") || undefined;
    const availability = searchParams.get("availability") || undefined;
    const sort = (searchParams.get("sort") as SortOption) || undefined;
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : undefined;
    const pageSize = searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined;

    const result = await getProducts({
      category,
      search,
      priceRange,
      availability,
      sort,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Không thể lấy danh sách sản phẩm", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = createProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu sản phẩm không hợp lệ",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const newProduct = await createProduct(validation.data);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Không thể tạo sản phẩm mới", details: String(error) },
      { status: 500 }
    );
  }
}
