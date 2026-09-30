export interface NavItem {
  title: string;
  href: string;
}

export const mainNav: NavItem[] = [
  { title: "Trang chủ", href: "/" },
  { title: "Sản phẩm", href: "/products" },
  { title: "Về chúng tôi", href: "/about" },
  { title: "Liên hệ", href: "/contact" },
];

export const categoryNavItems = [
  { title: "Ghế công thái học", href: "/products?category=Ghế+công+thái+học" },
  { title: "Ghế văn phòng", href: "/products?category=Ghế+văn+phòng" },
  { title: "Ghế gaming", href: "/products?category=Ghế+gaming" },
  { title: "Ghế lãnh đạo", href: "/products?category=Ghế+lãnh+đạo" },
];
