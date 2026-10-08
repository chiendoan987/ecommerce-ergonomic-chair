/**
 * Danh sách Tỉnh / Thành phố và Quận / Huyện chuẩn Việt Nam cho tính cước vận chuyển
 */
export interface DistrictData {
  name: string;
}

export interface ProvinceData {
  name: string;
  isMajorCity?: boolean; // Hà Nội, TP.HCM, Đà Nẵng
  districts: string[];
}

export const VIETNAM_PROVINCES: ProvinceData[] = [
  {
    name: "Hà Nội",
    isMajorCity: true,
    districts: [
      "Quận Cầu Giấy",
      "Quận Ba Đình",
      "Quận Đống Đa",
      "Quận Thanh Xuân",
      "Quận Nam Từ Liêm",
      "Quận Bắc Từ Liêm",
      "Quận Hà Đông",
      "Quận Hai Bà Trưng",
      "Quận Hoàn Kiếm",
      "Quận Tây Hồ",
      "Quận Hoàng Mai",
      "Quận Long Biên",
      "Huyện Gia Lâm",
      "Huyện Đông Anh",
      "Huyện Thanh Trì",
      "Huyện Hoài Đức",
    ],
  },
  {
    name: "TP. Hồ Chí Minh",
    isMajorCity: true,
    districts: [
      "Quận 1",
      "Quận 3",
      "Quận 5",
      "Quận 7",
      "Quận 10",
      "Quận Bình Thạnh",
      "Quận Phú Nhuận",
      "Quận Tân Bình",
      "Quận Tân Phú",
      "Quận Gò Vấp",
      "Quận Bình Tân",
      "TP. Thủ Đức",
      "Huyện Nhà Bè",
      "Huyện Hóc Môn",
      "Huyện Bình Chánh",
    ],
  },
  {
    name: "Đà Nẵng",
    isMajorCity: true,
    districts: [
      "Quận Hải Châu",
      "Quận Thanh Khê",
      "Quận Sơn Trà",
      "Quận Ngũ Hành Sơn",
      "Quận Cẩm Lệ",
      "Quận Liên Chiểu",
      "Huyện Hòa Vang",
    ],
  },
  {
    name: "Hải Phòng",
    districts: [
      "Quận Hồng Bàng",
      "Quận Ngô Quyền",
      "Quận Lê Chân",
      "Quận Hải An",
      "Quận Kiến An",
      "Huyện Thủy Nguyên",
      "Huyện An Dương",
    ],
  },
  {
    name: "Cần Thơ",
    districts: [
      "Quận Ninh Kiều",
      "Quận Bình Thủy",
      "Quận Cái Răng",
      "Quận Ô Môn",
      "Quận Thốt Nốt",
    ],
  },
  {
    name: "Bình Dương",
    districts: [
      "TP. Thủ Dầu Một",
      "TP. Thuận An",
      "TP. Dĩ An",
      "TP. Tân Uyên",
      "TP. Bến Cát",
      "Huyện Bàu Bàng",
    ],
  },
  {
    name: "Đồng Nai",
    districts: [
      "TP. Biên Hòa",
      "TP. Long Khánh",
      "Huyện Long Thành",
      "Huyện Nhơn Trạch",
      "Huyện Trảng Bom",
    ],
  },
  {
    name: "Bắc Ninh",
    districts: [
      "TP. Bắc Ninh",
      "TP. Từ Sơn",
      "Thị xã Quế Võ",
      "Thị xã Thuận Thành",
      "Huyện Yên Phong",
      "Huyện Tiên Du",
    ],
  },
  {
    name: "Quảng Ninh",
    districts: [
      "TP. Hạ Long",
      "TP. Cẩm Phả",
      "TP. Uông Bí",
      "TP. Móng Cái",
      "Thị xã Quảng Yên",
      "Thị xã Đông Triều",
    ],
  },
  {
    name: "Hải Dương",
    districts: [
      "TP. Hải Dương",
      "TP. Chí Linh",
      "Thị xã Kinh Môn",
      "Huyện Cẩm Giàng",
      "Huyện Nam Sách",
    ],
  },
  {
    name: "Hưng Yên",
    districts: [
      "TP. Hưng Yên",
      "Thị xã Mỹ Hào",
      "Huyện Văn Giang",
      "Huyện Văn Lâm",
      "Huyện Yên Mỹ",
    ],
  },
  {
    name: "Vĩnh Phúc",
    districts: ["TP. Vĩnh Yên", "TP. Phúc Yên", "Huyện Bình Xuyên", "Huyện Yên Lạc"],
  },
  {
    name: "Thái Nguyên",
    districts: ["TP. Thái Nguyên", "TP. Sông Công", "TP. Phổ Yên", "Huyện Phú Bình"],
  },
  {
    name: "Thừa Thiên Huế",
    districts: ["TP. Huế", "Thị xã Hương Thủy", "Thị xã Hương Trà", "Huyện Phú Vang"],
  },
  {
    name: "Khánh Hòa",
    districts: ["TP. Nha Trang", "TP. Cam Ranh", "Thị xã Ninh Hòa", "Huyện Diên Khánh"],
  },
  {
    name: "Lâm Đồng",
    districts: ["TP. Đà Lạt", "TP. Bảo Lộc", "Huyện Đức Trọng", "Huyện Đơn Dương"],
  },
  {
    name: "Bà Rịa - Vũng Tàu",
    districts: ["TP. Vũng Tàu", "TP. Bà Rịa", "Thị xã Phú Mỹ", "Huyện Long Điền"],
  },
  {
    name: "Nghệ An",
    districts: ["TP. Vinh", "Thị xã Cửa Lò", "Huyện Diễn Châu", "Huyện Nghi Lộc"],
  },
  {
    name: "Thanh Hóa",
    districts: ["TP. Thanh Hóa", "TP. Sầm Sơn", "Thị xã Bỉm Sơn", "Huyện Quảng Xương"],
  },
  {
    name: "Nam Định",
    districts: ["TP. Nam Định", "Huyện Ý Yên", "Huyện Hải Hậu", "Huyện Vụ Bản"],
  },
];
