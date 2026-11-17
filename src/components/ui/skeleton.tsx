import { cn } from "@/lib/utils";

/** Placeholder block; shimmer comes from the `.skeleton` class in globals.css. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton", className)} />;
}
