import { prisma } from "@/lib/prisma";
import type {
  ChatMessage,
  ChatbotProductSuggestion,
  ChatbotResponse,
  ChatUserContext,
} from "@/lib/types/chatbot";

const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";
const FALLBACK_GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
  "llama-3.3-70b-versatile",
];

// =========================================================================
// KIỂU DỮ LIỆU ĐẶC TẢ CHO LUỒNG: TRÍCH XUẤT THỰC THỂ -> TRUY VẤN BẢNG -> TỔNG HỢP
// =========================================================================
export type ChatIntent =
  | "TRACK_ORDER"        // Tra cứu tiến độ / trạng thái đơn hàng & vận chuyển
  | "SEARCH_PRODUCT"      // Tìm kiếm ghế theo vóc dáng, giá tiền, chất liệu
  | "PRODUCT_DETAIL"      // Hỏi chi tiết một mẫu ghế cụ thể
  | "WARRANTY_POLICY"     // Hỏi về chính sách bảo hành, đổi trả
  | "SHIPPING_POLICY"     // Hỏi về phí vận chuyển, hỏa tốc, lắp đặt
  | "DISCOUNT_INQUIRY"    // Hỏi về mã giảm giá, coupon, voucher, khuyến mãi
  | "PRODUCT_REVIEW"      // Hỏi về đánh giá, review sản phẩm
  | "GENERAL_QA";         // Chào hỏi, câu hỏi thông thường

export type TargetDatabaseTable = "Order" | "Product" | "Category" | "Review";

export interface ExtractedEntities {
  orderCode?: string | null;
  phoneNumber?: string | null;
  productName?: string | null;
  budgetRange?: { min: number | null; max: number | null } | null;
  heightCm?: number | null;
  weightKg?: number | null;
  material?: string | null;
}

export interface ExtractedQueryPlan {
  intent: ChatIntent;
  targetTables: TargetDatabaseTable[];
  entities: ExtractedEntities;
}

export interface RetrievedDatabaseContext {
  orders?: any[];
  singleOrder?: any | null;
  multipleOrders?: any[];
  isMultiOrderDisambiguation?: boolean;
  products?: any[];
  categories?: any[];
  reviews?: any[];
  discountSystemStatus: { hasCoupons: boolean; reason: string };
  shippingPolicy: { freeShippingMin: number; standardFee: string; expressFee: string };
  warrantyPolicy: { minYears: number; maxYears: number; replacementDays: number };
}

// =========================================================================
// GIAI ĐOẠN 1: TRÍCH XUẤT THỰC THỂ (ENTITY EXTRACTION) & CHỌN BẢNG LIÊN QUAN
// =========================================================================

/**
 * 1.1 Trích xuất dự phòng cục bộ (Deterministic Regex & Heuristic Parser)
 * Đảm bảo 100% không bao giờ lỗi kể cả khi không có mạng hoặc Groq timeout
 */
