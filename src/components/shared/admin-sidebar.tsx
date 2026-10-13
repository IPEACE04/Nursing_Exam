"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Smile, ClipboardCheck, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";
import { Brand } from "@/components/shared/brand";

const navItems = [
  { href: "/admin/dashboard", label: "admin.nav.dashboard", icon: LayoutDashboard },
  { href: "/admin/exams", label: "admin.nav.exams", icon: ClipboardList },
  { href: "/admin/pre-post-test", label: "admin.nav.prepost", icon: ClipboardCheck },
  { href: "/admin/community", label: "admin.nav.community", icon: MessageCircle },
  { href: "/admin/satisfaction", label: "admin.nav.satisfaction", icon: Smile },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { locale } = useLocale();

  return (
    <aside className="hidden w-[264px] shrink-0 flex-col bg-sidebar lg:flex xl:w-[284px]">
      <div className="p-7 pb-9"><Brand inverted /></div>
      <nav aria-label={t(locale, "common.navigation")} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-5 pb-5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "learning-nav-link relative isolate",
                isActive
                  ? "font-semibold text-sidebar-primary"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-5" />
              {t(locale, item.label)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
