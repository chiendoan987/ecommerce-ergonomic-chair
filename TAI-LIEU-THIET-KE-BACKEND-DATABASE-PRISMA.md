# TÀI LIỆU ĐẶC TẢ KIẾN TRÚC BACKEND, CƠ SỞ DỮ LIỆU MYSQL VÀ PRISMA ORM
## DỰ ÁN: E-COMMERCE ERGONOMIC CHAIR (ERGOCHAIR)

> **Phiên bản:** 1.0.0  
> **Hệ quản trị CSDL:** MySQL 8.0+  
> **ORM:** Prisma Client (`@prisma/client`)  
> **Runtime / Framework:** Next.js 16 (App Router Route Handlers) & Node.js  
> **Xác thực:** JWT HttpOnly Cookies / Session RBAC (Admin & Customer)  
> **Chuẩn hóa:** Khớp 100% với giao diện Khách hàng (Storefront) & Trang Quản trị (Admin Portal)

---

## 1. KHẢO SÁT & ÁNH XẠ TOÀN BỘ GIAO DIỆN (UI/UX AUDIT)

Qua quá trình rà soát toàn bộ các trang frontend hiện hữu, hệ thống bao gồm hai phân hệ chính:

### 1.1. Phân hệ Cửa hàng (Storefront)
| Đường dẫn URL | Chức năng giao diện | Dữ liệu đầu vào / hiển thị | Yêu cầu Backend |
|---|---|---|---|
| `/` | Trang chủ (Hero, Bán chạy, Danh mục, Đánh giá, Lợi ích, CTA) | Danh sách sản phẩm nổi bật, đánh giá mẫu, thống kê | `GET /api/products?featured=true`, `GET /api/reviews/summary` |
| `/products` | Danh mục sản phẩm (Catalog) | Lọc danh mục, khoảng giá, tình trạng kho, sắp xếp, tìm kiếm, phân trang | `GET /api/products` (Filters: category, priceRange, availability, sort, page, pageSize, search) |
| `/products/[id]` | Chi tiết sản phẩm | Hình ảnh gallery, specs, phân loại biến thể (màu sắc/chất liệu), tình trạng tồn kho, chính sách bảo hành, danh sách review, form gửi review, sản phẩm liên quan | `GET /api/products/:id`, `GET /api/reviews?productId=...`, `POST /api/reviews`, `GET /api/products/related` |
| `/cart` | Giỏ hàng | Danh sách món hàng, biến thể, giá, số lượng, mã giảm giá (ERGO10, VIP20), tạm tính, giảm giá, phí ship, tổng tiền | Quản lý local cart + đồng bộ DB khi user đăng nhập: `POST /api/cart/sync`, `POST /api/coupons/validate` |
| `/checkout` | Thanh toán | Thông tin giao hàng (Họ tên, SĐT, Email, Tỉnh/Thành, Quận/Huyện, Địa chỉ chi tiết, Ghi chú), sổ địa chỉ đã lưu của user, phương thức thanh toán (COD, Bank Transfer, VNPAY, MoMo), mã giảm giá | `POST /api/orders` (Tạo đơn hàng, trừ kho sản phẩm, áp voucher, gửi thông báo) |
| `/order-success` | Xác nhận đặt hàng thành công | Mã đơn, tổng tiền, phương thức thanh toán, tóm tắt đơn | `GET /api/orders/:id` |
| `/wishlist` | Danh sách yêu thích | Danh sách sản phẩm đã lưu, thêm nhanh vào giỏ, xóa khỏi wishlist | `GET /api/wishlist`, `POST /api/wishlist`, `DELETE /api/wishlist/:productId` |
| `/login` | Đăng nhập | Email, Mật khẩu, Chuyển hướng theo vai trò (Customer -> Home/Account, Admin -> /admin) | `POST /api/auth/login` (Tạo JWT token an toàn trong HttpOnly Cookie) |
| `/register` | Đăng ký | Họ tên, Email, SĐT, Mật khẩu | `POST /api/auth/register` (Mã hóa bcrypt, tạo User, cấp token) |
| `/account` | Tài khoản cá nhân | 3 Tab: <br>1. **Đơn hàng:** Lịch sử mua sắm, trạng thái đơn, tracking, chi tiết sản phẩm đã mua<br>2. **Hồ sơ:** Sửa họ tên, SĐT, email, avatar<br>3. **Sổ địa chỉ:** Thêm mới, sửa, xóa, đặt làm mặc định | `GET /api/user/orders`, `PUT /api/user/profile`, `PUT /api/user/password`, `GET /api/user/addresses`, `POST /api/user/addresses`, `DELETE /api/user/addresses/:id`, `PATCH /api/user/addresses/:id/default` |
| `/contact` | Liên hệ & Hỗ trợ | Họ tên, email, SĐT, tiêu đề, nội dung tin nhắn liên hệ | `POST /api/contact` |

