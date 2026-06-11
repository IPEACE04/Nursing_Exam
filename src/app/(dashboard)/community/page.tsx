"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { getPosts } from "@/actions/community";
import { CATEGORIES } from "@/lib/community-constants";
import type { CommunityPostWithAuthor } from "@/types";
import { PostCard } from "@/components/community/post-card";
import { CreatePostForm } from "@/components/community/create-post-form";
import { LoadingSpinner } from "@/components/premium/loading-spinner";

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const data = await getPosts(activeCategory);
    setPosts(data);
    setLoading(false);
  }, [activeCategory]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  function handlePostCreated() {
    setShowCreateForm(false);
    fetchPosts();
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Community
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            แบ่งปันความรู้และเทคนิคการทำข้อสอบ
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-premium shrink-0"
        >
          <Plus className="size-5" />
          <span className="hidden sm:inline">สร้างโพสต์</span>
        </button>
      </div>

      {/* Create Post Modal */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl border border-border/50 bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">
                สร้างโพสต์ใหม่
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
            <CreatePostForm onPostCreated={handlePostCreated} />
          </motion.div>
        </motion.div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <LoadingSpinner />
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card py-16 text-center">
          <p className="text-base text-muted-foreground">
            ยังไม่มีโพสต์ในขณะนี้
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-premium mt-4"
          >
            <Plus className="size-4" />
            สร้างโพสต์แรก
          </button>
        </div>
      ) : (
        <div className="space-y-4">
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
        </div>
      )}
    </div>
  );
}
