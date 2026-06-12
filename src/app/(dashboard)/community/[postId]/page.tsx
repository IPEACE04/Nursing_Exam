"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getPost, getComments, deletePost } from "@/actions/community";
import { useAuth } from "@/context/auth-context";
import type {
  CommunityPostDetail,
  CommunityCommentWithAuthor,
} from "@/types";
import { LikeButton } from "@/components/community/like-button";
import { CommentItem } from "@/components/community/comment-item";
import { CommentForm } from "@/components/community/comment-form";
import { LoadingSpinner } from "@/components/premium/loading-spinner";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<CommunityPostDetail | null>(null);
  const [comments, setComments] = useState<CommunityCommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    const [postData, commentsData] = await Promise.all([
      getPost(postId),
      getComments(postId),
    ]);
    setPost(postData);
    setComments(commentsData);
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete() {
    if (!confirm("ต้องการลบโพสต์นี้?")) return;
    setDeleting(true);
    const result = await deletePost(postId);
    if (result.success) {
      router.push("/community");
    }
    setDeleting(false);
  }

  function handleCommentDeleted(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">ไม่พบโพสต์นี้</p>
        <Link href="/community" className="btn-premium mt-4 inline-flex">
          กลับไป Community
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === post.user_id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl space-y-6"
    >
      {/* Back */}
      <Link
        href="/community"
        className="inline-flex items-center gap-2 py-2 -ml-2 px-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        กลับไป Community
      </Link>

      {/* Post */}
      <article className="rounded-xl border border-border/50 bg-card p-4 sm:p-6 lg:p-8 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
              {post.category}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {post.title}
            </h1>
          </div>

          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="ลบโพสต์"
            >
              <Trash2 className="size-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {post.author_name.charAt(0)}
          </div>
          <span className="font-medium text-foreground">
            {post.author_name}
          </span>
          <span>·</span>
          <span>{formatDate(post.created_at)}</span>
        </div>

        <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap break-words">
          {post.content}
        </div>

        <div className="mt-6 pt-4 border-t border-border/40">
          <LikeButton
            postId={postId}
            initialLiked={post.has_liked}
            initialCount={post.like_count}
          />
        </div>
      </article>

      {/* Comments */}
      <div className="rounded-xl border border-border/50 bg-card p-4 sm:p-6 lg:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-6">
          ความคิดเห็น ({comments.length})
        </h2>

        <div className="space-y-4 mb-6">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              ยังไม่มีความคิดเห็น — เป็นคนแรกที่แสดงความคิดเห็น
            </p>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onDelete={handleCommentDeleted}
              />
            ))
          )}
        </div>

        <div className="pt-4 border-t border-border/40">
          <CommentForm postId={postId} onCommentAdded={fetchData} />
        </div>
      </div>
    </motion.div>
  );
}
