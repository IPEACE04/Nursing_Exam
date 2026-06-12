"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSessionUserId } from "@/lib/auth";
import type { Profile } from "@/types";

export async function getCurrentProfile(): Promise<{
  user: { id: string; email: string } | null;
  profile: Profile | null;
}> {
  const userId = await getSessionUserId();
  if (!userId) return { user: null, profile: null };

  const supabase = createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) return { user: null, profile: null };

  return {
    user: { id: profile.id, email: profile.email },
    profile: profile as Profile,
  };
}

export async function uploadAvatar(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "กรุณาเข้าสู่ระบบ" };

  const file = formData.get("file") as File;
  if (!file) return { error: "กรุณาเลือกรูปภาพ" };

  const supabase = createSupabaseServerClient();

  const filePath = `${userId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) return { error: "อัพโหลดไม่สำเร็จ" };

  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  const avatarUrl = urlData.publicUrl;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId);

  if (updateError) return { error: "บันทึกไม่สำเร็จ" };

  revalidatePath("/profile");
  return { success: true, url: avatarUrl };
}

export async function updateProfile(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "กรุณาเข้าสู่ระบบ" };

  const name = formData.get("name") as string;
  const university = formData.get("university") as string;

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ name, university })
    .eq("id", userId);

  if (error) return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };

  revalidatePath("/profile");
  return { success: true };
}
