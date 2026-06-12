"use server";

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
