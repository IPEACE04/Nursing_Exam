"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { logout } from "@/actions/auth";
import { LogOut, User, Shield } from "lucide-react";
import { studentNavItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useAuth();

  const initials = profile?.name
    ? profile.name.charAt(0).toUpperCase()
    : "?";

  return (
    <div className="sticky top-0 z-40 mx-auto w-full max-w-5xl px-3 sm:px-4 lg:px-8 pt-3">
      <header className="flex h-14 sm:h-16 items-center justify-between rounded-2xl border border-border/50 bg-card px-4 sm:px-5 shadow-sm">
        <Link href="/community" className="flex items-center gap-2.5 shrink-0">
          <div className="size-9 rounded-3xl bg-primary/10" />
          <span className="text-sm sm:text-base font-bold tracking-tight text-foreground whitespace-nowrap">
            NurseUp
          </span>
        </Link>

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

        <div className="flex items-center gap-1.5 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80">
              <Avatar className="size-9 ring-1 ring-border">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-xl border-border/40 p-1.5 shadow-clinic-lg"
            >
              <div className="mb-1 px-3 py-2">
                <p className="text-sm font-semibold text-foreground truncate">
                  {profile?.name || "ผู้ใช้"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile?.email}
                </p>
              </div>
              <DropdownMenuSeparator className="my-1 bg-border/40" />
              <DropdownMenuItem
                className="cursor-pointer rounded-lg py-2.5 text-sm"
                onClick={() => router.push("/profile")}
              >
                <User className="mr-2.5 size-4" />
                โปรไฟล์
              </DropdownMenuItem>
              {profile?.role === "admin" && (
                <DropdownMenuItem
                  className="cursor-pointer rounded-lg py-2.5 text-sm"
                  onClick={() => router.push("/admin")}
                >
                  <Shield className="mr-2.5 size-4" />
                  แอดมิน
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="my-1 bg-border/40" />
              <DropdownMenuItem
                className="cursor-pointer rounded-lg py-2.5 text-sm text-destructive focus:text-destructive"
                onClick={() => logout()}
              >
                <LogOut className="mr-2.5 size-4" />
                ออกจากระบบ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </div>
  );
}