---

### 1.2. Phân hệ Quản trị (Admin Portal)
| Đường dẫn URL | Chức năng giao diện | Yêu cầu Backend |
|---|---|---|
| `/admin` | Tổng quan (Dashboard):<br>- 4 Card KPI: Doanh thu thực tế, Tổng đơn hàng, Tổng sản phẩm (còn hàng/hết hàng), Tổng tài khoản khách<br>- Biểu đồ sóng 7 ngày (Wave Chart)<br>- Đơn hàng mới nhất<br>- Top sản phẩm bán chạy<br>- Tiến độ trạng thái đơn | `GET /api/admin/dashboard/stats` (Tính toán tổng hợp trực tiếp từ DB) |
| `/admin/products` | Quản lý sản phẩm:<br>- Danh sách phân trang, tìm kiếm, lọc danh mục, kho<br>- Modal Thêm mới sản phẩm (Tên, danh mục, giá, giá gốc, tồn kho, ảnh, mô tả, specs, bảo hành)<br>- Modal Chỉnh sửa sản phẩm<br>- Xóa sản phẩm | `GET /api/admin/products`<br>`POST /api/admin/products`<br>`PUT /api/admin/products/:id`<br>`DELETE /api/admin/products/:id` |
| `/admin/orders` | Quản lý đơn hàng:<br>- Danh sách lọc theo trạng thái (`pending`, `processing`, `shipped`, `completed`, `cancelled`), theo thanh toán, tìm kiếm khách/mã đơn<br>- Dropdown cập nhật nhanh trạng thái đơn<br>- Modal xem chi tiết đơn: Thông tin nhận hàng, ghi chú khách, danh sách món, tiền nong, in phiếu | `GET /api/admin/orders`<br>`GET /api/admin/orders/:id`<br>`PATCH /api/admin/orders/:id/status` |
| `/admin/customers` | Quản lý tài khoản người dùng:<br>- Thống kê: Tổng user, Khách hàng, Admin, Trạng thái (Đang hoạt động / Tạm khóa)<br>- Lọc vai trò, trạng thái, tìm kiếm SĐT/Email/Tên<br>- Modal Thêm tài khoản mới<br>- Modal Sửa thông tin tài khoản<br>- Nút Khóa / Mở khóa tài khoản (toggle status `active` <-> `blocked`)<br>- Modal Đặt lại mật khẩu mới cho user (Admin Reset Password)<br>- Modal Chi tiết người dùng: Hồ sơ, Sổ địa chỉ, Lịch sử mua hàng + Tổng chi tiêu tích lũy<br>- Xóa tài khoản (bảo vệ không cho tự xóa chính mình) | `GET /api/admin/users`<br>`POST /api/admin/users`<br>`GET /api/admin/users/:id`<br>`PUT /api/admin/users/:id`<br>`PATCH /api/admin/users/:id/toggle-status`<br>`POST /api/admin/users/:id/reset-password`<br>`DELETE /api/admin/users/:id` |

---

## 2. THIẾT KẾ CƠ SỞ DỮ LIỆU MYSQL (PRISMA SCHEMA)

Dưới đây là lược đồ `prisma/schema.prisma` chuẩn hóa chi tiết và tối ưu hóa quan hệ bảng (indexes, constraints, foreign keys, cascade):

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// =========================================================================
// 1. NGƯỜI DÙNG & PHÂN QUYỀN (USERS & AUTHENTICATION)
// =========================================================================
enum UserRole {
  customer
  admin
}

