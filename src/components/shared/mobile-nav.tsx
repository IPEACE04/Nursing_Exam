"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { studentNavItems } from "@/lib/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mobileItems = [
  ...studentNavItems,
  { href: "/profile", label: "โปรไฟล์", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const { profile } = useAuth();

  const initials = profile?.name
    ? profile.name.charAt(0).toUpperCase()
    : "?";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/40 bg-card/95 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-around px-2 py-2 sm:py-2.5">
        {mobileItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          const isProfile = item.href === "/profile";

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
                  isActive && !isProfile && "bg-primary/10"
                )}
              >
                {isProfile ? (
                  <Avatar className={cn(
                    "size-6 transition-all",
                    isActive && "ring-2 ring-primary ring-offset-1 ring-offset-card"
                  )}>
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Icon className="size-5" />
                )}
              </div>
              <span className="text-[11px] sm:text-xs font-medium leading-tight truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
