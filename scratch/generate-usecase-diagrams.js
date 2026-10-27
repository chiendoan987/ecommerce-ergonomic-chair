const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'use case');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const commonSkinParam = `!theme plain
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 12
skinparam packageStyle rectangle
skinparam shadowing false
skinparam roundCorner 8
left to right direction

skinparam actor {
    BackgroundColor #FEF3C7
    BorderColor #D97706
    FontColor #1E293B
    FontStyle bold
}

skinparam usecase {
    BackgroundColor #EFF6FF
    BorderColor #2563EB
    BorderThickness 1.2
    FontColor #0F172A
    ArrowColor #2563EB
}

skinparam rectangle {
    BackgroundColor #F8FAFC
    BorderColor #64748B
    FontColor #0F172A
    FontStyle bold
}

skinparam note {
    BackgroundColor #FFFBEB
    BorderColor #F59E0B
    FontColor #92400E
    FontSize 11
}
`;

const diagrams = [
  // 00. Tổng quan toàn hệ thống
  {
    fileName: '00_tong_quan_toan_he_thong.puml',
    title: 'Sơ đồ Use Case Tổng thể Toàn Hệ thống ErgoChair',
    content: `@startuml
${commonSkinParam}

title SƠ ĐỒ USE CASE TỔNG THỂ TOÀN HỆ THỐNG E-COMMERCE ERGOCHAIR

' === ACTORS ===
actor "Khách vãng lai\\n(Guest User)" as Guest
actor "Khách hàng thành viên\\n(Registered Customer)" as Customer
actor "Quản trị viên\\n(System Admin)" as Admin
actor "Cổng thanh toán\\n(VNPay / VietQR)" as PaymentGateway <<system>>
actor "Hệ thống AI LLM\\n(Groq API)" as GroqAI <<system>>

Customer --|> Guest : <<generalization>>

rectangle "Nền tảng E-Commerce Ghế Công Thái Học ErgoChair" {
    package "Phân hệ Khách hàng (Storefront)" {
        usecase "UC01 - Duyệt & Tìm kiếm sản phẩm" as UC_Catalog
        usecase "UC02 - Xem chi tiết & Tương tác ghế" as UC_Detail
        usecase "UC03 - Quản lý Giỏ hàng & Wishlist" as UC_CartWishlist
        usecase "UC04 - Đặt hàng & Thanh toán" as UC_Checkout
        usecase "UC05 - Tra cứu đơn hàng công khai" as UC_Tracking
        usecase "UC06 - Đánh giá & Nhận xét" as UC_Review
        usecase "UC07 - Đăng ký / Đăng nhập tài khoản" as UC_Auth
        usecase "UC08 - Quản lý Hồ sơ & Sổ địa chỉ" as UC_Profile
        usecase "UC09 - Xem lịch sử đơn hàng cá nhân" as UC_OrderHistory
        usecase "UC10 - Trò chuyện với Trợ lý AI ErgoBot" as UC_AIBot
        usecase "UC11 - Gửi phiếu quên mật khẩu" as UC_ForgotPass
    }

    package "Phân hệ Quản trị viên (Admin Portal)" {
        usecase "UC-AD01 - Giám sát Dashboard KPI & Doanh thu" as AD_Dashboard
        usecase "UC-AD02 - Quản lý Sản phẩm (CRUD & Tồn kho)" as AD_Product
        usecase "UC-AD03 - Quản lý Danh mục hàng hóa" as AD_Category
        usecase "UC-AD04 - Quản lý Vận đơn & Trạng thái đơn" as AD_Order
        usecase "UC-AD05 - Quản lý Khách hàng & CLV" as AD_Customer
        usecase "UC-AD06 - Quản lý Tài khoản & Phân quyền" as AD_User
        usecase "UC-AD07 - Xử lý Hàng đợi cấp lại mật khẩu" as AD_ResetQueue
        usecase "UC-AD08 - Quản lý Tệp tin đa phương tiện" as AD_Media
    }
}

' === GUEST & CUSTOMER ASSOCIATIONS ===
Guest --> UC_Catalog
Guest --> UC_Detail
Guest --> UC_CartWishlist
Guest --> UC_Checkout
Guest --> UC_Tracking
Guest --> UC_Review
Guest --> UC_Auth
Guest --> UC_ForgotPass
Guest --> UC_AIBot

Customer --> UC_Profile
Customer --> UC_OrderHistory

' === EXTERNAL SYSTEM INTERACTIONS ===
UC_Checkout --> PaymentGateway
UC_AIBot --> GroqAI

' === ADMIN ASSOCIATIONS ===
Admin --> AD_Dashboard
Admin --> AD_Product
Admin --> AD_Category
Admin --> AD_Order
Admin --> AD_Customer
Admin --> AD_User
Admin --> AD_ResetQueue
Admin --> AD_Media

note bottom of Customer
  Khách hàng thành viên thừa hưởng
  toàn bộ chức năng của Khách vãng lai,
  đồng thời có thêm quyền quản lý hồ sơ,
  sổ địa chỉ và lịch sử đơn hàng.
end note

@enduml`
  },

  // 01. Tổng quan phân hệ khách hàng
  {
    fileName: '01_tong_quan_phan_he_khach_hang.puml',
    title: 'Sơ đồ Use Case Tổng thể Phân hệ Khách hàng (Storefront)',
    content: `@startuml
${commonSkinParam}

title SƠ ĐỒ USE CASE PHÂN HỆ KHÁCH HÀNG (STOREFRONT)

actor "Khách vãng lai" as Guest
actor "Khách hàng thành viên" as Customer
actor "Cổng thanh toán" as PG <<system>>
actor "Groq AI Service" as AI <<system>>

Customer --|> Guest : <<generalization>>

rectangle "Phân Hệ Khách Hàng (ErgoChair Storefront)" {
    package "Khám phá & Chọn lựa" {
        usecase "UC-01: Duyệt danh mục sản phẩm" as UC01
        usecase "UC-02: Tìm kiếm & Lọc đa tiêu chí" as UC02
        usecase "UC-03: Xem chi tiết & Thông số ghế" as UC03
        usecase "UC-04: Quản lý danh sách yêu thích" as UC04
    }

    package "Mua hàng & Giao vận" {
        usecase "UC-05: Quản lý giỏ hàng" as UC05
        usecase "UC-06: Thực hiện đặt hàng (Checkout)" as UC06
        usecase "UC-07: Thanh toán trực tuyến Sandbox" as UC07
        usecase "UC-08: Tra cứu hành trình đơn hàng" as UC08
    }

    package "Tương tác & Đánh giá" {
        usecase "UC-09: Gửi đánh giá nhận xét" as UC09
        usecase "UC-16: Chat tư vấn với AI ErgoBot" as UC16
        usecase "UC-17: Kênh liên hệ tư vấn đa kênh" as UC17
    }

    package "Tài khoản & Xác thực" {
        usecase "UC-10: Đăng ký tài khoản" as UC10
        usecase "UC-11: Đăng nhập hệ thống" as UC11
        usecase "UC-12: Quản lý hồ sơ & Sổ địa chỉ" as UC12
        usecase "UC-13: Xem lịch sử đơn hàng cá nhân" as UC13
        usecase "UC-14: Đổi mật khẩu cá nhân" as UC14
        usecase "UC-15: Gửi yêu cầu cấp lại mật khẩu" as UC15
    }
}

' Relations
Guest --> UC01
Guest --> UC02
Guest --> UC03
Guest --> UC04
Guest --> UC05
Guest --> UC06
Guest --> UC08
Guest --> UC09
Guest --> UC10
Guest --> UC11
Guest --> UC15
Guest --> UC16
Guest --> UC17

Customer --> UC12
Customer --> UC13
Customer --> UC14

UC06 .> UC05 : <<include>>
UC06 .> UC07 : <<extend>>
UC07 --> PG
UC16 --> AI

@enduml`
  },

  // 02. Tổng quan phân hệ quản trị
  {
    fileName: '02_tong_quan_phan_he_quan_tri.puml',
    title: 'Sơ đồ Use Case Tổng thể Phân hệ Quản trị viên (Admin Portal)',
    content: `@startuml
${commonSkinParam}

title SƠ ĐỒ USE CASE PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN PORTAL)

actor "Quản trị viên\\n(System Administrator)" as Admin
actor "Máy chủ lưu trữ Media" as MediaServer <<system>>

rectangle "Phân Hệ Quản Trị Viên (ErgoChair Admin Portal)" {
    package "Báo cáo & Thống kê" {
        usecase "UC-AD01: Giám sát Dashboard KPI & Doanh thu" as AD01
    }

    package "Quản trị Hàng hóa & Danh mục" {
        usecase "UC-AD02: Quản lý sản phẩm toàn diện (CRUD)" as AD02
        usecase "UC-AD03: Bật/Tắt tồn kho tức thì" as AD03
        usecase "UC-AD04: Quản lý danh mục hàng hóa" as AD04
    }

    package "Vận hành Đơn hàng & Dòng tiền" {
        usecase "UC-AD05: Quản lý tiến độ đơn hàng" as AD05
        usecase "UC-AD06: Cập nhật trạng thái thanh toán" as AD06
    }

    package "Quản trị Khách hàng & Nhân sự" {
        usecase "UC-AD07: Xem hồ sơ khách hàng 360 & CLV" as AD07
        usecase "UC-AD08: Khóa / Mở khóa tài khoản người dùng" as AD08
        usecase "UC-AD09: Quản lý tài khoản hệ thống & Phân quyền" as AD09
        usecase "UC-AD10: Đặt lại mật khẩu tài khoản trực tiếp" as AD10
        usecase "UC-AD11: Xử lý hàng đợi cấp lại mật khẩu" as AD11
    }

    package "Dịch vụ Hệ thống" {
        usecase "UC-AD12: Tải lên & Quản lý tệp tin Media" as AD12
    }
}

Admin --> AD01
Admin --> AD02
Admin --> AD03
Admin --> AD04
Admin --> AD05
Admin --> AD06
Admin --> AD07
Admin --> AD08
Admin --> AD09
Admin --> AD10
Admin --> AD11
Admin --> AD12

AD02 .> AD12 : <<include>>
AD12 --> MediaServer

@enduml`
  },

  // UC-01
  {
    fileName: 'UC-01_duyet_kham_pha_san_pham.puml',
    title: 'UC-01: Duyệt & Khám Phá Sản Phẩm',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-01: DUYỆT & KHÁM PHÁ SẢN PHẨM

actor "Khách vãng lai" as Guest
actor "Khách hàng thành viên" as Customer

Customer --|> Guest : <<generalization>>

rectangle "Hệ Thống Storefront (Catalog & Discovery)" {
    usecase "UC-01: Duyệt & Khám phá sản phẩm" as UC01
    usecase "Xem menu danh mục động" as Sub_Menu
    usecase "Xem danh sách ghế theo danh mục" as Sub_List
    usecase "Xem danh sách sản phẩm nổi bật" as Sub_Featured
    usecase "Cuộn mượt mà có gia tốc (Custom Easing)" as Sub_Scroll
    usecase "UC-03: Xem chi tiết sản phẩm" as UC03
}

Guest --> UC01

UC01 .> Sub_Menu : <<include>>
UC01 .> Sub_List : <<include>>
UC01 .> Sub_Featured : <<include>>
UC01 .> Sub_Scroll : <<include>>
UC03 .> UC01 : <<extend>>

note right of Sub_Scroll
  Kích hoạt hiệu ứng cuộn mượt mà
  easeInOutCubic (900ms) bù trừ
  chiều cao Header (94px / 76px)
end note

note right of Sub_Menu
  Tải động danh mục từ MySQL,
  đồng bộ Custom Event Header
end note

@enduml`
  },

  // UC-02
  {
    fileName: 'UC-02_tim_kiem_loc_da_tieu_chi.puml',
    title: 'UC-02: Tìm Kiếm & Lọc Đa Tiêu Chí',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-02: TÌM KIẾM & LỌC ĐA TIÊU CHÍ

actor "Khách vãng lai" as Guest
actor "Khách hàng thành viên" as Customer

Customer --|> Guest : <<generalization>>

rectangle "Hệ Thống Storefront (Search & Filter Engine)" {
    usecase "UC-02: Tìm kiếm & Lọc sản phẩm" as UC02
    usecase "Tìm kiếm tiếng Việt không dấu" as Sub_SearchText
    usecase "Lọc theo 4 khoảng giá" as Sub_FilterPrice
    usecase "Lọc theo trạng thái tồn kho" as Sub_FilterStock
    usecase "Sắp xếp theo giá / đánh giá sao" as Sub_Sort
    usecase "Đồng bộ bộ lọc lên URL Params" as Sub_URLSync
}

Guest --> UC02

UC02 .> Sub_SearchText : <<include>>
UC02 .> Sub_URLSync : <<include>>
Sub_FilterPrice .> UC02 : <<extend>>
Sub_FilterStock .> UC02 : <<extend>>
Sub_Sort .> UC02 : <<extend>>

note right of Sub_SearchText
  Chuẩn hóa chuỗi tìm kiếm tức thì:
  loại bỏ dấu thanh, đ/Đ -> d,
  phản hồi ngay trong < 100ms
end note

note right of Sub_URLSync
  Lưu trạng thái lọc vào URL
  qua replaceState, không reload trang
end note

@enduml`
  },

  // UC-03
  {
    fileName: 'UC-03_xem_chi_tiet_san_pham.puml',
    title: 'UC-03: Xem Chi Tiết & Tương Tác Sản Phẩm',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-03: XEM CHI TIẾT & TƯƠNG TÁC SẢN PHẨM

actor "Khách vãng lai" as Guest
actor "Khách hàng thành viên" as Customer

Customer --|> Guest : <<generalization>>

rectangle "Hệ Thống Storefront (Product Detail Page)" {
    usecase "UC-03: Xem chi tiết sản phẩm" as UC03
    usecase "Xem bộ sưu tập 5 ảnh (Gallery)" as Sub_Gallery
    usecase "Xem bảng thông số kỹ thuật (Specs)" as Sub_Specs
    usecase "Xem video giới thiệu ghế" as Sub_Video
    usecase "Kiểm tra khóa tồn kho (Stock Guard)" as Sub_StockGuard
    usecase "Tự động ghi nhận sản phẩm vừa xem" as Sub_Recent
    usecase "UC-04: Thêm vào yêu thích" as UC04
    usecase "UC-05: Thêm vào giỏ hàng" as UC05
    usecase "Chuyển hướng tư vấn (khi hết hàng)" as Sub_Contact
}

Guest --> UC03

UC03 .> Sub_Gallery : <<include>>
UC03 .> Sub_Specs : <<include>>
UC03 .> Sub_StockGuard : <<include>>
UC03 .> Sub_Recent : <<include>>

Sub_Video .> UC03 : <<extend>>
UC04 .> UC03 : <<extend>>
UC05 .> UC03 : <<extend>>
Sub_Contact .> Sub_StockGuard : <<extend>>

note right of Sub_StockGuard
  BR-01: Nếu stockQuantity = 0:
  - Khóa ô số lượng và nút mua
  - Hiện nút "Liên hệ tư vấn"
end note

@enduml`
  },

  // UC-04
  {
    fileName: 'UC-04_quan_ly_danh_sach_yeu_thich.puml',
    title: 'UC-04: Quản Lý Danh Sách Yêu Thích (Wishlist)',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-04: QUẢN LÝ DANH SÁCH YÊU THÍCH (WISHLIST)

actor "Khách vãng lai" as Guest
actor "Khách hàng thành viên" as Customer

Customer --|> Guest : <<generalization>>

rectangle "Hệ Thống Storefront (Wishlist Management)" {
    usecase "UC-04: Quản lý danh sách yêu thích" as UC04
    usecase "Thêm ghế vào danh sách yêu thích" as Sub_Add
    usecase "Bỏ ghế khỏi danh sách yêu thích" as Sub_Remove
    usecase "Xem trang danh sách yêu thích" as Sub_View
    usecase "Chuyển nhanh ghế vào giỏ hàng" as Sub_MoveToCart
    usecase "Xóa toàn bộ danh sách yêu thích" as Sub_ClearAll
    usecase "Đồng bộ bộ nhớ LocalStorage" as Sub_Storage
}

Guest --> UC04

UC04 .> Sub_Add : <<include>>
UC04 .> Sub_Remove : <<include>>
UC04 .> Sub_View : <<include>>
UC04 .> Sub_Storage : <<include>>

Sub_MoveToCart .> Sub_View : <<extend>>
Sub_ClearAll .> Sub_View : <<extend>>

note right of Sub_Storage
  Lưu trữ liên tục trong
  localStorage key 'ergochair-wishlist'
  bảo toàn dữ liệu khi F5
end note

@enduml`
  },

  // UC-05
  {
    fileName: 'UC-05_quan_ly_gio_hang.puml',
    title: 'UC-05: Quản Lý Giỏ Hàng Mua Sắm',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-05: QUẢN LÝ GIỎ HÀNG MUA SẮM

actor "Khách vãng lai" as Guest
actor "Khách hàng thành viên" as Customer

Customer --|> Guest : <<generalization>>

rectangle "Hệ Thống Storefront (Cart Management)" {
    usecase "UC-05: Quản lý giỏ hàng" as UC05
    usecase "Thêm sản phẩm vào giỏ" as Sub_Add
    usecase "Tăng / Giảm số lượng món" as Sub_ChangeQty
    usecase "Xóa sản phẩm khỏi giỏ" as Sub_RemoveItem
    usecase "Xóa toàn bộ giỏ hàng" as Sub_ClearCart
    usecase "Xem chi tiết giỏ hàng" as Sub_ViewCart
    usecase "Kiểm tra ràng buộc tồn kho (BR-01)" as Sub_CheckStock
    usecase "Tự động tính tạm tính & tiền ship" as Sub_CalcSubtotal
}

Guest --> UC05

UC05 .> Sub_Add : <<include>>
UC05 .> Sub_ChangeQty : <<include>>
UC05 .> Sub_RemoveItem : <<include>>
UC05 .> Sub_ViewCart : <<include>>
UC05 .> Sub_CheckStock : <<include>>
UC05 .> Sub_CalcSubtotal : <<include>>

Sub_ClearCart .> Sub_ViewCart : <<extend>>

note right of Sub_CheckStock
  BR-01: Chặn tuyệt đối hành vi thêm
  vào giỏ nếu sản phẩm inStock=false
  hoặc stockQuantity = 0
end note

note bottom of UC05
  Đồng bộ realtime giữa các tab
  thông qua ergochair-cart LocalStorage
end note

@enduml`
  },

  // UC-06
  {
    fileName: 'UC-06_thuc_hien_dat_hang_checkout.puml',
    title: 'UC-06: Thực Hiện Đặt Hàng & Checkout',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-06: THỰC HIỆN ĐẶT HÀNG & CHECKOUT

actor "Khách vãng lai" as Guest
actor "Khách hàng thành viên" as Customer
actor "Cổng thanh toán trực tuyến" as PG <<system>>

Customer --|> Guest : <<generalization>>

rectangle "Hệ Thống Storefront (Checkout & Order Flow)" {
    usecase "UC-06: Thực hiện đặt hàng (Checkout)" as UC06
    usecase "Nhập thông tin giao hàng chuẩn VN" as Sub_ShippingInfo
    usecase "Tự động điền từ Sổ địa chỉ" as Sub_AutoFill
    usecase "Chọn phương thức vận chuyển" as Sub_ShippingMethod
    usecase "Chọn hình thức thanh toán" as Sub_PaymentMethod
    usecase "Áp dụng mã giảm giá (Coupon)" as Sub_Coupon
    usecase "Tạo đơn hàng & Trừ kho (POST /api/orders)" as Sub_CreateOrder
    usecase "UC-07: Thanh toán trực tuyến Sandbox" as UC07
}

Guest --> UC06
Customer --> UC06

UC06 .> Sub_ShippingInfo : <<include>>
UC06 .> Sub_ShippingMethod : <<include>>
UC06 .> Sub_PaymentMethod : <<include>>
UC06 .> Sub_CreateOrder : <<include>>

Sub_AutoFill .> Sub_ShippingInfo : <<extend>>
Sub_Coupon .> UC06 : <<extend>>
UC07 .> UC06 : <<extend>>
UC07 --> PG

note right of Sub_AutoFill
  Chỉ khả dụng đối với
  Khách hàng thành viên đã đăng nhập
end note

note right of Sub_ShippingMethod
  3 gói cước:
  - Tiêu chuẩn (30.000đ)
  - Hỏa tốc 2H (60.000đ)
  - ErgoCare lắp đặt tận phòng
end note

note right of Sub_PaymentMethod
  4 hình thức:
  - COD (nhận hàng thanh toán)
  - VietQR / VNPAY / MoMo
end note

@enduml`
  },

  // UC-07
  {
    fileName: 'UC-07_thanh_toan_truc_tuyen_sandbox.puml',
    title: 'UC-07: Cổng Thanh Toán Trực Tuyến Giả Lập Sandbox',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-07: CỔNG THANH TOÁN TRỰC TUYẾN GIẢ LẬP (SANDBOX)

actor "Khách hàng" as User
actor "Cổng đối soát thanh toán" as PaymentGateway <<system>>

rectangle "Hệ Thống Storefront (Payment Gateway Sandbox)" {
    usecase "UC-07: Thanh toán trực tuyến Sandbox" as UC07
    usecase "Thanh toán quét mã VietQR" as Pay_VietQR
    usecase "Thanh toán cổng VNPAY-QR" as Pay_VNPay
    usecase "Thanh toán Ví điện tử MoMo" as Pay_MoMo
    usecase "Xác nhận đã thanh toán thành công" as Sub_Success
    usecase "Hủy / Báo lỗi thanh toán thất bại" as Sub_Fail
    usecase "Cập nhật paymentStatus = 'paid'" as Sub_UpdateDB
}

User --> UC07
PaymentGateway --> Sub_UpdateDB

Pay_VietQR --|> UC07 : <<generalization>>
Pay_VNPay --|> UC07 : <<generalization>>
Pay_MoMo --|> UC07 : <<generalization>>

UC07 .> Sub_Success : <<include>>
Sub_Success .> Sub_UpdateDB : <<include>>
Sub_Fail .> UC07 : <<extend>>

note right of Sub_Success
  Gọi API PATCH /api/orders/[id]/pay
  Chuyển sang trang /order-success
end note

note right of Sub_Fail
  Cho phép người dùng chọn lại
  phương thức thanh toán khác
end note

@enduml`
  },

  // UC-08
  {
    fileName: 'UC-08_tra_cuu_van_don_cong_khai.puml',
    title: 'UC-08: Tra Cứu & Theo Dõi Hành Trình Đơn Hàng',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-08: TRA CỨU HÀNH TRÌNH ĐƠN HÀNG CÔNG KHAI

actor "Khách vãng lai" as Guest
actor "Khách hàng thành viên" as Customer

Customer --|> Guest : <<generalization>>

rectangle "Hệ Thống Storefront (Order Tracking Service)" {
    usecase "UC-08: Tra cứu hành trình đơn hàng" as UC08
    usecase "Tra cứu bằng Mã đơn hàng (ord-xxx)" as Search_OrderCode
    usecase "Tra cứu bằng Mã vận đơn (GHTK-xxx)" as Search_TrackCode
    usecase "Tra cứu bằng Số điện thoại nhận hàng" as Search_Phone
    usecase "Hiển thị Timeline 5 mốc vận chuyển" as Sub_Timeline
    usecase "Xem chi tiết kiện hàng & trạng thái thanh toán" as Sub_Detail
}

Guest --> UC08

Search_OrderCode --|> UC08 : <<generalization>>
Search_TrackCode --|> UC08 : <<generalization>>
Search_Phone --|> UC08 : <<generalization>>

UC08 .> Sub_Timeline : <<include>>
UC08 .> Sub_Detail : <<include>>

note right of Sub_Timeline
  5 mốc vận đơn:
  1. Đã tiếp nhận đơn
  2. Đang đóng gói tại kho
  3. Đang giao hàng
  4. Giao hàng thành công
  5. Đã hủy đơn
end note

note bottom of UC08
  Tra cứu công khai không bắt buộc
  đăng nhập, kết nối GET /api/orders/track
end note

@enduml`
  },

  // UC-09
  {
    fileName: 'UC-09_gui_danh_gia_nhan_xet.puml',
    title: 'UC-09: Đánh Giá & Nhận Xét Sản Phẩm',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-09: ĐÁNH GIÁ & NHẬN XÉT SẢN PHẨM

actor "Khách vãng lai" as Guest
actor "Khách hàng thành viên" as Customer

Customer --|> Guest : <<generalization>>

rectangle "Hệ Thống Storefront (Product Reviews System)" {
    usecase "UC-09: Gửi đánh giá nhận xét" as UC09
    usecase "Xem điểm sao & nhận xét cộng đồng" as Sub_ViewReviews
    usecase "Lọc nhận xét theo số sao (1 - 5 sao)" as Sub_FilterStars
    usecase "Chọn số sao đánh giá (1 - 5)" as Sub_Rating
    usecase "Viết nội dung cảm nhận thực tế" as Sub_Content
    usecase "Gắn nhãn xác thực 'Đã mua hàng' (Verified Purchase)" as Sub_Verified
    usecase "Lưu đánh giá vào bảng Review MySQL" as Sub_SaveDB
}

Guest --> Sub_ViewReviews
Guest --> UC09
Customer --> UC09

Sub_ViewReviews .> Sub_FilterStars : <<extend>>

UC09 .> Sub_Rating : <<include>>
UC09 .> Sub_Content : <<include>>
UC09 .> Sub_SaveDB : <<include>>

Sub_Verified .> UC09 : <<extend>>

note right of Sub_Verified
  Hệ thống tự động kiểm tra:
  nếu Customer đã có đơn hoàn tất
  chứa ghế này -> cấp nhãn Verified
end note

@enduml`
  },

  // UC-10
  {
    fileName: 'UC-10_dang_ky_tai_khoan.puml',
    title: 'UC-10: Đăng Ký Tài Khoản Mới',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-10: ĐĂNG KÝ TÀI KHOẢN MỚI

actor "Khách vãng lai" as Guest

rectangle "Hệ Thống Storefront (Registration Flow)" {
    usecase "UC-10: Đăng ký tài khoản mới" as UC10
    usecase "Nhập họ tên, email, SĐT, mật khẩu" as Sub_Input
    usecase "Kiểm tra định dạng & trùng lặp Email" as Sub_Validate
    usecase "Băm mật khẩu PBKDF2 SHA-512 (BR-02)" as Sub_Hash
    usecase "Khởi tạo bản ghi User (role: customer)" as Sub_CreateUser
    usecase "Tự động đăng nhập & chuyển hướng" as Sub_AutoLogin
}

Guest --> UC10

UC10 .> Sub_Input : <<include>>
UC10 .> Sub_Validate : <<include>>
UC10 .> Sub_Hash : <<include>>
UC10 .> Sub_CreateUser : <<include>>
Sub_AutoLogin .> UC10 : <<extend>>

note right of Sub_Hash
  BR-02: Băm bằng PBKDF2 SHA-512,
  1.000 iterations, muối 16 byte
  ngẫu nhiên. Không lưu plain text.
end note

@enduml`
  },

  // UC-11
  {
    fileName: 'UC-11_dang_nhap_he_thong.puml',
    title: 'UC-11: Đăng Nhập & Xác Thực Người Dùng',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-11: ĐĂNG NHẬP HỆ THỐNG

actor "Người dùng" as User
actor "Khách hàng" as Customer
actor "Quản trị viên" as Admin

Customer --|> User
Admin --|> User

rectangle "Hệ Thống Storefront (Authentication Flow)" {
    usecase "UC-11: Đăng nhập hệ thống" as UC11
    usecase "Nhập Email và Mật khẩu" as Sub_Input
    usecase "Xác thực mã băm PBKDF2" as Sub_VerifyHash
    usecase "Kiểm tra trạng thái tài khoản (BR-03)" as Sub_CheckBlocked
    usecase "Khởi tạo phiên & lưu LocalStorage" as Sub_Session
    usecase "Đồng bộ trạng thái phiên đa tab" as Sub_SyncTab
    usecase "UC-15: Gửi yêu cầu cấp lại mật khẩu" as UC15
}

User --> UC11

UC11 .> Sub_Input : <<include>>
UC11 .> Sub_VerifyHash : <<include>>
UC11 .> Sub_CheckBlocked : <<include>>
UC11 .> Sub_Session : <<include>>
UC11 .> Sub_SyncTab : <<include>>

UC15 .> UC11 : <<extend>>

note right of Sub_CheckBlocked
  BR-03: Nếu status = 'blocked',
  chặn đăng nhập ngay lập tức
  và hiển thị thông báo lỗi
end note

note right of Sub_SyncTab
  Phát Custom DOM Event:
  ergochair-auth-change
  để Header & Context cập nhật tức thì
end note

@enduml`
  },

  // UC-12
  {
    fileName: 'UC-12_quan_ly_ho_so_so_dia_chi.puml',
    title: 'UC-12: Quản Lý Hồ Sơ & Sổ Địa Chỉ',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-12: QUẢN LÝ HỒ SƠ & SỔ ĐỊA CHỈ

actor "Khách hàng thành viên" as Customer

rectangle "Hệ Thống Storefront (Account Management)" {
    usecase "UC-12: Quản lý hồ sơ & Sổ địa chỉ" as UC12
    usecase "Xem thông tin định danh cá nhân" as Sub_ViewProfile
    usecase "Cập nhật họ tên & số điện thoại" as Sub_UpdateProfile
    usecase "Thêm địa chỉ giao nhận mới" as Sub_AddAddress
    usecase "Chỉnh sửa địa chỉ nhận hàng" as Sub_EditAddress
    usecase "Xóa địa chỉ nhận hàng" as Sub_DeleteAddress
    usecase "Thiết lập địa chỉ mặc định" as Sub_SetDefault
}

Customer --> UC12

UC12 .> Sub_ViewProfile : <<include>>
Sub_UpdateProfile .> UC12 : <<extend>>
Sub_AddAddress .> UC12 : <<extend>>
Sub_EditAddress .> UC12 : <<extend>>
Sub_DeleteAddress .> UC12 : <<extend>>
Sub_SetDefault .> Sub_EditAddress : <<extend>>

note right of Sub_SetDefault
  Địa chỉ mặc định sẽ tự động điền
  vào form khi thực hiện Checkout
end note

@enduml`
  },

  // UC-13
  {
    fileName: 'UC-13_xem_lich_su_don_hang.puml',
    title: 'UC-13: Xem Lịch Sử Đơn Hàng Cá Nhân',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-13: XEM LỊCH SỬ ĐƠN HÀNG CÁ NHÂN

actor "Khách hàng thành viên" as Customer

rectangle "Hệ Thống Storefront (Order History)" {
    usecase "UC-13: Xem lịch sử đơn hàng cá nhân" as UC13
    usecase "Xem danh sách các đơn đã đặt" as Sub_ListOrders
    usecase "Lọc đơn theo trạng thái xử lý" as Sub_FilterStatus
    usecase "Xem chi tiết kiện hàng & sản phẩm" as Sub_OrderDetail
    usecase "Theo dõi tiến độ vận chuyển đơn" as Sub_TrackOrder
}

Customer --> UC13

UC13 .> Sub_ListOrders : <<include>>
Sub_FilterStatus .> Sub_ListOrders : <<extend>>
Sub_OrderDetail .> Sub_ListOrders : <<extend>>
Sub_TrackOrder .> Sub_OrderDetail : <<extend>>

note right of Sub_ListOrders
  Truy vấn trực tiếp các đơn hàng
  gắn với userId của phiên đăng nhập
end note

@enduml`
  },

  // UC-14
  {
    fileName: 'UC-14_doi_mat_khau_ca_nhan.puml',
    title: 'UC-14: Đổi Mật Khẩu Cá Nhân',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-14: ĐỔI MẬT KHẨU CÁ NHÂN

actor "Khách hàng thành viên" as Customer

rectangle "Hệ Thống Storefront (Security Settings)" {
    usecase "UC-14: Đổi mật khẩu cá nhân" as UC14
    usecase "Nhập mật khẩu hiện tại" as Sub_CurrentPass
    usecase "Xác thực mật khẩu cũ qua PBKDF2" as Sub_VerifyCurrent
    usecase "Nhập mật khẩu mới (tối thiểu 6 ký tự)" as Sub_NewPass
    usecase "Băm & Lưu mật khẩu mới (BR-02)" as Sub_HashNewPass
    usecase "Thông báo cập nhật thành công" as Sub_Success
}

Customer --> UC14

UC14 .> Sub_CurrentPass : <<include>>
UC14 .> Sub_VerifyCurrent : <<include>>
UC14 .> Sub_NewPass : <<include>>
UC14 .> Sub_HashNewPass : <<include>>
UC14 .> Sub_Success : <<include>>

note right of Sub_VerifyCurrent
  Nếu mật khẩu hiện tại sai,
  hệ thống từ chối đổi mật khẩu
  và báo lỗi lập tức
end note

@enduml`
  },

  // UC-15
  {
    fileName: 'UC-15_gui_yeu_cau_cap_lai_mat_khau.puml',
    title: 'UC-15: Gửi Yêu Cầu Cấp Lại Mật Khẩu',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-15: GỬI YÊU CẦU CẤP LẠI MẬT KHẨU

actor "Khách vãng lai / Thành viên" as User
actor "Quản trị viên" as Admin

rectangle "Hệ Thống Storefront & Backend" {
    usecase "UC-15: Gửi yêu cầu cấp lại mật khẩu" as UC15
    usecase "Nhập Email & Số điện thoại đã đăng ký" as Sub_Input
    usecase "Nhập lý do / ghi chú hỗ trợ" as Sub_Note
    usecase "Kiểm tra tồn tại tài khoản trong DB" as Sub_CheckUser
    usecase "Khởi tạo phiếu PasswordResetRequest (status: pending)" as Sub_CreateTicket
    usecase "UC-AD11: Admin xử lý phiếu cấp mật khẩu" as AD11
}

User --> UC15
Admin --> AD11

UC15 .> Sub_Input : <<include>>
UC15 .> Sub_Note : <<include>>
UC15 .> Sub_CheckUser : <<include>>
UC15 .> Sub_CreateTicket : <<include>>

AD11 .> Sub_CreateTicket : <<include>>

note right of Sub_CreateTicket
  Phiếu được ghi vào bảng
  PasswordResetRequest để
  Admin duyệt và cấp mật khẩu mới
end note

@enduml`
  },

  // UC-16
  {
    fileName: 'UC-16_tro_ly_ao_ai_ergobot.puml',
    title: 'UC-16: Chat Tư Vấn Với Trợ Lý Ảo AI ErgoBot',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-16: TRỢ LÝ ẢO AI ERGOBOT (RAG & FALLBACK)

actor "Người dùng" as User
actor "Groq AI LLM Service" as GroqAPI <<system>>

rectangle "Hệ Thống Trợ Lý Ảo (AI ErgoBot Widget)" {
    usecase "UC-16: Chat tư vấn với AI ErgoBot" as UC16
    usecase "Phân loại 8 ý định người dùng (RAG Classifier)" as Sub_Classify
    usecase "Tư vấn chọn ghế theo chiều cao & cân nặng" as Sub_Recommend
    usecase "Tra cứu đơn hàng tự động qua AI" as Sub_TrackAI
    usecase "Hỏi chính sách bảo hành, đổi trả, ship" as Sub_Policy
    usecase "Kích hoạt Heuristic Fallback khi Timeout (BR-06)" as Sub_Fallback
    usecase "Hiển thị thẻ sản phẩm tương tác (Product Card)" as Sub_ProductCard
}

User --> UC16

UC16 .> Sub_Classify : <<include>>
Sub_Recommend .> UC16 : <<extend>>
Sub_TrackAI .> UC16 : <<extend>>
Sub_Policy .> UC16 : <<extend>>

Sub_Classify --> GroqAPI
Sub_Fallback .> Sub_Classify : <<extend>>
Sub_ProductCard .> Sub_Recommend : <<extend>>

note right of Sub_Fallback
  BR-06: Timeout Groq API > 3.5s
  hoặc lỗi kết nối mạng ->
  Tự động kích hoạt bộ Regex Fallback
  nội bộ, đảm bảo 100% phản hồi.
end note

@enduml`
  },

  // UC-17
  {
    fileName: 'UC-17_lien_he_tu_van_da_kenh.puml',
    title: 'UC-17: Kênh Liên Hệ Tư Vấn Đa Kênh',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-17: KÊNH LIÊN HỆ TƯ VẤN ĐA KÊNH

actor "Khách hàng" as Customer

rectangle "Hệ Thống Storefront (Omnichannel Contact)" {
    usecase "UC-17: Kênh liên hệ tư vấn đa kênh" as UC17
    usecase "Gọi điện thoại trực tiếp Hotline" as Contact_Hotline
    usecase "Mở kết nối chat Zalo Official Account" as Contact_Zalo
    usecase "Mở chat Facebook Messenger Fanpage" as Contact_Messenger
    usecase "Gửi biểu mẫu liên hệ trực tuyến (/contact)" as Contact_Form
    usecase "Xem bản đồ chỉ đường & Địa chỉ Showroom" as Contact_Showroom
}

Customer --> UC17

Contact_Hotline --|> UC17 : <<generalization>>
Contact_Zalo --|> UC17 : <<generalization>>
Contact_Messenger --|> UC17 : <<generalization>>
Contact_Form --|> UC17 : <<generalization>>

UC17 .> Contact_Showroom : <<include>>

note right of Contact_Hotline
  Tích hợp Floating Contact Widget
  ở góc màn hình cho phép gọi
  hoặc nhắn tin chỉ với 1 click
end note

@enduml`
  },

  // UC-AD01
  {
    fileName: 'UC-AD01_dashboard_kpi_doanh_thu.puml',
    title: 'UC-AD01: Giám Sát Dashboard KPI & Doanh Thu',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-AD01: GIÁM SÁT DASHBOARD KPI & DOANH THU

actor "Quản trị viên" as Admin

rectangle "Phân Hệ Quản Trị (Admin Dashboard)" {
    usecase "UC-AD01: Giám sát Dashboard KPI & Doanh thu" as AD01
    usecase "Xem 4 thẻ chỉ số KPI tổng quan" as Sub_Cards
    usecase "Xem biểu đồ sóng doanh thu 7 ngày" as Sub_RevenueChart
    usecase "Xem danh sách đơn hàng mới tiếp nhận" as Sub_RecentOrders
    usecase "Xem bảng xếp hạng Top sản phẩm bán chạy" as Sub_TopProducts
    usecase "Tự động loại trừ đơn hủy (BR-05)" as Sub_ExcludeCancel
}

Admin --> AD01

AD01 .> Sub_Cards : <<include>>
AD01 .> Sub_RevenueChart : <<include>>
AD01 .> Sub_RecentOrders : <<include>>
AD01 .> Sub_TopProducts : <<include>>
Sub_Cards .> Sub_ExcludeCancel : <<include>>

note right of Sub_Cards
  4 thẻ KPI:
  1. Tổng doanh thu thực tế
  2. Tổng số đơn hàng (5 trạng thái)
  3. Tổng sản phẩm (Còn / Hết hàng)
  4. Tổng người dùng hệ thống
end note

note right of Sub_ExcludeCancel
  BR-05: Đơn hàng ở trạng thái 'cancelled'
  tuyệt đối không được tính vào
  tổng doanh thu kinh doanh
end note

@enduml`
  },

  // UC-AD02
  {
    fileName: 'UC-AD02_quan_ly_san_pham_crud.puml',
    title: 'UC-AD02: Quản Lý Sản Phẩm Toàn Diện (CRUD)',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-AD02: QUẢN LÝ SẢN PHẨM TOÀN DIỆN (CRUD)

actor "Quản trị viên" as Admin
actor "Máy chủ lưu trữ Media" as MediaServer <<system>>

rectangle "Phân Hệ Quản Trị (Product Lifecycle Management)" {
    usecase "UC-AD02: Quản lý sản phẩm toàn diện" as AD02
    usecase "Xem danh sách & Lọc sản phẩm" as Sub_List
    usecase "Thêm mới sản phẩm" as Sub_Create
    usecase "Chỉnh sửa thông tin sản phẩm" as Sub_Edit
    usecase "Xóa sản phẩm an toàn" as Sub_Delete
    usecase "UC-AD12: Tải lên 5 ảnh sản phẩm" as AD12
    usecase "Tải lên hoặc nhúng Video YouTube" as Sub_Video
    usecase "Nhập bảng thông số kỹ thuật đa chiều (Specs)" as Sub_Specs
    usecase "Xác thực ràng buộc khóa ngoại trước khi xóa" as Sub_GuardDelete
}

Admin --> AD02

AD02 .> Sub_List : <<include>>
Sub_Create .> AD02 : <<extend>>
Sub_Edit .> AD02 : <<extend>>
Sub_Delete .> AD02 : <<extend>>

Sub_Create .> AD12 : <<include>>
Sub_Edit .> AD12 : <<include>>
Sub_Create .> Sub_Specs : <<include>>
Sub_Edit .> Sub_Specs : <<include>>

Sub_Video .> Sub_Create : <<extend>>
Sub_Video .> Sub_Edit : <<extend>>
Sub_GuardDelete .> Sub_Delete : <<include>>

AD12 --> MediaServer

@enduml`
  },

  // UC-AD03
  {
    fileName: 'UC-AD03_bat_tat_ton_kho_tuc_thi.puml',
    title: 'UC-AD03: Bật/Tắt Trạng Thái Tồn Kho Tức Thì',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-AD03: BẬT/TẮT TỒN KHO TỨC THÌ (INSTANT TOGGLE)

actor "Quản trị viên" as Admin

rectangle "Phân Hệ Quản Trị (Product Stock Management)" {
    usecase "UC-AD03: Bật/Tắt tồn kho tức thì" as AD03
    usecase "Gạt công tắc InStock trên bảng danh sách" as Sub_ToggleSwitch
    usecase "Gọi API PATCH /api/products/[id]" as Sub_CallAPI
    usecase "Cập nhật trường inStock trong MySQL" as Sub_UpdateDB
    usecase "Đồng bộ tức thì ra Storefront (Khóa/Mở mua)" as Sub_SyncStorefront
}

Admin --> AD03

AD03 .> Sub_ToggleSwitch : <<include>>
AD03 .> Sub_CallAPI : <<include>>
AD03 .> Sub_UpdateDB : <<include>>
AD03 .> Sub_SyncStorefront : <<include>>

note right of Sub_ToggleSwitch
  Thao tác 1-click trực tiếp
  không cần mở modal chỉnh sửa,
  phản hồi Optimistic UI mượt mà
end note

note right of Sub_SyncStorefront
  Khi inStock = false:
  Giao diện khách hàng tự động khóa mua
  và chuyển sang nút Liên hệ tư vấn
end note

@enduml`
  },

  // UC-AD04
  {
    fileName: 'UC-AD04_quan_ly_danh_muc_hang_hoa.puml',
    title: 'UC-AD04: Quản Lý Danh Mục Hàng Hóa (CRUD)',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-AD04: QUẢN LÝ DANH MỤC HÀNG HÓA (CRUD)

actor "Quản trị viên" as Admin

rectangle "Phân Hệ Quản Trị (Category Management)" {
    usecase "UC-AD04: Quản lý danh mục hàng hóa" as AD04
    usecase "Xem danh sách danh mục & số lượng ghế" as Sub_ListCat
    usecase "Thêm danh mục hàng mới" as Sub_AddCat
    usecase "Chỉnh sửa tên danh mục" as Sub_EditCat
    usecase "Xóa danh mục an toàn" as Sub_DeleteCat
    usecase "Tự động sinh Slug tiếng Việt chuẩn SEO" as Sub_AutoSlug
    usecase "Phát Custom Event đồng bộ menu Header" as Sub_EventSync
}

Admin --> AD04

AD04 .> Sub_ListCat : <<include>>
Sub_AddCat .> AD04 : <<extend>>
Sub_EditCat .> AD04 : <<extend>>
Sub_DeleteCat .> AD04 : <<extend>>

Sub_AddCat .> Sub_AutoSlug : <<include>>
Sub_AddCat .> Sub_EventSync : <<include>>
Sub_EditCat .> Sub_EventSync : <<include>>
Sub_DeleteCat .> Sub_EventSync : <<include>>

note right of Sub_EventSync
  Phát sự kiện DOM:
  ergochair-categories-change
  Menu phía Storefront tự động cập nhật
  ngay lập tức mà không cần reload
end note

@enduml`
  },

  // UC-AD05
  {
    fileName: 'UC-AD05_quan_ly_tien_do_don_hang.puml',
    title: 'UC-AD05: Quản Lý & Cập Nhật Tiến Độ Đơn Hàng',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-AD05: QUẢN LÝ TIẾN ĐỘ ĐƠN HÀNG

actor "Quản trị viên" as Admin
actor "Đơn vị vận chuyển" as Shipper <<system>>

rectangle "Phân Hệ Quản Trị (Order & Logistics Operations)" {
    usecase "UC-AD05: Quản lý tiến độ đơn hàng" as AD05
    usecase "Lọc đơn theo 5 trạng thái vòng đời" as Sub_FilterStatus
    usecase "Cập nhật nhanh trạng thái qua Dropdown" as Sub_QuickSwitch
    usecase "Xem modal chi tiết đơn hàng toàn diện" as Sub_OrderDetail
    usecase "In phiếu đơn hàng / xuất phiếu giao vận" as Sub_PrintInvoice
    usecase "Tuân thủ quy tắc chuyển trạng thái một chiều (BR-05)" as Sub_EnforceBR05
    usecase "Gán mã vận đơn GHTK / Viettel Post" as Sub_AssignTracking
}

Admin --> AD05
Shipper --> Sub_AssignTracking

AD05 .> Sub_FilterStatus : <<include>>
AD05 .> Sub_OrderDetail : <<include>>
AD05 .> Sub_QuickSwitch : <<include>>
Sub_QuickSwitch .> Sub_EnforceBR05 : <<include>>

Sub_PrintInvoice .> Sub_OrderDetail : <<extend>>
Sub_AssignTracking .> Sub_OrderDetail : <<extend>>

note right of Sub_EnforceBR05
  BR-05: Trạng thái di chuyển theo chiều:
  pending -> processing -> shipped -> completed.
  Đơn cancelled không được khôi phục.
end note

@enduml`
  },

  // UC-AD06
  {
    fileName: 'UC-AD06_cap_nhat_trang_thai_thanh_toan.puml',
    title: 'UC-AD06: Cập Nhật Trạng Thái Thanh Toán Đơn Hàng',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-AD06: CẬP NHẬT TRẠNG THÁI THANH TOÁN

actor "Quản trị viên" as Admin

rectangle "Phân Hệ Quản Trị (Payment Audit & Operations)" {
    usecase "UC-AD06: Cập nhật trạng thái thanh toán" as AD06
    usecase "Xem trạng thái thanh toán hiện tại" as Sub_ViewStatus
    usecase "Chuyển trạng thái Chưa thanh toán -> Đã thanh toán" as Sub_MarkPaid
    usecase "Chuyển trạng thái Đã thanh toán -> Chưa thanh toán" as Sub_MarkUnpaid
    usecase "Đối soát dòng tiền thanh toán COD / Chuyển khoản" as Sub_Audit
    usecase "Cập nhật trường paymentStatus trong MySQL" as Sub_UpdateDB
}

Admin --> AD06

AD06 .> Sub_ViewStatus : <<include>>
AD06 .> Sub_Audit : <<include>>

Sub_MarkPaid .> AD06 : <<extend>>
Sub_MarkUnpaid .> AD06 : <<extend>>

Sub_MarkPaid .> Sub_UpdateDB : <<include>>
Sub_MarkUnpaid .> Sub_UpdateDB : <<include>>

note right of Sub_Audit
  Hỗ trợ thủ kho & kế toán đối soát
  sau khi đơn vị vận chuyển thu tiền COD
  hoặc nhận được tin báo biến động số dư
end note

@enduml`
  },

  // UC-AD07
  {
    fileName: 'UC-AD07_xem_ho_so_khach_hang_clv.puml',
    title: 'UC-AD07: Xem Hồ Sơ Khách Hàng 360 & Giá Trị Vòng Đời (CLV)',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-AD07: XEM HỒ SƠ KHÁCH HÀNG 360 & CLV

actor "Quản trị viên" as Admin

rectangle "Phân Hệ Quản Trị (Customer 360 Analytics)" {
    usecase "UC-AD07: Xem hồ sơ khách hàng 360 & CLV" as AD07
    usecase "Xem danh sách khách hàng & ngày đăng ký" as Sub_ListCustomers
    usecase "Mở Customer 360 View Modal" as Sub_Modal360
    usecase "Xem tính toán giá trị vòng đời (CLV)" as Sub_CLV
    usecase "Xem danh sách sổ địa chỉ đã lưu của khách" as Sub_AddressList
    usecase "Xem toàn bộ lịch sử đơn hàng của khách" as Sub_CustomerOrders
}

Admin --> AD07

AD07 .> Sub_ListCustomers : <<include>>
Sub_Modal360 .> Sub_ListCustomers : <<extend>>

Sub_Modal360 .> Sub_CLV : <<include>>
Sub_Modal360 .> Sub_AddressList : <<include>>
Sub_Modal360 .> Sub_CustomerOrders : <<include>>

note right of Sub_CLV
  Customer Lifetime Value (CLV):
  Tự động cộng dồn doanh số từ
  toàn bộ đơn hàng 'completed'
  mà khách đã thực hiện
end note

@enduml`
  },

  // UC-AD08
  {
    fileName: 'UC-AD08_khoa_mo_khoa_tai_khoan.puml',
    title: 'UC-AD08: Khóa / Mở Khóa Tài Khoản Người Dùng',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-AD08: KHÓA / MỞ KHÓA TÀI KHOẢN NGƯỜI DÙNG

actor "Quản trị viên" as Admin

rectangle "Phân Hệ Quản Trị (Account Access Control)" {
    usecase "UC-AD08: Khóa / Mở khóa tài khoản người dùng" as AD08
    usecase "Gạt công tắc chuyển đổi Active / Blocked" as Sub_ToggleStatus
    usecase "Cập nhật status người dùng trong MySQL" as Sub_UpdateUserDB
    usecase "Thu hồi phiên làm việc tức thời (BR-03)" as Sub_RevokeSession
    usecase "Chặn đăng nhập ngay tại cổng API" as Sub_BlockAPI
}

Admin --> AD08

AD08 .> Sub_ToggleStatus : <<include>>
Sub_ToggleStatus .> Sub_UpdateUserDB : <<include>>
Sub_UpdateUserDB .> Sub_RevokeSession : <<include>>
Sub_UpdateUserDB .> Sub_BlockAPI : <<include>>

note right of Sub_RevokeSession
  BR-03: Khi tài khoản bị chuyển sang 'blocked':
  Hệ thống lập tức từ chối API /api/auth/me,
  buộc đăng xuất ngay lập tức
  trên mọi thiết bị đang mở
end note

@enduml`
  },

  // UC-AD09
  {
    fileName: 'UC-AD09_quan_ly_tai_khoan_nhan_su.puml',
    title: 'UC-AD09: Quản Lý Tài Khoản Nhân Sự & Phân Quyền',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-AD09: QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN

actor "Quản trị viên" as Admin

rectangle "Phân Hệ Quản Trị (User & Role Management)" {
    usecase "UC-AD09: Quản lý tài khoản & Phân quyền" as AD09
    usecase "Xem danh sách tài khoản toàn hệ thống" as Sub_ListUsers
    usecase "Tạo mới tài khoản nhân sự" as Sub_CreateUser
    usecase "Phân quyền vai trò (Admin / Customer)" as Sub_AssignRole
    usecase "Chỉnh sửa thông tin tài khoản" as Sub_EditUser
    usecase "Xóa tài khoản nhân sự" as Sub_DeleteUser
    usecase "Cơ chế bảo vệ Admin không tự xóa mình (BR-04)" as Sub_SelfDeleteGuard
}

Admin --> AD09

AD09 .> Sub_ListUsers : <<include>>
Sub_CreateUser .> AD09 : <<extend>>
Sub_EditUser .> AD09 : <<extend>>
Sub_DeleteUser .> AD09 : <<extend>>

Sub_CreateUser .> Sub_AssignRole : <<include>>
Sub_EditUser .> Sub_AssignRole : <<extend>>
Sub_DeleteUser .> Sub_SelfDeleteGuard : <<include>>

note right of Sub_SelfDeleteGuard
  BR-04: Hệ thống chặn tuyệt đối
  hành vi Admin tự xóa tài khoản chính mình,
  bảo vệ an toàn quyền quản trị tối cao
end note

@enduml`
  },

  // UC-AD10
  {
    fileName: 'UC-AD10_dat_lai_mat_khau_truc_tiep.puml',
    title: 'UC-AD10: Admin Đặt Lại Mật Khẩu Trực Tiếp',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-AD10: ĐẶT LẠI MẬT KHẨU TRỰC TIẾP

actor "Quản trị viên" as Admin

rectangle "Phân Hệ Quản Trị (Direct Password Reset)" {
    usecase "UC-AD10: Đặt lại mật khẩu trực tiếp" as AD10
    usecase "Chọn người dùng cần đặt lại mật khẩu" as Sub_SelectUser
    usecase "Nhập mật khẩu mới chỉ định" as Sub_InputNewPass
    usecase "Băm mật khẩu PBKDF2 SHA-512 (BR-02)" as Sub_HashPass
    usecase "Cập nhật bản ghi mật khẩu trong MySQL" as Sub_UpdateUserPass
    usecase "Ghi nhật ký thay đổi an ninh" as Sub_AuditLog
}

Admin --> AD10

AD10 .> Sub_SelectUser : <<include>>
AD10 .> Sub_InputNewPass : <<include>>
AD10 .> Sub_HashPass : <<include>>
AD10 .> Sub_UpdateUserPass : <<include>>
AD10 .> Sub_AuditLog : <<include>>

note right of Sub_InputNewPass
  Phục vụ hỗ trợ khách hàng khẩn cấp
  khi khách liên hệ qua hotline
  hoặc đến trực tiếp showroom
end note

@enduml`
  },

  // UC-AD11
  {
    fileName: 'UC-AD11_xu_ly_hang_doi_cap_lai_mat_khau.puml',
    title: 'UC-AD11: Xử Lý Hàng Đợi Cấp Lại Mật Khẩu',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-AD11: XỬ LÝ HÀNG ĐỢI CẤP LẠI MẬT KHẨU

actor "Quản trị viên" as Admin

rectangle "Phân Hệ Quản Trị (Password Reset Queue Service)" {
    usecase "UC-AD11: Xử lý hàng đợi cấp lại mật khẩu" as AD11
    usecase "Xem danh sách yêu cầu (Lọc Pending/Done/Rejected)" as Sub_ViewQueue
    usecase "Phê duyệt & Cấp mật khẩu mới" as Sub_Approve
    usecase "Từ chối yêu cầu & Nhập lý do phản hồi" as Sub_Reject
    usecase "Tự động sinh mật khẩu ngẫu nhiên độ bảo mật cao" as Sub_GenPass
    usecase "Băm mật khẩu mới bằng PBKDF2 & Lưu MySQL" as Sub_SaveHash
    usecase "Hiển thị hộp thoại sao chép mật khẩu 1-chạm" as Sub_CopyDialog
}

Admin --> AD11

AD11 .> Sub_ViewQueue : <<include>>
Sub_Approve .> AD11 : <<extend>>
Sub_Reject .> AD11 : <<extend>>

Sub_Approve .> Sub_GenPass : <<include>>
Sub_Approve .> Sub_SaveHash : <<include>>
Sub_Approve .> Sub_CopyDialog : <<include>>

note right of Sub_CopyDialog
  Admin sao chép mật khẩu mới
  để gửi cho khách qua Email/SMS/Zalo
  đã đăng ký
end note

@enduml`
  },

  // UC-AD12
  {
    fileName: 'UC-AD12_tai_len_quan_ly_media.puml',
    title: 'UC-AD12: Tải Lên & Quản Lý Tệp Tin Media Máy Chủ',
    content: `@startuml
${commonSkinParam}

title USE CASE UC-AD12: TẢI LÊN & QUẢN LÝ MEDIA MÁY CHỦ

actor "Quản trị viên" as Admin
actor "Dịch vụ tệp tin máy chủ (Node.js FS)" as ServerFS <<system>>

rectangle "Phân Hệ Quản Trị (Media Storage Service)" {
    usecase "UC-AD12: Tải lên & Quản lý Media máy chủ" as AD12
    usecase "Chọn tệp hình ảnh (JPG, PNG, WebP) hoặc video (MP4)" as Sub_SelectFile
    usecase "Kiểm tra giới hạn dung lượng (Tối đa 50MB)" as Sub_CheckSize
    usecase "Khử dấu tiếng Việt & ký tự lạ (BR-07)" as Sub_SanitizeName
    usecase "Gắn nhãn Unix Timestamp chống ghi đè (BR-07)" as Sub_AddTimestamp
    usecase "Lưu tệp tin vào thư mục public/uploads/" as Sub_SaveFile
    usecase "Trả về đường dẫn tệp công khai (URL)" as Sub_ReturnURL
}

Admin --> AD12
ServerFS --> Sub_SaveFile

AD12 .> Sub_SelectFile : <<include>>
AD12 .> Sub_CheckSize : <<include>>
AD12 .> Sub_SanitizeName : <<include>>
AD12 .> Sub_AddTimestamp : <<include>>
AD12 .> Sub_SaveFile : <<include>>
AD12 .> Sub_ReturnURL : <<include>>

note right of Sub_SanitizeName
  BR-07: Chuẩn hóa tên file:
  - Khử toàn bộ dấu tiếng Việt
  - Khoảng trắng -> gạch ngang '-'
  - Gắn timestamp chống đè file
end note

@enduml`
  }
];

