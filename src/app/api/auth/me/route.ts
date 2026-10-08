import { NextResponse } from "next/server";
import { findUserByIdFromDb } from "@/lib/server/user.repository";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ user: null });
    }

    const user = await findUserByIdFromDb(id);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