function extractEntitiesDeterministically(query: string): ExtractedQueryPlan {
  const q = query.trim();
  const lowerQ = q.toLowerCase();

  const entities: ExtractedEntities = {
    orderCode: null,
    phoneNumber: null,
    productName: null,
    budgetRange: null,
    heightCm: null,
    weightKg: null,
    material: null,
  };

  // 1. Trích xuất mã đơn hàng
  const orderIdMatch =
    q.match(/ord-[a-zA-Z0-9-]+/i) ||
    q.match(/\b\d{6}-\d{3}\b/i) ||
    q.match(/(AHM|GHTK|VTP|ERGO-CARE)-[a-zA-Z0-9-]+/i);
  if (orderIdMatch) {
    entities.orderCode = orderIdMatch[0].trim();
  }

  // 2. Trích xuất số điện thoại
  const phoneMatch = q.match(/(?:0|\+84)[3|5|7|8|9][0-9]{8}\b/);
  if (phoneMatch) {
    entities.phoneNumber = phoneMatch[0].replace(/\+84/, "0");
  }

  // 3. Trích xuất chiều cao
  const heightMatch = lowerQ.match(/(\d{1,2})m(\d{1,2})/i) || lowerQ.match(/(\d{3})\s*cm/i);
  if (heightMatch) {
    if (heightMatch[1] && heightMatch[2]) {
      entities.heightCm = parseInt(heightMatch[1], 10) * 100 + parseInt(heightMatch[2], 10);
    } else if (heightMatch[1]) {
      entities.heightCm = parseInt(heightMatch[1], 10);
    }
  }

  // 4. Trích xuất cân nặng
  const weightMatch = lowerQ.match(/(\d{2,3})\s*kg/i);
  if (weightMatch) {
    entities.weightKg = parseInt(weightMatch[1], 10);
  }

  // 5. Trích xuất ngân sách
  const budgetMatch = lowerQ.match(/(\d+)\s*(triệu|tr)/i);
  if (budgetMatch) {
    const val = parseInt(budgetMatch[1], 10) * 1000000;
    entities.budgetRange = { min: val * 0.7, max: val * 1.3 };
  }

  // 6. Trích xuất tên sản phẩm
  const knownSlugs = [
    { name: "Aero Support", match: ["aero support", "aero", "aero-support"] },
    { name: "Cloud Mesh Air", match: ["cloud mesh air", "cloud mesh", "mesh air"] },
    { name: "Focus Task", match: ["focus task", "focus-task", "focus"] },
    { name: "Motion Lite", match: ["motion lite", "motion-lite", "motion"] },
    { name: "Lounge Heritage", match: ["lounge heritage", "lounge", "heritage"] },
    { name: "Executive Oak", match: ["executive oak", "executive", "oak"] },
    { name: "Play Seat Pro", match: ["play seat", "play seat pro", "gaming"] },
    { name: "TG 01", match: ["tg 01", "tg-01"] },
  ];
  for (const item of knownSlugs) {
    if (item.match.some((m) => lowerQ.includes(m))) {
      entities.productName = item.name;
      break;
    }
  }

  // 7. Trích xuất chất liệu
  if (lowerQ.includes("lưới") || lowerQ.includes("mesh")) entities.material = "Lưới";
  else if (lowerQ.includes("da") || lowerQ.includes("leather")) entities.material = "Da";
  else if (lowerQ.includes("nilon") || lowerQ.includes("nylon") || lowerQ.includes("vải")) entities.material = "Vải & Nylon";

  // 8. Phân loại ý định (Intent) và chọn bảng tương ứng
  const isOrderQuery =
    Boolean(entities.orderCode) ||
    Boolean(entities.phoneNumber) ||
    /(đơn hàng|don hang|giao đến đâu|giao toi dau|giao chưa|giao chua|đang ở đâu|dang o dau|kiểm tra đơn|kiem tra don|tra cứu đơn|tra cuu don|vận đơn|van don|hành trình|hanh trinh|tiến độ giao|tien do giao|đơn của tôi|don cua toi|đơn vừa đặt|don vua dat)/i.test(
      lowerQ
    );

  const isDiscountQuery =
    /(mã giảm giá|ma giam gia|voucher|coupon|khuyến mãi|khuyen mai|code giảm|code giam|giảm giá thêm|nhập mã)/i.test(
      lowerQ
    );

  const isWarrantyQuery = /(bảo hành|bao hanh|warranty|đổi trả|doi tra|hỏng|bể|gãy|sửa)/i.test(lowerQ);

  const isShippingQuery = /(phí vận chuyển|phi van chuyen|phí ship|phi ship|giao hàng như thế nào|lắp đặt|thanh toán)/i.test(
    lowerQ
  );

  const isReviewQuery = /(đánh giá|danh gia|review|nhận xét|khách mua nói gì)/i.test(lowerQ);

  let intent: ChatIntent = "GENERAL_QA";
  const targetTables: TargetDatabaseTable[] = [];

  if (isOrderQuery) {
    intent = "TRACK_ORDER";
    targetTables.push("Order");
  } else if (isDiscountQuery) {
    intent = "DISCOUNT_INQUIRY";
    // Không có bảng coupon hợp lệ nào trên frontend
  } else if (isWarrantyQuery) {
    intent = "WARRANTY_POLICY";
    targetTables.push("Product");
  } else if (isShippingQuery) {
    intent = "SHIPPING_POLICY";
  } else if (isReviewQuery) {
    intent = "PRODUCT_REVIEW";
    targetTables.push("Review", "Product");
  } else if (entities.productName || entities.heightCm || entities.budgetRange || entities.material) {
    intent = "SEARCH_PRODUCT";
    targetTables.push("Product", "Category");
  } else {
    intent = "GENERAL_QA";
    targetTables.push("Product");
  }

  return { intent, targetTables, entities };
}

/**
 * 1.2 Trích xuất thực thể bằng Groq LLM (Structured JSON Extraction)
 * Model phân tích ngữ nghĩa câu hỏi và trả về đúng schema JSON
 */
async function extractEntitiesWithLLM(
  query: string,
  apiKey: string,
  modelName: string
): Promise<ExtractedQueryPlan | null> {
  const extractionPrompt = `Bạn là hệ thống trích xuất thực thể (Entity Extractor) và phân loại ý định cho website ErgoChair.
Phân tích câu hỏi của người dùng và trả về DUY NHẤT một JSON hợp lệ (không kèm markdown) theo cấu trúc:
{
  "intent": "TRACK_ORDER" | "SEARCH_PRODUCT" | "PRODUCT_DETAIL" | "WARRANTY_POLICY" | "SHIPPING_POLICY" | "DISCOUNT_INQUIRY" | "PRODUCT_REVIEW" | "GENERAL_QA",
  "targetTables": ("Order" | "Product" | "Category" | "Review")[],
  "entities": {
    "orderCode": string | null,
    "phoneNumber": string | null,
    "productName": string | null,
    "budgetRange": { "min": number | null, "max": number | null } | null,
    "heightCm": number | null,
    "weightKg": number | null,
    "material": string | null
  }
}
Lưu ý quy tắc:
- Nếu hỏi về "đơn hàng", "giao đến đâu", "kiểm tra đơn": intent là "TRACK_ORDER", targetTables gồm ["Order"].
- Nếu hỏi về "mã giảm giá", "voucher", "coupon": intent là "DISCOUNT_INQUIRY", targetTables là [].
- Nếu hỏi chọn ghế, vóc dáng, chiều cao, ngân sách: intent là "SEARCH_PRODUCT", targetTables gồm ["Product"].
- Nếu hỏi bảo hành ghế: intent là "WARRANTY_POLICY", targetTables gồm ["Product"].`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: extractionPrompt },
          { role: "user", content: query },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as ExtractedQueryPlan;
    if (parsed.intent && Array.isArray(parsed.targetTables) && parsed.entities) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Trích xuất thực thể kết hợp (Hybrid Extractor: LLM + Deterministic Fallback)
 */
