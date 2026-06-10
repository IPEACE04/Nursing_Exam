import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fc] p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-4xl font-bold text-[#1a2744]">404</h1>
        <p className="mt-2 text-sm text-slate-500">
          ไม่พบหน้าที่คุณต้องการ
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1a2744] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1a2744]/90"
        >
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}
