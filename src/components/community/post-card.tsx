"use client";

import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import type { CommunityPostWithAuthor } from "@/types";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PostCard({ post }: { post: CommunityPostWithAuthor }) {
  return (
    <Link href={`/community/${post.id}`}>
      <article className="rounded-xl border border-border/50 bg-card p-5 sm:p-6 shadow-sm transition-all hover:shadow-md cursor-pointer">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-foreground line-clamp-2">
            {post.title}
          </h3>
          <span className="shrink-0 rounded-full px-3 py-1 text-xs font-medium bg-primary/10 text-primary">
            {post.category}
          </span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {post.content}
        </p>

        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              {post.author_name}
            </span>
            <span>·</span>
            <span>{formatDate(post.created_at)}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="flex items-center gap-1.5">
              <Heart className="size-4" />
              {post.like_count}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="size-4" />
              {post.comment_count}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
