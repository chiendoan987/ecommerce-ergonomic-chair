import { prisma } from "./src/lib/prisma";
import {
  getProductsFromDb,
  getProductByIdOrSlugFromDb,
  createProductInDb,
  updateProductInDb,
  deleteProductFromDb,
  toggleProductStockInDb,
  getRelatedProductsFromDb,
} from "./src/lib/server/product.repository";
import {
  validateCouponInDb,
} from "./src/lib/server/coupon.repository";
import {
  getOrdersFromDb,
  getOrderByIdFromDb,
  createOrderInDb,
  updateOrderStatusInDb,
} from "./src/lib/server/order.repository";
import {
  getReviewsFromDb,
  createReviewInDb,
} from "./src/lib/server/review.repository";
import {
  findUserByEmailFromDb,
  findUserByIdFromDb,
  authenticateUser,
  registerUserInDb,
  addUserAddressInDb,
} from "./src/lib/server/user.repository";
import { verifyPassword, hashPassword } from "./src/lib/utils/password";
import {
  getAdminDashboardStats,
} from "./src/lib/server/stats.repository";
import { OrderStatus, PaymentMethod, PaymentStatus, UserRole } from "@prisma/client";

interface TestReport {
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const reports: TestReport[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    reports.push({ name, passed: true, details });
    console.log(`  [PASS] ${name}${details ? ` -> ${details}` : ""}`);
  } else {
    reports.push({ name, passed: false, details });
    console.error(`  [FAIL] ${name}${details ? ` -> ${details}` : ""}`);
  }
}