enum UserStatus {
  active
  blocked
}

model User {
  id            String         @id @default(uuid())
  fullName      String         @db.VarChar(191)
  email         String         @unique @db.VarChar(191)
  phone         String?        @db.VarChar(50)
  password      String         @db.VarChar(255) // Hash bcrypt
  avatar        String?        @db.VarChar(500)
  role          UserRole       @default(customer)
  status        UserStatus     @default(active)
  
  // Quan hệ
  addresses     Address[]
  orders        Order[]
  reviews       Review[]
  wishlistItems WishlistItem[]
  cartItems     CartItem[]
  
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([email])
  @@index([role])
  @@index([status])
}

// Sổ địa chỉ người dùng
model Address {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  fullName  String   @db.VarChar(191)
  phone     String   @db.VarChar(50)
  province  String   @db.VarChar(100)
  district  String   @db.VarChar(100)
  detail    String   @db.VarChar(255)
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

// =========================================================================
// 2. DANH MỤC & SẢN PHẨM (CATALOG & PRODUCTS)
// =========================================================================
enum StockStatus {
  in_stock
  out_of_stock
  pre_order
}

model Category {
  id          String    @id @default(uuid())
  name        String    @unique @db.VarChar(100)
  slug        String    @unique @db.VarChar(100)
  description String?   @db.Text
  image       String?   @db.VarChar(500)
  sortOrder   Int       @default(0)
  isActive    Boolean   @default(true)
  products    Product[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([slug])
}

model Product {
  id             String           @id @default(uuid())
  slug           String           @unique @db.VarChar(150)
  name           String           @db.VarChar(255)
  categoryId     String?
  categoryRef    Category?        @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  category       String           @db.VarChar(100) // Tương thích nhanh với category text trên UI
  
  // Giá bán & kho hàng
  price          Int              // Đơn vị VNĐ
  oldPrice       Int?             // Giá gạch cũ
  compareAtPrice Int?
  stockStatus    StockStatus      @default(in_stock)
  stockQuantity  Int              @default(0)
  inStock        Boolean          @default(true)
  
  // Hình ảnh
  image          String           @db.VarChar(500) // Ảnh đại diện chính
  images         Json?            // Mảng URL ảnh: string[]
  gallery        Json?            // Mảng URL thư viện ảnh: string[]
  
  // Mô tả & thông số kỹ thuật (Specs)
  description    String           @db.Text
  specs          Json?            // Key-value specs: Record<string, string>
  
  // Thuộc tính vật lý đồng bộ với UI specs
  material       String?          @db.VarChar(191)
  color          String?          @db.VarChar(100)
  size           String?          @db.VarChar(100)
  weight         String?          @db.VarChar(50)
  capacity       String?          @db.VarChar(50)
  warranty       String?          @db.VarChar(100)
  
  // Đánh giá & xếp hạng
  rating         Float            @default(5.0)
  reviewCount    Int              @default(0)
  isFeatured     Boolean          @default(false)
  isActive       Boolean          @default(true)
  
  // Quan hệ
  variants       ProductVariant[]
  reviews        Review[]
  orderItems     OrderItem[]
  wishlistItems  WishlistItem[]
  cartItems      CartItem[]
  
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@index([slug])
  @@index([category])
  @@index([price])
  @@index([inStock])
  @@index([isFeatured])
}

// Biến thể sản phẩm (màu sắc, khung, đệm,...)
model ProductVariant {
  id            String      @id @default(uuid())
  productId     String
  product       Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  name          String      @db.VarChar(150)
  sku           String?     @db.VarChar(100)
  priceDelta    Int         @default(0) // Chênh lệch giá so với giá gốc
  stockQuantity Int         @default(0)
  imageUrl      String?     @db.VarChar(500)
  orderItems    OrderItem[]
  cartItems     CartItem[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([productId])
}

// =========================================================================
// 3. ĐƠN HÀNG & MÃ KHUYẾN MÃI (ORDERS & COUPONS)
// =========================================================================
enum OrderStatus {
  pending      // Chờ xác nhận
  processing   // Đang xử lý / chuẩn bị hàng
  shipped      // Đang giao hàng
  completed    // Hoàn thành
  cancelled    // Đã hủy
}

enum PaymentMethod {
  cod
  bank_transfer
  vnpay
  momo
}

enum PaymentStatus {
  unpaid
  paid
  refunded
}

model Order {
  id              String        @id @default(uuid()) // VD: ord-172803... hoặc UUID
  userId          String?
  user            User?         @relation(fields: [userId], references: [id], onDelete: SetNull)
  status          OrderStatus   @default(pending)
  paymentMethod   PaymentMethod @default(cod)
  paymentStatus   PaymentStatus @default(unpaid)
  
  // Tiền tệ VNĐ
  subtotal        Int
  discount        Int           @default(0)
  shippingFee     Int           @default(30000)
  total           Int
  couponCode      String?       @db.VarChar(50)
  
  // Thông tin giao hàng tại thời điểm đặt (Snapshot bất biến)
  recipientName   String        @db.VarChar(191)
  recipientPhone  String        @db.VarChar(50)
  recipientEmail  String?       @db.VarChar(191)
  deliveryAddress String        @db.VarChar(255)
  province        String        @db.VarChar(100)
  district        String        @db.VarChar(100)
  note            String?       @db.Text
  cancelReason    String?       @db.VarChar(255)
  
  items           OrderItem[]
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

model OrderItem {
  id           String          @id @default(uuid())
  orderId      String
  order        Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId    String
  product      Product         @relation(fields: [productId], references: [id], onDelete: Restrict)
  productName  String          @db.VarChar(255)
  productImage String          @db.VarChar(500)
  price        Int             // Giá sản phẩm tại thời điểm mua
  quantity     Int             @default(1)
  variantId    String?
  variant      ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)
  variantName  String?         @db.VarChar(150)
  createdAt    DateTime        @default(now())

  @@index([orderId])
  @@index([productId])
}

// Mã giảm giá
model Coupon {
  id              String    @id @default(uuid())
  code            String    @unique @db.VarChar(50) // VD: ERGO10, VIP20
  description     String    @db.VarChar(255)
  discountPercent Int?      // VD: 10, 20 (%)
  discountAmount  Int?      // Hoặc số tiền cố định: 100.000đ
  minOrderValue   Int       @default(0)
  maxDiscount     Int?      // Trần giảm giá tối đa
  usageLimit      Int?      // Số lần tối đa được dùng
  usedCount       Int       @default(0)
  isActive        Boolean   @default(true)
  startDate       DateTime?
  endDate         DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([code])
  @@index([isActive])
}

// =========================================================================
// 4. ĐÁNH GIÁ, YÊU THÍCH, GIỎ HÀNG (REVIEWS, WISHLIST, CART)
// =========================================================================
model Review {
  id               String   @id @default(uuid())
  productId        String
  product          Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  userId           String?
  user             User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  authorName       String   @db.VarChar(191)
  authorRole       String?  @db.VarChar(100) // VD: "Designer", "Lập trình viên",...
  rating           Int      @default(5)     // 1 - 5 sao
  comment          String   @db.Text
  verifiedPurchase Boolean  @default(false)
  isApproved       Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([productId])
  @@index([userId])
}

model WishlistItem {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, productId])
  @@index([userId])
  @@index([productId])
}

model CartItem {
  id        String          @id @default(uuid())
  userId    String
  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId String
  product   Product         @relation(fields: [productId], references: [id], onDelete: Cascade)
  variantId String?
  variant   ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)
  quantity  Int             @default(1)
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt

  @@unique([userId, productId, variantId])
  @@index([userId])
}

