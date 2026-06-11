"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { logout } from "@/actions/auth";
import { LogOut, TestTubeDiagonal } from "lucide-react";
import { studentNavItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-40 mx-auto w-full max-w-5xl px-3 sm:px-4 lg:px-8 pt-3">
      <header className="flex h-14 sm:h-16 items-center justify-between rounded-2xl border border-border/50 bg-card px-4 sm:px-5 shadow-sm">
        {/* Left: Logo */}
        <Link href="/community" className="flex items-center gap-2.5 shrink-0">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary">
            <TestTubeDiagonal className="size-5 text-primary-foreground" />
          </div>
          <span className="hidden sm:inline text-base font-bold tracking-tight text-foreground whitespace-nowrap">
            NurseSim
          </span>
        </Link>

        {/* Center: Nav links */}
        <nav className="hidden md:flex items-center gap-1 mx-4">
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
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Logout */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => logout()}
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="ออกจากระบบ"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </header>
    </div>
  );
}
