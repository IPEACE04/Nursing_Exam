"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { LogOut, Shield, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AdminNavbar() {
  const router = useRouter();
  const { profile } = useAuth();
  const initials = profile?.name
    ? profile.name.charAt(0).toUpperCase()
    : "?";

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-card/70 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-sm">
            <Shield className="size-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-base font-semibold text-foreground">
              Nursing Exam
            </span>
            <span className="ml-2 inline-flex items-center rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-accent-foreground uppercase">
              Admin
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 p-1.5 pr-3 transition-all hover:bg-muted/50 hover:shadow-sm">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-foreground leading-tight">
                {profile?.name || "Admin"}
              </p>
              <p className="text-[11px] text-muted-foreground">ผู้ดูแลระบบ</p>
            </div>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/profile")}
            >
              จัดการโปรไฟล์
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/dashboard")}
            >
              ดูหน้า Student
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={handleLogout}
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