// Write all diagram files
for (const diag of diagrams) {
  const filePath = path.join(targetDir, diag.fileName);
  fs.writeFileSync(filePath, diag.content, 'utf8');
  console.log('Created:', diag.fileName);
}

// Write README.md file in the use case folder
const readmeContent = `# 📂 DANH MỤC BIỂU ĐỒ USE CASE HỆ THỐNG E-COMMERCE ERGOCHAIR (PLANTUML)

> **Dự án:** Nền tảng Thương mại Điện tử Ghế Công Thái Học Cao Cấp ErgoChair  
> **Tài liệu tham chiếu:**
> - [TONG_HOP_CHUC_NANG_PHAN_TICH_THIET_KE_HE_THONG.md](../TONG_HOP_CHUC_NANG_PHAN_TICH_THIET_KE_HE_THONG.md)
> - [use-case-diagram-guide-tong-hop.md](../use-case-diagram-guide-tong-hop.md)  
> **Ngôn ngữ mô hình hóa:** UML 2.5 (PlantUML)  
> **Số lượng biểu đồ:** 32 tệp PlantUML (.puml) độc lập, hoàn chỉnh.

---

## 📑 BẢNG TỔNG HỢP DANH MỤC CÁC BIỂU ĐỒ

### 1. Sơ Đồ Use Case Tổng Thể (Overview Diagrams)
| STT | Tên Tệp Biểu Đồ | Tên Use Case / Phạm Vi | Tác Nhân Tham Gia (Actors) |
|:---:|---|---|---|
| 00 | [\`00_tong_quan_toan_he_thong.puml\`](./00_tong_quan_toan_he_thong.puml) | **Sơ đồ Use Case Tổng thể Toàn Hệ thống** | Guest, Customer, Admin, VNPay/VietQR, Groq AI |
| 01 | [\`01_tong_quan_phan_he_khach_hang.puml\`](./01_tong_quan_phan_he_khach_hang.puml) | **Sơ đồ Use Case Tổng thể Phân hệ Khách hàng** | Guest, Customer, VNPay/VietQR, Groq AI |
| 02 | [\`02_tong_quan_phan_he_quan_tri.puml\`](./02_tong_quan_phan_he_quan_tri.puml) | **Sơ đồ Use Case Tổng thể Phân hệ Quản trị** | Admin, Media Storage Server |

---

### 2. Phân Hệ Khách Hàng (Customer / Storefront) - 17 Use Cases
| STT | Mã Use Case | Tên Tệp Biểu Đồ | Tên Nghiệp Vụ Use Case | Tác Nhân Chính | Quan Hệ Chính |
|:---:|:---:|---|---|---|---|
| 03 | **UC-01** | [\`UC-01_duyet_kham_pha_san_pham.puml\`](./UC-01_duyet_kham_pha_san_pham.puml) | Duyệt & Khám Phá Sản Phẩm | Khách vãng lai, Khách hàng | \`<<include>>\`, \`<<extend>>\` |
| 04 | **UC-02** | [\`UC-02_tim_kiem_loc_da_tieu_chi.puml\`](./UC-02_tim_kiem_loc_da_tieu_chi.puml) | Tìm Kiếm & Lọc Đa Tiêu Chí | Khách vãng lai, Khách hàng | \`<<include>>\`, \`<<extend>>\` |
| 05 | **UC-03** | [\`UC-03_xem_chi_tiet_san_pham.puml\`](./UC-03_xem_chi_tiet_san_pham.puml) | Xem Chi Tiết & Tương Tác Ghế | Khách vãng lai, Khách hàng | \`<<include>>\`, \`<<extend>>\` |
| 06 | **UC-04** | [\`UC-04_quan_ly_danh_sach_yeu_thich.puml\`](./UC-04_quan_ly_danh_sach_yeu_thich.puml) | Quản Lý Danh Sách Yêu Thích | Khách vãng lai, Khách hàng | \`<<include>>\`, \`<<extend>>\` |
| 07 | **UC-05** | [\`UC-05_quan_ly_gio_hang.puml\`](./UC-05_quan_ly_gio_hang.puml) | Quản Lý Giỏ Hàng Mua Sắm | Khách vãng lai, Khách hàng | \`<<include>>\`, \`<<extend>>\` |
| 08 | **UC-06** | [\`UC-06_thuc_hien_dat_hang_checkout.puml\`](./UC-06_thuc_hien_dat_hang_checkout.puml) | Thực Hiện Đặt Hàng (Checkout) | Khách vãng lai, Khách hàng | \`<<include>>\`, \`<<extend>>\` |
| 09 | **UC-07** | [\`UC-07_thanh_toan_truc_tuyen_sandbox.puml\`](./UC-07_thanh_toan_truc_tuyen_sandbox.puml) | Thanh Toán Trực Tuyến Sandbox | Khách hàng, Cổng thanh toán | \`--\|>\`, \`<<include>>\`, \`<<extend>>\` |
| 10 | **UC-08** | [\`UC-08_tra_cuu_van_don_cong_khai.puml\`](./UC-08_tra_cuu_van_don_cong_khai.puml) | Tra Cứu Vận Đơn Công Khai | Khách vãng lai, Khách hàng | \`--\|>\`, \`<<include>>\` |
| 11 | **UC-09** | [\`UC-09_gui_danh_gia_nhan_xet.puml\`](./UC-09_gui_danh_gia_nhan_xet.puml) | Gửi Đánh Giá & Nhận Xét | Khách vãng lai, Khách hàng | \`<<include>>\`, \`<<extend>>\` |
| 12 | **UC-10** | [\`UC-10_dang_ky_tai_khoan.puml\`](./UC-10_dang_ky_tai_khoan.puml) | Đăng Ký Tài Khoản Mới | Khách vãng lai | \`<<include>>\`, \`<<extend>>\` |
| 13 | **UC-11** | [\`UC-11_dang_nhap_he_thong.puml\`](./UC-11_dang_nhap_he_thong.puml) | Đăng Nhập & Xác Thực | Người dùng, Quản trị viên | \`<<include>>\`, \`<<extend>>\` |
| 14 | **UC-12** | [\`UC-12_quan_ly_ho_so_so_dia_chi.puml\`](./UC-12_quan_ly_ho_so_so_dia_chi.puml) | Quản Lý Hồ Sơ & Sổ Địa Chỉ | Khách hàng thành viên | \`<<include>>\`, \`<<extend>>\` |
| 15 | **UC-13** | [\`UC-13_xem_lich_su_don_hang.puml\`](./UC-13_xem_lich_su_don_hang.puml) | Xem Lịch Sử Đơn Hàng Cá Nhân | Khách hàng thành viên | \`<<include>>\`, \`<<extend>>\` |
| 16 | **UC-14** | [\`UC-14_doi_mat_khau_ca_nhan.puml\`](./UC-14_doi_mat_khau_ca_nhan.puml) | Đổi Mật Khẩu Cá Nhân | Khách hàng thành viên | \`<<include>>\` |
| 17 | **UC-15** | [\`UC-15_gui_yeu_cau_cap_lai_mat_khau.puml\`](./UC-15_gui_yeu_cau_cap_lai_mat_khau.puml) | Gửi Yêu Cầu Cấp Lại Mật Khẩu | Người dùng, Quản trị viên | \`<<include>>\`, \`<<extend>>\` |
| 18 | **UC-16** | [\`UC-16_tro_ly_ao_ai_ergobot.puml\`](./UC-16_tro_ly_ao_ai_ergobot.puml) | Chat Tư Vấn Với AI ErgoBot | Khách hàng, Groq AI LLM | \`<<include>>\`, \`<<extend>>\` |
| 19 | **UC-17** | [\`UC-17_lien_he_tu_van_da_kenh.puml\`](./UC-17_lien_he_tu_van_da_kenh.puml) | Liên Hệ Tư Vấn Đa Kênh | Khách hàng | \`--\|>\`, \`<<include>>\` |

---

### 3. Phân Hệ Quản Trị Viên (Admin Portal) - 12 Use Cases
| STT | Mã Use Case | Tên Tệp Biểu Đồ | Tên Nghiệp Vụ Use Case | Tác Nhân Chính | Quan Hệ Chính |
|:---:|:---:|---|---|---|---|
| 20 | **UC-AD01** | [\`UC-AD01_dashboard_kpi_doanh_thu.puml\`](./UC-AD01_dashboard_kpi_doanh_thu.puml) | Giám Sát Dashboard KPI | Quản trị viên | \`<<include>>\`, \`<<extend>>\` |
| 21 | **UC-AD02** | [\`UC-AD02_quan_ly_san_pham_crud.puml\`](./UC-AD02_quan_ly_san_pham_crud.puml) | Quản Lý Sản Phẩm (CRUD) | Quản trị viên, Media Server | \`<<include>>\`, \`<<extend>>\` |
| 22 | **UC-AD03** | [\`UC-AD03_bat_tat_ton_kho_tuc_thi.puml\`](./UC-AD03_bat_tat_ton_kho_tuc_thi.puml) | Bật/Tắt Tồn Kho Tức Thì | Quản trị viên | \`<<include>>\` |
| 23 | **UC-AD04** | [\`UC-AD04_quan_ly_danh_muc_hang_hoa.puml\`](./UC-AD04_quan_ly_danh_muc_hang_hoa.puml) | Quản Lý Danh Mục (CRUD) | Quản trị viên | \`<<include>>\`, \`<<extend>>\` |
| 24 | **UC-AD05** | [\`UC-AD05_quan_ly_tien_do_don_hang.puml\`](./UC-AD05_quan_ly_tien_do_don_hang.puml) | Quản Lý Tiến Độ Đơn Hàng | Quản trị viên, Đơn vị VC | \`<<include>>\`, \`<<extend>>\` |
| 25 | **UC-AD06** | [\`UC-AD06_cap_nhat_trang_thai_thanh_toan.puml\`](./UC-AD06_cap_nhat_trang_thai_thanh_toan.puml) | Cập Nhật Trạng Thái Thanh Toán | Quản trị viên | \`<<include>>\`, \`<<extend>>\` |
| 26 | **UC-AD07** | [\`UC-AD07_xem_ho_so_khach_hang_clv.puml\`](./UC-AD07_xem_ho_so_khach_hang_clv.puml) | Xem Hồ Sơ Khách Hàng 360 & CLV | Quản trị viên | \`<<include>>\`, \`<<extend>>\` |
| 27 | **UC-AD08** | [\`UC-AD08_khoa_mo_khoa_tai_khoan.puml\`](./UC-AD08_khoa_mo_khoa_tai_khoan.puml) | Khóa / Mở Khóa Người Dùng | Quản trị viên | \`<<include>>\` |
| 28 | **UC-AD09** | [\`UC-AD09_quan_ly_tai_khoan_nhan_su.puml\`](./UC-AD09_quan_ly_tai_khoan_nhan_su.puml) | Quản Lý Tài Khoản & Phân Quyền | Quản trị viên | \`<<include>>\`, \`<<extend>>\` |
| 29 | **UC-AD10** | [\`UC-AD10_dat_lai_mat_khau_truc_tiep.puml\`](./UC-AD10_dat_lai_mat_khau_truc_tiep.puml) | Đặt Lại Mật Khẩu Trực Tiếp | Quản trị viên | \`<<include>>\` |
| 30 | **UC-AD11** | [\`UC-AD11_xu_ly_hang_doi_cap_lai_mat_khau.puml\`](./UC-AD11_xu_ly_hang_doi_cap_lai_mat_khau.puml) | Xử Lý Hàng Đợi Cấp Lại Pass | Quản trị viên | \`<<include>>\`, \`<<extend>>\` |
| 31 | **UC-AD12** | [\`UC-AD12_tai_len_quan_ly_media.puml\`](./UC-AD12_tai_len_quan_ly_media.puml) | Tải Lên & Quản Lý Media Máy Chủ | Quản trị viên, Máy chủ FS | \`<<include>>\` |

---

## 🛠️ HƯỚNG DẪN XEM VÀ XUẤT ẢNH SƠ ĐỒ

### Cách 1: Sử dụng Extension PlantUML trong VS Code
1. Cài đặt extension **PlantUML** (của *jebbs*) trong VS Code.
2. Mở tệp \`.puml\` bất kỳ trong thư mục này.
3. Nhấn tổ hợp phím \`Alt + D\` để mở màn hình xem trước biểu đồ trực quan (Preview).
4. Nhấn chuột phải chọn **Export Current Diagram** để xuất ảnh PNG/SVG.

### Cách 2: Xem trực tuyến không cần cài đặt
1. Copy nội dung code trong tệp \`.puml\`.
2. Truy cập [PlantText](https://www.planttext.com/) hoặc [PlantUML Web Server](http://www.plantuml.com/plantuml/uml/).
3. Dán code vào khung soạn thảo và nhấn **Refresh / Generate Image**.
`;

fs.writeFileSync(path.join(targetDir, 'README.md'), readmeContent, 'utf8');
console.log('Created: README.md');
console.log('Total files generated:', diagrams.length + 1);
