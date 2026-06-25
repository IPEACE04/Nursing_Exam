"use client";

import { useEffect } from "react";
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
import { useAuth } from "@/context/auth-context";

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
  const { user, profile, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      if (profile?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/community");
      }
    }
  }, [isLoading, user, profile, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen">
      {/* ── Navbar ──────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex h-16 sm:h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <img src="/kk.png" alt="NurseUp" className="size-9 sm:size-10 rounded-xl object-cover" />
            <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              NurseUp
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
            >
              เริ่มฟรี
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="pt-28 pb-14 sm:pt-36 sm:pb-20 md:pt-40 md:pb-24">
          <div className="mx-auto max-w-4xl px-5 sm:px-6 text-center">

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight"
            >
              ฝึกสอบอย่างมืออาชีพ
              <br />
              ก่อนลงสนามจริง
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl leading-relaxed text-muted-foreground"
            >
              แพลตฟอร์มข้อสอบสำหรับนักศึกษาพยาบาล — วิเคราะห์ผล ติดตามพัฒนาการ
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
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
              >
                สมัครใช้งานฟรี
                <ArrowRight className="size-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-transparent px-8 text-base font-semibold text-foreground transition-all duration-150 hover:bg-muted active:translate-y-px"
              >
                มีบัญชีอยู่แล้ว
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────── */}
        <section className="pb-20 sm:pb-24 md:pb-28">
          <div className="mx-auto max-w-4xl px-5 sm:px-6">
            <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-4">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    className="rounded-2xl border border-border bg-card p-5 sm:p-6 transition-all duration-200 hover:shadow-sm hover:border-border/80 hover:-translate-y-0.5"
                  >
                    <Icon className="mb-3 size-6 text-primary" />
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
      <footer className="border-t border-border py-8">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} NurseUp · Rangsit University
        </p>
      </footer>
    </div>
  );
}
