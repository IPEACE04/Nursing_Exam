"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  Globe,
  Info,
  LayoutDashboard,
  LogIn,
  MessageCircle,
  TrendingUp,
  Trophy,
  UserPlus,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/premium/page-header";
import { Brand } from "@/components/shared/brand";
import { LocaleToggle } from "@/components/shared/locale-toggle";
import landing from "@/app/landing.module.css";

interface GuideFigure {
  src: string;
  width: number;
  height: number;
  caption: string;
}

interface GuideSection {
  id: string;
  icon: LucideIcon;
  title: string;
  body: ReactNode;
  steps?: ReactNode[];
  note?: ReactNode;
  figures: GuideFigure[];
}

const fig = (name: string, width: number, height: number, caption: string): GuideFigure => ({
  src: `/images/guide/${name}.jpg`,
  width,
  height,
  caption,
});

const B = ({ children }: { children: ReactNode }) => (
  <strong className="font-semibold text-foreground">{children}</strong>
);

const journey = [
  { icon: UserPlus, title: "สมัครสมาชิก", desc: "กรอกข้อมูลส่วนตัว" },
  { icon: ClipboardCheck, title: "ทำ PreTest", desc: "40 ข้อ · 40 นาที" },
  { icon: ClipboardList, title: "ฝึกข้อสอบย่อย", desc: "ครบทั้ง 2 ชุด" },
  { icon: Award, title: "ทำ PostTest", desc: "ดูพัฒนาการและเฉลย" },
];

