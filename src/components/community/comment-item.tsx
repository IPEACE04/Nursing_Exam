"use client";

import { Trash2 } from "lucide-react";
import { deleteComment } from "@/actions/community";
import { useAuth } from "@/context/auth-context";
import type { CommunityCommentWithAuthor } from "@/types";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CommentItem({
  comment,
  onDelete,
}: {
  comment: CommunityCommentWithAuthor;
  onDelete?: (id: string) => void;
}) {
  const { user } = useAuth();
  const isOwner = user?.id === comment.user_id;

  async function handleDelete() {
    const result = await deleteComment(comment.id);
    if (result.success && onDelete) {
      onDelete(comment.id);
    }
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {comment.author_name.charAt(0)}
            </div>
            <span className="text-sm font-medium text-foreground">
              {comment.author_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.created_at)}
            </span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {comment.content}
          </p>
        </div>

        {isOwner && (
          <button
            onClick={handleDelete}
            className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="ลบคอมเมนต์"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
