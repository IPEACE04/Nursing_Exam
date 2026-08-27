export const MAX_IMAGE_DIMENSION = 1600;
export const TARGET_IMAGE_SIZE_BYTES = 1.2 * 1024 * 1024;
export const MAX_SOURCE_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const QUALITY_STEPS = [0.78, 0.7, 0.62, 0.54];

export type ImageOptimizationErrorCode = "unsupported" | "sourceTooLarge" | "processingFailed";

export class ImageOptimizationError extends Error {
  readonly code: ImageOptimizationErrorCode;

  constructor(code: ImageOptimizationErrorCode) {
    super(code);
    this.code = code;
  }
}

export function calculateImageDimensions(width: number, height: number): { width: number; height: number } {
  const longestSide = Math.max(width, height);
  if (longestSide <= MAX_IMAGE_DIMENSION) return { width, height };

  const scale = MAX_IMAGE_DIMENSION / longestSide;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new ImageOptimizationError("processingFailed"));
    };
    image.src = objectUrl;
  });
}

function encodeWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new ImageOptimizationError("processingFailed"));
    }, "image/webp", quality);
  });
}

function webpFileName(file: File): string {
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return `${baseName}.webp`;
}

export async function optimizeImageFile(file: File): Promise<File> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new ImageOptimizationError("unsupported");
  }
  if (file.size > MAX_SOURCE_IMAGE_SIZE_BYTES) {
    throw new ImageOptimizationError("sourceTooLarge");
  }

  const image = await loadImage(file);
  const { width, height } = calculateImageDimensions(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(image, 0, 0, width, height);

  let optimizedBlob = await encodeWebp(canvas, QUALITY_STEPS[0]);
  for (const quality of QUALITY_STEPS.slice(1)) {
    if (optimizedBlob.size <= TARGET_IMAGE_SIZE_BYTES) break;
    optimizedBlob = await encodeWebp(canvas, quality);
  }

  return new File([optimizedBlob], webpFileName(file), {
    type: "image/webp",
    lastModified: file.lastModified,
  });
}

export async function optimizeImageFiles(files: File[]): Promise<File[]> {
  const optimizedFiles: File[] = [];
  for (const file of files) {
    optimizedFiles.push(await optimizeImageFile(file));
  }
  return optimizedFiles;
}
