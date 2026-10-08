import { PrismaClient, UserRole, UserStatus, StockStatus, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu khởi tạo dữ liệu mẫu (Seeding Database)...");

  // 1. Tạo Danh Mục (Categories)
  console.log("📁 Tạo danh mục sản phẩm...");
  const categoriesData = [
    {
      id: "cat-cong-thai-hoc",
      name: "Ghế công thái học",
      slug: "ghe-cong-thai-hoc",
      description: "Dòng ghế thiết kế chuẩn công thái học hỗ trợ cột sống tối đa khi làm việc kéo dài.",
      sortOrder: 1,
    },
    {
      id: "cat-van-phong",
      name: "Ghế văn phòng",
      slug: "ghe-van-phong",
      description: "Dòng ghế làm việc hiện đại, êm ái, tối ưu cho môi trường văn phòng chuyên nghiệp.",
      sortOrder: 2,
    },
    {
      id: "cat-gaming",
      name: "Ghế gaming",
      slug: "ghe-gaming",
      description: "Dòng ghế gaming đẳng cấp với đệm đúc nguyên khối và góc ngả linh hoạt.",
      sortOrder: 3,
    },
    {
      id: "cat-lanh-dao",
      name: "Ghế lãnh đạo",
      slug: "ghe-lanh-dao",
      description: "Dòng ghế giám đốc, lãnh đạo sang trọng với chất liệu da cao cấp và gỗ tự nhiên.",
      sortOrder: 4,
    },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  // 2. Tạo Người Dùng (Users)
  console.log("👤 Tạo người dùng & tài khoản quản trị...");
  const usersData = [
    {
      id: "usr-admin-01",
      fullName: "Nguyễn Văn Quản Trị",
      email: "admin@ergochair.vn",
      phone: "0901234567",
      password: "123456",
      role: UserRole.admin,
      status: UserStatus.active,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    },
    {
      id: "usr-customer-01",
      fullName: "Trần Minh Quân",
      email: "quan.tran@example.com",
      phone: "0987654321",
      password: "123456",
      role: UserRole.customer,
      status: UserStatus.active,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    },
    {
      id: "usr-customer-02",
      fullName: "Lê Hoàng Yến",
      email: "hoangyen.le@gmail.com",
      phone: "0912345678",
      password: "123456",
      role: UserRole.customer,
      status: UserStatus.active,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    },
    {
      id: "usr-customer-03",
      fullName: "Phạm Quốc Dũng",
      email: "dung.pq@vinagroup.vn",
      phone: "0977889900",
      password: "123456",
      role: UserRole.customer,
      status: UserStatus.active,
    },
    {
      id: "usr-customer-04",
      fullName: "Nguyễn Hải Đăng",
      email: "haidang.gamer@gmail.com",
      phone: "0934567891",
      password: "123456",
      role: UserRole.customer,
      status: UserStatus.active,
    },
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: u,
      create: u,
    });
  }

  // Tạo địa chỉ cho khách hàng
  console.log("📍 Tạo địa chỉ người dùng...");
  const addressesData = [
    {
      id: "addr-01",
      userId: "usr-admin-01",
      fullName: "Nguyễn Văn Quản Trị",
      phone: "0901234567",
      province: "Hà Nội",
      district: "Nam Từ Liêm",
      detail: "36 Nguyễn Cơ Thạch, Mỹ Đình 2",
      isDefault: true,
    },
    {
      id: "addr-02",
      userId: "usr-customer-01",
      fullName: "Trần Minh Quân",
      phone: "0987654321",
      province: "TP. Hồ Chí Minh",
      district: "Quận 1",
      detail: "123 Lê Lợi, Bến Nghé",
      isDefault: true,
    },
    {
      id: "addr-03",
      userId: "usr-customer-02",
      fullName: "Lê Hoàng Yến",
      phone: "0912345678",
      province: "Hà Nội",
      district: "Cầu Giấy",
      detail: "Tòa Keangnam Landmark 72, Phạm Hùng",
      isDefault: true,
    },
  ];

  for (const addr of addressesData) {
    await prisma.address.upsert({
      where: { id: addr.id },
      update: addr,
      create: addr,
    });
  }

  // 3. Tạo Sản Phẩm (Products)
  console.log("🪑 Tạo sản phẩm và biến thể...");
  const productsData = [
    {
      id: "focus-task",
      slug: "focus-task",
      name: "Focus Task",
      categoryId: "cat-van-phong",
      category: "Ghế văn phòng",
      image: "/images/products/focus-task.png",
      images: [
        "/images/products/focus-task.png",
        "/images/products/focus-task/1.png",
        "/images/products/focus-task/2.png",
        "/images/products/focus-task/3.png",
      ],
      gallery: [
        "/images/products/focus-task/1.png",
        "/images/products/focus-task/2.png",
        "/images/products/focus-task/3.png",
      ],
      price: 6790000,
      oldPrice: 7990000,
      compareAtPrice: 7990000,
      rating: 4.8,
      reviewCount: 141,
      inStock: true,
      stockStatus: StockStatus.in_stock,
      stockQuantity: 42,
      material: "Lưới AirFlex & nylon",
      color: "Xám graphite",
      size: "66 × 65 × 110–120 cm",
      weight: "17.5 kg",
      capacity: "140 kg",
      warranty: "5 năm",
      isFeatured: true,
      description:
        "Focus Task giữ cho bạn tỉnh táo và thoải mái với thiết kế hỗ trợ lưng chủ động, tối ưu cho công việc tập trung cao độ.",
      specs: {
        "Chất liệu": "Lưới AirFlex & nylon",
        "Màu sắc": "Xám graphite",
        "Kích thước": "66 × 65 × 110–120 cm",
        "Trọng lượng": "17.5 kg",
        "Tải trọng tối đa": "140 kg",
        "Thời gian bảo hành": "5 năm",
      },
      variants: [
        { name: "Tiêu chuẩn (Graphite)", priceDelta: 0, stockQuantity: 25 },
        { name: "Bản nâng cấp đệm tản nhiệt", priceDelta: 500000, stockQuantity: 17 },
      ],
    },
    {
      id: "cloud-mesh-air",
      slug: "cloud-mesh-air",
      name: "Cloud Mesh Air",
      categoryId: "cat-cong-thai-hoc",
      category: "Ghế công thái học",
      image: "/images/products/cloud-mesh-air.png",
      images: [
        "/images/products/cloud-mesh-air.png",
        "/images/products/cloud-mesh-air/1.png",
        "/images/products/cloud-mesh-air/2.png",
      ],
      gallery: [
        "/images/products/cloud-mesh-air/1.png",
        "/images/products/cloud-mesh-air/2.png",
      ],
      price: 6290000,
      oldPrice: 7490000,
      compareAtPrice: 7490000,
      rating: 4.8,
      reviewCount: 214,
      inStock: true,
      stockStatus: StockStatus.in_stock,
      stockQuantity: 35,
      material: "Lưới AirFlex & nylon cao cấp",
      color: "Xám sương",
      size: "65 × 64 × 108–118 cm",
      weight: "16 kg",
      capacity: "135 kg",
      warranty: "5 năm",
      isFeatured: true,
      description:
        "Cloud Mesh Air mang đến cảm giác nhẹ thoáng và nâng đỡ linh hoạt. Thiết kế tối giản phù hợp với mọi góc làm việc hiện đại.",
      specs: {
        "Chất liệu": "Lưới AirFlex & nylon cao cấp",
        "Màu sắc": "Xám sương",
        "Kích thước": "65 × 64 × 108–118 cm",
        "Trọng lượng": "16 kg",
        "Tải trọng tối đa": "135 kg",
        "Thời gian bảo hành": "5 năm",
      },
      variants: [
        { name: "Khung Xám Sương", priceDelta: 0, stockQuantity: 20 },
        { name: "Khung Đen Tuyền", priceDelta: 0, stockQuantity: 15 },
      ],
    },
    {
      id: "executive-oak",
      slug: "executive-oak",
      name: "Executive Oak",
      categoryId: "cat-lanh-dao",
      category: "Ghế lãnh đạo",
      image: "/images/products/executive-oak.png",
      images: [
        "/images/products/executive-oak.png",
        "/images/products/executive-oak/1.png",
      ],
      gallery: ["/images/products/executive-oak/1.png"],
      price: 12990000,
      oldPrice: 14990000,
      compareAtPrice: 14990000,
      rating: 5.0,
      reviewCount: 87,
      inStock: true,
      stockStatus: StockStatus.in_stock,
      stockQuantity: 18,
      material: "Da PU & gỗ sồi tự nhiên",
      color: "Nâu gỗ",
      size: "72 × 70 × 115–125 cm",
      weight: "24 kg",
      capacity: "160 kg",
      warranty: "7 năm",
      isFeatured: true,
      description:
        "Executive Oak kết hợp vẻ đẹp ấm áp của gỗ sồi với hệ thống điều chỉnh công thái học tinh tế, dành cho những không gian làm việc có gu.",
      specs: {
        "Chất liệu": "Da PU & gỗ sồi tự nhiên",
        "Màu sắc": "Nâu gỗ",
        "Kích thước": "72 × 70 × 115–125 cm",
        "Trọng lượng": "24 kg",
        "Tải trọng tối đa": "160 kg",
        "Thời gian bảo hành": "7 năm",
      },
    },
    {
      id: "motion-lite",
      slug: "motion-lite",
      name: "Motion Lite",
      categoryId: "cat-van-phong",
      category: "Ghế văn phòng",
      image: "/images/products/motion-lite.png",
      images: [
        "/images/products/motion-lite.png",
        "/images/products/motion-lite/1.png",
        "/images/products/motion-lite/2.png",
      ],
      gallery: [
        "/images/products/motion-lite/1.png",
        "/images/products/motion-lite/2.png",
      ],
      price: 4890000,
      oldPrice: 5890000,
      compareAtPrice: 5890000,
      rating: 4.7,
      reviewCount: 156,
      inStock: false,
      stockStatus: StockStatus.out_of_stock,
      stockQuantity: 0,
      material: "Vải dệt & nylon",
      color: "Xanh olive",
      size: "64 × 63 × 104–114 cm",
      weight: "15 kg",
      capacity: "120 kg",
      warranty: "3 năm",
      isFeatured: false,
      description:
        "Motion Lite gọn nhẹ, linh hoạt và dễ làm quen. Đây là mẫu ghế thực dụng cho góc làm việc tại nhà.",
      specs: {
        "Chất liệu": "Vải dệt & nylon",
        "Màu sắc": "Xanh olive",
        "Kích thước": "64 × 63 × 104–114 cm",
        "Trọng lượng": "15 kg",
        "Tải trọng tối đa": "120 kg",
        "Thời gian bảo hành": "3 năm",
      },
    },
    {
      id: "play-seat-pro",
      slug: "play-seat-pro",
      name: "Play Seat Pro",
      categoryId: "cat-gaming",
      category: "Ghế gaming",
      image: "/images/products/play-seat-pro.png",
      images: [
        "/images/products/play-seat-pro.png",
        "/images/products/play-seat-pro/2.png",
      ],
      gallery: ["/images/products/play-seat-pro/2.png"],
      price: 7290000,
      oldPrice: 8490000,
      compareAtPrice: 8490000,
      rating: 4.8,
      reviewCount: 192,
      inStock: true,
      stockStatus: StockStatus.in_stock,
      stockQuantity: 28,
      material: "Da PU & foam định hình",
      color: "Đen đỏ",
      size: "70 × 68 × 120–130 cm",
      weight: "21 kg",
      capacity: "150 kg",
      warranty: "5 năm",
      isFeatured: true,
      description:
        "Play Seat Pro hỗ trợ vững chắc cho những phiên làm việc và giải trí kéo dài, với phần tựa lưng ôm và đệm ngồi đàn hồi.",
      specs: {
        "Chất liệu": "Da PU & foam định hình",
        "Màu sắc": "Đen đỏ",
        "Kích thước": "70 × 68 × 120–130 cm",
        "Trọng lượng": "21 kg",
        "Tải trọng tối đa": "150 kg",
        "Thời gian bảo hành": "5 năm",
      },
    },
    {
      id: "aero-support",
      slug: "aero-support",
      name: "Aero Support",
      categoryId: "cat-cong-thai-hoc",
      category: "Ghế công thái học",
      image: "/images/products/aero-support.png",
      images: [
        "/images/products/aero-support.png",
        "/images/products/aero-support/1.png",
      ],
      gallery: ["/images/products/aero-support/1.png"],
      price: 5590000,
      oldPrice: 6790000,
      compareAtPrice: 6790000,
      rating: 4.6,
      reviewCount: 119,
      inStock: true,
      stockStatus: StockStatus.in_stock,
      stockQuantity: 22,
      material: "Lưới thoáng khí & thép sơn tĩnh điện",
      color: "Trắng kem",
      size: "65 × 64 × 109–119 cm",
      weight: "17 kg",
      capacity: "135 kg",
      warranty: "5 năm",
      isFeatured: false,
      description:
        "Aero Support là mẫu ghế thông thoáng với phần đỡ thắt lưng điều chỉnh được, giúp tư thế ngồi luôn cân bằng.",
      specs: {
        "Chất liệu": "Lưới thoáng khí & thép sơn tĩnh điện",
        "Màu sắc": "Trắng kem",
        "Kích thước": "65 × 64 × 109–119 cm",
        "Trọng lượng": "17 kg",
        "Tải trọng tối đa": "135 kg",
        "Thời gian bảo hành": "5 năm",
      },
    },
    {
      id: "lounge-heritage",
      slug: "lounge-heritage",
      name: "Lounge Heritage",
      categoryId: "cat-lanh-dao",
      category: "Ghế lãnh đạo",
      image: "/images/products/lounge-heritage.png",
      images: [
        "/images/products/lounge-heritage.png",
        "/images/products/lounge-heritage/1.png",
      ],
      gallery: ["/images/products/lounge-heritage/1.png"],
      price: 10990000,
      oldPrice: 12490000,
      compareAtPrice: 12490000,
      rating: 4.9,
      reviewCount: 64,
      inStock: false,
      stockStatus: StockStatus.out_of_stock,
      stockQuantity: 0,
      material: "Vải boucle & gỗ sồi",
      color: "Be tự nhiên",
      size: "75 × 72 × 110–120 cm",
      weight: "23 kg",
      capacity: "150 kg",
      warranty: "7 năm",
      isFeatured: false,
      description:
        "Lounge Heritage tạo nên một góc làm việc mềm mại và trang nhã với chất liệu cao cấp cùng đường nét thư giãn.",
      specs: {
        "Chất liệu": "Vải boucle & gỗ sồi",
        "Màu sắc": "Be tự nhiên",
        "Kích thước": "75 × 72 × 110–120 cm",
        "Trọng lượng": "23 kg",
        "Tải trọng tối đa": "150 kg",
        "Thời gian bảo hành": "7 năm",
      },
    },
    {
      id: "ergo-pro-x1",
      slug: "ergo-pro-x1",
      name: "Ergo Pro X1",
      categoryId: "cat-van-phong",
      category: "Ghế văn phòng",
      image: "/images/products/ergo-pro-x1.png",
      images: [
        "/images/products/ergo-pro-x1.png",
        "/images/products/ergo-pro-x1/1.png",
        "/images/products/ergo-pro-x1/2.png",
      ],
      gallery: [
        "/images/products/ergo-pro-x1/1.png",
        "/images/products/ergo-pro-x1/2.png",
      ],
      price: 8490000,
      oldPrice: 9990000,
      compareAtPrice: 9990000,
      rating: 4.9,
      reviewCount: 328,
      inStock: true,
      stockStatus: StockStatus.in_stock,
      stockQuantity: 50,
      material: "Lưới AirFlex & hợp kim nhôm",
      color: "Đen than",
      size: "67 × 67 × 112–122 cm",
      weight: "18.5 kg",
      capacity: "150 kg",
      warranty: "5 năm",
      isFeatured: true,
      description:
        "Ergo Pro X1 là lựa chọn cân bằng giữa hiệu năng và thẩm mỹ. Tựa lưng AirFlex ôm sát đường cong tự nhiên, giúp bạn tập trung thoải mái trong suốt ngày dài.",
      specs: {
        "Chất liệu": "Lưới AirFlex & hợp kim nhôm",
        "Màu sắc": "Đen than",
        "Kích thước": "67 × 67 × 112–122 cm",
        "Trọng lượng": "18.5 kg",
        "Tải trọng tối đa": "150 kg",
        "Thời gian bảo hành": "5 năm",
      },
    },
  ];

  for (const item of productsData) {
    const { variants, ...prodData } = item;
    const product = await prisma.product.upsert({
      where: { id: prodData.id },
      update: prodData,
      create: prodData,
    });

    if (variants && variants.length > 0) {
      for (const variant of variants) {
        const variantId = `${product.id}-${variant.name.toLowerCase().replace(/\s+/g, "-")}`;
        await prisma.productVariant.upsert({
          where: { id: variantId },
          update: {
            name: variant.name,
            priceDelta: variant.priceDelta,
            stockQuantity: variant.stockQuantity,
          },
          create: {
            id: variantId,
            productId: product.id,
            name: variant.name,
            priceDelta: variant.priceDelta,
            stockQuantity: variant.stockQuantity,
          },
        });
      }
    }
  }

  // 4. Tạo Mã Giảm Giá (Coupons)
  console.log("🎟️ Tạo mã giảm giá...");
  const couponsData = [
    {
      id: "cpn-ergo10",
      code: "ERGO10",
      description: "Giảm 10% cho đơn hàng đầu tiên",
      discountPercent: 10,
      minOrderValue: 2000000,
      isActive: true,
      usedCount: 14,
    },
    {
      id: "cpn-vip20",
      code: "VIP20",
      description: "Giảm 20% cho khách hàng VIP",
      discountPercent: 20,
      minOrderValue: 5000000,
      isActive: true,
      usedCount: 5,
    },
    {
      id: "cpn-welcome",
      code: "WELCOME",
      description: "Quà tặng 100.000đ cho khách hàng mới",
      discountAmount: 100000,
      minOrderValue: 1000000,
      isActive: true,
      usedCount: 32,
    },
    {
      id: "cpn-freeship",
      code: "FREESHIP",
      description: "Miễn phí vận chuyển toàn quốc",
      discountAmount: 30000,
      minOrderValue: 0,
      isActive: true,
      usedCount: 88,
    },
  ];

  for (const c of couponsData) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }

  // 5. Tạo Đánh Giá Sản Phẩm (Reviews)
  console.log("⭐ Tạo đánh giá sản phẩm...");
  const reviewsData = [
    {
      id: "rev-1",
      productId: "focus-task",
      userId: "usr-customer-01",
      authorName: "Nguyễn Tuấn Khôi",
      authorRole: "Tech Lead",
      rating: 5,
      comment: "Tôi ngồi code liên tục 9-10 tiếng mỗi ngày, từ ngày đổi sang Focus Task chứng đau thắt lưng giảm rõ rệt. Khung ghế rất chắc chắn và lưới thoáng.",
      verifiedPurchase: true,
      isApproved: true,
    },
    {
      id: "rev-2",
      productId: "focus-task",
      userId: "usr-customer-02",
      authorName: "Trần Mai Phương",
      authorRole: "Senior Designer",
      rating: 5,
      comment: "Thiết kế tối giản và hiện đại rất hợp không gian làm việc. Tay vịn 3D chỉnh được nhiều góc đỡ mỏi tay khi vẽ wacom.",
      verifiedPurchase: true,
      isApproved: true,
    },
    {
      id: "rev-3",
      productId: "focus-task",
      authorName: "Lê Văn Hùng",
      authorRole: "DevOps Engineer",
      rating: 4,
      comment: "Chất lượng hoàn thiện tốt, đệm ngồi êm không bị xẹp. Điểm trừ nhỏ là lắp đặt ban đầu hơi mất thời gian một chút nhưng hướng dẫn kèm theo rất rõ ràng.",
      verifiedPurchase: true,
      isApproved: true,
    },
    {
      id: "rev-4",
      productId: "cloud-mesh-air",
      authorName: "Phạm Hải Đăng",
      authorRole: "Software Architect",
      rating: 5,
      comment: "Lưới AirFlex siêu êm và mát, ngồi phòng không bật điều hòa vẫn không bị bí lưng. Cơ chế ngả lưng 135 độ ngủ trưa cực kỳ tiện lợi.",
      verifiedPurchase: true,
      isApproved: true,
    },
    {
      id: "rev-5",
      productId: "cloud-mesh-air",
      authorName: "Hoàng Bích Thủy",
      authorRole: "Product Manager",
      rating: 5,
      comment: "Ghế rất nhẹ nhàng nhưng vô cùng vững chãi. Hỗ trợ thắt lưng tự động điều chỉnh theo từng cử động.",
      verifiedPurchase: true,
      isApproved: true,
    },
    {
      id: "rev-6",
      productId: "ergo-pro-x1",
      authorName: "Vũ Đình Nam",
      authorRole: "Kinh doanh tự do",
      rating: 5,
      comment: "Xứng đáng từng đồng bỏ ra. Khung nhôm nguyên khối đầm tay, bánh xe di chuyển mượt mà không gây xước sàn gỗ.",
      verifiedPurchase: true,
      isApproved: true,
    },
    {
      id: "rev-7",
      productId: "play-seat-pro",
      authorName: "Đinh Công Minh",
      authorRole: "Gamer & Streamer",
      rating: 5,
      comment: "Ngồi chơi game và làm việc nhiều giờ liền không bị mỏi. Khóa ngả đa điểm rất mượt mà.",
      verifiedPurchase: true,
      isApproved: true,
    },
    {
      id: "rev-8",
      productId: "executive-oak",
      authorName: "Bùi Hoàng Long",
      authorRole: "Managing Director",
      rating: 5,
      comment: "Da cao cấp và đường may cực kỳ tinh tế, toát lên phong thái chuyên nghiệp cho phòng làm việc.",
      verifiedPurchase: true,
      isApproved: true,
    },
  ];

  for (const rev of reviewsData) {
    await prisma.review.upsert({
      where: { id: rev.id },
      update: rev,
      create: rev,
    });
  }

  // Tự động đồng bộ số lượng đánh giá và điểm rating chuẩn xác cho từng sản phẩm
  console.log("🔄 Đồng bộ số lượng đánh giá và điểm rating của sản phẩm...");
  const allDbProducts = await prisma.product.findMany();
  for (const prod of allDbProducts) {
    const prodReviews = await prisma.review.findMany({
      where: { productId: prod.id, isApproved: true },
      select: { rating: true },
    });
    const count = prodReviews.length;
    const avg = count > 0 ? Number((prodReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)) : 5.0;

    await prisma.product.update({
      where: { id: prod.id },
      data: {
        rating: avg,
        reviewCount: count,
      },
    });
  }

  // 6. Tạo Đơn Hàng Mẫu (Orders)
  console.log("📦 Tạo đơn hàng thực tế...");
  const ordersData = [
    {
      id: "ord-2026-001",
      userId: "usr-customer-01",
      status: OrderStatus.completed,
      paymentMethod: PaymentMethod.cod,
      paymentStatus: PaymentStatus.paid,
      subtotal: 6290000,
      discount: 0,
      shippingFee: 30000,
      total: 6320000,
      recipientName: "Trần Minh Quân",
      recipientPhone: "0987654321",
      recipientEmail: "quan.tran@example.com",
      deliveryAddress: "123 Lê Lợi, Bến Nghé",
      province: "TP. Hồ Chí Minh",
      district: "Quận 1",
      items: [
        {
          productId: "cloud-mesh-air",
          productName: "Cloud Mesh Air",
          productImage: "/images/products/cloud-mesh-air.png",
          price: 6290000,
          quantity: 1,
        },
      ],
    },
    {
      id: "ord-2026-002",
      userId: "usr-customer-02",
      status: OrderStatus.processing,
      paymentMethod: PaymentMethod.vnpay,
      paymentStatus: PaymentStatus.paid,
      subtotal: 22070000,
      discount: 2207000,
      shippingFee: 0,
      total: 19863000,
      couponCode: "ERGO10",
      recipientName: "Lê Hoàng Yến",
      recipientPhone: "0912345678",
      recipientEmail: "hoangyen.le@gmail.com",
      deliveryAddress: "Tòa Keangnam Landmark 72, Phạm Hùng",
      province: "Hà Nội",
      district: "Cầu Giấy",
      items: [
        {
          productId: "focus-task",
          productName: "Focus Task",
          productImage: "/images/products/focus-task.png",
          price: 6790000,
          quantity: 2,
        },
        {
          productId: "ergo-pro-x1",
          productName: "Ergo Pro X1",
          productImage: "/images/products/ergo-pro-x1.png",
          price: 8490000,
          quantity: 1,
        },
      ],
    },
    {
      id: "ord-2026-003",
      userId: "usr-customer-01",
      status: OrderStatus.shipped,
      paymentMethod: PaymentMethod.bank_transfer,
      paymentStatus: PaymentStatus.paid,
      subtotal: 8490000,
      discount: 0,
      shippingFee: 30000,
      total: 8520000,
      recipientName: "Trần Minh Quân",
      recipientPhone: "0987654321",
      recipientEmail: "quan.tran@example.com",
      deliveryAddress: "123 Lê Lợi, Bến Nghé",
      province: "TP. Hồ Chí Minh",
      district: "Quận 1",
      items: [
        {
          productId: "ergo-pro-x1",
          productName: "Ergo Pro X1",
          productImage: "/images/products/ergo-pro-x1.png",
          price: 8490000,
          quantity: 1,
        },
      ],
    },
    {
      id: "ord-2026-004",
      userId: "usr-customer-03",
      status: OrderStatus.pending,
      paymentMethod: PaymentMethod.bank_transfer,
      paymentStatus: PaymentStatus.unpaid,
      subtotal: 12990000,
      discount: 1299000,
      shippingFee: 50000,
      total: 11741000,
      couponCode: "ERGO10",
      recipientName: "Phạm Quốc Dũng",
      recipientPhone: "0977889900",
      recipientEmail: "dung.pq@vinagroup.vn",
      deliveryAddress: "88 Bạch Đằng, P. Thạch Thang",
      province: "Đà Nẵng",
      district: "Hải Châu",
      items: [
        {
          productId: "executive-oak",
          productName: "Executive Oak",
          productImage: "/images/products/executive-oak.png",
          price: 12990000,
          quantity: 1,
        },
      ],
    },
    {
      id: "ord-2026-005",
      userId: "usr-customer-04",
      status: OrderStatus.completed,
      paymentMethod: PaymentMethod.momo,
      paymentStatus: PaymentStatus.paid,
      subtotal: 7290000,
      discount: 0,
      shippingFee: 30000,
      total: 7320000,
      recipientName: "Nguyễn Hải Đăng",
      recipientPhone: "0934567891",
      recipientEmail: "haidang.gamer@gmail.com",
      deliveryAddress: "45 Đại Lộ Bình Dương",
      province: "Bình Dương",
      district: "Thủ Dầu Một",
      items: [
        {
          productId: "play-seat-pro",
          productName: "Play Seat Pro",
          productImage: "/images/products/play-seat-pro.png",
          price: 7290000,
          quantity: 1,
        },
      ],
    },
    {
      id: "ord-2026-006",
      userId: null,
      status: OrderStatus.cancelled,
      paymentMethod: PaymentMethod.cod,
      paymentStatus: PaymentStatus.unpaid,
      subtotal: 6790000,
      discount: 0,
      shippingFee: 30000,
      total: 6820000,
      cancelReason: "Khách đổi ý muốn lấy mẫu khác",
      recipientName: "Vũ Thùy Linh",
      recipientPhone: "0908123456",
      recipientEmail: "thuylinh.vu@yahoo.com",
      deliveryAddress: "12 Chùa Bộc, Trung Tự",
      province: "Hà Nội",
      district: "Đống Đa",
      items: [
        {
          productId: "focus-task",
          productName: "Focus Task",
          productImage: "/images/products/focus-task.png",
          price: 6790000,
          quantity: 1,
        },
      ],
    },
  ];

  for (const order of ordersData) {
    const { items, ...orderHeader } = order;
    const createdOrder = await prisma.order.upsert({
      where: { id: orderHeader.id },
      update: orderHeader,
      create: orderHeader,
    });

    // Xóa items cũ nếu có và thêm lại
    await prisma.orderItem.deleteMany({
      where: { orderId: createdOrder.id },
    });

    for (const item of items) {
      await prisma.orderItem.create({
        data: {
          orderId: createdOrder.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          price: item.price,
          quantity: item.quantity,
        },
      });
    }
  }

  console.log("✅ Seeding hoàn tất thành công! Cơ sở dữ liệu MySQL đã sẵn sàng.");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi seeding cơ sở dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