export async function extractQueryPlan(
  query: string,
  apiKey?: string,
  modelName?: string
): Promise<ExtractedQueryPlan> {
  if (apiKey && apiKey.trim().length > 5) {
    const llmPlan = await extractEntitiesWithLLM(
      query,
      apiKey,
      modelName || DEFAULT_GROQ_MODEL
    );
    if (llmPlan) {
      // Bổ sung thêm các thực thể mà regex bắt được chính xác (ví dụ orderCode dạng số)
      const fallback = extractEntitiesDeterministically(query);
      if (!llmPlan.entities.orderCode && fallback.entities.orderCode) {
        llmPlan.entities.orderCode = fallback.entities.orderCode;
      }
      if (fallback.entities.orderCode || fallback.intent === "TRACK_ORDER") {
        llmPlan.intent = "TRACK_ORDER";
        if (!llmPlan.targetTables.includes("Order")) {
          llmPlan.targetTables.push("Order");
        }
      }
      if (!llmPlan.entities.phoneNumber && fallback.entities.phoneNumber) {
        llmPlan.entities.phoneNumber = fallback.entities.phoneNumber;
      }
      return llmPlan;
    }
  }

  return extractEntitiesDeterministically(query);
}

// =========================================================================
// GIAI ĐOẠN 2: TRUY VẤN CÁC BẢNG DATABASE LIÊN QUAN NHẤT (TARGETED PRISMA RETRIEVAL)
// =========================================================================

export async function queryTargetDatabaseTables(
  plan: ExtractedQueryPlan,
  userContext?: ChatUserContext
): Promise<RetrievedDatabaseContext> {
  const result: RetrievedDatabaseContext = {
    discountSystemStatus: {
      hasCoupons: false,
      reason:
        "Hệ thống website hiện tại không áp dụng mã giảm giá / coupon / voucher tại bước giỏ hàng và thanh toán. Tất cả sản phẩm đã niêm yết giá ưu đãi trực tiếp tốt nhất và Miễn phí vận chuyển toàn quốc cho đơn từ 2.000.000đ.",
    },
    shippingPolicy: {
      freeShippingMin: 2000000,
      standardFee: "Miễn phí đơn từ 2tr (dưới 2tr: 30.000đ - 45.000đ)",
      expressFee: "Hỏa tốc 2H (60.000đ)",
    },
    warrantyPolicy: {
      minYears: 3,
      maxYears: 7,
      replacementDays: 30,
    },
  };

  // 1. TRUY VẤN BẢNG ORDER KHI TARGET CÓ "Order"
  if (plan.targetTables.includes("Order")) {
    // Trường hợp A: Khách hàng chỉ định đích danh mã đơn hàng (Ví dụ: ord-169181-212)
    if (plan.entities.orderCode) {
      const code = plan.entities.orderCode.replace(/^#/, "").trim();
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { id: code },
            { id: { contains: code } },
            { trackingCode: code },
            { trackingCode: { contains: code } },
          ],
        },
        include: { items: true },
      });
      result.singleOrder = order;
      result.isMultiOrderDisambiguation = false;
    } else {
      // Trường hợp B: Khách hỏi chung chung ("đơn hàng đã đến đâu rồi", "đơn của tôi")
      // Thu thập các điều kiện để tìm toàn bộ đơn hàng liên quan đến khách
      const orConditions: any[] = [];
      if (plan.entities.phoneNumber) {
        orConditions.push({ recipientPhone: { contains: plan.entities.phoneNumber } });
      }
      if (userContext?.userId) {
        orConditions.push({ userId: userContext.userId });
      }
      if (userContext?.phone) {
        const cleanPhone = userContext.phone.replace(/\+84/, "0");
        orConditions.push({ recipientPhone: { contains: cleanPhone } });
      }

      let candidateOrders: any[] = [];
      if (orConditions.length > 0) {
        candidateOrders = await prisma.order.findMany({
          where: { OR: orConditions },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { items: true },
        });
      } else if (userContext?.lastOrderId) {
        const order = await prisma.order.findFirst({
          where: { id: userContext.lastOrderId },
          include: { items: true },
        });
        if (order) candidateOrders = [order];
      }

      // NẾU TÌM THẤY TỪ 2 ĐƠN HÀNG TRỞ LÊN:
      // Kích hoạt hỏi lại khách hàng xem khách muốn kiểm tra đơn nào!
      if (candidateOrders.length > 1) {
        result.multipleOrders = candidateOrders;
        result.isMultiOrderDisambiguation = true;
      } else if (candidateOrders.length === 1) {
        result.singleOrder = candidateOrders[0];
        result.isMultiOrderDisambiguation = false;
      } else {
        result.singleOrder = null;
        result.isMultiOrderDisambiguation = false;
      }
    }
  }

  // 2. TRUY VẤN BẢNG PRODUCT KHI TARGET CÓ "Product"
  if (plan.targetTables.includes("Product")) {
    const whereConditions: any = { isActive: true };

    // Lọc theo tên sản phẩm nếu có
    if (plan.entities.productName) {
      whereConditions.OR = [
        { name: { contains: plan.entities.productName } },
        { slug: { contains: plan.entities.productName.toLowerCase().replace(/\s+/g, "-") } },
      ];
    }

    // Lọc theo ngân sách nếu có
    if (plan.entities.budgetRange?.min && plan.entities.budgetRange?.max) {
      whereConditions.price = {
        gte: plan.entities.budgetRange.min,
        lte: plan.entities.budgetRange.max,
      };
    }

    let products = await prisma.product.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        price: true,
        oldPrice: true,
        stockStatus: true,
        stockQuantity: true,
        material: true,
        warranty: true,
        capacity: true,
        rating: true,
        reviewCount: true,
        description: true,
        image: true,
      },
      orderBy: { price: "asc" },
      take: 6,
    });

    // Nếu lọc chính xác không ra sản phẩm (do ngân sách hoặc tên lệch), lấy các sản phẩm công thái học tiêu chuẩn
    if (products.length === 0) {
      products = await prisma.product.findMany({
        where: {
          isActive: true,
          price: { gte: 4000000 },
          slug: { notIn: ["kjkj", "test"] },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          price: true,
          oldPrice: true,
          stockStatus: true,
          stockQuantity: true,
          material: true,
          warranty: true,
          capacity: true,
          rating: true,
          reviewCount: true,
          description: true,
          image: true,
        },
        orderBy: { price: "asc" },
        take: 6,
      });
    }

    result.products = products;
  }

  // 3. TRUY VẤN BẢNG REVIEW KHI TARGET CÓ "Review"
  if (plan.targetTables.includes("Review")) {
    result.reviews = await prisma.review.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      select: {
        authorName: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    });
  }

  // 4. TRUY VẤN BẢNG CATEGORY KHI TARGET CÓ "Category"
  if (plan.targetTables.includes("Category")) {
    result.categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { name: true, slug: true },
    });
  }

  return result;
}

