"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";

interface PageSkeletonProps {
  /** Rough shape of the content being loaded. */
  variant?: "list" | "dashboard" | "table" | "detail" | "posts";
  /** Show a page-title placeholder above the content. */
  header?: boolean;
}

function Rows({ count, className }: { count: number; className: string }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className={className} />
      ))}
    </>
  );
}

export function PageSkeleton({ variant = "list", header = true }: PageSkeletonProps) {
  const { locale } = useLocale();
  return (
    <div role="status" aria-busy="true" className="w-full space-y-6">
      <span className="sr-only">{t(locale, "common.loading")}</span>

      {header && (
        <div className="space-y-3 border-b border-border pb-6">
          <Skeleton className="h-9 w-56 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
      )}

      {variant === "dashboard" && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Rows count={4} className="h-28 rounded-2xl" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Rows count={2} className="h-72 rounded-2xl" />
          </div>
        </>
      )}

      {variant === "list" && (
        <div className="space-y-3">
          <Rows count={5} className="h-20 rounded-2xl" />
        </div>
      )}

      {variant === "table" && (
        <div className="space-y-3 rounded-2xl border border-border p-4">
          <Skeleton className="h-6 w-full" />
          <Rows count={6} className="h-10 w-full" />
        </div>
      )}

      {variant === "detail" && (
        <div className="space-y-4 rounded-2xl border border-border p-6">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Rows count={3} className="h-14 w-full rounded-xl" />
        </div>
      )}

      {variant === "posts" &&
        Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="space-y-4 rounded-2xl border border-border p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}
    </div>
  );
}
