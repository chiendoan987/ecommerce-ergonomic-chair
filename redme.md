# 🪑 ErgoChair - Nền Tảng Thương Mại Điện Tử Ghế Công Thái Học Cao Cấp

> Website thương mại điện tử chuyên biệt về dòng nội thất công thái học cao cấp (Ergonomic Chairs). Dự án được xây dựng với định hướng mang lại trải nghiệm mua sắm tinh tế, tối giản sang trọng theo phong cách Zevora, hiệu ứng mượt mà và khả năng tương tác thời gian thực tối ưu.

---

## 📌 Mục Lục
1. [Giới Thiệu Dự Án](#-giới-thiệu-dự-án)
2. [Công Nghệ Sử Dụng (Tech Stack)](#-công-nghệ-sử-dụng-tech-stack)
3. [Cấu Trúc Thư Mục Hệ Thống](#-cấu-trúc-thư-mục-hệ-thống)
4. [Tổng Hợp Các Tính Năng Đã Hoàn Thiện](#-tổng-hợp-các-tính-năng-đã-hoàn-thiện)
   - [Trang Chủ (Landing Page)](#1-trang-chủ-landing-page---)
   - [Trang Danh Mục & Bộ Lọc Sản Phẩm (Catalog)](#2-trang-danh-mục--bộ-lọc-sản-phẩm-catalog---products)
   - [Trang Chi Tiết Sản Phẩm (Product Detail)](#3-trang-chi-tiết-sản-phẩm-product-detail---productsid)
   - [Trang Giỏ Hàng (Shopping Cart)](#4-trang-giỏ-hàng-shopping-cart---cart)
   - [Trang Đặt Hàng & Thanh Toán (Checkout)](#5-trang-đặt-hàng--thanh-toán-checkout---checkout)
   - [Trang Xác Nhận Đơn Hàng (Order Success)](#6-trang-xác-nhận-đơn-hàng---order-success)
   - [Trang Giới Thiệu & Liên Hệ (About & Contact)](#7-trang-giới-thiệu--liên-hệ---about--contact)
   - [Yêu Thích & Đánh Giá Sản Phẩm (Wishlist & Reviews)](#8-yêu-thích--đánh-giá-sản-phẩm-wishlist--reviews)
   - [Tài Khoản Người Dùng & Sổ Địa Chỉ (Auth & Account)](#9-tài-khoản-người-dùng--sổ-địa-chỉ-auth--account---login--account)
5. [Các Điểm Nhấn Kiến Trúc & Trải Nghiệm (UX/UI Highlights)](#-các-điểm-nhấn-kiến-trúc--trải-nghiệm-uxui-highlights)
6. [Hướng Dẫn Cài Đặt & Chạy Dự Án](#-hướng-dẫn-cài-đặt--chạy-dự-án)

---

## 🌟 Giới Thiệu Dự Án

**ErgoChair** là giải pháp mua sắm trực tuyến dành riêng cho khách hàng cá nhân và doanh nghiệp đang tìm kiếm các sản phẩm ghế công thái học bảo vệ sức khỏe cột sống. Hệ thống kết hợp giữa thương mại điện tử trực quan và tư vấn không gian làm việc hiện đại.

- **Phong cách thiết kế:** Tối giản sang trọng (Warm Minimalist & Editorial Design), sử dụng bảng màu tự nhiên (Kem, Be, Gỗ sồi, Than chì, Olive) tạo cảm giác an tâm và cao cấp.
- **Tiêu chuẩn typography:** Sử dụng chuẩn Zevora với font **Poppins** (Modern Sans-serif sắc nét, dễ đọc) kết hợp **Playfair Display** (Editorial Serif sang trọng cho tiêu đề).

---

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

| Hạng mục | Công nghệ / Thư viện | Ghi chú |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16.3.2** (App Router, Turbopack) | Kiến trúc ứng dụng hiện đại, render tối ưu |
| **Thư viện UI** | **React 19.2.8** | Tận dụng Hooks (`use`, `useMemo`, `useRef`, `useState`) |
| **Ngôn ngữ** | **TypeScript 5** | Định kiểu chặt chẽ toàn hệ thống |
| **Styling** | **Vanilla CSS + CSS Variables** | Quản lý tokens màu sắc, typography và layout linh hoạt |
| **Typography** | `next/font/google` (`Poppins` + `Playfair Display`) | Tối ưu nạp font cục bộ, không gây giật layout (zero CLS) |
| **Quản lý Giỏ hàng** | **React Context API + LocalStorage** | Lưu trữ giỏ hàng bền vững qua các phiên duyệt web |
| **Hiệu ứng cuộn** | **IntersectionObserver API + RequestAnimationFrame** | Scroll reveal và tự động cuộn trang mượt mà không cần thư viện nặng |

---

---

## 📁 Cấu Trúc Thư Mục Hệ Thống

```text
ecommerce-ergonomic-chair/
├── prisma/                     # Cấu hình ORM Prisma sẵn sàng cho MySQL
│   └── schema.prisma           # Định nghĩa Model Product, User, Order, Address, Review...
├── public/                     # Ảnh tĩnh, icon, thư viện ảnh sản phẩm
│   ├── images/products/        # Ảnh đại diện & bộ sưu tập ảnh chi tiết (gallery)
│   └── favicon.ico
├── src/
│   ├── app/                    # Next.js App Router (Các trang chính)
│   │   ├── layout.tsx          # Root Layout: Tích hợp Toast, Auth, Wishlist, Cart Providers
│   │   ├── template.tsx        # Template chuyển trang
│   │   ├── not-found.tsx       # Trang 404 tùy biến chuẩn thương hiệu
│   │   ├── globals.css         # Design Tokens, Reset CSS & Toàn bộ style giao diện
│   │   ├── page.tsx            # Trang Chủ (Home Landing Page)
│   │   ├── products/
│   │   │   ├── page.tsx        # Danh mục sản phẩm (Lọc realtime, tìm kiếm, cuộn tự động)
│   │   │   └── [id]/           # Dynamic SEO Metadata & Chi tiết sản phẩm
│   │   ├── cart/page.tsx       # Giỏ hàng & áp dụng mã giảm giá
│   │   ├── checkout/page.tsx   # Thanh toán, tự điền địa chỉ người dùng hoặc mua không tài khoản
│   │   ├── order-success/page.tsx # Trang chúc mừng đặt hàng thành công
│   │   ├── wishlist/page.tsx   # Trang danh sách sản phẩm yêu thích
│   │   ├── login/page.tsx      # Đăng nhập / Đăng ký (kèm tài khoản Demo 1 chạm)
│   │   ├── register/page.tsx   # Điều hướng đồng bộ tới Login/Register tab
│   │   ├── account/page.tsx    # Bảng điều khiển tài khoản: Thông tin, Sổ địa chỉ, Lịch sử đơn hàng
│   │   ├── about/page.tsx      # Trang giới thiệu thương hiệu & câu chuyện ErgoChair
│   │   └── contact/page.tsx    # Trang liên hệ, hotline, địa chỉ showroom
│   ├── components/             # Các Component tái sử dụng
│   │   ├── site-header.tsx     # Header toàn cục: Điều hướng, Tìm kiếm, Wishlist, Giỏ hàng, Auth Avatar
│   │   ├── product-card.tsx    # Thẻ sản phẩm chuẩn hóa với nút Wishlist & nhãn tình trạng kho
│   │   ├── product-reviews.tsx # Khu vực đánh giá, phân bố sao và form gửi nhận xét
│   │   ├── recently-viewed-products.tsx # Băng chuyền sản phẩm vừa xem
│   │   ├── toast-provider.tsx  # Cổng thông báo nổi toàn cục (Toast Notifications)
│   │   ├── cart-provider.tsx   # Context quản lý giỏ hàng & logic bảo vệ kho
│   │   └── ...
│   ├── contexts/               # Các React Context chia sẻ trạng thái
│   │   ├── auth-context.tsx    # Trạng thái đăng nhập, tài khoản người dùng & sổ địa chỉ
│   │   ├── wishlist-context.tsx# Quản lý danh sách yêu thích
│   │   └── toast-context.tsx   # Hệ thống thông báo toast (success, error, info)
│   ├── hooks/                  # Custom React Hooks
│   │   ├── use-auth.ts         # Hook thao tác auth & profile
│   │   ├── use-wishlist.ts     # Hook thao tác wishlist
│   │   ├── use-toast.ts        # Hook bắn thông báo toast
│   │   └── use-recently-viewed.ts # Hook lưu và đọc sản phẩm vừa xem
│   └── lib/                    # Kiến trúc tầng dịch vụ (Service Layer & Types)
│       ├── types/              # Chuẩn hóa dữ liệu tương thích Prisma (product, order, user, cart...)
│       ├── services/           # Service Layer đóng gói nghiệp vụ (auth, order, product, wishlist...)
│       ├── data/               # Mock data cô lập (mock-products, mock-users, mock-orders...)
│       └── utils/              # Tiện ích định dạng tiền tệ, xử lý chuỗi
├── .env.example                # Khung biến môi trường chuẩn bị cho DB & API
├── package.json                # Dependencies & scripts
└── tsconfig.json               # Cấu hình TypeScript nghiêm ngặt (strict: true)
```

---

## 🚀 Tổng Hợp Các Tính Năng Đã Hoàn Thiện

### 1. Trang Chủ (Landing Page - `/`)
- **Header thông minh:** Cố định khi cuộn trang (Sticky Header), tích hợp menu điều hướng, dropdown danh mục sản phẩm, tìm kiếm nhanh và giỏ hàng có badge hiển thị số lượng tức thì.
- **Hero Section nổi bật:** Tiêu đề ấn tượng chuẩn font Zevora, lời giới thiệu truyền cảm hứng, nút kêu gọi hành động (CTA) và số liệu uy tín.
- **Khối thương hiệu tin dùng (Trust Badges):** Logo đối tác cao cấp.
- **Sản phẩm nổi bật (Featured Products):** Hiển thị các mẫu ghế bán chạy kèm nhãn giảm giá, đánh giá sao, giá bán và nút thêm nhanh vào giỏ.
- **Danh mục theo nhu cầu:** 4 thẻ danh mục lớn trực quan:
  - *Ghế công thái học*
  - *Ghế văn phòng*
  - *Ghế gaming*
  - *Ghế lãnh đạo*
- **Câu chuyện thương hiệu (Story & Value):** 4 giá trị cốt lõi: Thiết kế công thái học, bảo hành chính hãng 5 năm, miễn phí vận chuyển, tư vấn tận tâm.
- **Khách hàng phản hồi (Reviews):** Nhận xét thực tế từ khách hàng uy tín kèm số điểm trung bình 4.9/5 sao.

---

### 2. Trang Danh Mục & Bộ Lọc Sản Phẩm (Catalog - `/products`)
- **Bộ lọc Thời Gian Thực (Realtime Filter - Không reload trang):**
  - Lọc theo **Danh mục** (Tất cả loại ghế, Ghế công thái học, Ghế văn phòng, Ghế gaming, Ghế lãnh đạo).
  - Lọc theo **Khoảng giá** (< 5 triệu, 5 – 8 triệu, 8 – 12 triệu, > 12 triệu).
  - Lọc theo **Tình trạng hàng** (Tất cả, Còn hàng, Tạm hết hàng).
  - Sắp xếp theo: Nổi bật nhất, Giá thấp đến cao, Giá cao đến thấp, Đánh giá cao nhất.
  - Trạng thái lọc được đồng bộ êm ả lên URL qua `window.history.replaceState` mà **không bị reload trang hay bị nhảy cuộn lên đầu**.
- **Tìm kiếm tức thì:** Tìm kiếm theo tên sản phẩm có hỗ trợ tiếng Việt có dấu và không dấu.
- **Tự động cuộn mượt xuống sản phẩm (Slow Smooth Scroll):**
  - Khi người dùng bấm vào danh mục từ menu Header hoặc thẻ danh mục ngoài trang chủ: Trang mở ra, giữ vài khoảnh khắc (~450ms) để người xem thấy tiêu đề danh mục, sau đó **tự động lướt chậm rãi, êm ái (`900ms` với gia tốc `easeInOutCubic`)** xuống đúng khu vực danh sách sản phẩm.
  - Có tính toán trừ hao chính xác chiều cao của thanh điều hướng cố định (Desktop: `94px`, Mobile: `76px`) giúp không bị che khuất nội dung.
- **Hỗ trợ sản phẩm tạm hết hàng:** Thẻ sản phẩm hiển thị nhãn "Tạm hết hàng", cho phép bấm vào ảnh hoặc nút **"Xem chi tiết →"** để vào trang thông tin sản phẩm.

---

### 3. Trang Chi Tiết Sản Phẩm (Product Detail - `/products/[id]`)
- **Bộ sưu tập ảnh đa góc độ (Gallery):** Xem ảnh lớn sắc nét, chuyển đổi nhanh qua danh sách ảnh thu nhỏ (Thumbnails).
- **Thông tin sản phẩm toàn diện:** Tên sản phẩm, danh mục, giá niêm yết, giá khuyến mãi (`-X%`), mô tả chi tiết, số sao đánh giá.
- **Thông số kỹ thuật chuẩn chỉnh:** Chất liệu, màu sắc, kích thước, trọng lượng, tải trọng tối đa, thời gian bảo hành.
- **Cơ chế xử lý thông minh khi sản phẩm "Tạm hết hàng":**
  - Vẫn cho phép người dùng vào xem toàn bộ thông tin chi tiết, hình ảnh và đánh giá.
  - Hiển thị hộp cảnh báo trang nhã: *"Sản phẩm này hiện đang tạm thời hết hàng tại kho. Các chức năng đặt mua trực tuyến cho mẫu ghế này hiện đang tạm khóa."*
  - **Khóa hoàn toàn các chức năng mua bán:**
    - Bộ chọn số lượng (Quantity) bị vô hiệu hóa (`disabled`), hiển thị về `0`.
    - Nút "Thêm vào giỏ hàng" chuyển sang trạng thái disabled với nhãn *"Tạm hết hàng"*.
    - Nút "Mua ngay" được thay bằng nút tiện ích **"Liên hệ tư vấn →"** dẫn sang trang liên hệ để khách hàng đăng ký giữ hàng đợt tới.
    - Tầng logic `CartProvider` ngăn chặn tuyệt đối việc thêm sản phẩm hết hàng vào giỏ hàng.
- **Sản phẩm liên quan (Related Products):** Tự động gợi ý các mẫu ghế cùng danh mục để người dùng dễ dàng tham khảo thay thế.

---

### 4. Trang Giỏ Hàng (Shopping Cart - `/cart`)
- **Hiển thị danh sách giỏ hàng chi tiết:** Ảnh sản phẩm, tên, đơn giá, số lượng, thành tiền từng món.
- **Quản lý linh hoạt:** Tăng / giảm số lượng tức thì hoặc xóa sản phẩm khỏi giỏ.
- **Lưu trữ bền bỉ (Persistent Storage):** Toàn bộ giỏ hàng được đồng bộ tự động với `localStorage`, không bị mất khi tải lại trang hoặc đóng trình duyệt.
- **Mã khuyến mãi (Promo Code):**
  - Hỗ trợ nhập mã ưu đãi (ví dụ: `ERGO10` giảm 10%, `VIP20` giảm 20%).
  - Tự động trừ tiền giảm giá vào tổng hóa đơn.
- **Tóm tắt đơn hàng:** Hiển thị tạm tính, chiết khấu, phí vận chuyển và tổng thanh toán rõ ràng.

---

### 5. Trang Đặt Hàng & Thanh Toán (Checkout - `/checkout`)
- **Biểu mẫu thông tin giao hàng chuẩn Việt Nam:**
  - Họ và tên, số điện thoại, địa chỉ email.
  - Địa chỉ cụ thể, Tỉnh/Thành phố, Quận/Huyện, Ghi chú giao hàng.
- **Xác thực dữ liệu form (Validation):**
  - Kiểm tra số điện thoại hợp lệ (chuẩn di động Việt Nam từ 9 đến 11 chữ số).
  - Kiểm tra định dạng email hợp lệ.
  - Báo lỗi trực quan ngay dưới từng ô nhập nếu bỏ trống.
- **Phương thức thanh toán:** Hỗ trợ thanh toán khi nhận hàng (COD) và Chuyển khoản ngân hàng.
- **Bảo mật & Tự động làm sạch giỏ:** Sau khi đặt hàng thành công, giỏ hàng tự động được dọn trống để chuẩn bị cho đơn hàng mới.

---

### 6. Trang Xác Nhận Đơn Hàng (`/order-success`)
- Thông báo xác nhận đơn hàng thành công kèm icon tick xanh thẩm mỹ.
- Tóm tắt tổng giá trị đơn hàng vừa đặt và phương thức thanh toán đã chọn.
- Các nút điều hướng nhanh: "Tiếp tục mua sắm" hoặc "Về trang chủ".

---

### 7. Trang Giới Thiệu & Liên Hệ (`/about` & `/contact`)
- **Về chúng tôi (`/about`):** Giới thiệu triết lý sản phẩm, tinh thần lấy sức khỏe cơ thể làm trung tâm, vật liệu bền vững.
- **Liên hệ (`/contact`):** Hotline hỗ trợ `1800 6868`, email tư vấn, địa chỉ văn phòng/showroom thực tế tại Hà Nội.

---

### 8. Yêu Thích & Đánh Giá Sản Phẩm (Wishlist & Reviews)
- **Hệ thống Yêu Thích (`/wishlist` & Quick Toggle):**
  - Nút biểu tượng trái tim tiện lợi trên mỗi thẻ sản phẩm (`ProductCard`) và trang chi tiết sản phẩm.
  - Lưu trữ bền vững qua `WishlistProvider` và `wishlist.service.ts` (LocalStorage).
  - Badge đếm số lượng trực tiếp trên thanh Header.
  - Trang `/wishlist` hỗ trợ xem nhanh, thêm vào giỏ hàng hoặc xóa sản phẩm.
- **Hệ thống Đánh Giá Sản Phẩm (Customer Reviews):**
  - Hiển thị trực quan điểm trung bình và biểu đồ thanh phân bố sao (5 sao đến 1 sao).
  - Form gửi nhận xét trực tiếp (chọn số sao, họ tên, email, nội dung).
  - Thông báo thành công với hệ thống Toast toàn cục, đóng gói qua `review.service.ts`.
- **Sản Phẩm Đã Xem Gần Đây (Recently Viewed):**
  - Băng chuyền hiển thị các mẫu ghế người dùng vừa ghé thăm, cập nhật tự động qua `recently-viewed.service.ts`.

---

### 9. Tài Khoản Người Dùng & Sổ Địa Chỉ (Auth & Account - `/login` & `/account`)
- **Đăng Nhập & Đăng Ký Thống Nhất (`/login`):**
  - Chuyển đổi mượt giữa 2 tab Đăng nhập và Đăng ký.
  - Hỗ trợ **Đăng nhập 1-chạm (Quick Demo Accounts)** với tài khoản Khách hàng mẫu (`quan.tran@example.com`) và tài khoản Quản trị viên (`admin@ergochair.vn`).
  - Quản lý trạng thái đăng nhập qua `auth.service.ts` và `AuthProvider`.
- **Trang Quản Lý Tài Khoản (`/account`):**
  - **Lịch sử đơn hàng:** Tra cứu toàn bộ đơn hàng của tài khoản, trạng thái (Chờ xử lý, Đang giao, Đã giao...), danh sách mặt hàng, phương thức thanh toán và tổng tiền.
  - **Sổ địa chỉ giao hàng:** Thêm địa chỉ mới, chỉnh sửa, xóa và chọn địa chỉ nhận hàng mặc định.
  - **Thông tin cá nhân:** Cập nhật họ tên, số điện thoại người dùng nhanh chóng.
- **Thanh toán Thông minh (Smart Checkout - `/checkout`):**
  - Tự động điền thông tin và địa chỉ giao hàng mặc định nếu người dùng đã đăng nhập.
  - Bộ chọn nhanh các địa chỉ đã lưu trong sổ địa chỉ.
  - Hỗ trợ mua không cần đăng nhập (Guest Checkout) kèm banner khuyến khích đăng nhập.
  - Đa dạng phương thức thanh toán: COD, Chuyển khoản ngân hàng, VNPAY QR, Ví điện tử MoMo.
  - Lưu vết đơn hàng vào `order.service.ts` gắn với ID người dùng để hiển thị ngay trong lịch sử mua hàng.

---

## 💎 Các Điểm Nhấn Kiến Trúc & Trải Nghiệm (UX/UI Highlights)

1. **Hệ thống Animation Xuất Hiện Dần (Scroll Reveal System):**
   - Sử dụng `IntersectionObserver` thuần không gây nặng web.
   - Các phần tử mang thuộc tính `data-reveal="up"`, `fade`, `scale`, `right` sẽ xuất hiện mượt mà khi người dùng cuộn đến.
2. **Cơ Chế Lướt Trang Chậm Rãi Cao Cấp (Custom Easing Smooth Scroll):**
   - Không dùng `scroll-behavior: smooth` cứng nhắc mặc định của trình duyệt.
   - Tính toán bằng `requestAnimationFrame` với đường cong `easeInOutCubic` trong thời lượng `900ms`:
     - Bắt đầu di chuyển từ từ.
     - Lướt êm ái ở giữa.
     - Đáp nhẹ nhàng không giật khựng khi đến đích.
   - Tự động ngắt khi người dùng chạm tay hoặc lăn chuột để trả quyền điều khiển ngay lập tức.
3. **Tự động đưa về đầu trang khi F5 / Chuyển trang:**
   - Ngăn chặn tình trạng trình duyệt nhớ vị trí cuộn dở dang của trang trước làm mất bố cục.
4. **Nút "Lên đầu trang" (Scroll To Top Button):**
   - Nút tròn nổi tinh tế ở góc phải màn hình, tự động xuất hiện khi người dùng cuộn quá `350px`.
5. **Thiết Kế Đáp Ứng Toàn Diện (Responsive Design):**
   - Giao diện được kiểm thử và tối ưu trên tất cả kích thước màn hình: Mobile (< 560px), Tablet (560px - 800px), và Desktop (> 800px). Menu trên điện thoại chuyển đổi thành Drawer tiện dụng.

---

## 💻 Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu cầu hệ thống:
- **Node.js:** Phiên bản 18.18.0 hoặc mới hơn (khuyên dùng Node 20 LTS).
- **Trình quản lý gói:** `npm`, `yarn`, `pnpm` hoặc `bun`.

### Các bước khởi chạy:

1. **Cài đặt thư viện dependencies:**
   ```bash
   npm install
   ```

2. **Chạy máy chủ phát triển (Development Server):**
   ```bash
   npm run dev
   ```
   Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000)

3. **Kiểm tra cú pháp & kiểm tra mã lỗi (Linting):**
   ```bash
   npm run lint
   ```

4. **Đóng gói sản phẩm (Production Build):**
   ```bash
   npm run build
   ```

5. **Chạy bản phát hành chính thức (Production Server):**
   ```bash
   npm run start
   ```

---

*Tài liệu được cập nhật tự động và đồng bộ với toàn bộ mã nguồn của dự án ErgoChair.*
