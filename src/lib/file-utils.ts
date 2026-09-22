import { detectImageType } from "./image-validation.ts";

export const MAX_COMMUNITY_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "svg",
  "bmp",
  "ico",
  "avif",
  "heic",
  "heif",
]);

export const BLOCKED_FILE_EXTENSIONS = new Set([
  "exe",
  "bat",
  "cmd",
  "sh",
  "bash",
  "bin",
  "msi",
  "apk",
  "app",
  "dmg",
  "vbs",
  "ps1",
  "scr",
  "jar",
  "html",
  "htm",
  "php",
  "phtml",
  "js",
  "mjs",
  "cjs",
  "jsp",
  "asp",
  "aspx",
  "cgi",
  "pl",
  "dll",
  "sys",
  "com",
  "svgz",
]);

export function getFileExtension(filenameOrUrl: string): string {
  const clean = filenameOrUrl.split("?")[0].split("#")[0];
  const parts = clean.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

export function isImageUrl(urlOrPath: string): boolean {
  const ext = getFileExtension(urlOrPath);
  return IMAGE_EXTENSIONS.has(ext);
}

export function encodeFileNameForStorage(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  const ext = lastDot !== -1 ? filename.slice(lastDot + 1).toLowerCase() : "";
  const rawBase = lastDot !== -1 ? filename.slice(0, lastDot) : filename;

  // Safe ASCII characters allowed in standard S3 / Supabase Storage object keys
  if (/^[a-zA-Z0-9_\-\. ()]+$/.test(rawBase) && !rawBase.startsWith("b64_")) {
    const trimmed = rawBase.trim().slice(0, 80);
    return ext ? `${trimmed}.${ext}` : trimmed;
  }

  // Base64url encode for Unicode (Thai, etc.) and special characters to ensure valid S3 key
  try {
    const utf8Bytes = new TextEncoder().encode(rawBase.slice(0, 100));
    let binary = "";
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const b64url = btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    return ext ? `b64_${b64url}.${ext}` : `b64_${b64url}`;
  } catch {
    const fallback = rawBase.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
    return ext ? `${fallback}.${ext}` : fallback;
  }
}

export function decodeFileNameFromStorage(storageName: string): string {
  const clean = storageName.split("?")[0].split("#")[0];
  const lastDot = clean.lastIndexOf(".");
  const ext = lastDot !== -1 ? clean.slice(lastDot + 1).toLowerCase() : "";
  let base = lastDot !== -1 ? clean.slice(0, lastDot) : clean;

  if (base.startsWith("b64_")) {
    const rawB64 = base.slice(4);
    try {
      const b64 = rawB64.replace(/-/g, "+").replace(/_/g, "/");
      const padLength = (4 - (b64.length % 4)) % 4;
      const padded = b64 + "=".repeat(padLength);
      const binary = atob(padded);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      base = new TextDecoder().decode(bytes);
    } catch {
      // keep base as-is if decoding fails
    }
  } else {
    try {
      base = decodeURIComponent(base);
    } catch {
      // keep base as-is
    }
  }

  return ext ? `${base}.${ext}` : base;
}

export function getFileNameFromUrl(urlOrPath: string): string {
  try {
    const pathname = urlOrPath.split("?")[0].split("#")[0];
    const fullName = pathname.split("/").pop() ?? "";
    const namePart = fullName.includes("_")
      ? fullName.slice(fullName.indexOf("_") + 1)
      : fullName;
    return decodeFileNameFromStorage(namePart);
  } catch {
    return urlOrPath.split("/").pop() ?? "file";
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function validateCommunityFile(file: File): Promise<string | null> {
  const ext = getFileExtension(file.name);

  if (BLOCKED_FILE_EXTENSIONS.has(ext)) {
    return `ไม่อนุญาตให้อัปโหลดไฟล์ .${ext} เพื่อความปลอดภัย`;
  }

  if (["jpg", "jpeg", "png", "webp"].includes(ext) && file.size > 0) {
    const detected = await detectImageType(file);
    if (!detected && !file.type.startsWith("image/")) {
      return `ไฟล์รูปภาพ ${file.name} ไม่ถูกต้อง`;
    }
  }

  return null;
}

export async function validateCommunityFiles(
  files: File[],
  maxFiles?: number,
): Promise<string | null> {
  if (maxFiles !== undefined && files.length > maxFiles) {
    return `สามารถแนบไฟล์ได้ไม่เกิน ${maxFiles} ไฟล์`;
  }

  for (const file of files) {
    const error = await validateCommunityFile(file);
    if (error) return error;
  }

  return null;
}
