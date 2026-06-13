"use client";

import { Trash2, User } from "lucide-react";
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
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-8 items-center justify-center rounded-full border border-border/60 bg-muted text-xs font-medium text-muted-foreground">
              <User className="size-3.5" />
            </div>
            <span className="text-sm font-medium text-foreground truncate">
              {comment.author_name}
            </span>
            <span className="text-xs text-muted-foreground/60">
              {formatDate(comment.created_at)}
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed break-words">
            {comment.content}
          </p>
        </div>

        {isOwner && (
          <button
            onClick={handleDelete}
            className="shrink-0 rounded-lg p-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="ลบคอมเมนต์"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
