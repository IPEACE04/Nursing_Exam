"use client";

import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";
import { logout } from "@/actions/auth";
import { LogOut } from "lucide-react";
import { LocaleToggle } from "@/components/shared/locale-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AdminNavbar() {
  const { profile } = useAuth();
  const { locale } = useLocale();
  const initials = profile?.name
    ? profile.name.charAt(0).toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-16 sm:h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <img src="/kk.png" alt="NurseUp" className="size-10 rounded-xl object-cover" />
          <div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Admin Panel
            </span>
            <p className="text-xs text-muted-foreground leading-none">
              {t(locale, "common.adminSubtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LocaleToggle />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 rounded-xl p-2 pr-4 transition-colors duration-150 hover:bg-muted">
            <div className="hidden text-right sm:block">
              <p className="text-base font-medium text-foreground">
                {profile?.name || t(locale, "common.adminFallback")}
              </p>
              <p className="text-xs text-primary font-medium">{t(locale, "common.adminRole")}</p>
            </div>
            <Avatar className="size-10 ring-1 ring-border">
              <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border border-border bg-card p-1.5 shadow-sm">
            <DropdownMenuSeparator className="bg-border/40 my-1" />
            <DropdownMenuItem
              className="cursor-pointer rounded-lg py-2.5 text-sm text-destructive focus:text-destructive"
              onClick={() => logout()}
            >
              <LogOut className="size-4" />
              {t(locale, "common.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
