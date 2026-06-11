import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback-secret-change-in-production"
);

const protectedRoutes = [
  "/dashboard",
  "/exam",
  "/history",
  "/ranking",
  "/profile",
  "/admin",
];
const authRoutes = ["/login", "/register"];

async function getUserIdFromCookie(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return (payload as unknown as { userId: string }).userId;
  } catch {
    return null;
  }
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  const userId = await getUserIdFromCookie(req);

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuth = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !userId) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuth && userId) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
