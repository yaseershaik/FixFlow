"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isDemo: boolean;
  overdueCount: number;
  setOverdueCount: (count: number) => void;
  mutateUser: (user: AuthUser | null) => void;
  refreshStats: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isDemo: false,
  overdueCount: 0,
  setOverdueCount: () => {},
  mutateUser: () => {},
  refreshStats: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [overdueCount, setOverdueCount] = useState(0);

  const isDemo = user?.email === "demo@fixflow.app";

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch("/api/issues/stats");
      if (res.ok) {
        const data = await res.json();
        if (typeof data?.data?.overdueCount === "number") {
          setOverdueCount(data.data.overdueCount);
        }
      }
    } catch {
      // Non-critical, ignore
    }
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data?.data?.user) {
          setUser(data.data.user);
        } else if (data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (user) {
      refreshStats();
    } else {
      setOverdueCount(0);
    }
  }, [user, refreshStats]);

  // Listen to global event when issues are updated (created, resolved, deleted)
  useEffect(() => {
    const handleIssuesChanged = () => {
      if (user) refreshStats();
    };
    window.addEventListener("fixflow:issues-updated", handleIssuesChanged);
    return () => {
      window.removeEventListener("fixflow:issues-updated", handleIssuesChanged);
    };
  }, [user, refreshStats]);

  const mutateUser = useCallback((newUser: AuthUser | null) => {
    setUser(newUser);
    if (!newUser) {
      setOverdueCount(0);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
    setOverdueCount(0);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemo,
        overdueCount,
        setOverdueCount,
        mutateUser,
        refreshStats,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
