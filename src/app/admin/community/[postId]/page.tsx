"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { deleteCommentAsAdmin, deletePostAsAdmin, getAdminPostDetail } from "@/actions/community";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";
import type { CommunityCommentWithAuthor, CommunityPostDetail } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";
import { ImageGallery } from "@/components/shared/image-gallery";

export default function AdminCommunityDetailPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = use(params);
  const { locale } = useLocale();
  const [post, setPost] = useState<CommunityPostDetail | null>(null);
  const [comments, setComments] = useState<CommunityCommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminPostDetail(postId).then((result) => {
      if (result) { setPost(result.post); setComments(result.comments); }
      else setError(t(locale, "admin.community.notFound"));
    }).catch(() => setError(t(locale, "error.desc"))).finally(() => setLoading(false));
  }, [locale, postId]);

  async function handleDeletePost() {
    if (!confirm(t(locale, "admin.community.deletePostConfirm"))) return;
    const result = await deletePostAsAdmin(postId);
    if (result.success) window.location.href = "/admin/community";
    else if (result.error) setError(result.error);
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm(t(locale, "admin.community.deleteCommentConfirm"))) return;
    const result = await deleteCommentAsAdmin(commentId);
    if (result.success) setComments((current) => current.filter((comment) => comment.id !== commentId));
    else if (result.error) setError(result.error);
  }

  if (loading) return <LoadingSpinner />;
  if (!post) return <div className="space-y-4"><Link href="/admin/community" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4" />{t(locale, "admin.community.back")}</Link><p className="text-sm text-destructive">{error || t(locale, "admin.community.notFound")}</p></div>;

  return <div className="mx-auto max-w-3xl space-y-6">
    <Link href="/admin/community" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{t(locale, "admin.community.back")}</Link>
    <PageHeader badge={post.category} title={post.title} description={post.author_name} action={<button onClick={() => void handleDeletePost()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-destructive/20 px-4 text-sm font-semibold text-destructive hover:bg-destructive/10"><Trash2 className="size-4" />{t(locale, "community.deletePost")}</button>} />
    {error && <p className="text-sm text-destructive">{error}</p>}
    <GlassCard className="p-5 sm:p-7"><p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">{post.content}</p><ImageGallery imageUrls={post.image_urls} className="mt-5" /></GlassCard>
    <GlassCard className="p-5 sm:p-7"><h2 className="mb-5 text-lg font-semibold text-foreground">{t(locale, "admin.community.comments")} ({comments.length})</h2><div className="space-y-3">{comments.length === 0 ? <p className="text-sm text-muted-foreground">{t(locale, "community.noComments")}</p> : comments.map((comment) => <div key={comment.id} className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><div className="mb-2 flex items-center gap-2"><Avatar className="size-7"><AvatarImage src={comment.author_avatar_url ?? undefined} /><AvatarFallback>{comment.author_name.charAt(0)}</AvatarFallback></Avatar><span className="text-sm font-medium text-foreground">{comment.author_name}</span></div><p className="whitespace-pre-wrap break-words text-sm text-foreground">{comment.content}</p><ImageGallery imageUrls={comment.image_urls} className="mt-3" /></div><button onClick={() => void handleDeleteComment(comment.id)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button></div></div>)}</div></GlassCard>
  </div>;
}
