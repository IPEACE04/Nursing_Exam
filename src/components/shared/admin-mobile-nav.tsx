"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

const adminItems = [
  { href: "/admin/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
  { href: "/admin/exams", label: "ข้อสอบ", icon: ClipboardList },
  { href: "/admin/satisfaction", label: "แบบประเมิน", icon: Smile },
];

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
      <div className="flex items-center justify-around px-2 py-3">
        {adminItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl px-3 py-1 transition-colors duration-150 min-w-0",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "rounded-full p-1.5 transition-colors duration-150",
                  isActive && "bg-primary/5"
                )}
              >
                <Icon className="size-5" />
              </div>
                <span className="text-xs font-medium leading-tight truncate">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
