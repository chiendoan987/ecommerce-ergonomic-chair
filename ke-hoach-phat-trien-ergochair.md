# 🪑 KẾ HOẠCH PHÁT TRIỂN HỆ THỐNG ERGOCHAIR
## Từ Demo Frontend → Website Thương Mại Điện Tử Hoàn Chỉnh

> Tài liệu này dùng để lên kế hoạch mở rộng dự án **ErgoChair** hiện tại (Next.js FE + dữ liệu mẫu) thành một hệ thống e-commerce đầy đủ chức năng, với chiến lược: **hoàn thiện Frontend trước → chuẩn hóa kiến trúc để dễ nối Backend sau**.
>
> **Quyết định công nghệ Backend (đã chốt, chỉ cấu hình trước — CHƯA code luận nghiệp vụ BE ở giai đoạn này):**
> - Backend viết bằng chính **Next.js** (dùng Route Handlers trong `app/api/`, không tách server riêng ở giai đoạn đầu) — giữ monorepo đơn giản, một đội FE có thể tự vận hành.
> - Database: **MySQL**
> - ORM: **Prisma**
>
> ⚠️ **Trọng tâm hiện tại vẫn là 100% Frontend.** Phần Backend/MySQL/Prisma ở tài liệu này chỉ dừng ở mức **cấu hình khung sườn** (tạo file, cài đặt, định nghĩa schema rỗng/mẫu) để sau này cắm logic thật vào nhanh — **không viết nghiệp vụ, không kết nối dữ liệu thật, không deploy DB** ở các giai đoạn FE.

---

## 📌 Mục Lục

