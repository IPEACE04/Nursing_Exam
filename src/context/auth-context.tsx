"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Profile } from "@/types";
import { getCurrentProfile } from "@/actions/profile";

interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<Profile | null>;
}

const AUTH_PAGES = ["/login", "/register", "/forgot-password"];

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  isLoading: true,
  refreshProfile: async () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, "refreshProfile">>({
    user: null,
    profile: null,
    isLoading: true,
  });

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    const result = await getCurrentProfile();
    setState({
      user: result.user as AuthUser | null,
      profile: result.profile,
      isLoading: false,
    });
    return result.profile;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const result = await getCurrentProfile();
      if (!cancelled) {
        setState({
          user: result.user as AuthUser | null,
          profile: result.profile,
          isLoading: false,
        });
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  const router = useRouter();
  const pathname = usePathname();
  const hasUser = state.user !== null;

  // Session can expire or be revoked while the page stays open: re-check on focus and every 5 min.
  useEffect(() => {
    // Public pages: skip, so a normal logout (which leaves stale state here) isn't reported as expiry.
    if (!hasUser || pathname === "/" || AUTH_PAGES.some((page) => pathname.startsWith(page))) return;

    async function check() {
      if (document.visibilityState !== "visible") return;
      const result = await getCurrentProfile();
      if (!result.user) {
        setState({ user: null, profile: null, isLoading: false });
        router.replace(`/login?expired=1&redirect=${encodeURIComponent(pathname)}`);
      }
    }

    const interval = setInterval(check, 5 * 60 * 1000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
    };
  }, [hasUser, pathname, router]);

  return (
    <AuthContext.Provider value={{ ...state, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);