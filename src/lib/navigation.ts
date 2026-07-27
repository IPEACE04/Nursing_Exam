import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, ClipboardList, BarChart3, Trophy, TrendingUp, MessageCircle } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const studentNavItems: NavItem[] = [
  { href: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard },
  { href: "/exam", label: "nav.exam", icon: ClipboardList },
  { href: "/community", label: "nav.community", icon: MessageCircle },
  { href: "/history", label: "nav.history", icon: BarChart3 },
  { href: "/progress", label: "nav.progress", icon: TrendingUp },
  { href: "/ranking", label: "nav.ranking", icon: Trophy },
];
