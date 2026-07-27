"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  hashPassword,
  verifyPassword,
  createJWT,
  verifyJWT,
  setSessionCookie,
  clearSessionCookie,
  getSessionUserId,
} from "@/lib/auth";
import { PERSONAL_QUESTIONS } from "@/lib/personal-questions";

export async function login(_prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }

  const supabase = createSupabaseServerClient();

  const { data: user, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !user || !user.password_hash) {
    return { error: "Incorrect Email or Password" };
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return { error: "Incorrect Email or Password" };
  }

  const token = await createJWT(user.id, user.role);
  await setSessionCookie(token);

  revalidatePath("/", "layout");
  return { success: true };
}

export async function register(_prevState: unknown, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const gender = formData.get("gender") as string;
  const ageRaw = formData.get("age") as string;
  const studentId = formData.get("studentId") as string;
  const gpaRaw = formData.get("gpa") as string;
  const personalQuestion = formData.get("personalQuestion") as string;
  const personalAnswer = formData.get("personalAnswer") as string;

  if (!name || !email || !password) {
    return { error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }

  if (password.length < 6) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
  }

  if (!personalQuestion || !personalAnswer) {
    return { error: "กรุณาเลือกคำถามส่วนตัวและกรอกคำตอบ" };
  }

  if (!PERSONAL_QUESTIONS.includes(personalQuestion)) {
    return { error: "คำถามส่วนตัวไม่ถูกต้อง" };
  }

  if (personalAnswer.trim().length < 2) {
    return { error: "คำตอบคำถามส่วนตัวต้องมีอย่างน้อย 2 ตัวอักษร" };
  }

  const supabase = createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return { error: "อีเมลนี้ลงทะเบียนแล้ว" };
  }

  const password_hash = await hashPassword(password);
  const personal_answer_hash = await hashPassword(personalAnswer.trim().toLowerCase());

  const age = ageRaw ? parseInt(ageRaw, 10) : null;
  const gpa = gpaRaw ? parseFloat(parseFloat(gpaRaw).toFixed(2)) : null;

  const { data: newUser, error } = await supabase
    .from("profiles")
    .insert({
      id: randomUUID(),
      name,
      email,
      password_hash,
      role: "student",
      gender: gender || null,
      age: age && !isNaN(age) ? age : null,
      student_id: studentId || null,
      gpa: gpa && !isNaN(gpa) ? gpa : null,
      personal_question: personalQuestion,
      personal_answer_hash,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };
  }

  const token = await createJWT(newUser.id, "student");
  await setSessionCookie(token);

  revalidatePath("/", "layout");
  return { success: true };
}

export async function getPersonalQuestion(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "กรุณากรอกอีเมล" };
  }

  const supabase = createSupabaseServerClient();

  const { data: user } = await supabase
    .from("profiles")
    .select("personal_question")
    .eq("email", email)
    .maybeSingle();

  if (!user?.personal_question) {
    return { error: "ไม่พบบัญชี หรือไม่ได้ตั้งคำถามส่วนตัว" };
  }

  return { success: true, question: user.personal_question, email };
}

export async function verifyPersonalAnswer(formData: FormData) {
  const email = formData.get("email") as string;
  const answer = formData.get("answer") as string;

  if (!email || !answer) {
    return { error: "กรุณากรอกคำตอบ" };
  }

  const supabase = createSupabaseServerClient();

  const { data: user } = await supabase
    .from("profiles")
    .select("id, personal_answer_hash")
    .eq("email", email)
    .maybeSingle();

  if (!user?.personal_answer_hash) {
    return { error: "ไม่พบข้อมูลคำถามส่วนตัว" };
  }

  const valid = await verifyPassword(answer.trim().toLowerCase(), user.personal_answer_hash);
  if (!valid) {
    return { error: "คำตอบไม่ถูกต้อง" };
  }

  const resetToken = await createJWT(user.id, "reset");
  const cookieStore = await cookies();
  cookieStore.set("reset_token", resetToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 5,
  });

  return { success: true };
}

export async function resetPasswordWithToken(formData: FormData) {
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const cookieStore = await cookies();
  const resetToken = cookieStore.get("reset_token")?.value;
  if (!resetToken) {
    return { error: "เซสชันหมดอายุ กรุณาลองใหม่" };
  }

  const payload = await verifyJWT(resetToken);
  if (!payload?.userId) {
    return { error: "เซสชันไม่ถูกต้อง" };
  }

  if (!newPassword || !confirmPassword) {
    return { error: "กรุณากรอกรหัสผ่าน" };
  }
  if (newPassword.length < 6) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "รหัสผ่านไม่ตรงกัน" };
  }

  const supabase = createSupabaseServerClient();
  const password_hash = await hashPassword(newPassword);

  const { error } = await supabase
    .from("profiles")
    .update({ password_hash })
    .eq("id", payload.userId);

  if (error) return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };

  cookieStore.delete("reset_token");

  revalidatePath("/", "layout");
  return { success: true, message: "เปลี่ยนรหัสผ่านสำเร็จ" };
}

export async function changePassword(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "Unauthorized" };

  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!newPassword || !confirmPassword) {
    return { error: "กรุณากรอกรหัสผ่าน" };
  }
  if (newPassword.length < 6) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "รหัสผ่านไม่ตรงกัน" };
  }

  const supabase = createSupabaseServerClient();
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
