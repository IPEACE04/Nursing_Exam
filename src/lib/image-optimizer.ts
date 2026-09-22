import { detectImageType } from "./image-validation.ts";

export const MAX_IMAGE_DIMENSION = 1600;
export const TARGET_IMAGE_SIZE_BYTES = 1.2 * 1024 * 1024;
export const MAX_SOURCE_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;

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

function encodeImage(canvas: HTMLCanvasElement, quality: number): Promise<{ blob: Blob; type: "image/webp" | "image/jpeg" }> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((webpBlob) => {
      if (webpBlob && webpBlob.size > 0) {
        resolve({ blob: webpBlob, type: "image/webp" });
        return;
      }
      canvas.toBlob((jpegBlob) => {
        if (jpegBlob && jpegBlob.size > 0) {
          resolve({ blob: jpegBlob, type: "image/jpeg" });
        } else {
          reject(new ImageOptimizationError("processingFailed"));
        }
      }, "image/jpeg", quality);
    }, "image/webp", quality);
  });
}

function optimizedFileName(file: File, type: "image/webp" | "image/jpeg"): string {
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  const ext = type === "image/webp" ? "webp" : "jpg";
  return `${baseName}.${ext}`;
}

export async function optimizeImageFile(file: File): Promise<File> {
  if (file.size > MAX_SOURCE_IMAGE_SIZE_BYTES) {
    throw new ImageOptimizationError("sourceTooLarge");
  }

  const detectedType = await detectImageType(file);
  if (!detectedType) throw new ImageOptimizationError("unsupported");

  const normalizedFile = file.type === detectedType
    ? file
    : new File([file], file.name, { type: detectedType, lastModified: file.lastModified });
  const image = await loadImage(normalizedFile);
  const { width, height } = calculateImageDimensions(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(image, 0, 0, width, height);

  let result = await encodeImage(canvas, QUALITY_STEPS[0]);
  for (const quality of QUALITY_STEPS.slice(1)) {
    if (result.blob.size <= TARGET_IMAGE_SIZE_BYTES) break;
    result = await encodeImage(canvas, quality);
  }

  return new File([result.blob], optimizedFileName(file, result.type), {
    type: result.type,
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
