"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { createPost } from "@/actions/community";
import { CATEGORIES } from "@/lib/community-constants";

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("แชร์ความรู้");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const formData = new FormData();
    formData.set("title", title);
    formData.set("content", content);
    formData.set("category", category);

    startTransition(async () => {
      const result = await createPost(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setTitle("");
        setContent("");
        setCategory("แชร์ความรู้");
        onPostCreated?.();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          หัวข้อ
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="หัวข้อโพสต์..."
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          หมวดหมู่
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
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          เนื้อหา
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="เขียนเนื้อหาโพสต์..."
          rows={6}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || !title.trim() || !content.trim()}
          className="btn-premium disabled:opacity-50"
        >
          <Send className="size-4" />
          {isPending ? "กำลังโพสต์..." : "โพสต์"}
        </button>
      </div>
    </form>
  );
}
