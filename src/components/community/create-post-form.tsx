"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { createPost } from "@/actions/community";
import { uploadCommunityFilesDirectly } from "@/lib/community-upload";
import { CATEGORIES } from "@/lib/community-constants";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";
import { ImageUpload } from "@/components/shared/image-upload";

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

const categoryKeyMap: Record<string, string> = {
  "เทคนิค": "community.category.technique",
  "แชร์ความรู้": "community.category.knowledge",
  "ถาม-ตอบ": "community.category.qna",
};

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const { locale } = useLocale();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("แชร์ความรู้");
  const [isPending, startTransition] = useTransition();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");
  const [images, setImages] = useState<File[]>([]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    setIsUploading(true);
    setUploadStatus("กำลังเตรียมข้อมูล...");

    startTransition(async () => {
      try {
        let uploadedPaths: string[] = [];
        if (images.length > 0) {
          const uploadRes = await uploadCommunityFilesDirectly(images, "posts", setUploadStatus);
          if (uploadRes.error) {
            setError(uploadRes.error);
            setIsUploading(false);
            return;
          }
          uploadedPaths = uploadRes.paths;
        }

        setUploadStatus("กำลังบันทึกโพสต์...");
        const formData = new FormData();
        formData.set("title", title);
        formData.set("content", content);
        formData.set("category", category);
        formData.set("imagePaths", JSON.stringify(uploadedPaths));

        const result = await createPost(formData);
        if (result.error) {
          setError(result.error);
        } else {
          setTitle("");
          setContent("");
          setCategory("แชร์ความรู้");
          setImages([]);
          onPostCreated?.();
        }
      } catch (err) {
        console.error("Create post error:", err);
        setError("ไม่สามารถสร้างโพสต์ได้ กรุณาลองใหม่");
      } finally {
        setIsUploading(false);
        setUploadStatus("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {t(locale, "community.postTitle")}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t(locale, "community.postTitlePlaceholder")}
          className="h-12 w-full rounded-xl border border-border bg-background px-5 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {t(locale, "community.category")}
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.filter((c) => c !== "ทั้งหมด").map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t(locale, categoryKeyMap[cat] ?? cat)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {t(locale, "community.content")}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t(locale, "community.contentPlaceholder")}
          rows={6}
          className="w-full rounded-xl border border-border bg-background px-5 py-3 text-base text-foreground placeholder:text-muted-foreground/60 resize-y transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
          required
        />
      </div>

      <ImageUpload
        files={images}
        onChange={setImages}
        label={t(locale, "community.filesAndImages")}
        onOptimizingChange={setIsOptimizing}
        allowAllFiles={true}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || isOptimizing || isUploading || !title.trim() || !content.trim()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none"
        >
          <Send className="size-4" />
          {isOptimizing
            ? t(locale, "image.optimizing")
            : isUploading || isPending
              ? uploadStatus || t(locale, "community.posting")
              : t(locale, "community.post")}
        </button>
      </div>
    </form>
  );
}