const sections: GuideSection[] = [
  {
    id: "start",
    icon: Globe,
    title: "เริ่มต้นใช้งาน",
    body: (
      <>
        เปิด NurseUp ได้ที่{" "}
        <a href="https://nurseup-rsu.vercel.app/" className="font-medium text-primary underline-offset-4 hover:underline">
          nurseup-rsu.vercel.app
        </a>{" "}
        ใช้งานได้ทั้งบนคอมพิวเตอร์และมือถือ
      </>
    ),
    figures: [fig("login-screen", 617, 375, "หน้าเข้าสู่ระบบของ NurseUp")],
  },
  {
    id: "register",
    icon: UserPlus,
    title: "สมัครสมาชิก",
    body: (
      <>
        ครั้งแรกที่ใช้งาน ให้ลงทะเบียนด้วยชื่อ-นามสกุล อีเมล รหัสผ่าน เพศ อายุ เกรดเฉลี่ย และรหัสนักศึกษา
        แล้วเลือกคำถามส่วนตัวพร้อมคำตอบไว้ใช้กู้คืนรหัสผ่าน
      </>
    ),
    steps: [
      <>คลิก <B>สมัครใช้งานฟรี</B></>,
      <>กรอกข้อมูลให้ครบ</>,
      <>คลิก <B>สมัครสมาชิก</B></>,
    ],
    note: <>จำคำตอบของคำถามส่วนตัวไว้ ต้องใช้ตอนกด <B>ลืมรหัสผ่าน?</B></>,
    figures: [fig("register", 1404, 991, "ขั้นตอนสมัครสมาชิก")],
  },
  {
    id: "login",
    icon: LogIn,
    title: "เข้าสู่ระบบ",
    body: <>เมื่อมีบัญชีแล้ว เข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่ลงทะเบียนไว้</>,
    steps: [
      <>คลิก <B>มีบัญชีอยู่แล้ว</B> หรือ <B>เข้าสู่ระบบ</B></>,
      <>กรอกอีเมลและรหัสผ่าน</>,
      <>คลิก <B>เข้าสู่ระบบ</B></>,
    ],
    figures: [fig("login", 1431, 425, "ขั้นตอนเข้าสู่ระบบ")],
  },
  {
    id: "pretest",
    icon: ClipboardCheck,
    title: "ทำข้อสอบ PreTest ครั้งแรก",
    body: (
      <>
        เข้าสู่ระบบครั้งแรก ต้องทำข้อสอบ PreTest ให้เสร็จก่อนจึงจะใช้เมนูอื่นได้ ข้อสอบมี 40 ข้อ เวลา 40 นาที
        เวลาเริ่มนับเมื่อคลิกเริ่มทำข้อสอบ
      </>
    ),
    steps: [
      <>คลิก <B>เริ่มทำข้อสอบ</B></>,
      <>ทำข้อสอบให้ครบ 40 ข้อ</>,
      <>คลิก <B>ส่งกระดาษคำตอบ</B></>,
      <>คลิก <B>ยืนยันส่ง</B></>,
    ],
    note: <>เริ่มแล้วหยุดเวลาไม่ได้ ข้อที่ไม่ได้ตอบจะนับเป็นข้อผิด</>,
    figures: [
      fig("pretest", 1437, 859, "ขั้นตอนทำและส่งข้อสอบ PreTest"),
      fig("progress-after-pretest", 446, 557, "หลังส่ง PreTest จะเห็นคะแนนในหน้าพัฒนาการ และ PostTest ยังถูกล็อกอยู่"),
    ],
  },
  {
    id: "community",
    icon: MessageCircle,
    title: "Community",
    body: (
      <>
        หลังทำ PreTest แล้ว ให้เข้าไปที่ Community เพื่ออ่านสรุปเนื้อหาวิชาและ Blueprint ตามสภาการพยาบาล
        ของวิชาการพยาบาลอนามัยชุมชน คุณยังแสดงความคิดเห็น แชร์เทคนิคทำข้อสอบ หรือถามเรื่องที่สงสัยเกี่ยวกับข้อสอบและเว็บไซต์ได้ที่นี่
      </>
    ),
    steps: [
      <>คลิกเมนู <B>Community</B></>,
      <>เลือกหมวดที่สนใจ หรืออ่านโพสต์สรุปเนื้อหาที่ปักหมุดไว้</>,
    ],
    figures: [fig("community", 1272, 1156, "หมวดความคิดเห็นและโพสต์สรุปเนื้อหาวิชา")],
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "แดชบอร์ด (Dashboard)",
    body: (
      <>
        สรุปทุกอย่างของคุณไว้ในหน้าเดียว ดูอันดับของคุณเทียบกับผู้ใช้ทั้งหมด และเริ่มทำข้อสอบย่อยได้จากหน้านี้
      </>
    ),
    steps: [
      <><B>อันดับของคุณ (Ranking)</B> คลิกดูทั้งหมดเพื่อดูอันดับของคนอื่น</>,
      <><B>ทำไปแล้ว (Completed)</B> จำนวนครั้งที่ทำข้อสอบ</>,
      <><B>คะแนนเฉลี่ย (Average Score)</B> และ <B>คะแนนสูงสุด (Best Score)</B></>,
      <><B>ข้อสอบที่เหลือ (Remaining Exams)</B> ชุดที่ยังไม่ได้ทำ</>,
      <><B>พัฒนาการ (Progress)</B> และ <B>ประวัติล่าสุด (Recent History)</B></>,
      <><B>แบบประเมินความพึงพอใจ</B> ช่วยให้เราปรับปรุง NurseUp</>,
    ],
    figures: [
      fig("dashboard", 1266, 1619, "อันดับและสถิติการทำข้อสอบ"),
      fig("dashboard-more", 1189, 1173, "พัฒนาการ ประวัติล่าสุด และแบบประเมินความพึงพอใจ"),
    ],
  },
  {
    id: "take-exam",
    icon: ClipboardList,
    title: "ทำข้อสอบ (Take Exam)",
    body: (
      <>
        ฝึกทำข้อสอบย่อยได้ที่หน้านี้ มี 2 ชุด ชุดละ 40 ข้อ เวลา 40 นาที ทำซ้ำได้ไม่จำกัด
        เมื่อทำข้อสอบย่อยครบทั้ง 2 ชุด จะปลดล็อก PostTest
      </>
    ),
    steps: [
      <>คลิกเมนู <B>ทำข้อสอบ</B></>,
      <>เลือกชุดข้อสอบ แล้วคลิก <B>เริ่มทำข้อสอบ</B></>,
    ],
    note: <>ชุดวัดระดับความรู้ (Pre/Post) อยู่ด้านบน ส่วนข้อสอบย่อยอยู่ด้านล่าง</>,
    figures: [fig("take-exam", 1244, 1761, "รายการข้อสอบ PostTest และชุดข้อสอบย่อย")],
  },
  {
    id: "history",
    icon: BarChart3,
    title: "ประวัติผลสอบ (Exam History)",
    body: (
      <>
        ดูคะแนนทุกครั้งที่คุณทำข้อสอบ ทั้งจำนวนชุดที่ทำ (Total exams) คะแนนเฉลี่ย คะแนนสูงสุด และรายการประวัติการสอบ
      </>
    ),
    steps: [<>คลิกเมนู <B>ประวัติผลสอบ</B></>],
    note: <>ถ้ายังไม่มีประวัติ คลิก <B>เริ่มทำข้อสอบเลย</B> เพื่อเลือกข้อสอบย่อย</>,
    figures: [fig("exam-history", 1195, 1795, "สถิติและรายการประวัติการสอบ")],
  },
  {
    id: "progress",
    icon: TrendingUp,
    title: "พัฒนาการ (Progress)",
    body: (
      <>
        ดูแนวโน้มคะแนนของคุณเป็นกราฟเส้น และผลต่างระหว่าง PreTest กับ PostTest
        ผู้ใช้ใหม่จะยังไม่เห็นกราฟจนกว่าจะทำข้อสอบย่อย
      </>
    ),
    steps: [<>คลิกเมนู <B>พัฒนาการ</B></>],
    figures: [fig("progress", 1470, 1773, "ซ้าย: ผู้ใช้ใหม่ที่ยังไม่ทำข้อสอบย่อย · ขวา: ผู้ใช้ที่ทำข้อสอบย่อยและ PostTest แล้ว")],
  },
  {
    id: "ranking",
    icon: Trophy,
    title: "อันดับ (Ranking)",
    body: <>ดูอันดับผู้ใช้ เรียงจากคะแนนสูงสุด มี 2 แท็บ</>,
    steps: [
      <><B>อันดับข้อสอบปกติ</B> (Assignment Leaderboard) อันดับจากคะแนนข้อสอบย่อย</>,
      <><B>อันดับ PreTest / PostTest</B> (Test Leaderboard) อันดับจากคะแนน PreTest และ PostTest</>,
    ],
    figures: [fig("ranking", 1470, 1558, "แท็บอันดับข้อสอบปกติ (ซ้าย) และอันดับ PreTest / PostTest (ขวา)")],
  },
  {
    id: "posttest",
    icon: Award,
    title: "PostTest และการดูเฉลย",
    body: (
      <>
        ทำ PostTest เสร็จแล้ว ทำซ้ำได้ไม่จำกัด คลิก <B>ดูผลเปรียบเทียบ PreTest vs PostTest</B> เพื่อดูพัฒนาการ
        และดูเฉลยของแต่ละชุดได้จากแดชบอร์ด
      </>
    ),
    steps: [
      <>คลิกเมนู <B>แดชบอร์ด</B></>,
      <>ที่ประวัติล่าสุด คลิกคะแนนของชุดที่ต้องการ เพื่อดูเฉลยละเอียด</>,
      <>คลิก <B>กลับไปแดชบอร์ด</B> เมื่อดูเสร็จ</>,
    ],
    figures: [fig("posttest-solutions", 1398, 1910, "ดูผลเปรียบเทียบและเฉลยของแต่ละชุด")],
  },
  {
    id: "profile",
    icon: UserRound,
    title: "ข้อมูลส่วนตัว",
    body: <>ดูและแก้ไขข้อมูลส่วนตัว หรือเปลี่ยนรหัสผ่านได้ที่หน้าโปรไฟล์</>,
    steps: [
      <>คลิกรูปโปรไฟล์ของคุณ</>,
      <>คลิก <B>โปรไฟล์</B></>,
      <>แก้ไขข้อมูล แล้วคลิก <B>บันทึก</B> หรือตั้งรหัสผ่านใหม่แล้วคลิก <B>เปลี่ยนรหัสผ่าน</B></>,
    ],
    figures: [fig("profile", 1421, 1893, "หน้าโปรไฟล์และการเปลี่ยนรหัสผ่าน")],
  },
];