async function runTestSuite() {
  console.log("=================================================================");
  console.log("  KIỂM THỬ TOÀN DIỆN HỆ THỐNG E-COMMERCE ERGONOMIC CHAIR (MYSQL)");
  console.log("=================================================================\n");

  // ---------------------------------------------------------------------------
  // PHẦN 1: SẢN PHẨM & TÌM KIẾM & BỘ LỌC (CATALOG, FILTERS & SEARCH)
  // ---------------------------------------------------------------------------
  console.log("--- [1] KIỂM THỬ DANH MỤC, BỘ LỌC & TÌM KIẾM SẢN PHẨM ---");
  const allProds = await getProductsFromDb({});
  assert(allProds.items.length > 0, "Lấy danh sách sản phẩm hoạt động", `Số lượng: ${allProds.items.length}`);

  const ergoPro = await getProductByIdOrSlugFromDb("ergo-pro-x1");
  assert(ergoPro !== null && ergoPro.slug === "ergo-pro-x1", "Tìm sản phẩm theo Slug (ergo-pro-x1)", ergoPro?.name);

  const ergoProById = await getProductByIdOrSlugFromDb(ergoPro!.id);
  assert(ergoProById !== null && ergoProById.id === ergoPro!.id, "Tìm sản phẩm theo ID", ergoProById?.name);

  // Filter by category
  const gamingProds = await getProductsFromDb({ category: "Ghế gaming" });
  assert(gamingProds.items.length > 0 && gamingProds.items.every(p => p.category === "Ghế gaming"), "Lọc theo danh mục 'Ghế gaming'", `Tìm thấy ${gamingProds.items.length} sp`);

  // Filter by priceRange
  const under5m = await getProductsFromDb({ priceRange: "under-5m" });
  assert(under5m.items.every(p => p.price < 5000000), "Lọc theo giá dưới 5 triệu (< 5M)", `Tìm thấy ${under5m.items.length} sp`);

  // Filter by availability
  const inStockProds = await getProductsFromDb({ availability: "in-stock" });
  assert(inStockProds.items.every(p => p.inStock === true), "Lọc theo trạng thái còn hàng (in-stock)", `Tìm thấy ${inStockProds.items.length} sp`);

  // Search by keyword
  const searchProds = await getProductsFromDb({ search: "Focus" });
  assert(searchProds.items.length > 0 && searchProds.items.some(p => p.name.includes("Focus")), "Tìm kiếm từ khóa 'Focus'", `Tìm thấy ${searchProds.items.length} sp`);

  // Related products
  const related = await getRelatedProductsFromDb("ergo-pro-x1", 3);
  assert(related.length > 0 && !related.some(r => r.id === "ergo-pro-x1"), "Lấy sản phẩm liên quan (loại trừ chính nó)", `Số lượng: ${related.length}`);

  // ---------------------------------------------------------------------------
  // PHẦN 2: QUẢN TRỊ ADMIN CRUD SẢN PHẨM & FIX LỖI XÓA SẢN PHẨM
  // ---------------------------------------------------------------------------
  console.log("\n--- [2] KIỂM THỬ ADMIN CRUD SẢN PHẨM & CHỨC NĂNG XÓA ---");
  
  // 2.1 Tạo sản phẩm mới
  const testProdData = {
    name: "Ghế Kiểm Thử Pro Alpha",
    category: "Ghế công thái học",
    price: 4990000,
    oldPrice: 5990000,
    stockQuantity: 15,
    description: "Sản phẩm thử nghiệm chức năng tạo, sửa, đổi kho, xóa",
    image: "/images/products/focus-task.png",
    material: "Lưới nhập khẩu cao cấp",
    color: "Xám Bạc",
  };
  const createdProd = await createProductInDb(testProdData);
  assert(createdProd !== null && createdProd.name === testProdData.name, "Tạo sản phẩm mới vào MySQL", `ID: ${createdProd.id}`);

  // 2.2 Sửa sản phẩm vừa tạo
  const updatedProd = await updateProductInDb(createdProd.id, {
    name: "Ghế Kiểm Thử Pro Alpha (Đã cập nhật)",
    price: 4500000,
    stockQuantity: 25,
  });
  assert(updatedProd !== null && updatedProd.price === 4500000 && updatedProd.stockQuantity === 25, "Cập nhật thông tin sản phẩm", `Giá mới: ${updatedProd?.price}`);

  // 2.3 Đổi trạng thái kho (Toggle Stock)
  const toggledOff = await toggleProductStockInDb(createdProd.id);
  assert(toggledOff !== null && toggledOff.inStock === false, "Chuyển trạng thái sang Hết hàng", `inStock: ${toggledOff?.inStock}`);

  const toggledOn = await toggleProductStockInDb(createdProd.id);
  assert(toggledOn !== null && toggledOn.inStock === true, "Chuyển lại trạng thái sang Còn hàng", `inStock: ${toggledOn?.inStock}`);

  // 2.4 Xóa sản phẩm CHƯA CÓ ĐƠN HÀNG (Hard delete vật lý)
  const hardDeleteSuccess = await deleteProductFromDb(createdProd.id);
  assert(hardDeleteSuccess === true, "Xóa sản phẩm chưa có đơn hàng (Hard Delete)", `ID: ${createdProd.id}`);

  const verifyDeleted = await prisma.product.findUnique({ where: { id: createdProd.id } });
  assert(verifyDeleted === null, "Xác nhận sản phẩm đã được xóa sạch khỏi MySQL", "DB returned null");

  // 2.5 Kiểm tra XÓA SẢN PHẨM ĐÃ CÓ ĐƠN HÀNG (Soft delete an toàn)
  // Tạo sản phẩm mẫu có đơn hàng
  const prodWithOrder = await createProductInDb({
    name: "Ghế Có Đơn Hàng Test",
    category: "Ghế văn phòng",
    price: 3200000,
    stockQuantity: 5,
    description: "Sản phẩm test xóa khi đã có orderItem",
  });
  // Tạo 1 đơn hàng tạm gắn với sản phẩm này
  const dummyOrder = await prisma.order.create({
    data: {
      subtotal: 3200000,
      total: 3230000,
      recipientName: "Khách Hàng Test",
      recipientPhone: "0912345678",
      deliveryAddress: "123 Đường Test",
      province: "Hà Nội",
      district: "Cầu Giấy",
      status: OrderStatus.pending,
      items: {
        create: {
          productId: prodWithOrder.id,
          productName: prodWithOrder.name,
          productImage: prodWithOrder.image,
          price: prodWithOrder.price,
          quantity: 1,
        },
      },
    },
  });

  const softDeleteSuccess = await deleteProductFromDb(prodWithOrder.id);
  assert(softDeleteSuccess === true, "Xóa sản phẩm đã có đơn hàng (Soft Delete bảo toàn FK)", `ID: ${prodWithOrder.id}`);

  // Kiểm tra sản phẩm đã bị ẩn khỏi catalog chưa
  const catalogCheck = await getProductsFromDb({ search: "Ghế Có Đơn Hàng Test" });
  assert(catalogCheck.items.length === 0, "Sản phẩm đã bị gỡ khỏi danh mục bán lẻ", "Không xuất hiện trên Storefront");

  // Dọn dẹp dữ liệu test order
  await prisma.orderItem.deleteMany({ where: { orderId: dummyOrder.id } });
  await prisma.order.delete({ where: { id: dummyOrder.id } });
  await prisma.product.delete({ where: { id: prodWithOrder.id } });

  // ---------------------------------------------------------------------------
  // PHẦN 3: MÃ GIẢM GIÁ & VOUCHER (COUPON SYSTEM)
  // ---------------------------------------------------------------------------
  console.log("\n--- [3] KIỂM THỬ HỆ THỐNG MÃ GIẢM GIÁ (COUPONS) ---");
  // 3.1 Validate coupon phần trăm (ERGO10: giảm 10%)
  const coupon10 = await validateCouponInDb("ERGO10", 6000000);
  assert(coupon10.valid === true && coupon10.discountAmount === 600000, "Áp dụng mã ERGO10 giảm 10%", `Giảm: ${coupon10.discountAmount}đ`);

  // 3.2 Validate coupon số tiền cố định (WELCOME: giảm 100k cho đơn từ 1tr)
  const couponWelcome = await validateCouponInDb("WELCOME", 2500000);
  assert(couponWelcome.valid === true && couponWelcome.discountAmount === 100000, "Áp dụng mã WELCOME giảm 100k", `Giảm: ${couponWelcome.discountAmount}đ`);

  // 3.3 Validate coupon không đủ giá trị đơn hàng tối thiểu (VIP20 yêu cầu >= 5tr)
  const couponMinFail = await validateCouponInDb("VIP20", 2000000);
  assert(couponMinFail.valid === false, "Từ chối mã VIP20 khi đơn hàng chưa đạt giá trị tối thiểu (yêu cầu 5M)", couponMinFail.message);

  // 3.4 Validate coupon không tồn tại
  const couponInvalid = await validateCouponInDb("MA_KHONG_TON_TAI_123", 5000000);
  assert(couponInvalid.valid === false, "Từ chối mã giảm giá không tồn tại trong hệ thống", couponInvalid.message);

  // ---------------------------------------------------------------------------
  // PHẦN 4: ĐƠN HÀNG & TRỪ TỒN KHO & QUẢN TRỊ TRẠNG THÁI (ORDERS)
  // ---------------------------------------------------------------------------
  console.log("\n--- [4] KIỂM THỬ ĐẶT HÀNG, TỒN KHO & XỬ LÝ ĐƠN HÀNG ---");
  
  // 4.1 Lấy sản phẩm ergo-pro-x1 và ghi nhận tồn kho ban đầu
  const beforeProd = await prisma.product.findUnique({ where: { id: "ergo-pro-x1" } });
  const initialStock = beforeProd!.stockQuantity;

  // 4.2 Tạo đơn hàng mới
  const createdOrder = await createOrderInDb({
    userId: "usr-customer-01",
    shippingAddress: {
      fullName: "Trần Minh Quân",
      phone: "0987654321",
      email: "quan.tran@example.com",
      detail: "456 Đường Lê Lợi, Phường Bến Nghé",
      province: "TP. Hồ Chí Minh",
      district: "Quận 1",
      note: "Giao giờ hành chính",
    },
    paymentMethod: "cod",
    items: [
      {
        product: { id: "ergo-pro-x1" } as any,
        quantity: 2,
      },
    ],
    couponCode: "ERGO10",
  });
  assert(createdOrder !== null && createdOrder.items.length === 1, "Tạo đơn hàng thành công", `Mã đơn: ${createdOrder.id}, Tổng tiền: ${createdOrder.total}đ`);

  // 4.3 Kiểm tra trừ tồn kho trong MySQL
  const afterProd = await prisma.product.findUnique({ where: { id: "ergo-pro-x1" } });
  assert(afterProd!.stockQuantity === initialStock - 2, "Tự động trừ 2 tồn kho khi đặt hàng", `Tồn kho cũ: ${initialStock} -> Mới: ${afterProd!.stockQuantity}`);

  // 4.4 Admin truy vấn đơn hàng
  const userOrders = await getOrdersFromDb({ userId: "usr-customer-01" });
  assert(userOrders.some(o => o.id === createdOrder.id), "Truy vấn danh sách đơn hàng theo khách hàng", `Tổng số: ${userOrders.length}`);

  const orderDetail = await getOrderByIdFromDb(createdOrder.id);
  assert(orderDetail !== null && orderDetail.shippingAddress.fullName === "Trần Minh Quân", "Truy vấn chi tiết đơn hàng theo ID", `Người nhận: ${orderDetail?.shippingAddress.fullName}`);

  // 4.5 Admin cập nhật trạng thái đơn hàng (processing -> shipped -> completed)
  const updatedShipped = await updateOrderStatusInDb(createdOrder.id, OrderStatus.shipped);
  assert(updatedShipped !== null && updatedShipped.status === "shipped", "Chuyển trạng thái đơn hàng sang 'shipped'", `Status: ${updatedShipped?.status}`);

  const updatedCompleted = await updateOrderStatusInDb(createdOrder.id, OrderStatus.completed, PaymentStatus.paid);
  assert(updatedCompleted !== null && updatedCompleted.status === "completed", "Hoàn tất đơn hàng sang 'completed'", `Status: ${updatedCompleted?.status}`);

  // ---------------------------------------------------------------------------
  // PHẦN 5: ĐÁNH GIÁ & TÍNH ĐIỂM SAO TỰ ĐỘNG (REVIEWS & RATINGS)
  // ---------------------------------------------------------------------------
  console.log("\n--- [5] KIỂM THỬ ĐÁNH GIÁ & TỰ ĐỘNG CẬP NHẬT RATING ---");
  const initialReviews = await getReviewsFromDb("ergo-pro-x1");
  const initialReviewCount = initialReviews.length;

  const newReview = await createReviewInDb({
    productId: "ergo-pro-x1",
    userId: "usr-customer-01",
    rating: 5,
    comment: "Sau 2 tuần sử dụng cơn đau thắt lưng đã đỡ hẳn, hoàn thiện khung kim loại rất chắc chắn.",
  });
  assert(newReview !== null && newReview.rating === 5, "Tạo đánh giá 5 sao cho sản phẩm", `Review ID: ${newReview.id}`);

  const afterReviews = await getReviewsFromDb("ergo-pro-x1");
  assert(afterReviews.length === initialReviewCount + 1, "Danh sách đánh giá tăng thêm 1", `Tổng đánh giá: ${afterReviews.length}`);

  const reviewedProd = await prisma.product.findUnique({ where: { id: "ergo-pro-x1" } });
  assert(reviewedProd!.reviewCount === afterReviews.length, "Cột reviewCount của sản phẩm tự động đồng bộ trong MySQL", `ReviewCount: ${reviewedProd!.reviewCount}`);

  // ---------------------------------------------------------------------------
  // PHẦN 6: XÁC THỰC NGƯỜI DÙNG & SỔ ĐỊA CHỈ (AUTH & ADDRESS BOOK)
  // ---------------------------------------------------------------------------
  console.log("\n--- [6] KIỂM THỬ XÁC THỰC, ĐĂNG NHẬP, ĐĂNG KÝ & SỔ ĐỊA CHỈ ---");
  
  // 6.1 Đăng nhập Admin
  const adminAuth = await authenticateUser({ email: "admin@ergochair.vn", password: "123456" });
  assert(adminAuth.user !== undefined && adminAuth.user.role === "admin", "Xác thực đăng nhập tài khoản quản trị Admin", adminAuth.user?.email);

  // 6.2 Đăng nhập Khách hàng
  const custAuth = await authenticateUser({ email: "quan.tran@example.com", password: "123456" });
  assert(custAuth.user !== undefined && custAuth.user.role === "customer", "Xác thực đăng nhập tài khoản khách hàng", custAuth.user?.email);

  // 6.3 Từ chối mật khẩu sai
  const wrongAuth = await authenticateUser({ email: "quan.tran@example.com", password: "sai_mat_khau_123" });
  assert(wrongAuth.user === undefined && wrongAuth.error !== undefined, "Từ chối khi nhập sai mật khẩu", wrongAuth.error);

  // 6.4 Đăng ký tài khoản khách hàng mới
  const testEmail = `test.user.${Date.now()}@example.com`;
  const regResult = await registerUserInDb({
    email: testEmail,
    password: "Password@123",
    fullName: "Nguyễn Văn Test Đăng Ký",
    phone: "0977889900",
  });
  assert(regResult.user !== undefined && regResult.user.email === testEmail, "Đăng ký thành viên mới thành công", regResult.user?.fullName);

  // 6.5 Thêm địa chỉ nhận hàng vào Sổ địa chỉ
  const addedAddress = await addUserAddressInDb(regResult.user!.id, {
    fullName: "Nguyễn Văn Test Đăng Ký",
    phone: "0977889900",
    province: "Đà Nẵng",
    district: "Hải Châu",
    detail: "123 Đường Bạch Đằng",
    isDefault: true,
  });
  assert(addedAddress !== null && addedAddress.province === "Đà Nẵng", "Thêm địa chỉ giao hàng vào sổ địa chỉ", addedAddress.detail);

  const userWithAddrs = await findUserByIdFromDb(regResult.user!.id);
  assert(userWithAddrs !== null && userWithAddrs.addresses.length === 1 && userWithAddrs.addresses[0].isDefault === true, "Truy vấn sổ địa chỉ người dùng", `Số địa chỉ: ${userWithAddrs?.addresses.length}`);

  // Dọn dẹp tài khoản test đăng ký
  await prisma.address.deleteMany({ where: { userId: regResult.user!.id } });
  await prisma.user.delete({ where: { id: regResult.user!.id } });

  // ---------------------------------------------------------------------------
  // PHẦN 7: THỐNG KÊ QUẢN TRỊ ADMIN DASHBOARD (ANALYTICS & METRICS)
  // ---------------------------------------------------------------------------
  console.log("\n--- [7] KIỂM THỬ THỐNG KÊ ADMIN DASHBOARD ---");
  const stats = await getAdminDashboardStats();
  assert(typeof stats.totalRevenue === "number" && stats.totalRevenue >= 0, "Thống kê Tổng doanh thu (VNĐ)", `${stats.totalRevenue.toLocaleString("vi-VN")}đ`);
  assert(typeof stats.totalOrders === "number" && stats.totalOrders > 0, "Thống kê Tổng số đơn hàng", `${stats.totalOrders} đơn`);
  assert(typeof stats.totalCustomers === "number" && stats.totalCustomers > 0, "Thống kê Tổng số khách hàng", `${stats.totalCustomers} khách`);
  assert(typeof stats.lowStockCount === "number" && Array.isArray(stats.lowStockProducts), "Thống kê Sản phẩm sắp hết hàng", `${stats.lowStockCount} sản phẩm (danh sách: ${stats.lowStockProducts.length})`);
  assert(Array.isArray(stats.recentOrders) && stats.recentOrders.length > 0, "Danh sách đơn hàng mới nhất cho Dashboard", `${stats.recentOrders.length} đơn hiển thị`);

  // Dọn dẹp review và order test
  await prisma.review.delete({ where: { id: newReview.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: createdOrder.id } });
  await prisma.order.delete({ where: { id: createdOrder.id } });
  // Hoàn trả tồn kho cho ergo-pro-x1
  await prisma.product.update({
    where: { id: "ergo-pro-x1" },
    data: { stockQuantity: initialStock },
  });

  // ---------------------------------------------------------------------------
  // TỔNG KẾT
  // ---------------------------------------------------------------------------
  const total = reports.length;
  const passed = reports.filter(r => r.passed).length;
  const failed = reports.filter(r => !r.passed).length;

  console.log("\n=================================================================");
  console.log(`  KẾT QUẢ KIỂM THỬ: ${passed}/${total} VƯỢT QUA (${Math.round((passed/total)*100)}%)`);
  if (failed === 0) {
    console.log("  >>> TẤT CẢ TÍNH NĂNG HOẠT ĐỘNG HOÀN HẢO 100% TRÊN MYSQL <<<");
  } else {
    console.log(`  >>> CÓ ${failed} KIỂM THỬ KHÔNG ĐẠT <<<`);
  }
  console.log("=================================================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch((err) => {
  console.error("Lỗi nghiêm trọng trong quá trình kiểm thử:", err);
  process.exit(1);
});
