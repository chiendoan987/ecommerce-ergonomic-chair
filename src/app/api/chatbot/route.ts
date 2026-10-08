import { NextResponse } from "next/server";
import { processChatbotMessage } from "@/lib/server/chatbot.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const isGroqSet = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 5);
  return NextResponse.json({
    status: "ok",
    service: "ErgoChair AI Assistant (ErgoBot)",
    groqConfigured: isGroqSet,
    engine: isGroqSet ? "Groq Cloud LLM (Llama 3.3 70B)" : "Database Semantic Engine",
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { messages = [], query = "", userContext } = body;

    const response = await processChatbotMessage(messages, query, userContext);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Lỗi POST /api/chatbot:", error);
    return NextResponse.json(
      {
        message: "Xin lỗi bạn, ErgoBot đang gặp gián đoạn tạm thời. Vui lòng liên hệ Hotline 1800 6868 hoặc thử lại sau giây lát nhé! 🪑",
        engine: "database_fallback",
        suggestedProducts: [],
      },
      { status: 500 }
    );
  }
}
