"use client";

import Link from "next/link";
import { Heart, MessageCircle, Paperclip } from "lucide-react";
import type { CommunityPostWithAuthor } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageGallery } from "@/components/shared/image-gallery";
import { getFileExtension, getFileNameFromUrl, isImageUrl } from "@/lib/file-utils";

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
  const imageUrls = post.image_urls.filter(isImageUrl);
  const attachmentUrls = post.image_urls.filter((url) => !isImageUrl(url));

  return (
    <Link href={`/community/${post.id}`}>
      <article className="rounded-2xl border border-border bg-card p-5 sm:p-6 transition-shadow duration-200 hover:shadow-sm cursor-pointer">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold tracking-tight text-foreground line-clamp-2">
            {post.title}
          </h3>
          <span className="shrink-0 rounded-full border border-border/60 bg-transparent px-3 py-1 text-xs font-medium text-muted-foreground">
            {post.category}
          </span>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
          {post.content}
        </p>

        <ImageGallery imageUrls={imageUrls} className="mb-4" linkImages={false} />

        {attachmentUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {attachmentUrls.map((url) => {
              const fileName = getFileNameFromUrl(url);
              const ext = getFileExtension(fileName).toUpperCase();
              return (
                <span
                  key={url}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  <Paperclip className="size-3 text-primary" />
                  <span className="truncate max-w-[200px]">{fileName}</span>
                  {ext && <span className="text-[10px] font-semibold text-muted-foreground/80">{ext}</span>}
                </span>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="size-8 shrink-0">
              <AvatarImage src={post.author_avatar_url ?? undefined} />
              <AvatarFallback className="text-xs font-medium">
                {post.author_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground truncate">
              {post.author_name}
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-xs sm:text-sm truncate">{formatDate(post.created_at)}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <span className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Heart className="size-4" />
              {post.like_count}
            </span>
            <span className="flex items-center gap-1.5 text-xs sm:text-sm">
              <MessageCircle className="size-4" />
              {post.comment_count}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
