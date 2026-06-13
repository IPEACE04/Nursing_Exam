import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-muted text-primary font-bold text-xl">
          N
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          404
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          ไม่พบหน้าที่คุณต้องการ
        </p>
        <Link
          href="/community"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px mt-6"
        >
          <ArrowLeft className="size-4" />
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}
