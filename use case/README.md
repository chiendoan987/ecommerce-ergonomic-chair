# 📂 DANH MỤC BIỂU ĐỒ USE CASE HỆ THỐNG E-COMMERCE ERGOCHAIR (PLANTUML)

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
| 00 | [`00_tong_quan_toan_he_thong.puml`](./00_tong_quan_toan_he_thong.puml) | **Sơ đồ Use Case Tổng thể Toàn Hệ thống** | Guest, Customer, Admin, VNPay/VietQR, Groq AI |
| 01 | [`01_tong_quan_phan_he_khach_hang.puml`](./01_tong_quan_phan_he_khach_hang.puml) | **Sơ đồ Use Case Tổng thể Phân hệ Khách hàng** | Guest, Customer, VNPay/VietQR, Groq AI |
| 02 | [`02_tong_quan_phan_he_quan_tri.puml`](./02_tong_quan_phan_he_quan_tri.puml) | **Sơ đồ Use Case Tổng thể Phân hệ Quản trị** | Admin, Media Storage Server |

---

### 2. Phân Hệ Khách Hàng (Customer / Storefront) - 17 Use Cases
| STT | Mã Use Case | Tên Tệp Biểu Đồ | Tên Nghiệp Vụ Use Case | Tác Nhân Chính | Quan Hệ Chính |
|:---:|:---:|---|---|---|---|
| 03 | **UC-01** | [`UC-01_duyet_kham_pha_san_pham.puml`](./UC-01_duyet_kham_pha_san_pham.puml) | Duyệt & Khám Phá Sản Phẩm | Khách vãng lai, Khách hàng | `<<include>>`, `<<extend>>` |
| 04 | **UC-02** | [`UC-02_tim_kiem_loc_da_tieu_chi.puml`](./UC-02_tim_kiem_loc_da_tieu_chi.puml) | Tìm Kiếm & Lọc Đa Tiêu Chí | Khách vãng lai, Khách hàng | `<<include>>`, `<<extend>>` |
| 05 | **UC-03** | [`UC-03_xem_chi_tiet_san_pham.puml`](./UC-03_xem_chi_tiet_san_pham.puml) | Xem Chi Tiết & Tương Tác Ghế | Khách vãng lai, Khách hàng | `<<include>>`, `<<extend>>` |
| 06 | **UC-04** | [`UC-04_quan_ly_danh_sach_yeu_thich.puml`](./UC-04_quan_ly_danh_sach_yeu_thich.puml) | Quản Lý Danh Sách Yêu Thích | Khách vãng lai, Khách hàng | `<<include>>`, `<<extend>>` |
| 07 | **UC-05** | [`UC-05_quan_ly_gio_hang.puml`](./UC-05_quan_ly_gio_hang.puml) | Quản Lý Giỏ Hàng Mua Sắm | Khách vãng lai, Khách hàng | `<<include>>`, `<<extend>>` |
| 08 | **UC-06** | [`UC-06_thuc_hien_dat_hang_checkout.puml`](./UC-06_thuc_hien_dat_hang_checkout.puml) | Thực Hiện Đặt Hàng (Checkout) | Khách vãng lai, Khách hàng | `<<include>>`, `<<extend>>` |
| 09 | **UC-07** | [`UC-07_thanh_toan_truc_tuyen_sandbox.puml`](./UC-07_thanh_toan_truc_tuyen_sandbox.puml) | Thanh Toán Trực Tuyến Sandbox | Khách hàng, Cổng thanh toán | `--|>`, `<<include>>`, `<<extend>>` |
| 10 | **UC-08** | [`UC-08_tra_cuu_van_don_cong_khai.puml`](./UC-08_tra_cuu_van_don_cong_khai.puml) | Tra Cứu Vận Đơn Công Khai | Khách vãng lai, Khách hàng | `--|>`, `<<include>>` |
| 11 | **UC-09** | [`UC-09_gui_danh_gia_nhan_xet.puml`](./UC-09_gui_danh_gia_nhan_xet.puml) | Gửi Đánh Giá & Nhận Xét | Khách vãng lai, Khách hàng | `<<include>>`, `<<extend>>` |
| 12 | **UC-10** | [`UC-10_dang_ky_tai_khoan.puml`](./UC-10_dang_ky_tai_khoan.puml) | Đăng Ký Tài Khoản Mới | Khách vãng lai | `<<include>>`, `<<extend>>` |
| 13 | **UC-11** | [`UC-11_dang_nhap_he_thong.puml`](./UC-11_dang_nhap_he_thong.puml) | Đăng Nhập & Xác Thực | Người dùng, Quản trị viên | `<<include>>`, `<<extend>>` |
| 14 | **UC-12** | [`UC-12_quan_ly_ho_so_so_dia_chi.puml`](./UC-12_quan_ly_ho_so_so_dia_chi.puml) | Quản Lý Hồ Sơ & Sổ Địa Chỉ | Khách hàng thành viên | `<<include>>`, `<<extend>>` |
| 15 | **UC-13** | [`UC-13_xem_lich_su_don_hang.puml`](./UC-13_xem_lich_su_don_hang.puml) | Xem Lịch Sử Đơn Hàng Cá Nhân | Khách hàng thành viên | `<<include>>`, `<<extend>>` |
| 16 | **UC-14** | [`UC-14_doi_mat_khau_ca_nhan.puml`](./UC-14_doi_mat_khau_ca_nhan.puml) | Đổi Mật Khẩu Cá Nhân | Khách hàng thành viên | `<<include>>` |
| 17 | **UC-15** | [`UC-15_gui_yeu_cau_cap_lai_mat_khau.puml`](./UC-15_gui_yeu_cau_cap_lai_mat_khau.puml) | Gửi Yêu Cầu Cấp Lại Mật Khẩu | Người dùng, Quản trị viên | `<<include>>`, `<<extend>>` |
| 18 | **UC-16** | [`UC-16_tro_ly_ao_ai_ergobot.puml`](./UC-16_tro_ly_ao_ai_ergobot.puml) | Chat Tư Vấn Với AI ErgoBot | Khách hàng, Groq AI LLM | `<<include>>`, `<<extend>>` |
| 19 | **UC-17** | [`UC-17_lien_he_tu_van_da_kenh.puml`](./UC-17_lien_he_tu_van_da_kenh.puml) | Liên Hệ Tư Vấn Đa Kênh | Khách hàng | `--|>`, `<<include>>` |

