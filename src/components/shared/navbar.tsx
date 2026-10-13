"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";
import { logout } from "@/actions/auth";
import { LogOut, User, Shield } from "lucide-react";
import { studentNavItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { LocaleToggle } from "@/components/shared/locale-toggle";
import { Brand } from "@/components/shared/brand";
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
  const { locale } = useLocale();

  const initials = profile?.name
    ? profile.name.charAt(0).toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card lg:fixed lg:inset-y-0 lg:left-0 lg:w-[264px] lg:border-0 lg:bg-sidebar xl:w-[284px]">
      <div className="flex h-18 items-center justify-between px-5 lg:h-full lg:flex-col lg:items-stretch lg:justify-start lg:px-5 lg:py-8">
        <div className="flex items-center gap-2.5 shrink-0">
          <Brand className="lg:[&>span]:text-sidebar-foreground" />
        </div>

        <nav aria-label={t(locale, "common.navigation")} className="hidden lg:mt-12 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-2 lg:overflow-y-auto lg:pb-5">
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
                  "learning-nav-link relative isolate",
                  isActive
                    ? "font-semibold text-sidebar-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="size-5 shrink-0" />
                {t(locale, item.label)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0 lg:flex-wrap lg:justify-between lg:border-t lg:border-sidebar-border lg:pt-5">
          <div className="lg:rounded-full lg:bg-white/90"><LocaleToggle /></div>
          <DropdownMenu>
            <DropdownMenuTrigger aria-label={t(locale, "common.profile")} className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80">
              <Avatar className="size-9 ring-1 ring-border">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-muted text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-xl border border-border bg-card p-1.5 shadow-sm"
            >
              <div className="mb-1 px-3 py-2">
                <p className="text-sm font-semibold text-foreground truncate">
                  {profile?.name || t(locale, "common.user")}
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
                {t(locale, "common.profile")}
              </DropdownMenuItem>
              {profile?.role === "admin" && (
                <DropdownMenuItem
                  className="cursor-pointer rounded-lg py-2.5 text-sm"
                  onClick={() => router.push("/admin")}
                >
                  <Shield className="mr-2.5 size-4" />
                  {t(locale, "common.admin")}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="my-1 bg-border/40" />
              <DropdownMenuItem
                className="cursor-pointer rounded-lg py-2.5 text-sm text-destructive focus:text-destructive"
                onClick={() => logout()}
              >
                <LogOut className="mr-2.5 size-4" />
                {t(locale, "common.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
