import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { LocaleProvider } from "@/context/locale-context";
import { PresentationMotion } from "@/components/shared/presentation-motion";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NurseUp — ระบบติวสอบออนไลน์วิชาการพยาบาลอนามัยชุมชน",
  description:
    "แพลตฟอร์มฝึกทำข้อสอบจำลองเตรียมสอบใบประกอบวิชาชีพของสภาการพยาบาล พร้อมระบบจับเวลา เฉลยละเอียด และกราฟวิเคราะห์พัฒนาการ",
  icons: {
    icon: "/kk.png",
    apple: "/kk.png",
  },
  openGraph: {
    title: "NurseUp — ระบบติวสอบออนไลน์วิชาการพยาบาลอนามัยชุมชน",
    description:
      "แพลตฟอร์มฝึกทำข้อสอบจำลองเตรียมสอบใบประกอบวิชาชีพของสภาการพยาบาล พร้อมระบบจับเวลา เฉลยละเอียด และกราฟวิเคราะห์พัฒนาการ",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${prompt.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-notebook text-foreground">
        <LocaleProvider>
          <AuthProvider><PresentationMotion>{children}</PresentationMotion></AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
