"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandProps {
  inverted?: boolean;
  compact?: boolean;
  className?: string;
}

export function Brand({ inverted = false, compact = false, className }: BrandProps) {
  return (
    <div className={cn("flex shrink-0 items-center gap-3", className)}>
      <Image src="/kk.png" alt="" width={44} height={44} className="size-11 rounded-xl object-cover" />
      {!compact && <span className={cn("font-heading text-xl font-semibold tracking-tight", inverted ? "text-sidebar-foreground" : "text-foreground")}>NurseUp<span className={inverted ? "text-sidebar-primary" : "text-primary"}>.</span></span>}
    </div>
  );
}
