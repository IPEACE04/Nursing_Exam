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

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mime = file.type || "image/png";
  const dataUrl = `data:${mime};base64,${base64}`;

  if (dataUrl.length > 3000000) return { error: "รูปใหญ่เกินไป กรุณาใช้รูปไม่เกิน 2MB" };

  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: dataUrl })
    .eq("id", userId);

  if (error) return { error: "บันทึกไม่สำเร็จ" };

  revalidatePath("/profile");
  return { success: true, url: dataUrl };
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
