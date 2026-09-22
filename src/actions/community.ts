"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSessionUserId } from "@/lib/auth";
import { deleteImageFiles, getFormFiles, getPublicImageUrls, parseImagePaths, uploadCommunityFiles } from "@/lib/storage";
import {
  BLOCKED_FILE_EXTENSIONS,
  encodeFileNameForStorage,
  getFileExtension,
  validateCommunityFiles,
} from "@/lib/file-utils";
import type { CommunityPostDetail, CommunityPostWithAuthor, CommunityCommentWithAuthor } from "@/types";

async function requireAdmin() {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Unauthorized");
  const supabase = createSupabaseServerClient();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (profile?.role !== "admin") throw new Error("Forbidden");
  return { supabase, userId };
}

function authorOf(row: Record<string, unknown>) {
  return row.profiles as { name: string; avatar_url: string | null } | null;
}

function mapPost(row: Record<string, unknown>, counts?: { likes?: number; comments?: number; liked?: boolean }): CommunityPostDetail {
  const author = authorOf(row);
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    title: String(row.title),
    content: String(row.content),
    category: String(row.category),
    created_at: String(row.created_at),
    image_urls: getPublicImageUrls("community-media", parseImagePaths(row.image_paths)),
    author_name: author?.name ?? "ไม่ระบุ",
    author_avatar_url: author?.avatar_url ?? null,
    like_count: counts?.likes ?? 0,
    comment_count: counts?.comments ?? 0,
    has_liked: counts?.liked ?? false,
  };
}

function mapComment(row: Record<string, unknown>): CommunityCommentWithAuthor {
  const author = authorOf(row);
  return {
    id: String(row.id),
    post_id: String(row.post_id),
    user_id: String(row.user_id),
    content: String(row.content),
    created_at: String(row.created_at),
    image_urls: getPublicImageUrls("community-media", parseImagePaths(row.image_paths)),
    author_name: author?.name ?? "ไม่ระบุ",
    author_avatar_url: author?.avatar_url ?? null,
  };
}

export async function getPosts(category?: string) {
  const supabase = createSupabaseServerClient();
  let query = supabase.from("community_posts").select("*, profiles:user_id ( name, avatar_url )").order("created_at", { ascending: false });
  if (category && category !== "ทั้งหมด") query = query.eq("category", category);
  const { data: posts } = await query;
  if (!posts) return [];

  const postIds = posts.map((post) => post.id);
  const [{ data: likes }, { data: comments }] = await Promise.all([
    supabase.from("community_likes").select("post_id").in("post_id", postIds),
    supabase.from("community_comments").select("post_id").in("post_id", postIds),
  ]);
  const likeCounts: Record<string, number> = {};
  const commentCounts: Record<string, number> = {};
  (likes ?? []).forEach((like) => { likeCounts[like.post_id] = (likeCounts[like.post_id] ?? 0) + 1; });
  (comments ?? []).forEach((comment) => { commentCounts[comment.post_id] = (commentCounts[comment.post_id] ?? 0) + 1; });

  return posts.map((post) => mapPost(post as Record<string, unknown>, {
    likes: likeCounts[post.id] ?? 0,
    comments: commentCounts[post.id] ?? 0,
  })) as CommunityPostWithAuthor[];
}

export async function getPost(postId: string) {
  const userId = await getSessionUserId();
  const supabase = createSupabaseServerClient();
  const { data: post } = await supabase.from("community_posts").select("*, profiles:user_id ( name, avatar_url )").eq("id", postId).single();
  if (!post) return null;

  const [{ count: likeCount }, { count: commentCount }, { count: likedCount }] = await Promise.all([
    supabase.from("community_likes").select("*", { count: "exact", head: true }).eq("post_id", postId),
    supabase.from("community_comments").select("*", { count: "exact", head: true }).eq("post_id", postId),
    userId ? supabase.from("community_likes").select("*", { count: "exact", head: true }).eq("post_id", postId).eq("user_id", userId) : Promise.resolve({ count: 0 }),
  ]);
  return mapPost(post as Record<string, unknown>, { likes: likeCount ?? 0, comments: commentCount ?? 0, liked: (likedCount ?? 0) > 0 });
}

export async function getComments(postId: string) {
  const supabase = createSupabaseServerClient();
  const { data: comments } = await supabase.from("community_comments").select("*, profiles:user_id ( name, avatar_url )").eq("post_id", postId).order("created_at", { ascending: true });
  return (comments ?? []).map((comment) => mapComment(comment as Record<string, unknown>));
}

export interface CommunityUploadTarget {
  name: string;
  type?: string;
  size?: number;
}

