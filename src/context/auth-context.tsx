"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
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

  return (
    <AuthContext.Provider value={{ ...state, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);