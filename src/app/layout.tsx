import type { Metadata } from "next";
import { Work_Sans, Plus_Jakarta_Sans, Lora, Playfair_Display, Baloo_2 } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/contexts/toast-context";
import { AuthProvider } from "@/contexts/auth-context";
import { WishlistProvider } from "@/contexts/wishlist-context";
import { CartProvider } from "@/components/cart-provider";
import { SiteHeader } from "@/components/site-header";
import { ScrollRevealProvider } from "@/components/scroll-reveal-provider";
import { ScrollToTop } from "@/components/scroll-to-top";
import { FloatingContactButtons } from "@/components/floating-contact-buttons";
import { FloatingChatbot } from "@/components/floating-chatbot";

// 1. Font nền giao diện (Pangea Fallback) ~88%: menu, link, tên sản phẩm, nút, nhãn nhỏ, body text
const pangeaFallback = Work_Sans({
  variable: "--font-pangea-fallback",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// 2. Font tiêu đề lớn (Criteria CF Fallback) ~12%: tiêu đề h1, h2, h3, h4
const criteriaFallback = Plus_Jakarta_Sans({
  variable: "--font-criteria-fallback",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// 3. Font mềm mại cao cấp Lora (Nét uốn lượn tự nhiên, mềm mại, khoảng cách từ chặt chẽ)
const loraFont = Lora({
  variable: "--font-lora-raw",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// 4. Font Playfair Display
const playfairFont = Playfair_Display({
  variable: "--font-playfair-raw",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

// 5. Font bo tròn mềm mại Baloo 2 (Fallback cho phong cách DVN Coffee Spark)
const balooFont = Baloo_2({
  variable: "--font-baloo-raw",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "ErgoChair - Ghế công thái học cao cấp",
  description: "Thiết kế cho tư thế tốt hơn, làm việc thoải mái hơn mỗi ngày. Bảo hành chính hãng 5 năm.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      data-scroll-behavior="smooth"
      className={`${pangeaFallback.variable} ${criteriaFallback.variable} ${loraFont.variable} ${playfairFont.variable} ${balooFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <ScrollRevealProvider />
                <SiteHeader />
                {children}
                <ScrollToTop />
                <FloatingContactButtons />
                <FloatingChatbot />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
