"use client";
// ──────────────────────────────────────────────────────────
// ClassLink – Authentication Context
// ──────────────────────────────────────────────────────────
// Provides a simple session-based auth layer for the prototype.
// In production this would be replaced with a real backend
// (e.g. NextAuth.js, Supabase Auth, or a custom JWT flow).
//
// What it manages:
//  user         – the logged-in user object, or null
//  isLoading    – true on first mount while reading localStorage
//  login()      – validates credentials against MOCK_USERS
//  logout()     – clears the session
//
// Session persistence:
//  The logged-in user is stored in localStorage under the key
//  "cl_session" so the session survives page refreshes.
//  On mount the context reads that key and rehydrates state.
// ──────────────────────────────────────────────────────────

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Role } from "./types";

// ── Shapes ────────────────────────────────────────────────

export interface AuthUser {
  id:     string;
  name:   string;
  email:  string;
  role:   Role;
  avatar: string;
}

interface AuthContextValue {
  user:      AuthUser | null;
  isLoading: boolean;
  /** Returns true on success, false on wrong credentials */
  login:  (email: string, password: string) => boolean;
  logout: () => void;
}

// ── Mock credentials database ─────────────────────────────
// Each entry has a plain-text password (fine for a prototype;
// use bcrypt + server-side validation in production).

const MOCK_USERS: Array<AuthUser & { password: string }> = [
  {
    id:       "u-student",
    name:     "Alejandro Mendoza",
    email:    "alejandro@ctp.cr",
    password: "Test1234",
    role:     "Estudiante",
    avatar:   "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face",
  },
  {
    id:       "u-company",
    name:     "Tech Solutions S.A.",
    email:    "rrhh@techsolutions.cr",
    password: "Empresa2024",
    role:     "Empresa",
    avatar:   "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop",
  },
  {
    id:       "u-school",
    name:     "CTP Don Bosco",
    email:    "admin@ctpdonbosco.ed.cr",
    password: "Colegio2024",
    role:     "Colegio",
    avatar:   "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=100&h=100&fit=crop",
  },
  {
    id:       "u-grad",
    name:     "María Rodríguez",
    email:    "maria@alumni.cr",
    password: "Alumni2024",
    role:     "Egresado",
    avatar:   "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=face",
  },
];

const SESSION_KEY = "cl_session";

// ── Context ───────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate session from localStorage on first render
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Try to log in with the given credentials.
   * Returns true if a matching user was found, false otherwise.
   */
  const login = useCallback((email: string, password: string): boolean => {
    const match = MOCK_USERS.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
    );
    if (!match) return false;

    // Strip password before storing
    const { password: _, ...safeUser } = match;
    setUser(safeUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    return true;
  }, []);

  /** Clear session from state and localStorage */
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Consumer hook ─────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// ── Exported mock users (for the login hint UI) ───────────
export { MOCK_USERS };
