import { ReactNode } from "react";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-5 sm:p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 sm:p-10">
        {children}
      </div>
    </div>
  );
}