---

### 3. Phân Hệ Quản Trị Viên (Admin Portal) - 12 Use Cases
| STT | Mã Use Case | Tên Tệp Biểu Đồ | Tên Nghiệp Vụ Use Case | Tác Nhân Chính | Quan Hệ Chính |
|:---:|:---:|---|---|---|---|
| 20 | **UC-AD01** | [`UC-AD01_dashboard_kpi_doanh_thu.puml`](./UC-AD01_dashboard_kpi_doanh_thu.puml) | Giám Sát Dashboard KPI | Quản trị viên | `<<include>>`, `<<extend>>` |
| 21 | **UC-AD02** | [`UC-AD02_quan_ly_san_pham_crud.puml`](./UC-AD02_quan_ly_san_pham_crud.puml) | Quản Lý Sản Phẩm (CRUD) | Quản trị viên, Media Server | `<<include>>`, `<<extend>>` |
| 22 | **UC-AD03** | [`UC-AD03_bat_tat_ton_kho_tuc_thi.puml`](./UC-AD03_bat_tat_ton_kho_tuc_thi.puml) | Bật/Tắt Tồn Kho Tức Thì | Quản trị viên | `<<include>>` |
| 23 | **UC-AD04** | [`UC-AD04_quan_ly_danh_muc_hang_hoa.puml`](./UC-AD04_quan_ly_danh_muc_hang_hoa.puml) | Quản Lý Danh Mục (CRUD) | Quản trị viên | `<<include>>`, `<<extend>>` |
| 24 | **UC-AD05** | [`UC-AD05_quan_ly_tien_do_don_hang.puml`](./UC-AD05_quan_ly_tien_do_don_hang.puml) | Quản Lý Tiến Độ Đơn Hàng | Quản trị viên, Đơn vị VC | `<<include>>`, `<<extend>>` |
| 25 | **UC-AD06** | [`UC-AD06_cap_nhat_trang_thai_thanh_toan.puml`](./UC-AD06_cap_nhat_trang_thai_thanh_toan.puml) | Cập Nhật Trạng Thái Thanh Toán | Quản trị viên | `<<include>>`, `<<extend>>` |
| 26 | **UC-AD07** | [`UC-AD07_xem_ho_so_khach_hang_clv.puml`](./UC-AD07_xem_ho_so_khach_hang_clv.puml) | Xem Hồ Sơ Khách Hàng 360 & CLV | Quản trị viên | `<<include>>`, `<<extend>>` |
| 27 | **UC-AD08** | [`UC-AD08_khoa_mo_khoa_tai_khoan.puml`](./UC-AD08_khoa_mo_khoa_tai_khoan.puml) | Khóa / Mở Khóa Người Dùng | Quản trị viên | `<<include>>` |
| 28 | **UC-AD09** | [`UC-AD09_quan_ly_tai_khoan_nhan_su.puml`](./UC-AD09_quan_ly_tai_khoan_nhan_su.puml) | Quản Lý Tài Khoản & Phân Quyền | Quản trị viên | `<<include>>`, `<<extend>>` |
| 29 | **UC-AD10** | [`UC-AD10_dat_lai_mat_khau_truc_tiep.puml`](./UC-AD10_dat_lai_mat_khau_truc_tiep.puml) | Đặt Lại Mật Khẩu Trực Tiếp | Quản trị viên | `<<include>>` |
| 30 | **UC-AD11** | [`UC-AD11_xu_ly_hang_doi_cap_lai_mat_khau.puml`](./UC-AD11_xu_ly_hang_doi_cap_lai_mat_khau.puml) | Xử Lý Hàng Đợi Cấp Lại Pass | Quản trị viên | `<<include>>`, `<<extend>>` |
| 31 | **UC-AD12** | [`UC-AD12_tai_len_quan_ly_media.puml`](./UC-AD12_tai_len_quan_ly_media.puml) | Tải Lên & Quản Lý Media Máy Chủ | Quản trị viên, Máy chủ FS | `<<include>>` |

---

## 🛠️ HƯỚNG DẪN XEM VÀ XUẤT ẢNH SƠ ĐỒ

### Cách 1: Sử dụng Extension PlantUML trong VS Code
1. Cài đặt extension **PlantUML** (của *jebbs*) trong VS Code.
2. Mở tệp `.puml` bất kỳ trong thư mục này.
3. Nhấn tổ hợp phím `Alt + D` để mở màn hình xem trước biểu đồ trực quan (Preview).
4. Nhấn chuột phải chọn **Export Current Diagram** để xuất ảnh PNG/SVG.

### Cách 2: Xem trực tuyến không cần cài đặt
1. Copy nội dung code trong tệp `.puml`.
2. Truy cập [PlantText](https://www.planttext.com/) hoặc [PlantUML Web Server](http://www.plantuml.com/plantuml/uml/).
3. Dán code vào khung soạn thảo và nhấn **Refresh / Generate Image**.
