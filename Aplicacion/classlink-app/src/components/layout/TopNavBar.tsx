"use client";
// ──────────────────────────────────────────────────────────
// TopNavBar – Fixed top navigation bar
// ──────────────────────────────────────────────────────────
// Always visible (z-50, fixed). Contains:
//  1. ClassLink logo (links to dashboard)
//  2. Role switcher dropdown (demo only — simulates role switching)
//  3. Notifications bell with unread badge and panel
//  4. User avatar dropdown (profile link + logout)
// ──────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import Link        from "next/link";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/role-context";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/types";
import { Bell, ChevronDown, Check, X, LogOut, User as UserIcon } from "lucide-react";

// ── Constants ─────────────────────────────────────────────

const ROLES: Role[] = ["Estudiante", "Egresado", "Empresa", "Colegio"];

const ROLE_COLORS: Record<Role, string> = {
  Estudiante: "bg-cyan-500",
  Egresado:   "bg-emerald-500",
  Empresa:    "bg-violet-500",
  Colegio:    "bg-amber-500",
};

const ROLE_EMOJI: Record<Role, string> = {
  Estudiante: "🎓",
  Egresado:   "💼",
  Empresa:    "🏢",
  Colegio:    "🏫",
};

// ── Component ─────────────────────────────────────────────

export default function TopNavBar() {
  const { role, setRole, notifications, unreadCount, markRead, markAllRead } = useRole();
  const { user, logout } = useAuth();
  const router = useRouter();

  // Dropdown open states
  const [roleDdOpen,   setRoleDdOpen]   = useState(false);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [userDdOpen,   setUserDdOpen]   = useState(false);

  // Refs for click-outside detection
  const roleDdRef = useRef<HTMLDivElement>(null);
  const notifRef  = useRef<HTMLDivElement>(null);
  const userDdRef = useRef<HTMLDivElement>(null);

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (roleDdRef.current && !roleDdRef.current.contains(e.target as Node)) setRoleDdOpen(false);
      if (notifRef.current  && !notifRef.current.contains(e.target as Node))  setNotifOpen(false);
      if (userDdRef.current && !userDdRef.current.contains(e.target as Node)) setUserDdOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /** Log out and redirect to the login page */
  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // Derive avatar initials from the logged-in user's name
  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/85 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
      <div className="flex justify-between items-center px-4 sm:px-6 h-16">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg primary-gradient flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
            <span className="text-white font-black text-sm">CL</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 hidden sm:block">
            Class<span className="text-cyan-600">Link</span>
          </span>
        </Link>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-1.5 sm:gap-2">

          {/* ══ Role Switcher ══════════════════════════════ */}
          <div ref={roleDdRef} className="relative">
            <button
              onClick={() => { setRoleDdOpen(!roleDdOpen); setNotifOpen(false); setUserDdOpen(false); }}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 px-3 py-1.5 rounded-full border border-slate-200/70 transition-all duration-150"
            >
              <span className="text-sm">{ROLE_EMOJI[role]}</span>
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">{role}</span>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-200 ${roleDdOpen ? "rotate-180" : ""}`}
              />
            </button>

            {roleDdOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-slate-100/80 py-1.5 z-50 animate-fade-in-down">
                <p className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Simular Perfil
                </p>
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setRole(r); setRoleDdOpen(false); }}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center gap-2.5 text-sm transition-colors ${
                      r === role ? "bg-cyan-50 text-cyan-700 font-semibold" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-base">{ROLE_EMOJI[r]}</span>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${ROLE_COLORS[r]}`} />
                    <span className="flex-1">{r}</span>
                    {r === role && <Check size={14} className="text-cyan-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ══ Notifications ══════════════════════════════ */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setRoleDdOpen(false); setUserDdOpen(false); }}
              className="relative p-2 hover:bg-slate-100 active:bg-slate-200 rounded-full transition-all duration-150"
            >
              <Bell
                size={20}
                className={`text-slate-500 ${unreadCount > 0 ? "animate-ring" : ""}`}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full animate-pop-in shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-slate-100/80 z-50 max-h-96 overflow-hidden flex flex-col animate-fade-in-down">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
                  <p className="text-xs font-bold text-slate-700 tracking-wide">Notificaciones</p>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] font-bold text-cyan-600 hover:underline">
                        Marcar todo leído
                      </button>
                    )}
                    <button onClick={() => setNotifOpen(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                      <X size={13} className="text-slate-400" />
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto thin-scrollbar">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-10 text-center text-sm text-slate-400">Sin notificaciones</p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`w-full text-left px-4 py-3.5 flex gap-3 transition-colors hover:bg-slate-50/80 ${n.read ? "opacity-50" : ""}`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? "bg-slate-300" : "bg-red-500 animate-pulse-dot"}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{n.title}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{n.description}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ══ User Avatar Dropdown ═══════════════════════ */}
          <div ref={userDdRef} className="relative">
            <button
              onClick={() => { setUserDdOpen(!userDdOpen); setRoleDdOpen(false); setNotifOpen(false); }}
              className="flex items-center gap-2 group"
            >
              {/* Avatar circle — shows photo if available, else initials */}
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white shadow-sm group-hover:ring-cyan-200 transition-all overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </button>

            {/* User dropdown */}
            {userDdOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-slate-100/80 py-1.5 z-50 animate-fade-in-down">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                </div>

                {/* Profile link */}
                <Link
                  href="/profile"
                  onClick={() => setUserDdOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <UserIcon size={15} className="text-slate-400" />
                  Mi Perfil
                </Link>

                {/* Divider */}
                <div className="border-t border-slate-100 my-1" />

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} className="text-red-500" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
