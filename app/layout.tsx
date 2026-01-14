import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const cairo = Cairo({ 
  subsets: ["latin", "arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: {
    default: "نظام إدارة الميزات",
    template: "%s | نظام إدارة الميزات",
  },
  description: "نظام شامل لإدارة وتنظيم الميزات الخاصة بالمشاريع مع إمكانية رفع الصور وتنظيم الميزات بشكل هرمي",
  keywords: ["إدارة الميزات", "المشاريع", "تنظيم الميزات", "ميزات المشاريع"],
  authors: [{ name: "نظام إدارة الميزات" }],
  creator: "نظام إدارة الميزات",
  openGraph: {
    type: "website",
    locale: "ar",
    url: "/",
    title: "نظام إدارة الميزات",
    description: "نظام شامل لإدارة وتنظيم الميزات الخاصة بالمشاريع",
    siteName: "نظام إدارة الميزات",
  },
  twitter: {
    card: "summary_large_image",
    title: "نظام إدارة الميزات",
    description: "نظام شامل لإدارة وتنظيم الميزات الخاصة بالمشاريع",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className={cairo.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