// Liên hệ từ khách hàng
model ContactMessage {
  id        String   @id @default(uuid())
  fullName  String   @db.VarChar(191)
  email     String   @db.VarChar(191)
  phone     String?  @db.VarChar(50)
  subject   String?  @db.VarChar(255)
  message   String   @db.Text
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([isRead])
}
```

---

## 3. DANH MỤC API ENDPOINTS CHI TIẾT (RESTFUL API SPECIFICATION)

### 3.1. Phân hệ Xác thực & Người dùng (Authentication & User Profile)
- `POST /api/auth/register`: Đăng ký tài khoản (FullName, Email, Phone, Password). Validate Zod, mã hóa password với `bcryptjs`, sinh cookie JWT.
- `POST /api/auth/login`: Đăng nhập bằng Email/Password. Kiểm tra trạng thái nếu `status === 'blocked'` thì trả lỗi 403 (Tài khoản bị tạm khóa bởi Admin). Trả JWT cookie + User profile.
- `GET /api/auth/me`: Lấy thông tin phiên đăng nhập hiện tại từ JWT cookie (kèm danh sách địa chỉ `addresses`).
- `POST /api/auth/logout`: Xóa auth cookie phiên làm việc.
- `PUT /api/user/profile`: Cập nhật họ tên, SĐT, avatar của user.
- `PUT /api/user/password`: Đổi mật khẩu cá nhân (kiểm tra `currentPassword` cũ và `newPassword` tối thiểu 6 ký tự).
- `GET /api/user/addresses`: Lấy danh sách địa chỉ đã lưu của user.
- `POST /api/user/addresses`: Thêm địa chỉ nhận hàng mới.
- `PUT /api/user/addresses/[id]`: Cập nhật địa chỉ nhận hàng.
- `DELETE /api/user/addresses/[id]`: Xóa địa chỉ.
- `PATCH /api/user/addresses/[id]/default`: Đặt làm địa chỉ mặc định.

### 3.2. Phân hệ Sản phẩm & Danh mục (Catalog & Products)
- `GET /api/products`: Danh sách sản phẩm có bộ lọc nâng cao:
  - `category`: Tên danh mục (ví dụ: "Ghế công thái học", "Ghế gaming",...)
  - `priceRange`: `under-5m` (< 5tr), `5m-8m` (5tr-8tr), `8m-12m` (8tr-12tr), `above-12m` (> 12tr)
  - `availability`: `in-stock` (còn hàng), `sold-out` (hết hàng)
  - `sort`: `featured` (nổi bật), `price-asc` (giá tăng dần), `price-desc` (giá giảm dần), `rating` (đánh giá cao)
  - `search`: Tìm kiếm từ khóa theo tên sản phẩm, chất liệu, mô tả
  - `page`, `pageSize`: Phân trang kết quả (trả về `{ items, total, page, pageSize, totalPages }`)
- `GET /api/products/[slug_or_id]`: Chi tiết 1 sản phẩm kèm danh sách biến thể, specs JSON, gallery ảnh, điểm rating trung bình.
- `GET /api/categories`: Danh sách các danh mục sản phẩm đang kích hoạt.
- `GET /api/products/related?productId=...`: Lấy 4 sản phẩm cùng danh mục gợi ý ở chân trang chi tiết.

### 3.3. Phân hệ Giỏ hàng & Yêu thích (Cart & Wishlist)
- `GET /api/cart`: Lấy giỏ hàng của user đang đăng nhập (hoặc local fallback cho khách vãng lai).
- `POST /api/cart`: Thêm sản phẩm + biến thể vào giỏ.
- `PATCH /api/cart/[id]`: Cập nhật số lượng item trong giỏ.
- `DELETE /api/cart/[id]`: Xóa món khỏi giỏ.
- `POST /api/cart/sync`: Đồng bộ giỏ hàng từ LocalStorage vào Database khi user đăng nhập.
- `GET /api/wishlist`: Lấy danh sách ID & thông tin sản phẩm yêu thích của user.
- `POST /api/wishlist`: Thêm sản phẩm vào danh sách yêu thích.
- `DELETE /api/wishlist/[productId]`: Bỏ sản phẩm khỏi yêu thích.

### 3.4. Phân hệ Mã giảm giá & Đặt hàng (Coupons & Orders)
- `POST /api/coupons/validate`: Kiểm tra mã giảm giá (`ERGO10`, `VIP20`), xác thực hạn sử dụng, giá trị đơn tối thiểu và tính số tiền được giảm (`discountAmount`).
- `POST /api/orders`: Tạo đơn hàng mới từ trang Checkout:
  1. Kiểm tra tồn kho sản phẩm trong database (ngăn ngừa over-selling).
  2. Tính toán lại subtotal, voucher discount, phí ship (30.000đ).
  3. Tạo bản ghi `Order` và các `OrderItem` trong một Prisma Transaction (`prisma.$transaction`).
  4. Trừ `stockQuantity` của sản phẩm và biến thể tương ứng.
  5. Cập nhật số lượt dùng của Coupon (`usedCount += 1`).
  6. Xóa giỏ hàng của user.
- `GET /api/orders/[id]`: Tra cứu thông tin đơn hàng theo ID.
- `GET /api/user/orders`: Lấy toàn bộ lịch sử đơn hàng của người dùng đang đăng nhập.

### 3.5. Phân hệ Đánh giá & Liên hệ (Reviews & Contact)
- `GET /api/reviews?productId=...`: Danh sách đánh giá đã duyệt của sản phẩm kèm phân bổ sao (1-5 sao).
- `POST /api/reviews`: Gửi đánh giá mới (sao từ 1-5, họ tên, nhận xét). Nếu user đã mua sản phẩm này thì tự động gắn cờ `verifiedPurchase = true`. Tự động cập nhật lại `rating` và `reviewCount` của `Product`.
- `POST /api/contact`: Lưu tin nhắn liên hệ từ khách hàng vào bảng `ContactMessage`.

### 3.6. Phân hệ Quản trị viên (Admin Portal API - Yêu cầu Role: Admin)
- `GET /api/admin/dashboard/stats`: Thống kê Dashboard:
  - Tổng doanh thu (không tính đơn hủy)
  - Số đơn theo trạng thái (chờ xử lý, đang xử lý, đang giao, hoàn tất, đã hủy)
  - Tổng sản phẩm & tỷ lệ còn hàng / hết hàng
  - Thống kê doanh thu theo từng ngày trong tuần (Wave chart data)
  - Top 5 sản phẩm bán chạy nhất
  - 5 đơn hàng mới nhất
- `GET /api/admin/products`: Danh sách quản lý sản phẩm cho admin (kèm bộ lọc, phân trang).
- `POST /api/admin/products`: Thêm mới sản phẩm (validate Zod, tạo slug tự động, lưu gallery & specs).
- `PUT /api/admin/products/[id]`: Cập nhật thông tin sản phẩm, giá bán, tồn kho, ảnh, specs.
- `DELETE /api/admin/products/[id]`: Xóa sản phẩm khỏi hệ thống.
- `GET /api/admin/orders`: Danh sách tất cả đơn hàng hệ thống (hỗ trợ search theo mã đơn, khách, SĐT, filter theo status).
- `GET /api/admin/orders/[id]`: Chi tiết đơn hàng cho admin xem modal.
- `PATCH /api/admin/orders/[id]/status`: Cập nhật trạng thái đơn hàng (`pending` -> `processing` -> `shipped` -> `completed` -> `cancelled`).
- `GET /api/admin/customers`: Danh sách quản lý tài khoản người dùng:
  - Hỗ trợ lọc theo `role` (customer / admin), theo `status` (active / blocked), search tên/email/SĐT/ID.
  - Kèm số lượng đơn đã đặt và tổng chi tiêu tích lũy của từng user.
- `POST /api/admin/customers`: Admin tạo tài khoản mới (hỗ trợ gán quyền Admin hoặc Khách hàng, đặt mật khẩu khởi tạo).
- `GET /api/admin/customers/[id]`: Lấy chi tiết hồ sơ tài khoản: thông tin cá nhân, sổ địa chỉ, lịch sử đơn hàng đã mua.
- `PUT /api/admin/customers/[id]`: Admin chỉnh sửa thông tin tài khoản (tên, email, SĐT, role, status).
- `PATCH /api/admin/customers/[id]/toggle-status`: Khóa hoặc Mở khóa tài khoản (chặn đăng nhập ngay lập tức).
- `POST /api/admin/customers/[id]/reset-password`: Admin cấp lại mật khẩu mới cho user.
- `DELETE /api/admin/customers/[id]`: Xóa tài khoản (chặn không cho phép tự xóa tài khoản của admin đang đăng nhập).

---

## 4. KẾ HOẠCH TRIỂN KHAI TUẦN TỰ (STEP-BY-STEP IMPLEMENTATION PLAN)

Để chuyển đổi mượt mà từ hệ thống Mock/LocalStorage hiện tại sang Hệ thống Backend MySQL + Prisma ORM hoàn chỉnh mà không làm gián đoạn hay hỏng bất kỳ chức năng giao diện nào, quy trình triển khai được chia làm 7 giai đoạn tuần tự:

```
[Giai đoạn 1: Database & Prisma Setup]
              │
              ▼
