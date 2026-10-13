"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Smile, ClipboardCheck, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";

const adminItems = [
  { href: "/admin/dashboard", label: "admin.nav.dashboard", icon: LayoutDashboard },
  { href: "/admin/exams", label: "admin.nav.exams_short", icon: ClipboardList },
  { href: "/admin/pre-post-test", label: "admin.nav.prepost_short", icon: ClipboardCheck },
  { href: "/admin/community", label: "admin.nav.community_short", icon: MessageCircle },
  { href: "/admin/satisfaction", label: "admin.nav.satisfaction", icon: Smile },
];

export function AdminMobileNav() {
  const pathname = usePathname();
  const { locale } = useLocale();

  return (
    <nav aria-label={t(locale, "common.navigation")} className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
      <div className="flex items-center justify-around px-2 py-3">
        {adminItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl px-3 py-1 transition-colors duration-150 min-w-0 focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={cn(
                  "rounded-full p-1.5 transition-colors duration-150"
                )}
              >
                <Icon className="size-5" />
              </div>
                <span className="text-xs font-medium leading-tight truncate">
                {t(locale, item.label)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
