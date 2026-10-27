const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'DANH_SACH_TOAN_BO_CHUC_NANG_HE_THONG.md');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Sửa đoạn mục 1 (Tech stack) bị lặp và lỗi ký tự
const section1OldRegex = /## 1\. TỔNG QUAN KIẾN TRÚC[\s\S]*?(?=## 2\. SƠ ĐỒ LUỒNG NGHIỆP VỤ)/;

const section1New = `## 1. TỔNG QUAN KIẾN TRÚC & NGĂN XẾP CÔNG NGHỆ (TECH STACK)

Hệ thống **ErgoChair** được thiết kế theo mô hình **Fullstack Next.js**, kết hợp khả năng Server-Side Rendering (SSR), Client-Side Hydration và RESTful Route Handlers chuẩn Clean Architecture:

\`\`\`
┌────────────────────────────────────────────────────────────────────────┐
│                   GIAO DIỆN NGƯỜI DÙNG (FRONTEND)                     │
│  • Khách hàng (Storefront)         • Quản trị viên (Admin Portal)     │
│  • React 19 + Context API          • Vanilla CSS (Design Tokens)      │
│  • Responsive Design (Mobile/PC)   • Custom Easing Animation Engine   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / RESTful API (JSON)
┌───────────────────────────────────▼────────────────────────────────────┐
│                  TẦNG XỬ LÝ BACKEND (NEXT.JS ROUTE HANDLERS)           │
│  • Auth: Node.js Crypto PBKDF2    • Validation: Zod Schemas            │
│  • Media Uploads: /api/upload     • AI: Groq REST API (Fetch) + RAG    │
│  • Clean Architecture: Repositories (Product, Order, User, Coupon,...) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Prisma ORM Client
┌───────────────────────────────────▼────────────────────────────────────┐
│                    CƠ SỞ DỮ LIỆU (MYSQL / MARIADB)                    │
│  • 10 Bảng quan hệ (User, Product, Order, Category, Review, Coupon...) │
│  • Indexes tối ưu tìm kiếm, Foreign Keys, Cascade Constraints          │
└────────────────────────────────────────────────────────────────────────┘
\`\`\`

- **Runtime & Ngôn ngữ:** Node.js 20+, TypeScript 5 (Định kiểu chặt chẽ 100%).
- **Web Framework:** Next.js 16.3.2 (App Router).
- **Thư viện UI & State:** React 19.2.8 (\`useContext\`, \`useMemo\`, \`useCallback\`, \`useState\`, \`useRef\`).
- **ORM & Database:** Prisma Client 6.19.3 kết nối trực tiếp MySQL Database (\`ergochair_db\`).
- **Cơ chế Xác thực & Mã hóa Mật khẩu:**
  - Sử dụng module gốc của Node.js (\`node:crypto\`) với thuật toán **PBKDF2 SHA-512** (1000 vòng lặp, muối ngẫu nhiên 16 byte qua \`crypto.randomBytes(16)\`, khóa băm 64 byte, định dạng lưu trữ \`\${salt}:\${hash}\`).
  - Tích hợp cơ chế backward-compatible / plain text fallback (\`if (password === storedHash) return true;\`) giúp tương thích với các tài khoản ban đầu được khởi tạo từ file seed.
- **Quản lý Phiên Người Dùng (Session Management):**
  - Quản lý phiên phía Client bằng \`localStorage\` (\`ergochair-auth-session\`).
  - Đồng bộ tức thì giữa tất cả các tab trình duyệt thông qua Custom DOM Event \`ergochair-auth-change\` và sự kiện \`storage\`.
  - Cơ chế tự động đồng bộ thời gian thực: Khi người dùng truy cập trang, hệ thống gọi \`GET /api/auth/me?id=\${sessionUser.id}\` để tải dữ liệu mới nhất từ MySQL, đồng thời kiểm tra nếu tài khoản bị khóa (\`blocked\`) sẽ lập tức xóa phiên và ngắt quyền truy cập.
- **Tích hợp Trí tuệ Nhân tạo (AI ErgoBot):**
  - Kết nối trực tiếp mô hình ngôn ngữ lớn qua **Groq REST API** (\`https://api.groq.com/openai/v1/chat/completions\`) sử dụng Native \`fetch\` với chế độ JSON Object (không cần cài thêm SDK bên ngoài).
  - Mô hình AI chính: \`openai/gpt-oss-120b\`; Danh sách mô hình dự phòng: \`qwen/qwen3.8-27b\`, \`llama-3.3-70b-versatile\`, \`openai/gpt-oss-20b\`.
  - Kiểm soát độ trễ: Tích hợp \`AbortController\` với thời gian chờ tối đa 3500ms; nếu quá thời gian hoặc API gặp sự cố, hệ thống tự động chuyển tiếp sang **Bộ máy Heuristic Regex nội bộ (Deterministic Fallback)** để trả lời ngay lập tức mà không làm gián đoạn người dùng.
- **Hệ thống Typography Zevora đa tầng:**
  - Font nền giao diện (Pangea Fallback ~88%): \`Work_Sans\` (Menu, tên sản phẩm, nút bấm, body text).
  - Font tiêu đề lớn (Criteria CF Fallback ~12%): \`Plus_Jakarta_Sans\` (Tiêu đề h1, h2, h3).
  - Font mềm mại bổ trợ: \`Lora\` và \`Playfair_Display\` (Editorial Serif trang trọng).
  - Font bo tròn mềm mại: \`Baloo_2\` (Fallback phong cách DVN Coffee Spark).
- **Styling Architecture:** Vanilla CSS mô-đun hóa với các biến CSS Design Tokens (Màu be \`--paper: #f5f4ef\`, trắng kem \`--cream: #e9eee7\`, nâu da sồi, xám than chì \`--ink: #1c1917\`, xanh olive \`--olive: #687d68\`).

---

`;

