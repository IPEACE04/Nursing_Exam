import Link from "next/link";
import { GraduationCap, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center premium-gradient-bg p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card/80 p-8 text-center shadow-lg backdrop-blur-xl">
        <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-primary/8">
          <GraduationCap className="size-10 text-primary/60" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          404
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          ไม่พบหน้าที่คุณต้องการ
        </p>
        <Link
          href="/dashboard"
          className="btn-premium mt-6 inline-flex"
        >
          <ArrowLeft className="size-4" />
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}
