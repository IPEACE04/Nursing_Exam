import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-clinical-grid p-4">
      <div className="w-full max-w-sm rounded-xl border border-border/50 bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-lg bg-primary/8 text-primary font-bold text-xl">
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
          className="btn-premium mt-6 inline-flex"
        >
          <ArrowLeft className="size-4" />
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}
