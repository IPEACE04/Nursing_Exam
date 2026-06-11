"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { logout } from "@/actions/auth";
import { LogOut, GraduationCap, User, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Navbar() {
  const router = useRouter();
  const { profile } = useAuth();
  const initials = profile?.name
    ? profile.name.charAt(0).toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-card/70 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary shadow-sm">
            <GraduationCap className="size-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-base font-semibold tracking-tight text-foreground">
              Nursing Exam
            </span>
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              สภาการพยาบาล
            </p>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-muted">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-foreground">
                {profile?.name || "ผู้ใช้"}
              </p>
              <p className="text-xs text-muted-foreground">
                {profile?.role === "admin" ? "ผู้ดูแลระบบ" : "นักศึกษา"}
              </p>
            </div>
            <Avatar className="size-9 ring-2 ring-accent/30">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/profile")}
            >
              <User className="size-4" />
              จัดการโปรไฟล์
            </DropdownMenuItem>
            {profile?.role === "admin" && (
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => router.push("/admin")}
              >
                <Shield className="size-4" />
                แอดมิน
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
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
