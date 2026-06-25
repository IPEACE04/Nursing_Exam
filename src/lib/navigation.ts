import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, ClipboardList, BarChart3, Trophy, TrendingUp, MessageCircle } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const studentNavItems: NavItem[] = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
  { href: "/exam", label: "ทำข้อสอบ", icon: ClipboardList },
  { href: "/community", label: "Community", icon: MessageCircle },
  { href: "/history", label: "ประวัติผลสอบ", icon: BarChart3 },
  { href: "/progress", label: "พัฒนาการ", icon: TrendingUp },
  { href: "/ranking", label: "อันดับ", icon: Trophy },
];
