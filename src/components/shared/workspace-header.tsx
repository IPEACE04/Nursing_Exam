"use client";

import { usePathname } from "next/navigation";
import { studentNavItems } from "@/lib/navigation";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";

export function WorkspaceHeader() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const active = studentNavItems.find((item) => pathname.startsWith(item.href));
  return (
    <header className="hidden min-h-20 items-center justify-between gap-4 border-b border-border bg-card px-8 lg:flex xl:px-12">
      <p className="text-sm text-muted-foreground">NurseUp <span className="mx-3 text-border">/</span><span className="text-foreground">{active ? t(locale, active.label) : t(locale, "common.profile")}</span></p>
    </header>
  );
}
