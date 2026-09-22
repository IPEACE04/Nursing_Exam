"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, ImagePlus, Paperclip, X } from "lucide-react";
import { openHiddenFileInput, releaseFileInputFocus } from "@/lib/file-input-focus";
import { createFilePreviewUrls, revokeFilePreviewUrls } from "@/lib/file-preview";
import { ImageOptimizationError, optimizeImageFile } from "@/lib/image-optimizer";
import { formatFileSize, getFileExtension, getFileNameFromUrl, isImageUrl, validateCommunityFile } from "@/lib/file-utils";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  existingUrls?: string[];
  onRemoveExisting?: (index: number) => void;
  label?: string;
  name?: string;
  onOptimizingChange?: (isOptimizing: boolean) => void;
  allowAllFiles?: boolean;
}

const OPTIMIZABLE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function ImageUpload({
  files,
  onChange,
  maxFiles,
  existingUrls = [],
  onRemoveExisting,
  label,
  name,
  onOptimizingChange,
  allowAllFiles = false,
}: ImageUploadProps) {
  const { locale } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [imageError, setImageError] = useState("");
  const visibleExistingUrls = maxFiles === 1 && files.length > 0 ? [] : existingUrls;
  const isFull = maxFiles !== undefined && files.length + visibleExistingUrls.length >= maxFiles;
  const previewUrls = useMemo(() => createFilePreviewUrls(files), [files]);

  const displayLabel = label ?? (allowAllFiles ? t(locale, "community.filesAndImages") : "รูปภาพ");
  const displayHint = allowAllFiles ? t(locale, "community.filesHint") : t(locale, "image.hint");

  useEffect(() => () => revokeFilePreviewUrls(previewUrls), [previewUrls]);

  async function handleFiles(selected: FileList | null) {
    if (!selected) return;
    const currentTotal = files.length + visibleExistingUrls.length;
    const availableSlots = maxFiles !== undefined ? Math.max(maxFiles - currentTotal, 0) : selected.length;
    if (availableSlots === 0) return;

    setImageError("");
    if (maxFiles !== undefined && selected.length > availableSlots) {
      setImageError(t(locale, "image.error.exceededLimit", { max: maxFiles, slots: availableSlots }));
    }

    const filesToProcess = maxFiles !== undefined
      ? Array.from(selected).slice(0, availableSlots)
      : Array.from(selected);

    if (allowAllFiles) {
      for (const file of filesToProcess) {
        const error = await validateCommunityFile(file);
        if (error) {
          setImageError(error);
          return;
        }
      }
    }

    setIsOptimizing(true);
    onOptimizingChange?.(true);
    try {
      const processedFiles: File[] = [];
      for (const file of filesToProcess) {
        if (OPTIMIZABLE_IMAGE_TYPES.has(file.type)) {
          processedFiles.push(await optimizeImageFile(file));
        } else {
          processedFiles.push(file);
        }
      }
      onChange([...files, ...processedFiles]);
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
      onOptimizingChange?.(false);
    }
  }

  const acceptTypes = allowAllFiles
    ? "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,.csv"
    : ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{displayLabel}</span>
        <span className="text-[11px] text-muted-foreground">{displayHint}</span>
      </div>
      <button
        type="button"
        disabled={isOptimizing || isFull}
        className={cn(
          "flex min-h-20 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground transition-colors",
          isFull
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:border-primary/50 hover:bg-muted"
        )}
        onClick={() => {
          if (isFull) return;
          if (fileInputRef.current) openHiddenFileInput(fileInputRef.current);
        }}
      >
        {allowAllFiles ? <Paperclip className="size-4" /> : <ImagePlus className="size-4" />}
        <span>
          {isOptimizing
            ? t(locale, "image.optimizing")
            : `${allowAllFiles ? t(locale, "community.addFileOrImage") : t(locale, "image.add")}${
                maxFiles !== undefined
                  ? ` (${files.length + visibleExistingUrls.length}/${maxFiles})`
                  : files.length + visibleExistingUrls.length > 0
                    ? ` (${files.length + visibleExistingUrls.length})`
                    : ""
              }`}
        </span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        multiple={maxFiles === undefined || maxFiles > 1}
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
          {visibleExistingUrls.map((url, index) => {
            const isImg = isImageUrl(url);
            const fileName = getFileNameFromUrl(url);
            return (
              <div key={url} className="group relative overflow-hidden rounded-lg border border-border bg-card">
                {isImg ? (
                  <img src={url} alt="" className="aspect-square w-full object-cover" />
                ) : (
                  <div className="flex aspect-square w-full flex-col items-center justify-center p-3 text-center bg-muted/40">
                    <FileText className="size-7 text-primary mb-1.5" />
                    <span className="w-full truncate text-xs font-medium text-foreground">{fileName}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{getFileExtension(fileName)}</span>
                  </div>
                )}
                {onRemoveExisting && (
                  <button
                    type="button"
                    onClick={() => onRemoveExisting(index)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            );
          })}
          {files.map((file, index) => {
            const isImg = file.type.startsWith("image/") || isImageUrl(file.name);
            return (
              <div key={`${file.name}-${file.lastModified}-${index}`} className="group relative overflow-hidden rounded-lg border border-border bg-card">
                {isImg ? (
                  <img src={previewUrls[index]} alt={file.name} className="aspect-square w-full object-cover" />
                ) : (
                  <div className="flex aspect-square w-full flex-col items-center justify-center p-3 text-center bg-muted/40">
                    <FileText className="size-7 text-primary mb-1.5" />
                    <span className="w-full truncate text-xs font-medium text-foreground">{file.name}</span>
                    <span className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
