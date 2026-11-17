"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { getPosts } from "@/actions/community";
import { CATEGORIES, POSTS_PAGE_SIZE } from "@/lib/community-constants";
import type { CommunityPostWithAuthor } from "@/types";
import { PostCard } from "@/components/community/post-card";
import { CreatePostForm } from "@/components/community/create-post-form";
import { PageSkeleton } from "@/components/premium/page-skeleton";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";

const categoryKeyMap: Record<string, string> = {
  "ทั้งหมด": "community.category.all",
  "เทคนิค": "community.category.technique",
  "แชร์ความรู้": "community.category.knowledge",
  "ถาม-ตอบ": "community.category.qna",
};

export default function CommunityPage() {
  const { locale } = useLocale();
  const [posts, setPosts] = useState<CommunityPostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [reloadKey, setReloadKey] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Bumped on every first-page load so late responses from an old category/reload are ignored.
  const requestRef = useRef(0);

  useEffect(() => {
    const request = ++requestRef.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    setLoadingMore(false);
    setMoreError(false);
    getPosts(activeCategory, 0)
      .then((data) => {
        if (request !== requestRef.current) return;
        setPosts(data);
        setHasMore(data.length === POSTS_PAGE_SIZE);
      })
      .catch(() => { if (request === requestRef.current) { setPosts([]); setError(true); } })
      .finally(() => { if (request === requestRef.current) setLoading(false); });
  }, [activeCategory, reloadKey]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    const request = requestRef.current;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const data = await getPosts(activeCategory, posts.length);
      if (request !== requestRef.current) return;
      // New posts created meanwhile shift offsets; drop any repeats.
      setPosts((prev) => [...prev, ...data.filter((post) => !prev.some((p) => p.id === post.id))]);
      setHasMore(data.length === POSTS_PAGE_SIZE);
    } catch {
      if (request === requestRef.current) setMoreError(true);
    } finally {
      if (request === requestRef.current) setLoadingMore(false);
    }
  }, [activeCategory, posts.length, loading, loadingMore, hasMore]);

  // Load the next page when the bottom sentinel scrolls into view.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || moreError) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) void loadMore(); },
      { rootMargin: "300px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, hasMore, moreError]);

  const reload = () => setReloadKey((key) => key + 1);

  function handlePostCreated() {
    setShowCreateForm(false);
    reload();
  }

  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-10">
      {/* Header */}
      <div className="learning-page-header">
        <div>
          <h1 className="learning-page-title">
            {t(locale, "community.title")}
          </h1>
          <p className="mt-1 text-base text-muted-foreground leading-relaxed">
            {t(locale, "community.desc")}
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="learning-button shrink-0 self-start"
          aria-label={t(locale, "community.createPost")}
        >
          <Plus className="size-5" />
          <span>{t(locale, "community.createPost")}</span>
        </button>
      </div>

      {/* Create Post Modal */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/20 backdrop-blur-sm p-4 pt-16 sm:pt-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {t(locale, "community.newPost")}
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label={t(locale, "common.cancel")}
              >
                <X className="size-5" />
              </button>
            </div>
            <CreatePostForm onPostCreated={handlePostCreated} />
          </motion.div>
        </motion.div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            aria-pressed={activeCategory === cat}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            {t(locale, categoryKeyMap[cat] ?? cat)}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <PageSkeleton variant="posts" header={false} />
      ) : error ? (
        <div role="alert" className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-destructive">{t(locale, "community.loadError")}</p>
          <button onClick={reload} className="mt-4 inline-flex h-11 cursor-pointer items-center rounded-xl border border-border px-5 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
            {t(locale, "community.retry")}
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-12 sm:py-16 text-center">
          <p className="text-base text-muted-foreground">
            {t(locale, "community.empty")}
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px mt-4"
          >
            <Plus className="size-4" />
            {t(locale, "community.createFirst")}
          </button>
        </div>
      ) : (
        <div className="mx-auto max-w-4xl space-y-4">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
          <div ref={sentinelRef} aria-hidden="true" />
          {loadingMore && <PageSkeleton variant="posts" header={false} />}
          {moreError && (
            <div role="alert" className="flex flex-wrap items-center justify-center gap-3 py-4 text-sm">
              <p className="text-destructive">{t(locale, "community.loadError")}</p>
              <button onClick={() => void loadMore()} className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-border px-5 font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
                {t(locale, "community.retry")}
              </button>
            </div>
          )}
          {!hasMore && posts.length > POSTS_PAGE_SIZE && (
            <p className="py-4 text-center text-sm text-muted-foreground">{t(locale, "community.noMore")}</p>
          )}
        </div>
      )}
    </div>
  );
}
