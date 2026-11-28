"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";
import { User } from "./types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: (isRetry?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Last known profile. Pages render from it immediately while /users/me revalidates in the
// background, so a cold backend no longer puts a spinner in front of every screen.
const USER_CACHE_KEY = "lb_user_cache";

function readCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function writeCachedUser(u: User | null) {
  try {
    if (u) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_CACHE_KEY);
  } catch {
    /* storage unavailable: just skip caching */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async (isRetry = false) => {
    try {
      if (!api.getToken()) {
        setUser(null);
        writeCachedUser(null);
        return;
      }
      const me = await api.getMe();
      setUser(me);
      writeCachedUser(me);
    } catch {
      if (!api.getToken()) {
        // The API client already dropped the token (401): really logged out.
        setUser(null);
        writeCachedUser(null);
      } else if (!isRetry) {
        // Slow / waking server, not a bad login: keep the cached user and try once more shortly.
        setTimeout(() => {
          void refreshUser(true);
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (api.getToken()) {
      const cached = readCachedUser();
      if (cached) {
        setUser(cached);
        setLoading(false);
      }
    }
    void refreshUser();
  }, []);

  // A 401 anywhere (expired / revoked token) must flip the UI to "logged out" right away.
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      writeCachedUser(null);
    };
    window.addEventListener("lb:unauthorized", onUnauthorized);
    return () => window.removeEventListener("lb:unauthorized", onUnauthorized);
  }, []);

  const login = async (email: string, pass: string) => {
    const params = new URLSearchParams();
    params.set("username", email);
    params.set("password", pass);
    const res = await api.login(params);
    if (typeof window !== "undefined" && res.verification_email_sent === false) {
      sessionStorage.setItem(
        "lb_otp_send_err",
        res.verification_email_error || "Failed to send verification email. Please click Resend code."
      );
    }
    await refreshUser();
  };

  const register = async (email: string, pass: string, name?: string) => {
    const regUser = await api.register({ email, password: pass, full_name: name });
    if (typeof window !== "undefined" && regUser.verification_email_sent === false) {
      sessionStorage.setItem(
        "lb_otp_send_err",
        regUser.verification_email_error || "Failed to send verification email. Please click Resend code."
      );
    }
    // After registration, automatically log in
    await login(email, pass);
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
    writeCachedUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