// =========================================================================
// GIAI ĐOẠN 3: TỔNG HỢP CÂU TRẢ LỜI DỰA TRÊN DỮ LIỆU ĐÃ TRÍCH XUẤT (GROUNDED SYNTHESIS)
// =========================================================================

/**
 * Xây dựng prompt có cấu trúc dựa CHÍNH XÁC vào dữ liệu vừa trích xuất từ database
 */
function buildTargetedSystemPrompt(
  plan: ExtractedQueryPlan,
  dbData: RetrievedDatabaseContext
): string {
  let contextSection = "";

  // 1. Dữ liệu từ bảng Order
  if (plan.targetTables.includes("Order")) {
    if (dbData.isMultiOrderDisambiguation && dbData.multipleOrders && dbData.multipleOrders.length > 1) {
      const statusMap: Record<string, string> = {
        pending: "Chờ xác nhận đơn hàng",
        processing: "Đang đóng gói và kiểm định tại kho",
        shipped: "Đang được đơn vị vận chuyển giao tới bạn",
        completed: "Đã giao hàng thành công",
        cancelled: "Đã hủy đơn hàng",
      };

      const ordersListStr = dbData.multipleOrders
        .map((o, idx) => {
          const itemsStr = o.items.map((i: any) => `${i.productName} (SL: ${i.quantity})`).join(", ");
          const dateStr = new Date(o.createdAt).toLocaleDateString("vi-VN");
          const st = statusMap[o.status] || o.status;
          return `${idx + 1}. Mã đơn: **#${o.id}** | Sản phẩm: ${itemsStr} | Ngày đặt: ${dateStr} | Trạng thái: **${st}** | Tổng tiền: ${o.total.toLocaleString("vi-VN")}đ`;
        })
        .join("\n");

      contextSection += `
### TÌNH HUỐNG: KHÁCH HÀNG CÓ NHIỀU ĐƠN HÀNG ĐANG TRONG HỆ THỐNG
Khách hàng hỏi câu chung chung ("đơn hàng đã đến đâu rồi", "đơn của tôi..."), và hệ thống tìm thấy **${dbData.multipleOrders.length} đơn hàng** liên kết với khách:
${ordersListStr}

*CHỈ THỊ QUAN TRỌNG (BẮT BUỘC)*:
1. Thông báo rõ ràng cho khách biết: Hệ thống kiểm tra thấy bạn hiện đang có **${dbData.multipleOrders.length} đơn hàng**.
2. Liệt kê danh sách các đơn hàng này theo định dạng gạch đầu dòng rõ ràng (Mã đơn, Danh sách sản phẩm, Ngày đặt, Trạng thái).
3. HỎI LẠI KHÁCH HÀNG: Hỏi khách đang muốn kiểm tra tiến độ chi tiết của đơn hàng nào trong các đơn trên (nhắc khách có thể nhắn mã đơn ví dụ: \`${dbData.multipleOrders[0].id}\` hoặc bấm vào các nút gợi ý bên dưới).
4. TUYỆT ĐỐI KHÔNG chào hàng hay giới thiệu sản phẩm ghế khi khách đang hỏi về đơn hàng!
`;
    } else if (dbData.singleOrder) {
      const o = dbData.singleOrder;
      const statusMap: Record<string, string> = {
        pending: "Chờ xác nhận đơn hàng (Đang kiểm tra)",
        processing: "Đang đóng gói và kiểm định chất lượng tại kho",
        shipped: "Đang được đơn vị vận chuyển giao tới địa chỉ của bạn",
        completed: "Đã giao hàng thành công",
        cancelled: "Đã hủy đơn hàng",
      };
      contextSection += `
### DỮ LIỆU THỰC TẾ TRÍCH XUẤT TỪ BẢNG [Order]:
- Mã đơn hàng: ${o.id}
- Trạng thái hiện tại: ${statusMap[o.status] || o.status}
- Đơn vị vận chuyển: ${o.carrier || "ErgoCare Express"}
- Mã vận đơn: ${o.trackingCode || "Đang phân bổ"}
- Dự kiến nhận: ${o.estimatedDelivery ? new Date(o.estimatedDelivery).toLocaleDateString("vi-VN") : "1 - 3 ngày làm việc"}
- Người nhận: ${o.recipientName} - ${o.recipientPhone}
- Địa chỉ nhận: ${o.deliveryAddress}, ${o.district}, ${o.province}
- Tổng thanh toán: ${o.total.toLocaleString("vi-VN")}đ (${o.paymentMethod === "cod" ? "COD" : "Chuyển khoản / Cổng thanh toán"})
- Sản phẩm gồm: ${o.items.map((i: any) => `${i.productName} (x${i.quantity})`).join(", ")}

*CHỈ THỊ QUAN TRỌNG*: Khách hàng đang hỏi về tiến độ đơn hàng. Hãy trả lời chi tiết và chuẩn xác theo dữ liệu trên, nhắc khách xem tại liên kết [Đơn hàng của tôi](/account?orderId=${o.id}) (chính xác cú pháp [Đơn hàng của tôi](/account?orderId=${o.id}), không bọc thêm dấu sao ** quanh link). TUYỆT ĐỐI KHÔNG chào bán sản phẩm ghế khi khách tra cứu đơn hàng!
`;
    } else {
      contextSection += `
### TÌNH TRẠNG TRA CỨU BẢNG [Order]:
- Khách hàng đang hỏi về đơn hàng / tiến độ giao hàng nhưng CHƯA có mã đơn và CHƯA có số điện thoại để tra cứu trong database.
*CHỈ THỊ QUAN TRỌNG*: Hãy lịch sự hướng dẫn khách cung cấp **Mã đơn hàng** (Ví dụ: \`ord-169181-212\`) hoặc **Số điện thoại** đã đặt hàng để bạn tra cứu trong database. Hoặc hướng dẫn khách vào mục [Đơn hàng của tôi](/account) để xem chi tiết. TUYỆT ĐỐI KHÔNG chào hàng hay giới thiệu sản phẩm!
`;
    }
  }

  // 2. Dữ liệu từ bảng Product
  if (dbData.products && dbData.products.length > 0) {
    const pList = dbData.products
      .map((p) => {
        const stock = p.stockStatus === "in_stock" ? `Còn hàng (${p.stockQuantity})` : "Tạm hết hàng";
        const w = p.warranty ? (p.warranty.includes("năm") ? p.warranty : `${p.warranty} năm`) : "5 năm";
        return `- **${p.name}** (Link: \`/products/${p.slug}\`): Giá **${p.price.toLocaleString("vi-VN")}đ**, danh mục: ${p.category}, chất liệu: ${p.material || "Cao cấp"}, bảo hành: ${w}, kho: ${stock}`;
      })
      .join("\n");

    contextSection += `
### DỮ LIỆU THỰC TẾ TRÍCH XUẤT TỪ BẢNG [Product]:
${pList}
`;
  }

  // 3. Dữ liệu chính sách khuyến mãi / mã giảm giá
  contextSection += `
### CHÍNH SÁCH MÃ GIẢM GIÁ (BẢNG KHÔNG CÓ TRÊN FRONTEND):
- ${dbData.discountSystemStatus.reason}
- Tuyệt đối không tự bịa đặt mã giảm giá dưới mọi hình thức (như ERGO10, SALE20, WELCOME).

### CHÍNH SÁCH GIAO NHẬN & BẢO HÀNH THỰC TẾ:
- Vận chuyển: Miễn phí toàn quốc cho đơn từ 2.000.000đ. Đơn dưới 2tr phí 30.000đ - 45.000đ. Hỏa tốc 2H (60.000đ).
- Bảo hành: Chính hãng từ 3 năm đến 7 năm theo từng dòng ghế. Đổi mới 1 đổi 1 trong 30 ngày nếu có lỗi nhà sản xuất.
`;

  return `Bạn là **ErgoBot** - Trợ lý thông minh của ErgoChair Việt Nam.
Nhiệm vụ của bạn là trả lời khách hàng DỰA 100% TRÊN DỮ LIỆU DATABASE ĐƯỢC TRÍCH XUẤT DƯỚI ĐÂY.

${contextSection}

QUY TẮC CỐT LÕI:
1. Khi khách hỏi đơn hàng: Trả lời đúng dữ liệu bảng Order, tuyệt đối không chèn quảng cáo ghế. BẮT BUỘC cung cấp link theo cú pháp chính xác [Đơn hàng của tôi](/account?orderId=MÃ_ĐƠN).
2. TUYỆT ĐỐI KHÔNG bọc link Markdown trong dấu sao ** (Ví dụ ĐÚNG: [Đơn hàng của tôi](/account?orderId=ord-123), Ví dụ SAI: **[Đơn hàng của tôi](...)**).
3. Khi khách hỏi mã giảm giá: Khẳng định rõ website không có mã giảm giá riêng, giá niêm yết đã là giá ưu đãi trực tiếp tốt nhất.
4. Khi tư vấn ghế: Dùng đúng tên, giá bán VNĐ, bảo hành và link [Tên ghế](/products/slug) theo dữ liệu bảng Product.`;
}

