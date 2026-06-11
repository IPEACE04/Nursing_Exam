"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { studentNavItems } from "@/lib/navigation";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/40 bg-card/95 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-around px-2 py-2 sm:py-2.5">
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
                "flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-colors duration-150 min-w-0",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "rounded-full p-1.5 transition-colors duration-150",
                  isActive && "bg-primary/10"
                )}
              >
                <Icon className="size-5" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium leading-tight truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
