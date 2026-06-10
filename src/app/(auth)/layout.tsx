import { GraduationCap, Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-[45%] overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 premium-mesh opacity-60" />
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 size-80 rounded-full bg-chart-3/10 blur-3xl" />

        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <GraduationCap className="size-6 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">Nursing Exam</span>
          </div>
        </div>

        <div className="relative z-10 px-10 pb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
            <Sparkles className="size-3.5 text-accent" />
            Premium Learning Platform
          </div>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
            เตรียมสอบใบประกอบวิชาชีพ
            <br />
            <span className="text-gradient-gold">อย่างมั่นใจ</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
            ฝึกทำข้อสอบจำลอง พร้อมระบบจับเวลา เฉลยละเอียด
            และวิเคราะห์พัฒนาการแบบเรียลไทม์
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { value: "100+", label: "ข้อสอบ" },
              { value: "24/7", label: "เข้าถึงได้" },
              { value: "Real", label: "สมจริง" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-white/5 p-4 backdrop-blur-sm"
              >
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border/60 bg-card/80 p-8 shadow-lg backdrop-blur-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