[Giai đoạn 2: Prisma Client Singleton & Auth Middleware]
              │
              ▼
[Giai đoạn 3: Catalog & Products API + Seed Data chuẩn]
              │
              ▼
[Giai đoạn 4: Cart, Wishlist, Coupon & Checkout Order API]
              │
              ▼
[Giai đoạn 5: Reviews, User Profile & Address API]
              │
              ▼
[Giai đoạn 6: Admin Portal APIs (Stats, Products, Orders, Users)]
              │
              ▼
[Giai đoạn 7: Refactor Frontend Services & End-to-End Testing]
```

### Chi tiết từng giai đoạn:

#### GIAI ĐOẠN 1: Cấu hình Cơ sở dữ liệu MySQL & Prisma Schema
1. **Thiết lập biến môi trường `.env`:**
   - Cung cấp chuỗi kết nối MySQL: `DATABASE_URL="mysql://root:password@localhost:3306/ergochair_db"`
   - Cung cấp Secret Key cho mã hóa phiên: `JWT_SECRET="ergochair-super-secret-key-2026"`
2. **Cập nhật `prisma/schema.prisma`:**
   - Đưa toàn bộ schema hoàn chỉnh từ Mục 2 vào file `prisma/schema.prisma`.
3. **Chạy Migration:**
   - Lệnh: `npx prisma migrate dev --name init_ergochair_database`
   - Tạo toàn bộ bảng, khóa chính, khóa ngoại và chỉ mục index trên MySQL.

#### GIAI ĐOẠN 2: Prisma Client Singleton & Seed Dữ liệu Ban Đầu
1. **Tạo Prisma Singleton Client:**
   - File `src/lib/prisma.ts` để quản lý kết nối connection pool tối ưu trong Next.js (tránh duplicate connections khi hot reload).
2. **Viết kịch bản Seed Data (`prisma/seed.ts`):**
   - Đổ dữ liệu từ `mock-products.ts` (6+ mẫu ghế công thái học kèm ảnh, gallery, specs, mô tả).
   - Đổ dữ liệu từ `mock-users.ts` (Tài khoản Admin mặc định `admin@ergochair.vn` / `admin123`, khách hàng mẫu kèm sổ địa chỉ).
   - Đổ mã giảm giá mẫu `ERGO10` (giảm 10%), `VIP20` (giảm 20%).
   - Đổ dữ liệu từ `mock-orders.ts` và `mock-reviews.ts`.
   - Chạy lệnh: `npx prisma db seed`.

#### GIAI ĐOẠN 3: Xây dựng Module Authentication & User Profile
1. **Tạo Auth Helper & JWT Service (`src/lib/auth.ts`):**
   - Hàm `hashPassword(password)` và `verifyPassword(password, hash)` dùng `bcryptjs`.
   - Hàm `signToken(payload)` và `verifyToken(token)`.
   - Hàm lấy thông tin user hiện tại từ Request Cookies (`getServerUser(req)`).
2. **Triển khai Route Handlers:**
   - `src/app/api/auth/register/route.ts`
   - `src/app/api/auth/login/route.ts`
   - `src/app/api/auth/me/route.ts`
   - `src/app/api/auth/logout/route.ts`
   - `src/app/api/user/profile/route.ts`
   - `src/app/api/user/password/route.ts`
   - `src/app/api/user/addresses/route.ts`
   - `src/app/api/user/addresses/[id]/route.ts`
   - `src/app/api/user/addresses/[id]/default/route.ts`

#### GIAI ĐOẠN 4: Xây dựng Module Products & Catalog API
1. **Triển khai Route Handlers:**
   - `src/app/api/products/route.ts` (Hỗ trợ đầy đủ bộ lọc category, priceRange, availability, sort, search, pagination).
   - `src/app/api/products/[id]/route.ts` (Tra cứu theo ID hoặc slug).
   - `src/app/api/categories/route.ts`
   - `src/app/api/products/related/route.ts`
2. **Cập nhật `product.service.ts`:**
   - Gọi trực tiếp Prisma khi ở Server Component / Route Handler.
   - Gọi `fetch('/api/products')` khi ở Client Component.

#### GIAI ĐOẠN 5: Xây dựng Module Cart, Wishlist, Coupon & Order Checkout
1. **Triển khai Route Handlers:**
   - `src/app/api/coupons/validate/route.ts`: Kiểm tra mã giảm giá thực tế từ bảng `Coupon`.
   - `src/app/api/cart/route.ts`: Lưu trữ giỏ hàng trong CSDL cho user đã đăng nhập.
   - `src/app/api/wishlist/route.ts`: Lưu trữ danh sách yêu thích trong CSDL.
   - `src/app/api/orders/route.ts`: Tạo đơn hàng trong Transaction, trừ tồn kho `Product`, ghi nhận coupon.
   - `src/app/api/orders/[id]/route.ts`: Chi tiết đơn hàng.
   - `src/app/api/user/orders/route.ts`: Lấy đơn của khách cho trang `/account`.

#### GIAI ĐOẠN 6: Xây dựng Module Reviews & Contact
1. **Triển khai Route Handlers:**
   - `src/app/api/reviews/route.ts` (GET danh sách & POST đánh giá mới kèm tự động cập nhật trung bình sao).
   - `src/app/api/contact/route.ts` (Lưu thông tin liên hệ).

#### GIAI ĐOẠN 7: Xây dựng Toàn bộ API Quản trị (Admin Portal APIs)
1. **Middleware bảo vệ quyền Admin:**
   - Kiểm tra `user.role === 'admin'`, nếu không phải trả 403 Forbidden.
2. **Triển khai Route Handlers Quản trị:**
   - `src/app/api/admin/dashboard/stats/route.ts`
   - `src/app/api/admin/products/route.ts` & `[id]/route.ts` (CRUD sản phẩm)
   - `src/app/api/admin/orders/route.ts` & `[id]/route.ts` (Xem & đổi trạng thái đơn)
   - `src/app/api/admin/customers/route.ts` & `[id]/route.ts` (CRUD user, toggle block, reset password)

#### GIAI ĐOẠN 8: Kiểm thử tích hợp toàn diện (End-to-End Validation)
1. Đăng ký tài khoản mới trên giao diện -> kiểm tra bản ghi xuất hiện trong MySQL.
2. Đăng nhập -> kiểm tra JWT cookie và hiển thị hồ sơ tại `/account`.
3. Thêm sản phẩm vào giỏ, nhập mã `ERGO10`, điền form thanh toán -> kiểm tra đơn hàng tạo thành công trong DB và kho giảm số lượng.
4. Mở `/admin/orders` -> thấy đơn hàng vừa đặt, đổi trạng thái sang "Đang giao" -> kiểm tra trang `/account` của khách lập tức thấy trạng thái cập nhật.
5. Kiểm tra phân quyền: Thử lấy tài khoản khách hàng thông thường truy cập `/admin` -> kiểm tra Auth Guard và API 403 chặn an toàn.

---

## 5. THƯ VIỆN & CÔNG CỤ CẦN THIẾT

Các thư viện đã có và cần bổ sung (nếu chưa có):
- `prisma`: CLI quản lý schema, migrate, studio (Đã có trong `devDependencies`)
- `@prisma/client`: Kết nối và truy vấn CSDL (Đã có trong `dependencies`)
- `bcryptjs` & `@types/bcryptjs`: Băm và so sánh mật khẩu an toàn
- `jose` hoặc `jsonwebtoken`: Ký và giải mã token JWT cho phiên đăng nhập
- `zod`: Kiểm tra tính hợp lệ của dữ liệu đầu vào (Đã có trong `dependencies`)

---
*Tài liệu này là căn cứ kỹ thuật chính xác 100% để triển khai tuần tự toàn bộ mã nguồn Backend cho dự án ErgoChair.*
