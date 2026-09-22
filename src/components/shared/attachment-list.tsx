"use client";

import { Download, File, FileArchive, FileSpreadsheet, FileText, Paperclip } from "lucide-react";
import { getFileNameFromUrl, getFileExtension } from "@/lib/file-utils";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";

interface AttachmentListProps {
  attachmentUrls: string[];
  className?: string;
}

function getFileIconAndColor(ext: string) {
  switch (ext) {
    case "pdf":
      return {
        icon: FileText,
        color: "text-red-500 bg-red-500/10 border-red-500/20",
        badge: "PDF",
      };
    case "doc":
    case "docx":
      return {
        icon: FileText,
        color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        badge: "DOC",
      };
    case "xls":
    case "xlsx":
    case "csv":
      return {
        icon: FileSpreadsheet,
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        badge: ext.toUpperCase(),
      };
    case "ppt":
    case "pptx":
      return {
        icon: FileText,
        color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
        badge: "PPT",
      };
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return {
        icon: FileArchive,
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        badge: "ZIP",
      };
    default:
      return {
        icon: File,
        color: "text-muted-foreground bg-muted border-border",
        badge: ext.toUpperCase() || "FILE",
      };
  }
}

export function AttachmentList({ attachmentUrls, className = "" }: AttachmentListProps) {
  const { locale } = useLocale();
  if (attachmentUrls.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Paperclip className="size-3.5" />
        <span>{t(locale, "community.attachmentsTitle")} ({attachmentUrls.length})</span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {attachmentUrls.map((url) => {
          const fileName = getFileNameFromUrl(url);
          const ext = getFileExtension(fileName);
          const { icon: Icon, color, badge } = getFileIconAndColor(ext);

          return (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              download={fileName}
              className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-3 transition-all duration-150 hover:border-primary/40 hover:bg-muted/40 hover:shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${color}`}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs sm:text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {fileName}
                  </p>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    {badge}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
                <Download className="size-3" />
                <span className="hidden sm:inline">{t(locale, "community.attachmentDownload")}</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