function GuideFigureView({ figure }: { figure: GuideFigure }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-muted/30">
      <a href={figure.src} target="_blank" rel="noreferrer" className="block bg-white p-2 sm:p-4" aria-label={`ดูภาพขนาดเต็ม: ${figure.caption}`}>
        <Image
          src={figure.src}
          alt={figure.caption}
          width={figure.width}
          height={figure.height}
          sizes="(min-width: 1280px) 760px, (min-width: 1024px) 60vw, 100vw"
          className="mx-auto h-auto max-h-[720px] w-auto max-w-full object-contain"
        />
      </a>
      <figcaption className="border-t border-border px-4 py-3 text-sm text-muted-foreground">{figure.caption}</figcaption>
    </figure>
  );
}

function GuideContent() {
  const { locale } = useLocale();
  const [activeId, setActiveId] = useState(sections[0].id);
  const tocRef = useRef<HTMLUListElement>(null);

  // Highlight the section crossing the upper part of the viewport.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // On small screens the contents list scrolls sideways; keep the active item in view without moving the page.
  useEffect(() => {
    const list = tocRef.current;
    const link = list?.querySelector<HTMLElement>(`[data-id="${activeId}"]`);
    if (!list || !link || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: link.offsetLeft - 16, behavior: "smooth" });
  }, [activeId]);

  return (
    <div className="space-y-8">
      <PageHeader title={t(locale, "nav.guide")} description={t(locale, "guide.description")} />

      <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {journey.map((item, index) => {
          const Icon = item.icon;
          return (
            <li key={item.title} className="learning-panel flex items-center gap-4 p-4">
              <span className="relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-6" />
                <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  {index + 1}
                </span>
              </span>
              <span>
                <span className="block font-semibold text-foreground">{item.title}</span>
                <span className="block text-sm text-muted-foreground">{item.desc}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label={t(locale, "guide.contents")} className="lg:sticky lg:top-8 lg:self-start">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t(locale, "guide.contents")}</p>
          <ul ref={tocRef} className="relative flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
            {sections.map((section) => (
              <li key={section.id} className="shrink-0">
                <a
                  href={`#${section.id}`}
                  data-id={section.id}
                  aria-current={activeId === section.id ? "location" : undefined}
                  className={cn(
                    "block whitespace-nowrap rounded-xl border px-3 py-2 text-sm transition-colors lg:rounded-l-none lg:border-y-0 lg:border-r-0 lg:border-l-2",
                    activeId === section.id
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground lg:border-transparent"
                  )}
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <section key={section.id} id={section.id} className="learning-panel scroll-mt-24 space-y-5 p-5 sm:p-7">
                <header className="flex items-center gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-6" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-primary">หัวข้อที่ {index + 1}</p>
                    <h2 className="text-xl font-semibold text-foreground sm:text-2xl">{section.title}</h2>
                  </div>
                </header>

                <p className="max-w-3xl leading-relaxed text-muted-foreground">{section.body}</p>

                {section.steps && (
                  <ol className="space-y-2.5">
                    {section.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex items-start gap-3 text-muted-foreground">
                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                          {stepIndex + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                )}

                {section.note && (
                  <p className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed text-muted-foreground">
                    <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{section.note}</span>
                  </p>
                )}

                <div className="space-y-4">
                  {section.figures.map((figure) => (
                    <GuideFigureView key={figure.src} figure={figure} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function GuidePage() {
  const { user } = useAuth();
  const { locale } = useLocale();

  if (user) return <GuideContent />;

  // Guests reach this page from the landing navbar, so it carries the landing header instead of the app shell.
  return (
    <div className={landing.page}>
      <header className={landing.header}>
        <div className={landing.navInner}>
          <Link href="/" aria-label="NurseUp" className={landing.brand}><Brand /></Link>
          <div className={landing.navActions}>
            <LocaleToggle />
            <span className={landing.navGuide} aria-current="page"><BookOpen size={17} /><span>{t(locale, "nav.guide")}</span></span>
            <Link href="/login" className={landing.navLogin}>{t(locale, "landing.login")}</Link>
            <Link href="/register" className={landing.navCta}>{t(locale, "landing.startFree")} <ArrowRight size={16} /></Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-12 xl:px-12">
        <GuideContent />
      </main>
    </div>
  );
}
