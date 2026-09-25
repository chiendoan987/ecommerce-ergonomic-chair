import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { SiteHeader } from "@/components/site-header";
import { ScrollRevealProvider } from "@/components/scroll-reveal-provider";
import { ScrollToTop } from "@/components/scroll-to-top";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ErgoChair - Ghế công thái học cao cấp",
  description: "Thiết kế cho tư thế tốt hơn, làm việc thoải mái hơn mỗi ngày. Bảo hành chính hãng 5 năm.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} ${playfair.variable} h-full antialiased`}
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