export async function getCommunityUploadUrls(
  files: CommunityUploadTarget[],
  prefix: "posts" | "comments" = "posts"
): Promise<{ uploads: { name: string; path: string; signedUrl: string }[]; error?: string }> {
  const userId = await getSessionUserId();
  if (!userId) return { uploads: [], error: "กรุณาเข้าสู่ระบบ" };

  for (const file of files) {
    const ext = getFileExtension(file.name);
    if (BLOCKED_FILE_EXTENSIONS.has(ext)) {
      return { uploads: [], error: `ไม่อนุญาตให้อัปโหลดไฟล์ .${ext} เพื่อความปลอดภัย` };
    }
  }

  const supabase = createSupabaseServerClient();
  const uploads: { name: string; path: string; signedUrl: string }[] = [];

  for (const file of files) {
    const storageName = encodeFileNameForStorage(file.name);
    const path = `${prefix}/${userId}/${randomUUID()}_${storageName}`;
    const { data, error } = await supabase.storage
      .from("community-media")
      .createSignedUploadUrl(path);

    if (error || !data?.signedUrl) {
      console.error("Failed to generate signed upload URL:", error);
      return { uploads: [], error: "ไม่สามารถเตรียมการอัปโหลดไฟล์ได้ กรุณาลองใหม่" };
    }

    uploads.push({
      name: file.name,
      path,
      signedUrl: data.signedUrl,
    });
  }

  return { uploads };
}

export async function createPost(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "กรุณาเข้าสู่ระบบ" };
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const category = String(formData.get("category") ?? "แชร์ความรู้");

  let preUploadedPaths: string[] = [];
  const rawImagePaths = formData.get("imagePaths");
  if (rawImagePaths) {
    try {
      preUploadedPaths = parseImagePaths(JSON.parse(String(rawImagePaths)));
    } catch {
      preUploadedPaths = parseImagePaths(formData.getAll("imagePaths"));
    }
  }

  const files = getFormFiles(formData, "images");
  if (files.length > 0) {
    const validationError = await validateCommunityFiles(files);
    if (validationError) return { error: validationError };
  }

  if (!title || !content) return { error: "กรุณากรอกหัวข้อและเนื้อหา" };

  const supabase = createSupabaseServerClient();
  const { data: post, error } = await supabase
    .from("community_posts")
    .insert({ user_id: userId, title, content, category, image_paths: preUploadedPaths })
    .select("id")
    .single();

  if (error || !post) return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };

  if (files.length > 0) {
    const upload = await uploadCommunityFiles(files, `posts/${post.id}`);
    if (upload.error) {
      await supabase.from("community_posts").delete().eq("id", post.id);
      return { error: upload.error };
    }
    const combinedPaths = [...preUploadedPaths, ...upload.paths];
    const { error: updateError } = await supabase
      .from("community_posts")
      .update({ image_paths: combinedPaths })
      .eq("id", post.id);

    if (updateError) {
      await deleteImageFiles("community-media", upload.paths);
      await supabase.from("community_posts").delete().eq("id", post.id);
      return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };
    }
  }

  revalidatePath("/community");
  return { success: true };
}

export async function addComment(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "กรุณาเข้าสู่ระบบ" };
  const postId = String(formData.get("postId") ?? "");
  const content = String(formData.get("content") ?? "").trim();

  let preUploadedPaths: string[] = [];
  const rawImagePaths = formData.get("imagePaths");
  if (rawImagePaths) {
    try {
      preUploadedPaths = parseImagePaths(JSON.parse(String(rawImagePaths)));
    } catch {
      preUploadedPaths = parseImagePaths(formData.getAll("imagePaths"));
    }
  }

  const files = getFormFiles(formData, "images");
  if (files.length > 0) {
    const validationError = await validateCommunityFiles(files);
    if (validationError) return { error: validationError };
  }

  if (!postId || !content) return { error: "กรุณาพิมพ์ความคิดเห็น" };

  const supabase = createSupabaseServerClient();
  const { data: comment, error } = await supabase
    .from("community_comments")
    .insert({ post_id: postId, user_id: userId, content, image_paths: preUploadedPaths })
    .select("id")
    .single();

  if (error || !comment) return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };

  if (files.length > 0) {
    const upload = await uploadCommunityFiles(files, `comments/${comment.id}`);
    if (upload.error) {
      await supabase.from("community_comments").delete().eq("id", comment.id);
      return { error: upload.error };
    }
    const combinedPaths = [...preUploadedPaths, ...upload.paths];
    const { error: updateError } = await supabase
      .from("community_comments")
      .update({ image_paths: combinedPaths })
      .eq("id", comment.id);

    if (updateError) {
      await deleteImageFiles("community-media", upload.paths);
      await supabase.from("community_comments").delete().eq("id", comment.id);
      return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };
    }
  }

  revalidatePath(`/community/${postId}`);
  return { success: true };
}

