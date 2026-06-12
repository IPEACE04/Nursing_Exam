"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSessionUserId } from "@/lib/auth";
import type {
  CommunityPostWithAuthor,
  CommunityPostDetail,
  CommunityCommentWithAuthor,
} from "@/types";

export async function getPosts(category?: string) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("community_posts")
    .select(
      `
      *,
      profiles:user_id ( name )
    `
    )
    .order("created_at", { ascending: false });

  if (category && category !== "ทั้งหมด") {
    query = query.eq("category", category);
  }

  const { data: posts } = await query;
  if (!posts) return [];

  const postIds = posts.map((p) => p.id);

  const [{ data: likes }, { data: comments }] = await Promise.all([
    supabase
      .from("community_likes")
      .select("post_id")
      .in("post_id", postIds),
    supabase
      .from("community_comments")
      .select("post_id")
      .in("post_id", postIds),
  ]);

  const likeCounts: Record<string, number> = {};
  const commentCounts: Record<string, number> = {};

  (likes ?? []).forEach((l) => {
    likeCounts[l.post_id] = (likeCounts[l.post_id] ?? 0) + 1;
  });
  (comments ?? []).forEach((c) => {
    commentCounts[c.post_id] = (commentCounts[c.post_id] ?? 0) + 1;
  });

  const postsWithCounts: CommunityPostWithAuthor[] = posts.map((post) => {
    const author = post.profiles as unknown as { name: string } | null;
    return {
      id: post.id,
      user_id: post.user_id,
      title: post.title,
      content: post.content,
      category: post.category,
      created_at: post.created_at,
      author_name: author?.name ?? "ไม่ระบุ",
      like_count: likeCounts[post.id] ?? 0,
      comment_count: commentCounts[post.id] ?? 0,
    };
  });

  return postsWithCounts;
}

export async function getPost(postId: string) {
  const userId = await getSessionUserId();
  const supabase = await createSupabaseServerClient();

  const { data: post } = await supabase
    .from("community_posts")
    .select(
      `
      *,
      profiles:user_id ( name )
    `
    )
    .eq("id", postId)
    .single();

  if (!post) return null;

  const [
    { count: likeCount },
    { count: commentCount },
    { count: likedCount },
  ] = await Promise.all([
    supabase
      .from("community_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId),
    supabase
      .from("community_comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId),
    userId
      ? supabase
          .from("community_likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", postId)
          .eq("user_id", userId)
      : Promise.resolve({ count: 0 }),
  ]);

  const author = post.profiles as unknown as { name: string } | null;

  return {
    id: post.id,
    user_id: post.user_id,
    title: post.title,
    content: post.content,
    category: post.category,
    created_at: post.created_at,
    author_name: author?.name ?? "ไม่ระบุ",
    like_count: likeCount ?? 0,
    comment_count: commentCount ?? 0,
    has_liked: (likedCount ?? 0) > 0,
  } satisfies CommunityPostDetail;
}

export async function createPost(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "กรุณาเข้าสู่ระบบ" };

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const category = formData.get("category") as string;

  if (!title || !content) {
    return { error: "กรุณากรอกหัวข้อและเนื้อหา" };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("community_posts").insert({
    user_id: userId,
    title,
    content,
    category: category || "แชร์ความรู้",
  });

  if (error) return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };

  revalidatePath("/community");
  return { success: true };
}

export async function deletePost(postId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "กรุณาเข้าสู่ระบบ" };

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("community_posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", userId);

  if (error) return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };

  revalidatePath("/community");
  return { success: true };
}

export async function addComment(postId: string, content: string) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "กรุณาเข้าสู่ระบบ" };

  if (!content.trim()) {
    return { error: "กรุณาพิมพ์ความคิดเห็น" };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("community_comments").insert({
    post_id: postId,
    user_id: userId,
    content: content.trim(),
  });

  if (error) return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };

  revalidatePath(`/community/${postId}`);
  return { success: true };
}

export async function getComments(postId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: comments } = await supabase
    .from("community_comments")
    .select(
      `
      *,
      profiles:user_id ( name )
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (!comments) return [];

  return comments.map((c) => {
    const author = c.profiles as unknown as { name: string } | null;
    return {
      id: c.id,
      post_id: c.post_id,
      user_id: c.user_id,
      content: c.content,
      created_at: c.created_at,
      author_name: author?.name ?? "ไม่ระบุ",
    } satisfies CommunityCommentWithAuthor;
  });
}

export async function deleteComment(commentId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "กรุณาเข้าสู่ระบบ" };

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("community_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId);

  if (error) return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };

  return { success: true };
}

export async function toggleLike(postId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "กรุณาเข้าสู่ระบบ" };

  const supabase = await createSupabaseServerClient();

  const { count: existingLike } = await supabase
    .from("community_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId)
    .eq("user_id", userId);

  if ((existingLike ?? 0) > 0) {
    await supabase
      .from("community_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    revalidatePath(`/community/${postId}`);
    return { liked: false };
  }

  const { error } = await supabase.from("community_likes").insert({
    post_id: postId,
    user_id: userId,
  });

  if (error) return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };

  revalidatePath(`/community/${postId}`);
  return { liked: true };
}