content = content.replace(section1OldRegex, section1New);

// 2. Cập nhật mục 3.5: Ghi rõ thực trạng tính năng Coupon ở tầng UI vs Backend
content = content.replace(
  /- \*\*Hệ Thống Áp Dụng Mã Khuyến Mãi \(Coupons \/ Vouchers\):\*\*[\s\S]*?(?=- \*\*Tạo Đơn Hàng & Khởi Tạo Vận Đơn Tự Động:\*\*)/,
  `- **Hệ Thống Mã Khuyến Mãi & Giảm Giá (Coupons / Vouchers Status):**
  - **Tầng Cơ sở dữ liệu & Backend:** Đã xây dựng hoàn chỉnh thực thể \`Coupon\` trong Prisma, tầng Repository \`coupon.repository.ts\`, Service \`coupon.service.ts\`, kiểm tra hợp lệ \`checkout.schema.ts\` và Endpoint xác thực \`POST /api/coupons/validate\`.
  - **Tầng Giao diện Người dùng:** Trên trang giỏ hàng (\`/cart\`) và trang thanh toán (\`/checkout\`), hệ thống hiện tập trung tối giản trải nghiệm thanh toán 1-chạm (chưa kích hoạt ô nhập mã voucher trên form, phí giao hàng tiêu chuẩn đồng giá 30.000đ và được trừ tự động khi đủ điều kiện).

`
);

// 3. Cập nhật các vị trí nhắc tới Bcrypt trong tài khoản
content = content.replace(
  /mã hóa bcrypt bảo mật/g,
  "mã hóa PBKDF2 SHA-512 bảo mật"
);

content = content.replace(
  /mã hóa mật khẩu bằng thuật toán Bcrypt trước khi lưu/g,
  "mã hóa mật khẩu bằng thuật toán PBKDF2 SHA-512 (với 16-byte random salt) trước khi lưu"
);

// 4. Cập nhật bảng API endpoint
content = content.replace(
  /\| `POST` \| `\/api\/auth\/login` \| Đăng nhập tài khoản, xác thực mật khẩu bcrypt và cấp phiên \| Công khai \|/,
  "| `POST` | `/api/auth/login` | Đăng nhập tài khoản, xác thực mật khẩu PBKDF2 SHA-512 và cấp phiên Client LocalStorage | Công khai |"
);

content = content.replace(
  /\| `POST` \| `\/api\/coupons\/validate` \| Kiểm tra tính hợp lệ và tính số tiền giảm của mã ưu đãi \| Công khai \|/,
  "| `POST` | `/api/coupons/validate` | Kiểm tra tính hợp lệ và tính số tiền giảm của mã ưu đãi (Backend API sẵn sàng) | Công khai |"
);

// 5. Cập nhật chi tiết phân hệ Admin người dùng (/admin/customers và /admin/users)
content = content.replace(
  /### 4\.5\. Quản Lý Khách Hàng, Nhân Sự & Cấp Lại Mật Khẩu \(Customer & User Management - `\/admin\/customers` & `\/admin\/users`\)\s*Module quản trị người dùng chuyên sâu \(gần 2000 dòng code\) chia thành 2 tab nghiệp vụ:/,
  `### 4.5. Quản Lý Khách Hàng, Nhân Sự & Cấp Lại Mật Khẩu (Customer & User Management - \`/admin/customers\` & \`/admin/users\`)
Phân hệ quản trị người dùng chuyên sâu với kiến trúc hợp nhất (component \`AdminCustomersPage\` gần 2.000 dòng code phục vụ cho cả hai tuyến đường dẫn \`/admin/customers\` và \`/admin/users\` thông qua export điều hướng). Giao diện quản trị được chia làm 2 tab nghiệp vụ chuyển đổi trực quan:`
);

