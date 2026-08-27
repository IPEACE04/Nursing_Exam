"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, MessageCircle, Search, Trash2 } from "lucide-react";
import { getAdminPosts, deletePostAsAdmin } from "@/actions/community";
import { CATEGORIES } from "@/lib/community-constants";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";
import type { CommunityPostWithAuthor } from "@/types";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";
import { ImageGallery } from "@/components/shared/image-gallery";

export default function AdminCommunityPage() {
  const { locale } = useLocale();
  const [posts, setPosts] = useState<CommunityPostWithAuthor[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ทั้งหมด");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPosts(await getAdminPosts(search, category));
    } catch {
      setError(t(locale, "error.desc"));
    } finally {
      setLoading(false);
    }
  }, [category, locale, search]);

  useEffect(() => {
    const timeout = setTimeout(() => void fetchPosts(), 250);
    return () => clearTimeout(timeout);
  }, [fetchPosts]);

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
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t(locale, "admin.community.search")} className="h-11 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm text-foreground outline-none focus:border-primary/50" />
          </div>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:border-primary/50">
            {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </GlassCard>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading ? <LoadingSpinner /> : posts.length === 0 ? (
        <GlassCard className="p-10 text-center"><MessageCircle className="mx-auto mb-3 size-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">{t(locale, "admin.community.noPosts")}</p></GlassCard>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <GlassCard key={post.id} className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{post.category}</span><span className="text-xs text-muted-foreground">{post.author_name}</span></div>
                  <h2 className="text-base font-semibold text-foreground">{post.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.content}</p>
                  <ImageGallery imageUrls={post.image_urls} className="mt-3 max-w-sm" />
                  <div className="mt-3 flex gap-4 text-xs text-muted-foreground"><span>{post.like_count} likes</span><span>{post.comment_count} comments</span></div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link href={`/admin/community/${post.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted"><Eye className="size-3.5" />{t(locale, "admin.community.view")}</Link>
                  <button onClick={() => void handleDelete(post.id)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-destructive/20 px-3 text-xs font-semibold text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" />{t(locale, "community.deletePost")}</button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
