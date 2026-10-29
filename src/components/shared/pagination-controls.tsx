"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";

interface PaginationControlsProps {
  page: number;
  total: number;
  pageSize: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  page,
  total,
  pageSize,
  disabled = false,
  onPageChange,
}: PaginationControlsProps) {
  const { locale } = useLocale();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <nav
      aria-label={t(locale, "admin.users.pagination")}
      className="flex flex-wrap items-center justify-between gap-3 py-4"
    >
      <p className="text-sm text-muted-foreground">
        {t(locale, "admin.users.page", { page, pages, total })}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={t(locale, "admin.users.previous")}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={disabled || page >= pages}
          onClick={() => onPageChange(page + 1)}
          aria-label={t(locale, "admin.users.next")}
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