/**
 * Gọi Groq Cloud LLM
 */
async function callGroqLLM(
  messages: ChatMessage[],
  latestUserText: string,
  systemPrompt: string,
  apiKey: string,
  preferredModel: string = DEFAULT_GROQ_MODEL
): Promise<string> {
  const history = [...messages];
  const lastMsg = history[history.length - 1];
  if (!lastMsg || lastMsg.sender !== "user" || lastMsg.text !== latestUserText) {
    history.push({ sender: "user", text: latestUserText });
  }

  const groqMessages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-8).map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text,
    })),
  ];

  const modelsToTry = [
    preferredModel,
    ...FALLBACK_GROQ_MODELS.filter((m) => m !== preferredModel),
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages: groqMessages,
          temperature: 0.3,
          max_tokens: 1024,
          top_p: 0.9,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const replyText = data.choices?.[0]?.message?.content;
        if (replyText) return replyText;
      } else {
        const errBody = await res.text().catch(() => "");
        lastError = new Error(`Groq model ${model} HTTP ${res.status}: ${errBody}`);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
    }
  }

  throw lastError || new Error("Không thể kết nối đến Groq API");
}

/**
 * Tạo câu trả lời dự phòng bằng Database Semantic Engine khi không có Groq
 */
function generateDeterministicReply(
  plan: ExtractedQueryPlan,
  dbData: RetrievedDatabaseContext
): string {
  // 1. Hỏi về đơn hàng
  if (plan.intent === "TRACK_ORDER") {
    // Trường hợp: Tìm thấy nhiều đơn hàng của khách -> Liệt kê và hỏi lại khách
    if (dbData.isMultiOrderDisambiguation && dbData.multipleOrders && dbData.multipleOrders.length > 1) {
      const statusMap: Record<string, string> = {
        pending: "Chờ xác nhận",
        processing: "Đang đóng gói tại kho",
        shipped: "Đang giao hàng",
        completed: "Đã giao thành công",
        cancelled: "Đã hủy đơn",
      };
      const list = dbData.multipleOrders
        .map((o, idx) => {
          const itemsStr = o.items.map((i: any) => `${i.productName} (x${i.quantity})`).join(", ");
          const dateStr = new Date(o.createdAt).toLocaleDateString("vi-VN");
          const st = statusMap[o.status] || o.status;
          return `${idx + 1}. **#${o.id}** — ${itemsStr}\n   * Ngày đặt: ${dateStr} | Trạng thái: **${st}** | Tổng tiền: **${o.total.toLocaleString("vi-VN")}đ**`;
        })
        .join("\n");

      return `📦 **Hệ thống tìm thấy ${dbData.multipleOrders.length} đơn hàng của bạn đang được xử lý:**

${list}

👉 **Bạn đang muốn kiểm tra chi tiết hành trình của đơn hàng nào ạ?**
Bạn có thể nhắn mã đơn hàng (ví dụ: \`${dbData.multipleOrders[0].id}\`), bấm vào nút gợi ý bên dưới hoặc xem trực tiếp tại mục [Đơn hàng của tôi](/account) nhé! ✨`;
    }

    if (dbData.singleOrder) {
      const o = dbData.singleOrder;
      const statusMap: Record<string, string> = {
        pending: "Chờ xác nhận",
        processing: "Đang đóng gói và kiểm định chất lượng tại kho",
        shipped: "Đang được đơn vị vận chuyển giao đến bạn",
        completed: "Đã giao hàng thành công",
        cancelled: "Đã hủy đơn",
      };
      const estDeliveryStr = o.estimatedDelivery
        ? new Date(o.estimatedDelivery).toLocaleDateString("vi-VN")
        : "1 - 3 ngày làm việc";
      const itemsList = (o.items || [])
        .map((i: any) => `- **${i.productName}** (Số lượng: ${i.quantity})`)
        .join("\n");

      return `📦 **TIẾN ĐỘ ĐƠN HÀNG #${o.id}**

- **Trạng thái:** **${statusMap[o.status] || o.status}**
- **Đơn vị vận chuyển:** **${o.carrier || "ErgoCare Express"}**
- **Mã vận đơn:** \`${o.trackingCode || "Đang phân bổ mã vận đơn"}\`
- **Dự kiến giao:** ${estDeliveryStr}
- **Địa chỉ nhận:** ${o.deliveryAddress}, ${o.district}, ${o.province}
- **Người nhận:** ${o.recipientName} (${o.recipientPhone})
- **Tổng tiền:** **${o.total.toLocaleString("vi-VN")}đ**

**Sản phẩm trong đơn:**
${itemsList}

👉 Bạn có thể theo dõi chi tiết tại mục [Đơn hàng của tôi](/account?orderId=${o.id}) bất cứ lúc nào!`;
    }

    return `📦 **Tra cứu tiến độ giao hàng ErgoChair:**

Để kiểm tra chính xác đơn hàng của bạn đã giao đến đâu từ cơ sở dữ liệu hệ thống, bạn vui lòng cung cấp một trong hai thông tin:
1. **Mã đơn hàng** (Ví dụ: \`ord-169181-212\`)
2. Hoặc **Số điện thoại** bạn đã dùng khi đặt hàng

💡 *Xem ngay:* Nếu bạn đã đăng nhập hoặc vừa đặt hàng trên thiết bị này, bạn có thể xem trực quan toàn bộ trạng thái tại mục [Đơn hàng của tôi](/account) nhé! 🚚`;
  }

  // 2. Hỏi về mã giảm giá
  if (plan.intent === "DISCOUNT_INQUIRY") {
    return `Hiện tại hệ thống website ErgoChair **không áp dụng mã giảm giá (voucher/coupon)** riêng biệt tại bước thanh toán.

Tất cả các sản phẩm trên hệ thống đã được **niêm yết mức giá ưu đãi trực tiếp tốt nhất**. Đặc biệt:
- 🚚 **Miễn phí giao hàng tiêu chuẩn toàn quốc** cho đơn từ **2.000.000đ**.
- 🛡️ **Bảo hành chính hãng tận nơi** từ **3 đến 7 năm** tùy từng dòng sản phẩm.
- 🔄 **Cam kết 1 đổi 1 trong 30 ngày** nếu phát sinh lỗi từ nhà sản xuất.

Bạn có thể yên tâm chọn mẫu ghế ưng ý và đặt hàng trực tiếp mà không cần lo lắng về việc thiếu mã giảm giá nhé! 🪑✨`;
  }

  // 3. Hỏi về bảo hành
  if (plan.intent === "WARRANTY_POLICY") {
    return `🛡️ **Chính sách bảo hành thực tế của ErgoChair:**
- **Thời hạn bảo hành:** Từ **3 năm đến 7 năm** chính hãng tùy mẫu sản phẩm (áp dụng cho piston Class 4, mâm ngả, khung chịu lực và bánh xe PU).
- **Phạm vi:** Kỹ thuật viên bảo hành tận nơi tại Hà Nội & TP.HCM. Khách hàng tỉnh được gửi linh kiện thay thế miễn phí trong 48h.
- **Cam kết đổi mới:** **1 đổi 1 trong 30 ngày** nếu có lỗi từ nhà sản xuất.`;
  }

  // 4. Hỏi về vận chuyển
  if (plan.intent === "SHIPPING_POLICY") {
    return `🚚 **Chính sách giao nhận & Thanh toán tại ErgoChair:**
- **Giao tiêu chuẩn:** **MIỄN PHÍ toàn quốc** cho đơn từ 2.000.000đ (dưới 2tr: phí 30.000đ – 45.000đ).
- **Hỏa tốc 2H:** Phí 60.000đ nội thành Hà Nội & TP.HCM.
- **Giao & Lắp đặt tận phòng:** Phí 50.000đ (đơn từ 5tr) hoặc 120.000đ (đơn dưới 5tr).
- **Thanh toán:** COD khi nhận hàng, Chuyển khoản VietQR, VNPAY hoặc Ví MoMo.`;
  }

  // 5. Tư vấn sản phẩm từ dữ liệu bảng Product
  if (dbData.products && dbData.products.length > 0) {
    const list = dbData.products
      .slice(0, 3)
      .map(
        (p) =>
          `- [**${p.name}**](/products/${p.slug}) (**${p.price.toLocaleString("vi-VN")}đ**): ${p.category} | ${
            p.material || "Lưới cao cấp"
          } | Bảo hành ${p.warranty || "5 năm"}`
      )
      .join("\n");

    return `Danh sách các mẫu ghế công thái học phù hợp trong hệ thống:
${list}

Tất cả các sản phẩm trên đều đạt chuẩn công thái học và được MIỄN PHÍ giao hàng tiêu chuẩn toàn quốc!`;
  }

  return `Chào bạn! Tôi là **ErgoBot**, trợ lý công thái học của ErgoChair. Bạn có thể cho tôi biết chiều cao, ngân sách hoặc mã đơn hàng để tôi hỗ trợ chuẩn xác theo dữ liệu hệ thống nhé! 🪑`;
}

