"use client";

import { Trash2 } from "lucide-react";
import { deleteComment } from "@/actions/community";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const { locale } = useLocale();
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
            <Avatar className="size-8 shrink-0">
              <AvatarImage src={comment.author_avatar_url ?? undefined} />
              <AvatarFallback className="text-xs font-medium">
                {comment.author_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
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
            title={t(locale, "community.deleteComment")}
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
