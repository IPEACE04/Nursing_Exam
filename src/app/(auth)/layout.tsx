import { ReactNode } from "react";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-clinical-grid p-5 sm:p-6">

      <div className="w-full max-w-md rounded-2xl border border-border/40 bg-card p-6 sm:p-8 md:p-10 shadow-sm">
        {children}
      </div>
    </div>
  );
}