async function deletePostAndMedia(postId: string, userId?: string) {
  const supabase = createSupabaseServerClient();
  let postQuery = supabase.from("community_posts").select("image_paths").eq("id", postId);
  if (userId) postQuery = postQuery.eq("user_id", userId);
  const { data: post } = await postQuery.single();
  if (!post) return { error: "ไม่พบโพสต์หรือคุณไม่มีสิทธิ์ลบ" };
  const { data: comments } = await supabase.from("community_comments").select("image_paths").eq("post_id", postId);
  const { error } = await supabase.from("community_posts").delete().eq("id", postId);
  if (error) return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };
  const paths = [parseImagePaths(post.image_paths), ...(comments ?? []).map((comment) => parseImagePaths(comment.image_paths))].flat();
  await deleteImageFiles("community-media", paths);
  return { success: true };
}

export async function deletePost(postId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "กรุณาเข้าสู่ระบบ" };
  const result = await deletePostAndMedia(postId, userId);
  if (result.success) {
    revalidatePath("/community");
    revalidatePath(`/community/${postId}`);
  }
  return result;
}

async function deleteCommentAndMedia(commentId: string, userId?: string) {
  const supabase = createSupabaseServerClient();
  let query = supabase.from("community_comments").select("post_id, image_paths").eq("id", commentId);
  if (userId) query = query.eq("user_id", userId);
  const { data: comment } = await query.single();
  if (!comment) return { error: "ไม่พบความคิดเห็นหรือคุณไม่มีสิทธิ์ลบ" };
  const { error } = await supabase.from("community_comments").delete().eq("id", commentId);
  if (error) return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };
  await deleteImageFiles("community-media", parseImagePaths(comment.image_paths));
  return { success: true, postId: comment.post_id };
}

export async function deleteComment(commentId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "กรุณาเข้าสู่ระบบ" };
  const result = await deleteCommentAndMedia(commentId, userId);
  if (result.success) revalidatePath(`/community/${result.postId}`);
  return result;
}

export async function getAdminPosts(search = "", category = "ทั้งหมด") {
  await requireAdmin();
  const supabase = createSupabaseServerClient();
  let query = supabase.from("community_posts").select("*, profiles:user_id ( name, avatar_url )").order("created_at", { ascending: false });
  if (category !== "ทั้งหมด") query = query.eq("category", category);
  const safeSearch = search.trim().replace(/[(),]/g, " ");
  if (safeSearch) query = query.or(`title.ilike.%${safeSearch}%,content.ilike.%${safeSearch}%`);
  const { data: posts } = await query;
  if (!posts) return [];
  const counts = await Promise.all(posts.map(async (post) => {
    const [{ count: likes }, { count: comments }] = await Promise.all([
      supabase.from("community_likes").select("*", { count: "exact", head: true }).eq("post_id", post.id),
      supabase.from("community_comments").select("*", { count: "exact", head: true }).eq("post_id", post.id),
    ]);
    return { id: post.id, likes: likes ?? 0, comments: comments ?? 0 };
  }));
  return posts.map((post) => {
    const count = counts.find((item) => item.id === post.id);
    return mapPost(post as Record<string, unknown>, { likes: count?.likes, comments: count?.comments });
  }) as CommunityPostWithAuthor[];
}

export async function getAdminPostDetail(postId: string) {
  await requireAdmin();
  const [post, comments] = await Promise.all([getPost(postId), getComments(postId)]);
  return post ? { post, comments } : null;
}

export async function deletePostAsAdmin(postId: string) {
  await requireAdmin();
  const result = await deletePostAndMedia(postId);
  if (result.success) {
    revalidatePath("/admin/community");
    revalidatePath(`/admin/community/${postId}`);
    revalidatePath("/community");
  }
  return result;
}

export async function deleteCommentAsAdmin(commentId: string) {
  await requireAdmin();
  const result = await deleteCommentAndMedia(commentId);
  if (result.success) {
    revalidatePath("/admin/community");
    revalidatePath(`/admin/community/${result.postId}`);
    revalidatePath(`/community/${result.postId}`);
  }
  return result;
}

export async function toggleLike(postId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "กรุณาเข้าสู่ระบบ" };
  const supabase = createSupabaseServerClient();
  const { count: existingLike } = await supabase.from("community_likes").select("*", { count: "exact", head: true }).eq("post_id", postId).eq("user_id", userId);
  if ((existingLike ?? 0) > 0) {
    await supabase.from("community_likes").delete().eq("post_id", postId).eq("user_id", userId);
    revalidatePath(`/community/${postId}`);
    return { liked: false };
  }
  const { error } = await supabase.from("community_likes").insert({ post_id: postId, user_id: userId });
  if (error) return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };
  revalidatePath(`/community/${postId}`);
  return { liked: true };
}
