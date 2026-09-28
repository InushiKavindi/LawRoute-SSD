import { useCallback, useEffect, useMemo, useState } from "react";

import { AuthContext } from "./authContext";
import { getMe } from "@/api/services/userService";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const loadUserProfile = useCallback(async () => {
    try {
      const response = await getMe();
      const nextUser = response?.data?.user ?? null;
      setUser(nextUser);
    } catch {
      setUser(null);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("lawroute:unauthorized", handleUnauthorized);
      return () => {
        window.removeEventListener("lawroute:unauthorized", handleUnauthorized);
      };
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      userId: user?.id ?? null,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user && user.role),
      user,
      signOut,
      setUser,
      refreshAuth: loadUserProfile,
    }),
    [user, signOut, loadUserProfile],
  );

  if (isInitializing) {
    return null; // Or a loading spinner. Blocks rendering until auth state is known, preserving route guards.
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
