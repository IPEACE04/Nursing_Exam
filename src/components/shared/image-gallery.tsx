"use client";

interface ImageGalleryProps {
  imageUrls: string[];
  className?: string;
  linkImages?: boolean;
  imageLoading?: "eager" | "lazy";
}

export function ImageGallery({ imageUrls, className = "", linkImages = true, imageLoading = "lazy" }: ImageGalleryProps) {
  if (imageUrls.length === 0) return null;

  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${className}`}>
      {imageUrls.map((url) => (
        linkImages ? (
          <a key={url} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-border bg-muted">
            <img src={url} alt="" loading={imageLoading} className="aspect-square w-full object-cover transition-transform hover:scale-105" />
          </a>
        ) : (
          <div key={url} className="block overflow-hidden rounded-xl border border-border bg-muted">
            <img src={url} alt="" loading={imageLoading} className="aspect-square w-full object-cover" />
          </div>
        )
      ))}
    </div>
  );
}
