"use client";

import { useEffect, useMemo, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { openHiddenFileInput, releaseFileInputFocus } from "@/lib/file-input-focus";
import { createFilePreviewUrls, revokeFilePreviewUrls } from "@/lib/file-preview";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const visibleExistingUrls = maxFiles === 1 && files.length > 0 ? [] : existingUrls;
  const previewUrls = useMemo(() => createFilePreviewUrls(files), [files]);

  useEffect(() => () => revokeFilePreviewUrls(previewUrls), [previewUrls]);

  function handleFiles(selected: FileList | null) {
    if (!selected) return;
    onChange([...files, ...Array.from(selected)].slice(0, maxFiles));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-[11px] text-muted-foreground">JPG, PNG, WebP · ไม่เกิน 5 MB</span>
      </div>
      <button
        type="button"
        className="flex min-h-20 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted"
        onClick={() => {
          if (fileInputRef.current) openHiddenFileInput(fileInputRef.current);
        }}
      >
        <ImagePlus className="size-4" />
        <span>เพิ่มรูปภาพ ({files.length + visibleExistingUrls.length}/{maxFiles})</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={maxFiles > 1}
        name={name}
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.currentTarget.value = "";
          releaseFileInputFocus(event.currentTarget);
        }}
      />
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
