"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, MessageCircle, Pin, PinOff, Search, Trash2 } from "lucide-react";
import { getAdminPosts, deletePostAsAdmin, setPostPinnedAsAdmin } from "@/actions/community";
import { CATEGORIES } from "@/lib/community-constants";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";
import type { CommunityPostWithAuthor } from "@/types";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";
import { ImageGallery } from "@/components/shared/image-gallery";
import { AttachmentList } from "@/components/shared/attachment-list";
import { isImageUrl } from "@/lib/file-utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminCommunityPage() {
  const { locale } = useLocale();
  const [posts, setPosts] = useState<CommunityPostWithAuthor[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ทั้งหมด");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pinningPostId, setPinningPostId] = useState<string | null>(null);
  const pinning = useRef(false);
  const requestId = useRef(0);

  const fetchPosts = useCallback(async (showLoading = true) => {
    const currentRequest = ++requestId.current;
    if (showLoading) setLoading(true);
    setError("");
    try {
      const data = await getAdminPosts(search, category);
      if (currentRequest === requestId.current) setPosts(data);
    } catch {
      if (currentRequest === requestId.current) setError(t(locale, "community.loadError"));
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [category, locale, search]);

  useEffect(() => {
    const timeout = setTimeout(() => void fetchPosts(), 250);
    return () => {
      clearTimeout(timeout);
      requestId.current += 1;
    };
  }, [fetchPosts]);

  async function handlePin(post: CommunityPostWithAuthor) {
    if (pinning.current) return;
    pinning.current = true;
    requestId.current += 1;
    setPinningPostId(post.id);
    setError("");
    setSuccess("");
    const formData = new FormData();
    formData.set("postId", post.id);
    formData.set("isPinned", String(!post.is_pinned));
    try {
      const result = await setPostPinnedAsAdmin(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSuccess(t(locale, post.is_pinned ? "admin.community.unpinSuccess" : "admin.community.pinSuccess"));
      await fetchPosts(false);
    } catch {
      setError(t(locale, "admin.community.pinError"));
    } finally {
      pinning.current = false;
      setPinningPostId(null);
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm(t(locale, "admin.community.deletePostConfirm"))) return;
    const result = await deletePostAsAdmin(postId);
    if (result.error) {
      setError(result.error);
      return;
    }
    setPosts((current) => current.filter((post) => post.id !== postId));
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader badge="Admin" title={t(locale, "admin.community.title")} description={t(locale, "admin.community.desc")} />
      <GlassCard className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input disabled={pinningPostId !== null} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t(locale, "admin.community.search")} className="h-11 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm text-foreground outline-none focus:border-primary/50 disabled:opacity-50" />
          </div>
          <select disabled={pinningPostId !== null} value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:border-primary/50 disabled:opacity-50">
            {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </GlassCard>

      <div aria-live="polite" aria-atomic="true" className="min-h-5 text-sm">
        {success && <p className="text-primary">{success}</p>}
        {error && <div className="flex flex-wrap items-center gap-2"><p className="text-destructive">{error}</p><Button variant="outline" size="xs" disabled={pinningPostId !== null} onClick={() => void fetchPosts()}>{t(locale, "community.retry")}</Button></div>}
      </div>
      {loading ? <LoadingSpinner /> : posts.length === 0 ? (
        <GlassCard className="p-10 text-center"><MessageCircle className="mx-auto mb-3 size-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">{t(locale, "admin.community.noPosts")}</p></GlassCard>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <GlassCard key={post.id} className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {post.is_pinned && <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"><Pin className="size-3" aria-hidden="true" />{t(locale, "community.pinned")}</span>}
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{post.category}</span><span className="text-xs text-muted-foreground">{post.author_name}</span>
                  </div>
                  <h2 className="text-base font-semibold text-foreground">{post.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.content}</p>
                  {(() => {
                    const imageUrls = post.image_urls.filter(isImageUrl);
                    const attachmentUrls = post.image_urls.filter((url) => !isImageUrl(url));
                    return (
                      <>
                        <ImageGallery imageUrls={imageUrls} className="mt-3 max-w-sm" />
                        <AttachmentList attachmentUrls={attachmentUrls} className="mt-2.5 max-w-sm" />
                      </>
                    );
                  })()}
                  <div className="mt-3 flex gap-4 text-xs text-muted-foreground"><span>{post.like_count} likes</span><span>{post.comment_count} comments</span></div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 sm:max-w-xs sm:justify-end">
                  <Button variant="outline" size="sm" className="relative h-9 rounded-xl px-3 text-xs cursor-pointer" disabled={pinningPostId !== null} aria-busy={pinningPostId === post.id} aria-label={t(locale, post.is_pinned ? "admin.community.unpin" : "admin.community.pin")} onClick={() => void handlePin(post)}>
                    <span className={cn("inline-flex items-center gap-1.5", pinningPostId === post.id && "invisible")}>
                      {post.is_pinned ? <PinOff className="size-3.5" aria-hidden="true" /> : <Pin className="size-3.5" aria-hidden="true" />}
                      {t(locale, post.is_pinned ? "admin.community.unpin" : "admin.community.pin")}
                    </span>
                    {pinningPostId === post.id && <Loader2 className="absolute size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                  </Button>
                  <Link href={`/admin/community/${post.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted"><Eye className="size-3.5" />{t(locale, "admin.community.view")}</Link>
                  <button disabled={pinningPostId !== null} onClick={() => void handleDelete(post.id)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-destructive/20 px-3 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"><Trash2 className="size-3.5" />{t(locale, "community.deletePost")}</button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
