import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, ClipboardList, BarChart3, Trophy, User } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const studentNavItems: NavItem[] = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
  { href: "/exam", label: "ทำข้อสอบ", icon: ClipboardList },
  { href: "/history", label: "ประวัติผลสอบ", icon: BarChart3 },
  { href: "/ranking", label: "อันดับ", icon: Trophy },
  { href: "/profile", label: "โปรไฟล์", icon: User },
];
