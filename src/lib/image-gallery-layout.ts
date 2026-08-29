export type SingleImageLayout = "grid" | "full";

export function getImageGalleryLayout(imageCount: number, singleImageLayout: SingleImageLayout) {
  const isFullWidthSingleImage = imageCount === 1 && singleImageLayout === "full";

  return {
    gridClassName: isFullWidthSingleImage ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3",
    imageClassName: isFullWidthSingleImage
      ? "max-h-[32rem] w-full object-contain"
      : "aspect-square w-full object-cover",
  };
}
