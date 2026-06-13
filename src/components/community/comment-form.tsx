"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { addComment } from "@/actions/community";

interface CommentFormProps {
  postId: string;
  onCommentAdded?: () => void;
}

export function CommentForm({ postId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await addComment(postId, content);
      if (result.error) {
        setError(result.error);
      } else {
        setContent("");
        onCommentAdded?.();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="เขียนความคิดเห็น..."
        rows={3}
        className="w-full rounded-xl border border-border bg-background px-5 py-3 text-base text-foreground placeholder:text-muted-foreground/60 resize-y transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none"
        >
          <Send className="size-4" />
          {isPending ? "กำลังส่ง..." : "ส่ง"}
        </button>
      </div>
    </form>
  );
}
