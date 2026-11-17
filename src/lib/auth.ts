import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase-server";

if (!process.env.AUTH_SECRET) {
  throw new Error("Missing AUTH_SECRET environment variable");
}

const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);
const COOKIE_NAME = "session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createJWT(
  userId: string,
  role: string,
  sessionVersion?: string
): Promise<string> {
  return new SignJWT({ userId, role, sv: sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyJWT(
  token: string
): Promise<{ userId: string; role?: string; sv?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as { userId: string; role?: string; sv?: string };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  const profile = await getSessionProfile<{ id: string }>("id");
  return profile?.id ?? null;
}

/**
 * Validates the session and reads the user's profile columns in the same query.
 * Returns null when there is no valid session.
 */
export async function getSessionProfile<T extends { id: string }>(
  columns: string
): Promise<T | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyJWT(token);
  // Tokens without a version (old sessions, reset tokens) are never valid sessions.
  if (payload?.userId && payload.sv) {
    const { data, error } = await createSupabaseServerClient()
      .from("profiles")
      .select(`${columns}, session_version`)
      .eq("id", payload.userId)
      .maybeSingle();
    // DB failure: deny this request but keep the cookie, so a blip doesn't log the user out.
    if (error) return null;
    const row = data as (T & { session_version?: string }) | null;
    if (row && row.session_version === payload.sv) {
      delete row.session_version;
      return row;
    }
  }
  // Revoked or invalid token: drop it so proxy.ts stops treating the user as logged in.
  try {
    cookieStore.delete(COOKIE_NAME);
  } catch {
    // cookies are read-only outside server actions / route handlers
  }
  return null;
}
