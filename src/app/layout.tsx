import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai, Sora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";

const ibmPlex = IBM_Plex_Sans_Thai({
  variable: "--font-sans",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const sora = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NurseUp — ฝึกทำข้อสอบสภาการพยาบาล",
  description:
    "แพลตฟอร์มฝึกทำข้อสอบจำลองเตรียมสอบใบประกอบวิชาชีพของสภาการพยาบาล พร้อมระบบจับเวลา เฉลยละเอียด และกราฟวิเคราะห์พัฒนาการ",
  icons: {
    icon: "/kk.png",
    apple: "/kk.png",
  },
  openGraph: {
    title: "NurseUp — ฝึกทำข้อสอบสภาการพยาบาล",
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
    <html lang="th" className={`${ibmPlex.variable} ${sora.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-notebook text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
