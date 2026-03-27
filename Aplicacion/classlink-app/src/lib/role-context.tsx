"use client";
// ──────────────────────────────────────────────────────────
// ClassLink – Global Role Context
// ──────────────────────────────────────────────────────────
// Provides a React Context that makes the current simulated
// role available throughout the entire component tree.
//
// What it manages:
//  1. role      – the currently active user role
//  2. setRole   – function to switch to a different role
//  3. notifications – list of notifications filtered to the active role
//  4. unreadCount   – derived count of unread notifications
//  5. markRead      – marks a single notification as read
//  6. markAllRead   – marks all notifications as read
//
// Architecture note:
//  "Read" state for notifications is stored locally in a Set<string>
//  of IDs rather than mutating the NOTIFICATIONS array. This keeps
//  the mock data immutable and avoids bugs when switching roles.
//
// Usage:
//  1. Wrap the app root in <RoleProvider> (done in app/layout.tsx)
//  2. Call `const { role, setRole, ... } = useRole()` in any component
// ──────────────────────────────────────────────────────────

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { Role, AppNotification } from "./types";
import { NOTIFICATIONS } from "./data";
import { useAuth } from "./auth-context";

// ── Context Shape ─────────────────────────────────────────

interface RoleContextValue {
  /** Currently active role */
  role: Role;
  /** Switch to a different role — updates the whole UI */
  setRole: (r: Role) => void;
  /** Notifications visible to the current role (pre-filtered) */
  notifications: AppNotification[];
  /** Number of notifications the user hasn't read yet */
  unreadCount: number;
  /** Mark a single notification as read by its ID */
  markRead: (id: string) => void;
  /** Mark every notification as read at once */
  markAllRead: () => void;
}

// ── Context Instance ──────────────────────────────────────

// Initialised to undefined so the useRole hook can detect misuse
// (calling it outside of a <RoleProvider>).
const RoleContext = createContext<RoleContextValue | undefined>(undefined);

// ── Provider Component ────────────────────────────────────

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Role is driven by the authenticated user's account type
  const [role, setRole] = useState<Role>(user?.role ?? "Estudiante");

  // Keep role in sync whenever the logged-in user changes (login / logout)
  useEffect(() => {
    if (user) setRole(user.role);
  }, [user]);

  // Set of notification IDs that the user has read in this session.
  // Using a Set for O(1) membership checks.
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  /**
   * Filter the global NOTIFICATIONS list to only those relevant to the
   * current role. Recalculated whenever the role changes.
   */
  const notifications = useMemo(
    () => NOTIFICATIONS.filter((n) => n.forRoles.includes(role)),
    [role]
  );

  /**
   * Count notifications that are neither server-marked as read
   * nor locally marked as read by the user in this session.
   */
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read && !readIds.has(n.id)).length,
    [notifications, readIds]
  );

  /** Add a single ID to the local read set */
  const markRead = useCallback((id: string) => {
    setReadIds((prev) => new Set(prev).add(id));
  }, []);

  /** Add every notification ID to the local read set */
  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      NOTIFICATIONS.forEach((n) => next.add(n.id));
      return next;
    });
  }, []);

  return (
    <RoleContext.Provider
      value={{ role, setRole, notifications, unreadCount, markRead, markAllRead }}
    >
      {children}
    </RoleContext.Provider>
  );
}

// ── Consumer Hook ─────────────────────────────────────────

/**
 * Access role context in any client component.
 * Throws a clear error if called outside of <RoleProvider>.
 */
export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
