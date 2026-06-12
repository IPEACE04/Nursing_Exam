"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Activity,
  BarChart3,
  Radio,
  CheckLine,
} from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Exam Mode",
    desc: "หน้าสอบได้ครบถ้วน พร้อมจับเวลา",
  },
  {
    icon: BarChart3,
    title: "Progress",
    desc: "วิเคราะห์พัฒนาการเป็นกราฟ",
  },
  {
    icon: Radio,
    title: "Community",
    desc: "คอมมูนิตี้เพื่อแบ่งปันความรู้ และเทคนิคในการทำข้อสอบ",
  },
  {
    icon: CheckLine,
    title: "Answer Keys",
    desc: "เฉลยพร้อมอธิบายอย่างละเอียด",
  },
];

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { createSupabaseBrowserClient } = await import(
          "@/lib/supabase-client"
        );
        const supabase = createSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          router.push("/community");
          return;
        }
      } catch {}
      setChecking(false);
    }
    checkAuth();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-clinical-grid">
      {/* ── Navbar ──────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-card/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 sm:h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <img src="/kk.png" alt="NurseCise" className="size-9 sm:size-10 rounded-3xl object-cover" />
            <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              NurseCise
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              เข้าสู่ระบบ
            </Link>
            <Link href="/register" className="btn-premium px-5 py-2.5 text-sm">
              เริ่มฟรี
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="pt-28 pb-14 sm:pt-36 sm:pb-20 md:pt-40 md:pb-24">
          <div className="mx-auto max-w-3xl px-5 sm:px-6 text-center">

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-[3.75rem] leading-[1.15]"
            >
              ฝึกสอบอย่าง{" "}
              <span className="text-primary font-extrabold">มืออาชีพ</span>
              <br />
              ก่อนลงสนามจริง
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-muted-foreground"
            >
              แพลตฟอร์มข้อสอบสำหรับนักศึกษาพยาบาล — วิเคราะห์ผล ติดตามพัฒนาการ
              <br className="hidden sm:block" />
              และวัดความพร้อมก่อนสอบใบประกอบ ในประสบการณ์ที่ได้จากข้อสอบจริง
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-sm sm:max-w-none mx-auto"
            >
              <Link
                href="/register"
                className="btn-premium px-8 py-3.5 text-base w-full sm:w-auto justify-center"
              >
                สมัครใช้งานฟรี
                <ArrowRight className="size-5" />
              </Link>
              <Link
                href="/login"
                className="btn-premium-outline px-8 py-3.5 text-base w-full sm:w-auto justify-center"
              >
                มีบัญชีอยู่แล้ว
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────── */}
        <section className="pb-20 sm:pb-24 md:pb-28">
          <div className="mx-auto max-w-4xl px-5 sm:px-6">
            <div className="grid grid-cols-2 gap-4 sm:gap-5 sm:grid-cols-4">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    className="rounded-xl border border-border/50 bg-card p-5 sm:p-6 shadow-sm transition-shadow duration-200 hover:shadow-md"
                  >
                    <Icon className="mb-3 size-6 text-muted-foreground" />
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">
                      {f.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {f.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-8">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} NurseCise · Rangsit University
        </p>
      </footer>
    </div>
  );
}
