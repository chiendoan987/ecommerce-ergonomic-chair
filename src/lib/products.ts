export type Product = {
  id: string;
  name: string;
  category: string;
  image: string;
  gallery: string[];
  price: number;
  oldPrice: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  material: string;
  color: string;
  size: string;
  weight: string;
  capacity: string;
  warranty: string;
  description: string;
};

export const products: Product[] = [
  { id: "focus-task", name: "Focus Task", category: "Ghế văn phòng", image: "/images/products/focus-task.png", gallery: ["/images/products/focus-task/1.png", "/images/products/focus-task/2.png", "/images/products/focus-task/3.png"], price: 6790000, oldPrice: 7990000, rating: 4.8, reviewCount: 141, inStock: true, material: "Lưới AirFlex & nylon", color: "Xám graphite", size: "66 × 65 × 110–120 cm", weight: "17.5 kg", capacity: "140 kg", warranty: "5 năm", description: "Focus Task giữ cho bạn tỉnh táo và thoải mái với thiết kế hỗ trợ lưng chủ động, tối ưu cho công việc tập trung." },
  { id: "cloud-mesh-air", name: "Cloud Mesh Air", category: "Ghế công thái học", image: "/images/products/cloud-mesh-air.png", gallery: ["/images/products/cloud-mesh-air/1.png", "/images/products/cloud-mesh-air/2.png"], price: 6290000, oldPrice: 7490000, rating: 4.8, reviewCount: 214, inStock: true, material: "Lưới AirFlex & nylon cao cấp", color: "Xám sương", size: "65 × 64 × 108–118 cm", weight: "16 kg", capacity: "135 kg", warranty: "5 năm", description: "Cloud Mesh Air mang đến cảm giác nhẹ thoáng và nâng đỡ linh hoạt. Thiết kế tối giản phù hợp với mọi góc làm việc hiện đại." },
  { id: "executive-oak", name: "Executive Oak", category: "Ghế lãnh đạo", image: "/images/products/executive-oak.png", gallery: ["/images/products/executive-oak/1.png"], price: 12990000, oldPrice: 14990000, rating: 5, reviewCount: 87, inStock: true, material: "Da PU & gỗ sồi tự nhiên", color: "Nâu gỗ", size: "72 × 70 × 115–125 cm", weight: "24 kg", capacity: "160 kg", warranty: "7 năm", description: "Executive Oak kết hợp vẻ đẹp ấm áp của gỗ sồi với hệ thống điều chỉnh công thái học tinh tế, dành cho những không gian làm việc có gu." },
  { id: "motion-lite", name: "Motion Lite", category: "Ghế văn phòng", image: "/images/products/motion-lite.png", gallery: ["/images/products/motion-lite/1.png", "/images/products/motion-lite/2.png"], price: 4890000, oldPrice: 5890000, rating: 4.7, reviewCount: 156, inStock: false, material: "Vải dệt & nylon", color: "Xanh olive", size: "64 × 63 × 104–114 cm", weight: "15 kg", capacity: "120 kg", warranty: "3 năm", description: "Motion Lite gọn nhẹ, linh hoạt và dễ làm quen. Đây là mẫu ghế thực dụng cho góc làm việc tại nhà." },
  { id: "play-seat-pro", name: "Play Seat Pro", category: "Ghế gaming", image: "/images/products/play-seat-pro.png", gallery: ["/images/products/play-seat-pro/2.png"], price: 7290000, oldPrice: 8490000, rating: 4.8, reviewCount: 192, inStock: true, material: "Da PU & foam định hình", color: "Đen đỏ", size: "70 × 68 × 120–130 cm", weight: "21 kg", capacity: "150 kg", warranty: "5 năm", description: "Play Seat Pro hỗ trợ vững chắc cho những phiên làm việc và giải trí kéo dài, với phần tựa lưng ôm và đệm ngồi đàn hồi." },
  { id: "aero-support", name: "Aero Support", category: "Ghế công thái học", image: "/images/products/aero-support.png", gallery: ["/images/products/aero-support/1.png"], price: 5590000, oldPrice: 6790000, rating: 4.6, reviewCount: 119, inStock: true, material: "Lưới thoáng khí & thép sơn tĩnh điện", color: "Trắng kem", size: "65 × 64 × 109–119 cm", weight: "17 kg", capacity: "135 kg", warranty: "5 năm", description: "Aero Support là mẫu ghế thông thoáng với phần đỡ thắt lưng điều chỉnh được, giúp tư thế ngồi luôn cân bằng." },
  { id: "lounge-heritage", name: "Lounge Heritage", category: "Ghế lãnh đạo", image: "/images/products/lounge-heritage.png", gallery: ["/images/products/lounge-heritage/1.png"], price: 10990000, oldPrice: 12490000, rating: 4.9, reviewCount: 64, inStock: false, material: "Vải boucle & gỗ sồi", color: "Be tự nhiên", size: "75 × 72 × 110–120 cm", weight: "23 kg", capacity: "150 kg", warranty: "7 năm", description: "Lounge Heritage tạo nên một góc làm việc mềm mại và trang nhã với chất liệu cao cấp cùng đường nét thư giãn." },
  { id: "ergo-pro-x1", name: "Ergo Pro X1", category: "Ghế văn phòng", image: "/images/products/ergo-pro-x1.png", gallery: ["/images/products/ergo-pro-x1/1.png", "/images/products/ergo-pro-x1/2.png"], price: 8490000, oldPrice: 9990000, rating: 4.9, reviewCount: 328, inStock: true, material: "Lưới AirFlex & hợp kim nhôm", color: "Đen than", size: "67 × 67 × 112–122 cm", weight: "18.5 kg", capacity: "150 kg", warranty: "5 năm", description: "Ergo Pro X1 là lựa chọn cân bằng giữa hiệu năng và thẩm mỹ. Tựa lưng AirFlex ôm sát đường cong tự nhiên, giúp bạn tập trung thoải mái trong suốt ngày dài." },
];

export function formatPrice(price: number) {
  return `${new Intl.NumberFormat("vi-VN").format(price)}đ`;
}