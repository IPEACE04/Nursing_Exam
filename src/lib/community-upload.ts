import { getCommunityUploadUrls } from "@/actions/community";

export async function uploadCommunityFilesDirectly(
  files: File[],
  prefix: "posts" | "comments" = "posts",
  onProgress?: (progressText: string) => void
): Promise<{ paths: string[]; error?: string }> {
  if (files.length === 0) return { paths: [] };

  onProgress?.("กำลังเตรียมการอัปโหลดไฟล์...");
  const targets = files.map((f) => ({
    name: f.name,
    type: f.type || "application/octet-stream",
    size: f.size,
  }));

  const { uploads, error } = await getCommunityUploadUrls(targets, prefix);
  if (error || !uploads || uploads.length !== files.length) {
    return { paths: [], error: error || "ไม่สามารถเตรียมการอัปโหลดไฟล์ได้ กรุณาลองใหม่" };
  }

  const uploadedPaths: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const { path, signedUrl } = uploads[i];
    const contentType = file.type || "application/octet-stream";

    if (files.length > 1) {
      onProgress?.(`กำลังอัปโหลดไฟล์ (${i + 1}/${files.length})...`);
    } else {
      onProgress?.("กำลังอัปโหลดไฟล์...");
    }

    try {
      const res = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });

      if (!res.ok) {
        console.error("Direct upload failed for file:", file.name, res.status, res.statusText);
        return { paths: [], error: `ไม่สามารถอัปโหลดไฟล์ ${file.name} ได้ กรุณาลองใหม่` };
      }

      uploadedPaths.push(path);
    } catch (err) {
      console.error("Upload fetch error:", err);
      return { paths: [], error: `การเชื่อมต่อขัดข้องขณะอัปโหลดไฟล์ ${file.name} กรุณาลองใหม่` };
    }
  }

  return { paths: uploadedPaths };
}
