"use client";

import { useLocale } from "@/context/locale-context";
import { cn } from "@/lib/utils";

export function LocaleToggle({ className }: { className?: string }) {
  const { locale, toggleLocale } = useLocale();

  return (
    <button
      onClick={toggleLocale}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-muted/50 px-2.5 text-xs font-semibold text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground",
        className
      )}
      title={locale === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
    >
      <span className={locale === "th" ? "text-foreground" : ""}>TH</span>
      <span className="text-border">/</span>
      <span className={locale === "en" ? "text-foreground" : ""}>EN</span>
    </button>
  );
}
