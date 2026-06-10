"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, Sparkles, ArrowRight, Clock, BarChart3, Target, Shield, ChevronRight } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { createSupabaseBrowserClient } = await import("@/lib/supabase-client");
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push("/dashboard");
          return;
        }
      } catch {}
      setChecking(false);
    }
    checkAuth();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center premium-gradient-bg-intense">
        <span className="size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const features = [
    { icon: Clock, title: "ระบบจับเวลา", desc: "จับเวลาเสมือนจริง ฝึกทำภายใต้แรงกดดันเหมือนสอบจริง" },
    { icon: BarChart3, title: "วิเคราะห์พัฒนาการ", desc: "กราฟแสดงคะแนนและความก้าวหน้าแบบ Real-time" },
    { icon: Target, title: "เฉลยละเอียด", desc: "คำอธิบายทุกข้อ รู้ว่าผิดเพราะอะไรและต้องแก้ไขตรงไหน" },
    { icon: Shield, title: "มั่นใจได้", desc: "ข้อสอบครอบคลุมเนื้อหาสอบใบประกอบวิชาชีพการพยาบาล" },
  ];

  return (
    <div className="min-h-screen premium-gradient-bg-intense">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-card/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-sm">
              <GraduationCap className="size-5 text-primary-foreground" />
            </div>
            <span className="text-base font-semibold text-foreground">Nursing Exam</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-premium-outline px-4 py-2 text-sm">
              เข้าสู่ระบบ
            </Link>
            <Link href="/register" className="btn-premium px-4 py-2 text-sm">
              ลงทะเบียน
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-40 -right-40 size-[500px] rounded-full bg-accent/8 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 size-[400px] rounded-full bg-chart-3/8 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/15 px-4 py-1.5 text-xs font-medium text-accent-foreground">
                <Sparkles className="size-3.5 text-accent" />
                แพลตฟอร์มฝึกทำข้อสอบสภาการพยาบาล
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              เตรียมสอบใบประกอบวิชาชีพ
              <br />
              <span className="text-gradient-gold">อย่างมั่นใจ</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground"
            >
              ฝึกทำข้อสอบจำลอง พร้อมระบบจับเวลาเสมือนจริง เฉลยละเอียดทุกข้อ 
              และวิเคราะห์พัฒนาการแบบเรียลไทม์ เตรียมพร้อมก่อนวันสอบจริง
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex items-center justify-center gap-4"
            >
              <Link
                href="/register"
                className="btn-premium px-8 py-3 text-base shadow-lg"
              >
                เริ่มเรียนฟรี
                <ArrowRight className="size-5" />
              </Link>
              <Link href="/login" className="btn-premium-outline px-8 py-3 text-base">
                เข้าสู่ระบบ
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12 grid grid-cols-3 gap-6 rounded-2xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm"
            >
              {[
                { value: "50+", label: "ชุดข้อสอบ" },
                { value: "500+", label: "ข้อสอบ" },
                { value: "Real", label: "สมจริง" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold text-foreground sm:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="border-t border-border/40 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
                ทำไมต้องเรียนกับเรา?
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                ครบทุกเครื่องมือที่ช่วยให้คุณพร้อมสอบ
              </p>
            </motion.div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/8">
                      <Icon className="size-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feature.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-border/40 py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
                พร้อมแล้วหรือยัง?
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                เริ่มฝึกทำข้อสอบวันนี้ ก้าวสู่อนาคตวิชาชีพการพยาบาล
              </p>
              <Link
                href="/register"
                className="btn-premium mt-8 inline-flex px-8 py-3 text-base shadow-lg"
              >
                สมัครใช้งานฟรี
                <ChevronRight className="size-5" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Nursing Exam Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