/**
 * Trích xuất thẻ sản phẩm đề xuất (TUYỆT ĐỐI không hiện khi hỏi đơn hàng hay mã giảm giá)
 */
function extractSuggestedProducts(
  plan: ExtractedQueryPlan,
  dbProducts?: any[],
  replyText?: string
): ChatbotProductSuggestion[] {
  if (plan.intent === "TRACK_ORDER" || plan.intent === "DISCOUNT_INQUIRY") {
    return [];
  }

  if (!dbProducts || dbProducts.length === 0) {
    return [];
  }

  let candidates = dbProducts;
  if (replyText) {
    const lowerReply = replyText.toLowerCase();
    const mentioned = dbProducts.filter(
      (p) => lowerReply.includes(p.name.toLowerCase()) || lowerReply.includes(p.slug.toLowerCase())
    );
    if (mentioned.length > 0) {
      candidates = mentioned;
    }
  }

  const cleanCandidates = candidates.filter(
    (p) => !["kjkj", "test"].includes(p.slug.toLowerCase())
  );
  const finalCandidates = cleanCandidates.length > 0 ? cleanCandidates : candidates;

  return finalCandidates.slice(0, 3).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    oldPrice: p.oldPrice,
    image: p.image,
    category: p.category,
    rating: p.rating,
    reviewCount: p.reviewCount,
    stockStatus: p.stockStatus as any,
    inStock: p.stockStatus === "in_stock",
    material: p.material,
    warranty: p.warranty,
  }));
}

