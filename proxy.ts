import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

if (!process.env.AUTH_SECRET) {
  throw new Error("Missing AUTH_SECRET environment variable");
}

const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);

const adminRoutes = ["/admin"];
const studentRoutes = ["/dashboard", "/exam", "/history", "/ranking", "/profile", "/community", "/progress", "/satisfaction"];
const authRoutes = ["/login", "/register", "/forgot-password"];

async function getSessionFromCookie(
  req: NextRequest
): Promise<{ userId: string; role?: string } | null> {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as { userId: string; role?: string };
  } catch {
    return null;
  }
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  const session = await getSessionFromCookie(req);

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isStudentRoute = studentRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isRoot = pathname === "/";

  // Not authenticated → protect all non-auth routes
  if (!session && (isAdminRoute || isStudentRoute || isRoot)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (session) {
    const role = session.role;

    // Old JWT without role → skip role-based routing, let client handle it
    if (!role) {
      if (isAuthRoute || isRoot) {
        const url = req.nextUrl.clone();
        url.pathname = "/community";
        return NextResponse.redirect(url);
      }
      return res;
    }

    // Authenticated on auth pages → redirect based on role
    if (isAuthRoute) {
      const url = req.nextUrl.clone();
      url.pathname = role === "admin" ? "/admin/dashboard" : "/community";
      return NextResponse.redirect(url);
    }

    // Root path → redirect based on role
    if (isRoot) {
      const url = req.nextUrl.clone();
      url.pathname = role === "admin" ? "/admin/dashboard" : "/community";
      return NextResponse.redirect(url);
    }

    // Non-admin on admin routes → redirect to community
    if (isAdminRoute && role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/community";
      return NextResponse.redirect(url);
    }

    // Admin on student routes → redirect to admin dashboard
    if (role === "admin" && isStudentRoute) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
