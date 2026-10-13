"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { studentNavItems } from "@/lib/navigation";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";

export function MobileNav() {
  const pathname = usePathname();
  const { locale } = useLocale();

  return (
    <nav aria-label={t(locale, "common.navigation")} className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
      <div className="flex items-center justify-around px-1.5 py-2 sm:px-2 sm:py-3">
        {studentNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 sm:gap-1.5 rounded-lg px-1.5 sm:px-3 py-1 transition-colors duration-150 min-w-0 focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={cn(
                  "rounded-full p-1 sm:p-1.5 transition-colors duration-150"
                )}
              >
                <Icon className="size-4 sm:size-5" />
              </div>
              <span className="text-[10px] sm:text-xs font-medium leading-tight truncate max-w-[56px] text-center">{t(locale, item.label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
