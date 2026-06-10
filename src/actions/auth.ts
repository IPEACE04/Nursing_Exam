"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function login(_prevState: unknown, formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message === "Invalid login credentials"
      ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
      : error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function register(_prevState: unknown, formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }

  if (password.length < 6) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
  }

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    return { error: error.message === "User already registered"
      ? "อีเมลนี้ลงทะเบียนแล้ว"
      : error.message };
  }

  if (data.user?.identities?.length === 0) {
    return { error: "อีเมลนี้ลงทะเบียนแล้ว" };
  }

  revalidatePath("/", "layout");

  // If email confirmation is disabled, go straight to dashboard
  if (data.session) {
    redirect("/dashboard");
  }

  redirect("/login?registered=true");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
