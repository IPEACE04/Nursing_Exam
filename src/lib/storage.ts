import { randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { validateImageFiles } from "@/lib/image-validation";

export type MediaBucket = "exam-media" | "community-media";

export function getPublicImageUrl(bucket: MediaBucket, path: string): string {
  const supabase = createSupabaseServerClient();
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export function getPublicImageUrls(bucket: MediaBucket, paths: string[]): string[] {
  return paths.filter(Boolean).map((path) => getPublicImageUrl(bucket, path));
}

export async function uploadImageFiles(
  bucket: MediaBucket,
  files: File[],
  directory: string,
): Promise<{ paths: string[]; error: string | null }> {
  const validationError = await validateImageFiles(files, files.length);
  if (validationError) return { paths: [], error: validationError };

  const supabase = createSupabaseServerClient();
  const uploadedPaths: string[] = [];

  for (const file of files) {
    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const path = `${directory}/${randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      await deleteImageFiles(bucket, uploadedPaths);
      return { paths: [], error: "ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่" };
    }

    uploadedPaths.push(path);
  }

  return { paths: uploadedPaths, error: null };
}

export async function deleteImageFiles(bucket: MediaBucket, paths: string[]): Promise<void> {
  const validPaths = paths.filter(Boolean);
  if (validPaths.length === 0) return;

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.storage.from(bucket).remove(validPaths);
  if (error) console.error(`Failed to remove files from ${bucket}`, error);
}

export function parseImagePaths(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

export function parseOptionImagePaths(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      ([key, path]) => ["A", "B", "C", "D"].includes(key) && typeof path === "string" && path.length > 0,
    ),
  );
}

export function getFormFiles(formData: FormData, field: string): File[] {
  return formData
    .getAll(field)
    .filter((value): value is File => value instanceof File && value.size > 0);
}
