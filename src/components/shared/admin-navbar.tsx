"use client";

import { useAuth } from "@/context/auth-context";
import { logout } from "@/actions/auth";
import { LogOut } from "lucide-react";
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
  const initials = profile?.name
    ? profile.name.charAt(0).toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-card/80 backdrop-blur-xl">
      <div className="flex h-16 sm:h-20 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-3xl bg-primary/10" />
          <div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Admin Panel
            </span>
            <p className="text-xs text-muted-foreground leading-none">
              จัดการระบบ
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 rounded-xl p-2 pr-4 transition-colors duration-150 hover:bg-muted">
            <div className="hidden text-right sm:block">
              <p className="text-base font-medium text-foreground">
                {profile?.name || "ผู้ดูแล"}
              </p>
              <p className="text-xs text-primary font-medium">ผู้ดูแลระบบ</p>
            </div>
            <Avatar className="size-10 ring-1 ring-border">
              <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/40 shadow-clinic-lg p-1.5">
            <DropdownMenuSeparator className="bg-border/40 my-1" />
            <DropdownMenuItem
              className="cursor-pointer rounded-lg py-2.5 text-sm text-destructive focus:text-destructive"
              onClick={() => logout()}
            >
              <LogOut className="size-4" />
              ออกจากระบบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
