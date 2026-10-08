import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Không tìm thấy tệp tin để tải lên." },
        { status: 400 }
      );
    }

    // Giới hạn kích thước: tối đa 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Kích thước tệp quá lớn (tối đa 50MB)." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Đảm bảo thư mục public/uploads tồn tại
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Tạo tên tệp an toàn không dấu
    const ext = path.extname(file.name) || (file.type.startsWith("image/") ? ".jpg" : ".mp4");
    const baseName = path
      .basename(file.name, ext)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40);

    const safeFileName = `${Date.now()}-${baseName || "media"}${ext}`;
    const filePath = path.join(uploadDir, safeFileName);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${safeFileName}`;

    return NextResponse.json({
      url: publicUrl,
      fileName: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error: any) {
    console.error("Lỗi API /api/upload:", error);
    return NextResponse.json(
      { error: "Lỗi lưu tệp lên máy chủ.", details: error.message },
      { status: 500 }
    );
  }
}
