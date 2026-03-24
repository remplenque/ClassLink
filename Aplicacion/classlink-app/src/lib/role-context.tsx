"use client";
// ──────────────────────────────────────────────
// ClassLink – Global Role Context
// ──────────────────────────────────────────────
import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { Role, AppNotification } from "./types";
import { NOTIFICATIONS } from "./data";

interface RoleContextValue {
  role: Role;
  setRole: (r: Role) => void;
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("Estudiante");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const notifications = useMemo(
    () => NOTIFICATIONS.filter((n) => n.forRoles.includes(role)),
    [role]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read && !readIds.has(n.id)).length,
    [notifications, readIds]
  );

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => new Set(prev).add(id));
  }, []);

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

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
