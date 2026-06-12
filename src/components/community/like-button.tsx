"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleLike } from "@/actions/community";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({
  postId,
  initialLiked,
  initialCount,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleLike(postId);
      if (result.liked !== undefined) {
        setLiked(result.liked);
        setCount((prev) => (result.liked ? prev + 1 : prev - 1));
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition-all min-h-[44px]",
        liked
          ? "bg-red-50 text-red-500 border border-red-200"
          : "bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-500 border border-transparent"
      )}
    >
      <Heart
        className={cn(
          "size-5 transition-all",
          liked && "fill-red-500"
        )}
      />
      {count}
    </button>
  );
}