// =========================================================================
// HÀM XỬ LÝ CHÍNH THEO ĐÚNG TƯ DUY 3 BƯỚC:
// BƯỚC 1: TRÍCH XUẤT THỰC THỂ & Ý ĐỊNH -> CHỌN BẢNG LIÊN QUAN
// BƯỚC 2: TRUY VẤN DỮ LIỆU TỪ CÁC BẢNG ĐÓ TRONG MYSQL (PRISMA)
// BƯỚC 3: DÙNG DỮ LIỆU VỪA TRÍCH XUẤT ĐỂ TỔNG HỢP CÂU TRẢ LỜI CHUẨN XÁC
// =========================================================================
export async function processChatbotMessage(
  messages: ChatMessage[],
  userQuery?: string,
  userContext?: ChatUserContext
): Promise<ChatbotResponse> {
  const latestText = userQuery || messages[messages.length - 1]?.text || "";
  const groqApiKey = process.env.GROQ_API_KEY;
  const groqModel = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

  // BƯỚC 1: Trích xuất thực thể và chọn ra các bảng liên quan nhất
  const queryPlan = await extractQueryPlan(latestText, groqApiKey, groqModel);

  // BƯỚC 2: Truy vấn dữ liệu thực tế từ các bảng liên quan nhất trong MySQL
  const dbData = await queryTargetDatabaseTables(queryPlan, userContext);

  // BƯỚC 3: Dùng dữ liệu vừa trích xuất để đưa ra câu trả lời chuẩn xác
  // Thử sinh câu trả lời bằng Groq LLM (được ground 100% bằng dữ liệu vừa trích xuất)
  if (groqApiKey && groqApiKey.trim().length > 5) {
    try {
      const systemPrompt = buildTargetedSystemPrompt(queryPlan, dbData);
      const groqReply = await callGroqLLM(
        messages,
        latestText,
        systemPrompt,
        groqApiKey,
        groqModel
      );
      const suggestedProducts = extractSuggestedProducts(
        queryPlan,
        dbData.products,
        groqReply
      );

      const dynamicQuickReplies =
        dbData.isMultiOrderDisambiguation && dbData.multipleOrders && dbData.multipleOrders.length > 1
          ? [
              ...dbData.multipleOrders.slice(0, 3).map((o) => `#${o.id}`),
              "📦 Xem tất cả Đơn hàng của tôi",
            ]
          : queryPlan.intent === "TRACK_ORDER"
          ? [
              "🔍 Tra cứu đơn hàng gần nhất",
              "📦 Xem Đơn hàng của tôi",
              "📞 Hotline hỗ trợ 0989 608 685",
            ]
          : [
              "📦 Đơn hàng đã giao đến đâu?",
              "📏 Tư vấn theo vóc dáng của tôi",
              "💰 Ghế công thái học tầm 6 triệu",
              "🛡️ Chính sách bảo hành bao lâu?",
            ];

      // Chuẩn hóa và làm sạch câu trả lời từ Groq
      let finalGroqReply = groqReply;
      if (dbData.singleOrder) {
        const orderId = dbData.singleOrder.id;
        // 1. Gỡ bỏ dấu sao ** bọc quanh link markdown
        finalGroqReply = finalGroqReply
          .replace(/\*\*\[(.*?)\]\((.*?)\)\*\*/g, "[$1]($2)")
          .replace(/\[\*\*(.*?)\*\*\]\((.*?)\)/g, "[$1]($2)");

        // 2. Tự động đính kèm ?orderId= vào link [Đơn hàng của tôi](/account) nếu chưa có
        finalGroqReply = finalGroqReply.replace(
          /\[([^\]]+)\]\((\/(?:account|orders))(\?[^)]*)?\)/g,
          (match, text, path, qs) => {
            if (qs && qs.includes("orderId=")) return `[${text}](/account${qs})`;
            const existingQs = qs ? qs.slice(1) : "";
            const newQs = existingQs
              ? `${existingQs}&orderId=${encodeURIComponent(orderId)}`
              : `orderId=${encodeURIComponent(orderId)}`;
            return `[${text}](/account?${newQs})`;
          }
        );

        // 3. Nếu Groq quên hoàn toàn link tra cứu, tự động bổ sung cuối tin nhắn
        if (!finalGroqReply.includes("/account")) {
          finalGroqReply += `\n\n👉 Bạn có thể theo dõi chi tiết tiến độ tại [Đơn hàng của tôi](/account?orderId=${encodeURIComponent(orderId)}).`;
        }
      }

      return {
        message: finalGroqReply,
        engine: "groq",
        suggestedProducts,
        quickReplies: dynamicQuickReplies,
        orderInfo: dbData.singleOrder
          ? {
              id: dbData.singleOrder.id,
              status: dbData.singleOrder.status,
              statusLabel: dbData.singleOrder.status,
              carrier: dbData.singleOrder.carrier,
              trackingCode: dbData.singleOrder.trackingCode,
              total: dbData.singleOrder.total,
              paymentStatus: dbData.singleOrder.paymentStatus,
            }
          : null,
      };
    } catch (groqError: any) {
      console.warn(
        "⚠️ Groq API gặp sự cố, tự động dùng Database Semantic Engine:",
        groqError?.message || groqError
      );
    }
  }

  // Nếu Groq không khả dụng, sử dụng Database Semantic Engine
  const deterministicReply = generateDeterministicReply(queryPlan, dbData);
  let finalDeterministicReply = deterministicReply;
  if (dbData.singleOrder) {
    const orderId = dbData.singleOrder.id;
    finalDeterministicReply = finalDeterministicReply
      .replace(/\*\*\[(.*?)\]\((.*?)\)\*\*/g, "[$1]($2)")
      .replace(/\[\*\*(.*?)\*\*\]\((.*?)\)/g, "[$1]($2)");

    finalDeterministicReply = finalDeterministicReply.replace(
      /\[([^\]]+)\]\((\/(?:account|orders))(\?[^)]*)?\)/g,
      (match, text, path, qs) => {
        if (qs && qs.includes("orderId=")) return `[${text}](/account${qs})`;
        const existingQs = qs ? qs.slice(1) : "";
        const newQs = existingQs
          ? `${existingQs}&orderId=${encodeURIComponent(orderId)}`
          : `orderId=${encodeURIComponent(orderId)}`;
        return `[${text}](/account?${newQs})`;
      }
    );
  }

  const fallbackProducts = extractSuggestedProducts(
    queryPlan,
    dbData.products,
    finalDeterministicReply
  );

  const dynamicQuickReplies =
    dbData.isMultiOrderDisambiguation && dbData.multipleOrders && dbData.multipleOrders.length > 1
      ? [
          ...dbData.multipleOrders.slice(0, 3).map((o) => `#${o.id}`),
          "📦 Xem tất cả Đơn hàng của tôi",
        ]
      : queryPlan.intent === "TRACK_ORDER"
      ? [
          "🔍 Tra cứu đơn hàng gần nhất",
          "📦 Xem Đơn hàng của tôi",
          "📞 Hotline hỗ trợ 0989 608 685",
        ]
      : [
          "📦 Đơn hàng đã giao đến đâu?",
          "📏 Tư vấn theo vóc dáng của tôi",
          "💰 Ghế công thái học tầm 6 triệu",
          "🛡️ Chính sách bảo hành bao lâu?",
        ];

  return {
    message: finalDeterministicReply,
    engine: "database_fallback",
    suggestedProducts: fallbackProducts,
    quickReplies: dynamicQuickReplies,
    orderInfo: dbData.singleOrder
      ? {
          id: dbData.singleOrder.id,
          status: dbData.singleOrder.status,
          statusLabel: dbData.singleOrder.status,
          carrier: dbData.singleOrder.carrier,
          trackingCode: dbData.singleOrder.trackingCode,
          total: dbData.singleOrder.total,
          paymentStatus: dbData.singleOrder.paymentStatus,
        }
      : null,
  };
}
