import type { Metadata } from "next";
import { Poppins, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { SiteHeader } from "@/components/site-header";
import { ScrollRevealProvider } from "@/components/scroll-reveal-provider";
import { ScrollToTop } from "@/components/scroll-to-top";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
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
      className={`${poppins.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <ScrollRevealProvider />
          <SiteHeader />
          {children}
          <ScrollToTop />
        </CartProvider>
      </body>
    </html>
  );
}
