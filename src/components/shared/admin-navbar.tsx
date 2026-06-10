"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { LogOut, Shield } from "lucide-react";
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
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-600">
            <Shield className="size-5 text-white" />
          </div>
          <div>
            <span className="text-base font-semibold text-[#1a2744]">
              Nursing Exam
            </span>
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 uppercase tracking-wider">
              Admin
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-slate-100">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">
                {profile?.name || "Admin"}
              </p>
              <p className="text-xs text-slate-500">ผู้ดูแลระบบ</p>
            </div>
            <Avatar className="size-9">
              <AvatarFallback className="bg-amber-600 text-xs font-medium text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
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
              className="cursor-pointer text-red-500 focus:text-red-500"
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