// 6. Cập nhật mục 11: Bảo mật và tối ưu
const sec11Old = `## 11. CÁC CƠ CHẾ AN TOÀN, TỐI ƯU & BẢO VỆ DỮ LIỆU

1. **Bảo Mật Mật Khẩu (Bcrypt Password Hashing):**
   - 100% mật khẩu người dùng được băm qua hàm Bcrypt với salt rounds tiêu chuẩn, không bao giờ lưu trữ mật khẩu dạng văn bản thô (plain text).`;

const sec11New = `## 11. CÁC CƠ CHẾ AN TOÀN, TỐI ƯU & BẢO VỆ DỮ LIỆU

1. **Bảo Mật Mật Khẩu (Node.js Crypto PBKDF2 SHA-512):**
   - Mật khẩu người dùng mới được băm bằng thuật toán tiêu chuẩn **PBKDF2** của module gốc \`node:crypto\` với hàm băm \`SHA-512\`, 1000 vòng lặp (iterations), khóa dài 64 byte và muối ngẫu nhiên 16 byte (\`crypto.randomBytes(16)\`), lưu trữ dưới định dạng chuỗi an toàn \`\${salt}:\${hash}\`.
   - Tích hợp cơ chế backward-compatible fallback chuỗi trực tiếp (\`password === storedHash\`) nhằm tương thích tuyệt đối với các tài khoản thử nghiệm từ file hạt giống khởi tạo ban đầu (\`prisma/seed.ts\`).
2. **Cơ Chế Quản Lý Phiên & Đồng Bộ Đa Tab (LocalStorage + Event Sync + Server Validation):**
   - Phiên đăng nhập được quản lý tại máy khách qua \`localStorage\` (\`ergochair-auth-session\`), tự động đồng bộ tức thì trên toàn bộ các tab trình duyệt bằng Custom Event \`ergochair-auth-change\` và \`storage\`.
   - Mỗi lần người dùng vào trang hoặc chuyển trang, Client tự động gọi API \`GET /api/auth/me?id=...\` để đối chiếu với database MySQL. Nếu tài khoản bị quản trị viên khóa (\`blocked\`) hoặc vai trò (\`role\`) thay đổi, phiên làm việc sẽ được cập nhật hoặc thu hồi ngay lập tức mà không cần đăng nhập lại.`;

content = content.replace(sec11Old, sec11New);

// 7. Cập nhật số thứ tự các mục bảo mật phía dưới cho chuẩn xác
content = content.replace(
  /2\. \*\*Kiểm Soát Trạng Thái Tài Khoản/,
  "3. **Kiểm Soát Trạng Thái Tài Khoản"
);
content = content.replace(
  /3\. \*\*Bảo Vệ Tính Toàn Vẹn Tồn Kho/,
  "4. **Bảo Vệ Tính Toàn Vẹn Tồn Kho"
);
content = content.replace(
  /4\. \*\*Validation Hai Tầng Chặt Chẽ/,
  "5. **Validation Hai Tầng Chặt Chẽ"
);
content = content.replace(
  /5\. \*\*Khử Dấu Tiếng Việt & Ngăn Ngừa Lỗ Hổng Tải Tệp/,
  "6. **Khử Dấu Tiếng Việt & Ngăn Ngừa Lỗ Hổng Tải Tệp"
);
content = content.replace(
  /6\. \*\*Bảo Vệ Xóa Tài Khoản Quản Trị/,
  "7. **Bảo Vệ Xóa Tài Khoản Quản Trị"
);
content = content.replace(
  /7\. \*\*Kiến Trúc Dự Phòng AI/,
  "8. **Kiến Trúc Dự Phòng AI (AI Graceful Fallback with AbortController):**\n   - API Chatbot kết nối Groq Cloud với thời gian timeout tự ngắt 3.5 giây thông qua `AbortController`. Nếu API bên ngoài bị nghẽn mạng hoặc hết hạn ngạch, hệ thống tự động kích hoạt bộ máy Heuristic Regex nội bộ để trích xuất thực thể và truy vấn RAG cục bộ, đảm bảo người dùng luôn nhận được phản hồi ngay lập tức."
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated DANH_SACH_TOAN_BO_CHUC_NANG_HE_THONG.md!');
