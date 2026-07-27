"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { studentNavItems } from "@/lib/navigation";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom,0px)] md:hidden">
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
                "flex flex-col items-center gap-0.5 sm:gap-1.5 rounded-lg px-1.5 sm:px-3 py-1 transition-colors duration-150 min-w-0",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "rounded-full p-1 sm:p-1.5 transition-colors duration-150",
                  isActive && "bg-primary/5"
                )}
              >
                <Icon className="size-4 sm:size-5" />
              </div>
              <span className="text-[10px] sm:text-xs font-medium leading-tight truncate max-w-[56px] text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
