"use client";

import { getImageGalleryLayout, type SingleImageLayout } from "@/lib/image-gallery-layout";

interface ImageGalleryProps {
  imageUrls: string[];
  className?: string;
  linkImages?: boolean;
  imageLoading?: "eager" | "lazy";
  singleImageLayout?: SingleImageLayout;
}

export function ImageGallery({ imageUrls, className = "", linkImages = true, imageLoading = "lazy", singleImageLayout = "grid" }: ImageGalleryProps) {
  if (imageUrls.length === 0) return null;
  const layout = getImageGalleryLayout(imageUrls.length, singleImageLayout);

  return (
    <div className={`grid ${layout.gridClassName} gap-3 ${className}`}>
      {imageUrls.map((url) => (
        linkImages ? (
          <a key={url} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-border bg-muted">
            <img src={url} alt="" loading={imageLoading} className={`${layout.imageClassName} transition-transform hover:scale-105`} />
          </a>
        ) : (
          <div key={url} className="block overflow-hidden rounded-xl border border-border bg-muted">
            <img src={url} alt="" loading={imageLoading} className={layout.imageClassName} />
          </div>
        )
      ))}
    </div>
  );
}
