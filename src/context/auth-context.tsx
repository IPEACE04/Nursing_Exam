"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";
import { getCurrentProfile } from "@/actions/profile";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  isLoading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, "refreshProfile">>({
    user: null,
    profile: null,
    isLoading: true,
  });

  const refreshProfile = useCallback(async () => {
    const result = await getCurrentProfile();
    setState({
      user: result.user as unknown as User | null,
      profile: result.profile,
      isLoading: false,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const result = await getCurrentProfile();
      if (!cancelled) {
        setState({
          user: result.user as unknown as User | null,
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
