"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, clearAuthToken, getAuthToken, setAuthToken } from "@/lib/api";

export interface UserSession {
  user_id: number;
  email: string;
  full_name: string;
  role: "STUDENT" | "MENTOR" | "ADMIN";
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserSession>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = getAuthToken();
    const savedUserStr =
      localStorage.getItem("eduintern_user") || localStorage.getItem("simms_user");

    if (savedToken && savedUserStr) {
      try {
        const parsedUser = JSON.parse(savedUserStr);
        setToken(savedToken);
        setUser(parsedUser);
      } catch {
        clearAuthToken();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<UserSession> => {
    setIsLoading(true);
    try {
      const resp = await api.login({ email, password });
      const sessionUser: UserSession = {
        user_id: resp.user_id,
        email: resp.email,
        full_name: resp.full_name,
        role: resp.role,
      };

      setAuthToken(resp.access_token);
      localStorage.setItem("eduintern_user", JSON.stringify(sessionUser));
      localStorage.setItem("simms_user", JSON.stringify(sessionUser));
      setToken(resp.access_token);
      setUser(sessionUser);

      return sessionUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
    setToken(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
