import type { Metadata } from "next";
import { Inter } from "next/font/google"; // หรือ font ที่คุณใช้อยู่
import "./globals.css";
import { LiffProvider } from "@/components/LiffProvider"; // <-- เพิ่มบรรทัดนี้

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EDS Car Booking",
  description: "ระบบจองรถภายในบริษัท",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* ครอบ LiffProvider ไว้ตรงนี้เพื่อให้ทุกหน้าใช้ได้ */}
        <LiffProvider>{children}</LiffProvider>
      </body>
    </html>
  );
}
