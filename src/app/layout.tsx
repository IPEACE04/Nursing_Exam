import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";

const ibmPlex = IBM_Plex_Sans_Thai({
  variable: "--font-sans",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NurseSim — ฝึกทำข้อสอบสภาการพยาบาล",
  description:
    "แพลตฟอร์มฝึกทำข้อสอบจำลองเตรียมสอบใบประกอบวิชาชีพของสภาการพยาบาล พร้อมระบบจับเวลา เฉลยละเอียด และกราฟวิเคราะห์พัฒนาการ",
  openGraph: {
    title: "NurseSim — ฝึกทำข้อสอบสภาการพยาบาล",
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
    <html lang="th" className={`${ibmPlex.variable} ${cormorant.variable} h-full`}>
      <body className="min-h-full flex flex-col premium-gradient-bg text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
