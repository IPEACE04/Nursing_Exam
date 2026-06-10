"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { studentNavItems } from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 bg-card/60 backdrop-blur-xl lg:flex">
      <div className="border-b border-border/60 px-5 py-5">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          เมนูหลัก
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
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
                "group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-5 transition-transform duration-200 group-hover:scale-105",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border/60 p-4">
        <div className="rounded-xl bg-primary/5 p-4">
          <p className="text-xs font-medium text-primary">Premium Study</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            ฝึกทำข้อสอบอย่างเป็นระบบ พร้อมวิเคราะห์พัฒนาการ
          </p>
        </div>
      </div>
    </aside>
  );
}
