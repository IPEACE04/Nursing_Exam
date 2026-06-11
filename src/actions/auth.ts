"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  hashPassword,
  verifyPassword,
  createJWT,
  setSessionCookie,
  clearSessionCookie,
  getSessionUserId,
} from "@/lib/auth";

export async function login(_prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }

  const supabase = await createSupabaseServerClient();

  const { data: user, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !user) {
    return { error: "Incorrect Email or Password" };
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return { error: "Incorrect Email or Password" };
  }

  const token = await createJWT(user.id);
  await setSessionCookie(token);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function register(_prevState: unknown, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }

  if (password.length < 6) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return { error: "อีเมลนี้ลงทะเบียนแล้ว" };
  }

  const password_hash = await hashPassword(password);

  const { data: newUser, error } = await supabase
    .from("profiles")
    .insert({
      name,
      email,
      password_hash,
      role: "student",
    })
    .select("id")
    .single();

  if (error) {
    return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };
  }

  const token = await createJWT(newUser.id);
  await setSessionCookie(token);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function changePassword(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Unauthorized" };

  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword.length < 6) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "รหัสผ่านไม่ตรงกัน" };
  }

  const supabase = await createSupabaseServerClient();
  const password_hash = await hashPassword(newPassword);

  const { error } = await supabase
    .from("profiles")
    .update({ password_hash })
    .eq("id", userId);

  if (error) return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };

  revalidatePath("/profile");
  return { success: true };
}

export async function logout() {
  await clearSessionCookie();
  revalidatePath("/", "layout");
  redirect("/login");
}
