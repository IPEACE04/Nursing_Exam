export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export async function validateImageFile(file: File): Promise<string | null> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "ขนาดไฟล์ต้องไม่เกิน 5 MB";
  }

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = file.type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = file.type === "image/png" && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  const isWebp = file.type === "image/webp" && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!isJpeg && !isPng && !isWebp) return "ไฟล์รูปภาพไม่ถูกต้อง";

  return null;
}

export async function validateImageFiles(files: File[], maxFiles: number): Promise<string | null> {
  if (files.length > maxFiles) {
    return `สามารถแนบรูปภาพได้ไม่เกิน ${maxFiles} รูป`;
  }

  for (const file of files) {
    const error = await validateImageFile(file);
    if (error) return error;
  }

  return null;
}
