import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";

const sarabun = Sarabun({
  variable: "--font-sans",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Nursing Exam — ฝึกทำข้อสอบสภาการพยาบาล",
  description:
    "แพลตฟอร์มฝึกทำข้อสอบจำลองเตรียมสอบใบประกอบวิชาชีพของสภาการพยาบาล พร้อมระบบจับเวลา เฉลยละเอียด และกราฟวิเคราะห์พัฒนาการ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full`}>
      <body className="min-h-full flex flex-col premium-gradient-bg text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
