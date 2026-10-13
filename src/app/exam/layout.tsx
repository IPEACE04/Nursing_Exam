"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { LocaleToggle } from "@/components/shared/locale-toggle";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";

export default function ExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { locale } = useLocale();
  return (
    <div className="min-h-screen bg-background">
      {pathname === "/exam" ? (
        <>
          <header className="border-b border-border bg-card">
            <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
              <Brand />
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" /><span className="hidden sm:inline">{t(locale, "nav.dashboard")}</span></Link>
                <LocaleToggle />
              </div>
            </div>
          </header>
          <main className="px-5 py-8 sm:px-8 sm:py-12">{children}</main>
        </>
      ) : children}
    </div>
  );
}