1. [Nguyên Tắc Chỉ Đạo Khi Mở Rộng](#1-nguyên-tắc-chỉ-đạo-khi-mở-rộng)
2. [Cấu Trúc Thư Mục Mới (Sẵn Sàng Cho Backend)](#2-cấu-trúc-thư-mục-mới-sẵn-sàng-cho-backend)
3. [Lớp Trừu Tượng Dữ Liệu (Data Access Layer) — Chìa Khóa Để Nối BE Sau](#3-lớp-trừu-tượng-dữ-liệu-data-access-layer--chìa-khóa-để-nối-be-sau)
4. [Danh Sách Tính Năng Cần Bổ Sung](#4-danh-sách-tính-năng-cần-bổ-sung)
5. [Data Model Chuẩn Hóa](#5-data-model-chuẩn-hóa)
6. [Lộ Trình Phát Triển Theo Giai Đoạn](#6-lộ-trình-phát-triển-theo-giai-đoạn)
7. [Gợi Ý Tech Stack Cho Backend (Giai Đoạn Sau)](#7-gợi-ý-tech-stack-cho-backend-giai-đoạn-sau)
8. [Checklist Bàn Giao Mỗi Giai Đoạn](#8-checklist-bàn-giao-mỗi-giai-đoạn)
9. [Rủi Ro & Lưu Ý Kỹ Thuật](#9-rủi-ro--lưu-ý-kỹ-thuật)

---

## 1. Nguyên Tắc Chỉ Đạo Khi Mở Rộng

Vì đội đang làm **FE trước, BE sau**, toàn bộ quyết định kiến trúc trong giai đoạn này phải tuân theo 4 nguyên tắc sau để tránh phải viết lại khi có BE thật:

1. **Không gọi trực tiếp mock data trong component/page.** Mọi component chỉ được lấy dữ liệu qua một lớp trung gian gọi là **Service Layer** (`lib/services/*`). Lớp này hôm nay đọc từ file mock, mai sau đổi thành `fetch("/api/...")` mà component không cần sửa gì.
2. **Định hình sẵn "hợp đồng dữ liệu" (Data Contract/Types) giống hệt như khi có DB thật** — id dạng string (UUID-ready), có `createdAt`, `updatedAt`, phân trang (`page`, `pageSize`, `total`) ngay từ đầu dù dữ liệu mock chỉ có vài chục sản phẩm.
3. **Tách biệt "trạng thái UI tạm thời" và "trạng thái nghiệp vụ".** Ví dụ: giỏ hàng, wishlist, so sánh sản phẩm nên thiết kế theo dạng có thể đồng bộ lên server (mỗi item có `productId`, `variantId`, `quantity`, không lưu toàn bộ object sản phẩm) để sau này merge giỏ hàng local với giỏ hàng server lúc đăng nhập không bị vỡ cấu trúc.
4. **Chuẩn bị sẵn khái niệm "Authentication State"** dạng `user: User | null` toàn cục ngay từ khi chưa có BE (dùng mock login), để các luồng như Checkout, Order History, Wishlist gắn với user thật một cách tự nhiên.

---

## 2. Cấu Trúc Thư Mục Mới (Sẵn Sàng Cho Backend)

Đề xuất tái cấu trúc thư mục `src/` như sau. Các mục có 🆕 là thư mục/khái niệm mới so với hiện tại.

```text
ecommerce-ergonomic-chair/
├── public/
│   └── images/
├── src/
│   ├── app/                              # Next.js App Router — chỉ chứa ROUTES + PAGE COMPOSITION
│   │   ├── (marketing)/                  # 🆕 Route group: các trang tĩnh/nội dung
│   │   │   ├── page.tsx                  # Trang chủ
│   │   │   ├── about/page.tsx
│   │   │   └── contact/page.tsx
│   │   ├── (shop)/                       # 🆕 Route group: luồng mua hàng
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── cart/page.tsx
│   │   │   ├── checkout/page.tsx
│   │   │   └── order-success/page.tsx
│   │   ├── (account)/                    # 🆕 Route group: tài khoản người dùng
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── account/
│   │   │   │   ├── page.tsx              # Thông tin cá nhân
│   │   │   │   ├── orders/page.tsx       # Lịch sử đơn hàng
│   │   │   │   ├── orders/[id]/page.tsx  # Chi tiết đơn hàng
│   │   │   │   ├── addresses/page.tsx    # Sổ địa chỉ
│   │   │   │   └── wishlist/page.tsx
│   │   ├── (admin)/                      # 🆕 Route group: khu vực quản trị (BE sau sẽ bảo vệ bằng middleware)
│   │   │   └── admin/
│   │   │       ├── page.tsx              # Dashboard tổng quan
│   │   │       ├── products/             # CRUD sản phẩm
│   │   │       ├── orders/                # Quản lý đơn hàng
│   │   │       ├── customers/             # Quản lý khách hàng
│   │   │       ├── coupons/                # Mã giảm giá
│   │   │       └── settings/
│   │   ├── api/                          # 🆕 Next.js Route Handlers — nơi BE "thật" sẽ được cắm vào sau
│   │   │   ├── products/route.ts         # Hiện tại: đọc mock. Sau này: gọi DB
│   │   │   ├── products/[id]/route.ts
│   │   │   ├── cart/route.ts
│   │   │   ├── orders/route.ts
│   │   │   ├── auth/[...nextauth]/route.ts (nếu dùng NextAuth)
│   │   │   └── ...
│   │   ├── layout.tsx
│   │   ├── template.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── layout/                       # 🆕 Header, Footer, Drawer menu mobile
│   │   ├── product/                      # 🆕 ProductCard, Gallery, VariantPicker, ReviewList...
│   │   ├── cart/                         # 🆕 CartItem, CartSummary, PromoCodeInput
│   │   ├── checkout/                     # 🆕 AddressForm, PaymentMethodSelector, OrderReview
│   │   ├── account/                      # 🆕 OrderHistoryTable, AddressCard, ProfileForm
│   │   ├── admin/                        # 🆕 DataTable, StatCard, AdminSidebar
│   │   └── ui/                           # 🆕 Design-system dùng chung: Button, Input, Modal, Toast, Badge, Skeleton
│   │
│   ├── contexts/                         # 🆕 Tách khỏi components/: các Context Provider thuần logic
│   │   ├── cart-context.tsx              # (đổi tên từ cart-provider.tsx cho rõ vai trò)
│   │   ├── auth-context.tsx              # 🆕
│   │   ├── wishlist-context.tsx          # 🆕
│   │   └── toast-context.tsx             # 🆕
│   │
│   ├── lib/
│   │   ├── services/                     # 🆕🔑 SERVICE LAYER — xem mục 3, đây là phần quan trọng nhất
│   │   │   ├── product.service.ts
│   │   │   ├── cart.service.ts
│   │   │   ├── order.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── coupon.service.ts
│   │   │   └── review.service.ts
│   │   ├── data/                         # (đổi tên từ chỗ chứa products.ts) — CHỈ chứa mock data thô
│   │   │   ├── mock-products.ts
│   │   │   ├── mock-users.ts             # 🆕
│   │   │   └── mock-orders.ts            # 🆕
│   │   ├── types/                        # 🆕 Toàn bộ TypeScript interface/type dùng chung
│   │   │   ├── product.ts
│   │   │   ├── order.ts
│   │   │   ├── user.ts
│   │   │   └── cart.ts
│   │   ├── validators/                   # 🆕 Schema validate (zod) dùng chung cho cả FE lẫn API route
│   │   │   ├── checkout.schema.ts
│   │   │   └── auth.schema.ts
│   │   ├── utils/                        # format tiền tệ, format ngày, slugify, debounce...
│   │   └── search.ts
│   │
│   ├── hooks/                            # 🆕 useCart, useAuth, useDebounce, useMediaQuery, useInfiniteScroll
│   │
│   └── config/                           # 🆕 site.config.ts (tên site, hotline...), nav.config.ts
│
├── prisma/                                # 🆕🔑 Tạo NGAY ở giai đoạn FE (chỉ cấu hình, chưa chạy migrate thật)
│   ├── schema.prisma                      # Khai báo datasource = mysql + các model rỗng/mẫu (mục 3.1)
│   └── migrations/                        # Để trống, sẽ sinh ra khi giai đoạn BE thật bắt đầu `prisma migrate dev`
├── .env.example                           # 🆕 Mẫu biến môi trường: DATABASE_URL (MySQL), NEXT_PUBLIC_API_URL...
├── .env.local                             # 🆕 (KHÔNG commit) DATABASE_URL trỏ tới MySQL local/Docker khi cần thử nghiệm
├── package.json
└── README.md
```

**Vì sao tách như vậy?**
- **Route Groups `(marketing)`, `(shop)`, `(account)`, `(admin)`**: giúp áp middleware bảo vệ route (ví dụ chỉ admin mới vào `/admin`) dễ dàng khi có auth thật, mà không đổi URL.
- **Thư mục `app/api/`**: dù chưa có BE riêng, đây chính là nơi bạn "giả lập API" bằng Route Handlers đọc mock data. Khi có BE thật (Node/NestJS riêng), chỉ cần đổi nội dung file trong này thành gọi sang BE, FE hoàn toàn không đổi.
- **`lib/services/`**: là lớp duy nhất "biết" dữ liệu đến từ đâu. Xem chi tiết mục 3.
- **`lib/types/`**: định nghĩa dữ liệu tập trung, sau này generate lại từ Prisma schema hoặc OpenAPI cũng không phá vỡ chỗ khác.

---

## 3. Lớp Trừu Tượng Dữ Liệu (Data Access Layer) — Chìa Khóa Để Nối BE Sau

Đây là phần **quan trọng nhất** trong toàn bộ kế hoạch — nếu làm đúng, việc chuyển từ mock sang BE thật sẽ mất vài giờ thay vì vài tuần.

### Nguyên tắc
Component/Page **KHÔNG BAO GIỜ** import trực tiếp từ `lib/data/mock-products.ts`. Chúng chỉ gọi hàm trong `lib/services/product.service.ts`.

### Ví dụ minh họa

**Giai đoạn hiện tại (FE-only, đọc mock):**
```ts
// lib/services/product.service.ts
import { mockProducts } from "@/lib/data/mock-products";
import type { Product, ProductFilters, PaginatedResult } from "@/lib/types/product";

export async function getProducts(filters: ProductFilters): Promise<PaginatedResult<Product>> {
  // Hiện tại: lọc trên mảng mock trong bộ nhớ
  let items = [...mockProducts];
  if (filters.category) items = items.filter(p => p.category === filters.category);
  // ... các filter khác
  return { items, total: items.length, page: filters.page ?? 1, pageSize: filters.pageSize ?? 12 };
}

export async function getProductById(id: string): Promise<Product | null> {
  return mockProducts.find(p => p.id === id) ?? null;
}
```

**Giai đoạn sau (có BE thật) — chỉ sửa BÊN TRONG file service:**
```ts
// lib/services/product.service.ts (phiên bản BE thật)
export async function getProducts(filters: ProductFilters): Promise<PaginatedResult<Product>> {
  const query = new URLSearchParams(filters as any).toString();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?${query}`);
  return res.json();
}

export async function getProductById(id: string): Promise<Product | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`);
  if (!res.ok) return null;
  return res.json();
}
```

➡️ **Component gọi `getProducts()` và `getProductById()` không cần sửa một dòng nào.**

### Áp dụng service layer cho toàn bộ nghiệp vụ
| Service | Trách nhiệm | Ghi chú chuẩn bị BE |
|---|---|---|
| `product.service.ts` | Danh sách, chi tiết, tìm kiếm, sản phẩm liên quan | Sau này map sang REST `/products` hoặc GraphQL |
| `cart.service.ts` | Đọc/ghi giỏ hàng | Giai đoạn đầu: localStorage. Có auth: đồng bộ 2 chiều local ⇄ server |
| `order.service.ts` | Tạo đơn, lấy lịch sử đơn, chi tiết đơn | Cần idempotency key khi tạo đơn (tránh double-submit) |
| `auth.service.ts` | Đăng ký, đăng nhập, refresh token | Giai đoạn đầu dùng mock user + localStorage token giả |
| `coupon.service.ts` | Kiểm tra & áp mã giảm giá | Validate ở BOTH client (UX nhanh) và service (nguồn sự thật) |
| `review.service.ts` | Đánh giá, Q&A sản phẩm | Cần kiểm duyệt (moderation) khi có BE |

### 3.1 Cấu hình trước Prisma + MySQL (chỉ khung, chưa dùng thật)

Vì đã chốt BE dùng **Next.js + MySQL + Prisma**, nên cấu hình sẵn ngay từ giai đoạn FE để tránh dựng lại từ đầu sau này — nhưng **dừng lại ở việc khai báo**, chưa nối vào service layer đang chạy mock:

```bash
npm install -D prisma
npm install @prisma/client
npx prisma init --datasource-provider mysql
```

Việc này tạo ra `prisma/schema.prisma` và `.env` với biến `DATABASE_URL`. Khai báo mẫu (chưa cần MySQL server thật đang chạy):

```prisma
// prisma/schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Model được viết PHỎNG THEO các type trong lib/types/*
// (mục 5) — nhưng CHƯA migrate, CHƯA chạy `prisma generate` bắt buộc trong CI ở giai đoạn FE.
model Product {
  id               String   @id @default(uuid())
  slug             String   @unique
  name             String
  category         String
  price            Int
  compareAtPrice   Int?
  stockStatus      String
  stockQuantity    Int
  description      String   @db.Text
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model User {
  id        String   @id @default(uuid())
  fullName  String
  email     String   @unique
  phone     String?
  role      String   @default("customer")
  createdAt DateTime @default(now())
}

model Order {
  id          String   @id @default(uuid())
  userId      String?
  status      String   @default("pending")
  subtotal    Int
  discount    Int
  shippingFee Int
  total       Int
  createdAt   DateTime @default(now())
}
```

```bash
# .env.example
DATABASE_URL="mysql://user:password@localhost:3306/ergochair_dev"
```

**Việc CẦN làm ở giai đoạn FE (chỉ cấu hình):**
- [ ] Cài Prisma, chạy `npx prisma init --datasource-provider mysql`
- [ ] Viết `schema.prisma` mẫu khớp với `lib/types/*` đã thiết kế (mục 5), commit vào repo
- [ ] Thêm `.env.example` với `DATABASE_URL` mẫu (không chứa mật khẩu thật)
- [ ] Thêm script tiện ích vào `package.json`: `"db:generate": "prisma generate"`, `"db:studio": "prisma studio"` — chưa cần chạy trong CI/CD

**Việc CHƯA làm ở giai đoạn FE (để dành cho giai đoạn BE — mục 6, Giai đoạn 5):**
- ❌ Chưa cài đặt MySQL server thật (local hay cloud)
- ❌ Chưa chạy `npx prisma migrate dev` (tạo bảng thật)
- ❌ Chưa sửa `lib/services/*` để gọi Prisma Client — service layer vẫn tiếp tục đọc mock data trong `lib/data/`
- ❌ Chưa viết logic bên trong `app/api/*` để query MySQL — Route Handlers ở giai đoạn FE chỉ trả về mock

---

## 4. Danh Sách Tính Năng Cần Bổ Sung

Chia theo nhóm chức năng, sắp theo mức độ ưu tiên (🔴 Cao — 🟡 Trung bình — 🟢 Thấp/nice-to-have).

### 4.1 Tài khoản & Xác thực (chưa có trong hệ thống hiện tại)
- 🔴 Đăng ký / Đăng nhập (email + mật khẩu)
- 🔴 Đăng xuất, phiên đăng nhập (session/JWT giả lập ở FE trước)
- 🔴 Trang "Tài khoản của tôi": thông tin cá nhân, đổi mật khẩu
- 🔴 Lịch sử đơn hàng + chi tiết đơn hàng, theo dõi trạng thái (Đang xử lý / Đang giao / Hoàn tất / Đã hủy)
- 🟡 Sổ địa chỉ giao hàng (thêm/sửa/xóa nhiều địa chỉ, đặt địa chỉ mặc định)
- 🟡 Quên mật khẩu / Đặt lại mật khẩu
- 🟢 Đăng nhập qua Google/Facebook (OAuth) — để dành khi có BE

### 4.2 Sản phẩm nâng cao
- 🔴 **Wishlist / Danh sách yêu thích** — lưu localStorage trước, sync server sau
- 🔴 **Đánh giá & bình luận sản phẩm** (rating, viết review, upload ảnh review)
- 🟡 **Biến thể sản phẩm (Variants)**: màu sắc, chất liệu khác nhau ⇒ giá/ảnh/kho khác nhau
- 🟡 **So sánh sản phẩm** (chọn 2-3 sản phẩm để so sánh thông số)
- 🟡 Sản phẩm đã xem gần đây (Recently Viewed)
- 🟢 Hỏi đáp sản phẩm (Q&A) kiểu Hỏi - Đáp công khai
- 🟢 Video sản phẩm / ảnh 360°

### 4.3 Giỏ hàng & Thanh toán nâng cao
- 🔴 **Tích hợp cổng thanh toán online thật**: VNPay / Momo / ZaloPay (sandbox trước)
- 🔴 Tính phí vận chuyển động theo tỉnh/thành hoặc theo trọng lượng đơn hàng
- 🟡 Cho phép áp dụng đồng thời coupon + điểm tích lũy (loyalty points)
- 🟡 Lưu giỏ hàng theo user (không chỉ theo trình duyệt) — merge giỏ local khi đăng nhập
- 🟡 "Mua lại" nhanh từ lịch sử đơn hàng
- 🟢 Giỏ hàng dùng chung nhiều thiết bị (cần BE)

### 4.4 Quản trị (Admin Panel) — hiện tại CHƯA CÓ, cần xây từ đầu
- 🔴 Dashboard tổng quan: doanh thu, số đơn hôm nay/tuần/tháng, sản phẩm bán chạy
- 🔴 Quản lý sản phẩm: CRUD, upload ảnh, quản lý tồn kho, đặt trạng thái "tạm hết hàng"
- 🔴 Quản lý đơn hàng: xem danh sách, đổi trạng thái, in hóa đơn
- 🟡 Quản lý khách hàng
- 🟡 Quản lý mã giảm giá (tạo mã, giới hạn số lần dùng, hạn sử dụng)
- 🟢 Quản lý banner/nội dung trang chủ (CMS nhẹ)
- 🟢 Phân quyền nhiều vai trò (Admin / Nhân viên kho / Nhân viên CSKH)

### 4.5 Trải nghiệm & Vận hành chung
- 🔴 **Hệ thống Toast/Notification** thống nhất (hiện tại có thể chưa có, cần cho thêm-giỏ-hàng, lỗi form...)
- 🔴 **SEO**: metadata động cho từng sản phẩm, sitemap.xml, robots.txt, Open Graph image
- 🔴 **Trạng thái loading/skeleton** rõ ràng khi chuyển từ mock sang gọi API thật (tránh giật layout)
- 🟡 **Đa ngôn ngữ** (VI/EN) nếu định mở rộng thị trường
- 🟡 **Trang 404 / 500 tùy biến**
- 🟡 **Blog/Bài viết tư vấn** (nội dung SEO, hướng dẫn chọn ghế)
- 🟢 **Chat hỗ trợ trực tuyến** (tích hợp widget hoặc tự xây)
- 🟢 **Progressive Web App (PWA)** cho trải nghiệm mobile tốt hơn

### 4.6 Chất lượng & Hạ tầng (làm song song, không phải "tính năng" nhưng bắt buộc)
- 🔴 Viết Unit test cho các hàm nghiệp vụ quan trọng (tính tổng tiền, áp coupon, validate form)
- 🔴 Thiết lập ESLint + Prettier + strict TypeScript rules
- 🟡 E2E test cơ bản cho luồng mua hàng (Playwright/Cypress)
- 🟡 CI pipeline (GitHub Actions): lint + build + test tự động khi tạo PR
- 🟢 Theo dõi lỗi runtime (Sentry) khi lên production thật

---

## 5. Data Model Chuẩn Hóa

Định nghĩa các type dùng chung ngay từ bây giờ trong `lib/types/`, thiết kế **giống hệt** như khi có database thật (dù hiện tại dữ liệu chỉ là mock), để sau này generate Prisma schema gần như copy-paste.

```ts
// lib/types/product.ts
export interface Product {
  id: string;                  // UUID-ready, không dùng số thứ tự 1,2,3
  slug: string;                // dùng cho URL đẹp: /products/ghe-cong-thai-hoc-ergo-x1
  name: string;
  category: ProductCategory;
  price: number;
  compareAtPrice?: number;     // giá gốc trước giảm
  stockStatus: "in_stock" | "out_of_stock" | "pre_order";
  stockQuantity: number;
  variants?: ProductVariant[]; // 🆕 chuẩn bị cho biến thể
  images: string[];
  description: string;
  specs: Record<string, string>;
  rating: { average: number; count: number };
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;                // "Màu Xám Than"
  priceDelta: number;          // chênh lệch giá so với giá gốc
  stockQuantity: number;
  imageUrl?: string;
}

// lib/types/order.ts
export interface Order {
  id: string;
  userId: string | null;       // null nếu khách vãng lai (guest checkout)
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: "cod" | "bank_transfer" | "vnpay" | "momo";
  status: "pending" | "processing" | "shipped" | "completed" | "cancelled";
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  couponCode?: string;
  createdAt: string;
}

// lib/types/user.ts
export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "customer" | "admin" | "staff";
  addresses: Address[];
  createdAt: string;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  detail: string;
  isDefault: boolean;
}
```

> 💡 **Mẹo:** Vì BE đã chốt dùng **Next.js + MySQL + Prisma**, các interface này gần như dịch nguyên sang `model` trong `schema.prisma` (xem bản khung dựng sẵn ở mục 3.1), giảm thiểu công sức thiết kế lại khi bước vào Giai đoạn 5.

---

## 6. Lộ Trình Phát Triển Theo Giai Đoạn

### 🏁 Giai đoạn 0 — Tái cấu trúc nền tảng (1 tuần)
Không thêm tính năng mới, chỉ tổ chức lại code theo mục 2 & 3.
- [x] Tạo `lib/services/`, `lib/types/`, `contexts/`, `hooks/`, `config/`
- [x] Di chuyển `products.ts` → `lib/data/mock-products.ts`, viết `product.service.ts` bọc quanh nó
- [x] Refactor toàn bộ page đang gọi trực tiếp mock → gọi qua service
- [x] Thiết lập ESLint/Prettier chuẩn, kiểm tra lại `tsconfig.json` (bật `strict: true`)

### 🚀 Giai đoạn 1 — Hoàn thiện trải nghiệm mua hàng (2-3 tuần)
- [x] Hệ thống Toast/Notification dùng chung
- [x] Wishlist (localStorage)
- [x] Đánh giá sản phẩm (form review + hiển thị danh sách, dùng mock data trước)
- [x] Sản phẩm đã xem gần đây
- [x] Trang 404 tùy biến, cải thiện SEO metadata cho từng trang sản phẩm

### 🔐 Giai đoạn 2 — Tài khoản người dùng (giả lập, chưa cần BE) (2 tuần)
- [x] Trang đăng ký/đăng nhập, `auth-context.tsx` quản lý user giả lập (mock trong localStorage)
- [x] Trang tài khoản: thông tin cá nhân, sổ địa chỉ, lịch sử đơn hàng (đọc từ mock order gắn theo userId)
- [x] Checkout tự điền thông tin nếu đã đăng nhập; hỗ trợ "Mua không cần tài khoản" (guest checkout)

### 🛠️ Giai đoạn 3 — Khu vực Quản trị (Admin Panel) (3 tuần)
- [x] Layout Admin riêng (`src/app/admin/layout.tsx`) với sidebar, bảo vệ bằng kiểm tra `role === "admin"` (mock trước)
- [x] CRUD sản phẩm (thao tác trên mock data & lưu trữ `localStorage`, chưa cần DB)
- [x] Quản lý đơn hàng: đổi trạng thái, lọc tìm kiếm, xem chi tiết và in hóa đơn
- [x] Dashboard thống kê cơ bản (doanh thu, biểu đồ phân tích 7 ngày, cơ cấu trạng thái đơn hàng, top sản phẩm)
- [x] Quản lý khách hàng: danh sách tài khoản, số lượng đơn hàng và tổng chi tiêu

### 🔌 Giai đoạn 4 — Chuẩn bị & Chuyển sang API layer nội bộ (1-2 tuần)
> Đây là bước đệm quan trọng trước khi làm BE thật. Vẫn nằm trong phạm vi FE.
- [ ] Chuyển toàn bộ mock data từ import trực tiếp sang đọc qua **Next.js Route Handlers** (`app/api/*`) — vẫn trả dữ liệu mock nhưng đã đi qua "API" thật sự trong cùng dự án Next.js
- [ ] Service layer (mục 3) đổi từ đọc mock trực tiếp → gọi `fetch("/api/...")`
- [ ] Thêm validate bằng `zod` dùng chung cho form (FE) và Route Handler (giả BE)
- [ ] Hoàn tất **cấu hình trước** Prisma + MySQL như mục 3.1 (cài đặt, viết `schema.prisma`, `.env.example`) — vẫn **chưa** dùng thật
- [ ] Viết `.env.example` đầy đủ, chuẩn bị biến môi trường cho `NEXT_PUBLIC_API_URL` và `DATABASE_URL` (mẫu)

> ⏸️ **Điểm dừng của giai đoạn FE.** Sau Giai đoạn 4, toàn bộ website chạy hoàn chỉnh bằng dữ liệu mock đi qua API nội bộ, sẵn sàng để bắt đầu Giai đoạn 5 bất cứ lúc nào mà không cần sửa lại kiến trúc.

### 🗄️ Giai đoạn 5 — Xây dựng Backend thật bằng Next.js + MySQL + Prisma (bắt đầu SAU khi FE hoàn chỉnh, 4-6 tuần tùy quy mô)
- [ ] Cài đặt MySQL thật (local qua Docker hoặc dịch vụ cloud như PlanetScale/Railway MySQL)
- [ ] Hoàn thiện `prisma/schema.prisma` đầy đủ quan hệ (Product ⇄ Variant ⇄ Order ⇄ User ⇄ Review...) dựa trên khung đã cấu hình ở mục 3.1
- [ ] Chạy `npx prisma migrate dev` để tạo bảng thật, dùng `prisma studio` để kiểm tra dữ liệu
- [ ] Viết logic thật bên trong từng `app/api/*` (dùng `@prisma/client` để query MySQL) — thay thế dần từng Route Handler đang trả mock, **không đổi URL/API contract** nên FE không cần sửa
- [ ] Authentication thật (NextAuth.js kết nối bảng `User` trong MySQL, hoặc JWT tự viết + refresh token)
- [ ] Tích hợp cổng thanh toán thật (sandbox VNPay/Momo/ZaloPay)
- [ ] Xử lý upload ảnh thật (Cloudinary/S3) thay vì ảnh tĩnh trong `public/`
- [ ] Seed dữ liệu mẫu vào MySQL bằng `prisma/seed.ts` (chuyển từ `lib/data/mock-*.ts` sang script seed)

### 🌐 Giai đoạn 6 — Hoàn thiện & Triển khai Production (2 tuần)
- [ ] Testing toàn diện (Unit + E2E)
- [ ] Tối ưu hiệu năng (Lighthouse, lazy load ảnh, cache API)
- [ ] Thiết lập CI/CD, deploy Next.js (Vercel hoặc VPS) + MySQL (PlanetScale/Railway/RDS MySQL)
- [ ] Giám sát lỗi (Sentry), giám sát uptime

---

## 7. Gợi Ý Tech Stack Cho Backend (Giai Đoạn Sau — Đã Chốt)

> Toàn bộ dòng dưới đây **chỉ áp dụng khi bắt đầu Giai đoạn 5**. Ở giai đoạn FE hiện tại, chỉ Prisma + MySQL được cấu hình khung (mục 3.1), chưa dùng thật.

| Hạng mục | Lựa chọn (đã chốt) | Lý do / Ghi chú |
|---|---|---|
| **Framework BE** | **Next.js** — dùng Route Handlers (`app/api/*`) ngay trong project FE hiện tại, không tách server riêng | Giữ monorepo đơn giản, một đội có thể tự vận hành cả FE lẫn BE, tận dụng luôn TypeScript + type đã thiết kế ở `lib/types/` |
| **Database** | **MySQL** | Đã chốt theo yêu cầu; phù hợp dữ liệu quan hệ rõ ràng (sản phẩm–đơn hàng–user) |
| **ORM** | **Prisma** | Type-safe, sinh type tự động khớp với `lib/types/` đã thiết kế sẵn; hỗ trợ MySQL đầy đủ |
| **Authentication** | **NextAuth.js** (Auth.js) hoặc JWT tự viết, lưu bảng `User` trong MySQL | Có sẵn OAuth Google/Facebook nếu cần mở rộng sau |
| **Thanh toán** | VNPay / MoMo / ZaloPay sandbox → production | Phổ biến nhất thị trường Việt Nam |
| **Lưu trữ ảnh** | Cloudinary hoặc AWS S3 | Upload ảnh sản phẩm động từ trang Admin, MySQL chỉ lưu URL |
| **Cache/Queue** | Redis (cache sản phẩm hot, hàng đợi gửi email) | Cần khi lượng truy cập tăng, không bắt buộc ở bản đầu |
| **Hosting** | Vercel hoặc VPS (Next.js full-stack) + MySQL managed (PlanetScale/Railway/AWS RDS MySQL) | Chi phí thấp cho giai đoạn đầu, dễ scale sau |
| **Email** | Resend hoặc Nodemailer + SMTP | Gửi email xác nhận đơn hàng, đặt lại mật khẩu |

---

## 8. Checklist Bàn Giao Mỗi Giai Đoạn

Dùng chung cho mọi giai đoạn, đảm bảo chất lượng trước khi merge vào nhánh chính:

- [ ] Code tuân thủ cấu trúc thư mục đã thống nhất (mục 2)
- [ ] Không có component gọi trực tiếp mock data (phải qua service — mục 3)
- [ ] Có type TypeScript đầy đủ, không dùng `any`
- [ ] Responsive kiểm tra trên 3 kích thước: Mobile / Tablet / Desktop
- [ ] Có trạng thái Loading / Empty / Error cho mọi màn hình có dữ liệu động
- [ ] Đã kiểm tra lint (`npm run lint`) và build thành công (`npm run build`)
- [ ] Cập nhật lại tài liệu README/kế hoạch nếu có thay đổi kiến trúc

---

## 9. Rủi Ro & Lưu Ý Kỹ Thuật

- **Rủi ro lớn nhất**: viết component gắn chặt với cấu trúc mock data (ví dụ lọc/sort thẳng trên mảng trong component) → khi có BE phải viết lại toàn bộ logic. ⇒ Bắt buộc tuân thủ Service Layer (mục 3) ngay từ giai đoạn 0.
- **Giỏ hàng & LocalStorage**: khi thêm tài khoản đăng nhập, cần có chiến lược **merge giỏ hàng** (giỏ hàng khi chưa đăng nhập + giỏ hàng đã lưu theo tài khoản) — nên thiết kế hàm `mergeCart()` trong `cart.service.ts` từ sớm dù chưa có BE.
- **SEO cho sản phẩm hết hàng**: đã xử lý tốt ở bản hiện tại (vẫn cho xem chi tiết), cần giữ nguyên nguyên tắc này khi phát triển thêm.
- **Guest checkout vs. bắt buộc đăng nhập**: nên quyết định sớm — ảnh hưởng lớn tới thiết kế Order model (`userId` có thể null).
- **Tính phí vận chuyển**: nếu chưa có BE, có thể mock bằng bảng phí cố định theo tỉnh/thành trong `lib/data/`, thiết kế hàm `calculateShippingFee()` trong service để sau này thay bằng gọi API GHN/GHTK/Viettel Post.
- **Bảo mật khi làm Admin Panel mock**: dù chưa có BE thật, tuyệt đối không hard-code mật khẩu admin trong code — dùng biến môi trường `.env.local` (không commit).

---

*Tài liệu kế hoạch phát triển — ErgoChair E-commerce Platform. Cập nhật lần đầu: Giai đoạn tái cấu trúc Frontend chuẩn bị cho Backend.*
