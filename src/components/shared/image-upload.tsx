"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { openHiddenFileInput, releaseFileInputFocus } from "@/lib/file-input-focus";
import { createFilePreviewUrls, revokeFilePreviewUrls } from "@/lib/file-preview";
import { ImageOptimizationError, optimizeImageFiles } from "@/lib/image-optimizer";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";

interface ImageUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles: number;
  existingUrls?: string[];
  onRemoveExisting?: (index: number) => void;
  label?: string;
  name?: string;
}

export function ImageUpload({
  files,
  onChange,
  maxFiles,
  existingUrls = [],
  onRemoveExisting,
  label = "รูปภาพ",
  name,
}: ImageUploadProps) {
  const { locale } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [imageError, setImageError] = useState("");
  const visibleExistingUrls = maxFiles === 1 && files.length > 0 ? [] : existingUrls;
  const previewUrls = useMemo(() => createFilePreviewUrls(files), [files]);

  useEffect(() => () => revokeFilePreviewUrls(previewUrls), [previewUrls]);

  async function handleFiles(selected: FileList | null) {
    if (!selected) return;
    const availableSlots = Math.max(maxFiles - files.length, 0);
    if (availableSlots === 0) return;

    setImageError("");
    setIsOptimizing(true);
    try {
      const optimizedFiles = await optimizeImageFiles(Array.from(selected).slice(0, availableSlots));
      onChange([...files, ...optimizedFiles]);
    } catch (error) {
      if (error instanceof ImageOptimizationError) {
        const keyByCode = {
          unsupported: "image.error.unsupported",
          sourceTooLarge: "image.error.sourceTooLarge",
          processingFailed: "image.error.processingFailed",
        } as const;
        setImageError(t(locale, keyByCode[error.code]));
      } else {
        setImageError(t(locale, "image.error.processingFailed"));
      }
    } finally {
      setIsOptimizing(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-[11px] text-muted-foreground">{t(locale, "image.hint")}</span>
      </div>
      <button
        type="button"
        disabled={isOptimizing}
        className="flex min-h-20 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted"
        onClick={() => {
          if (fileInputRef.current) openHiddenFileInput(fileInputRef.current);
        }}
      >
        <ImagePlus className="size-4" />
        <span>{isOptimizing ? t(locale, "image.optimizing") : `${t(locale, "image.add")} (${files.length + visibleExistingUrls.length}/${maxFiles})`}</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={maxFiles > 1}
        name={name}
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.currentTarget.value = "";
          releaseFileInputFocus(event.currentTarget);
        }}
      />
      {imageError && <p className="text-xs text-destructive">{imageError}</p>}
      {(existingUrls.length > 0 || files.length > 0) && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {visibleExistingUrls.map((url, index) => (
            <div key={url} className="group relative overflow-hidden rounded-lg border border-border">
              <img src={url} alt="" className="aspect-square w-full object-cover" />
              {onRemoveExisting && (
                <button type="button" onClick={() => onRemoveExisting(index)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white">
                  <X className="size-3" />
                </button>
              )}
            </div>
          ))}
          {files.map((file, index) => (
            <div key={`${file.name}-${file.lastModified}-${index}`} className="group relative overflow-hidden rounded-lg border border-border">
              <img src={previewUrls[index]} alt={file.name} className="aspect-square w-full object-cover" />
              <button type="button" onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white">
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
