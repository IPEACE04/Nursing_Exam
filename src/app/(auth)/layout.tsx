"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/shared/brand";
import { StudyVisual } from "@/components/shared/study-visual";
import { LocaleToggle } from "@/components/shared/locale-toggle";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { locale } = useLocale();
  const pathname = usePathname();
  const visual = pathname === "/register" ? "register" : pathname === "/forgot-password" ? "recovery" : "login";
  return (
    <div className="min-h-dvh bg-background p-2.5 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100svh-1.25rem)] max-w-[1500px] overflow-hidden rounded-2xl border border-border bg-card sm:min-h-[calc(100svh-3rem)] lg:grid-cols-2">
        <section className="flex min-w-0 flex-col px-5 py-6 sm:px-12 sm:py-10 lg:px-16">
          <div className="flex items-center justify-between gap-4">
            <Brand />
            <LocaleToggle />
          </div>
          <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-12 sm:py-14">{children}</main>
        </section>
        <aside className="relative m-3 hidden min-h-[600px] overflow-hidden rounded-xl lg:block">
          <StudyVisual variant={visual} priority className="absolute inset-0" />
          <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-foreground/85 via-foreground/15 to-transparent" />
          <div className="absolute inset-x-8 bottom-10 z-10 text-white xl:inset-x-12 xl:bottom-14">
            <h2 className="max-w-lg text-3xl font-medium leading-relaxed xl:text-4xl">{t(locale, "landing.hero")}<br />{t(locale, "landing.heroSub")}</h2>
            <p className="mt-6 max-w-md border-t border-white/30 pt-5 text-sm leading-relaxed text-white/90">{t(locale, "landing.desc")}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
