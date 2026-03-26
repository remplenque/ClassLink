"use client";
// ──────────────────────────────────────────────────────────
// TopNavBar – Fixed top navigation bar
// ──────────────────────────────────────────────────────────
// Always visible at the top of the screen (z-50, fixed).
// Contains:
//  1. ClassLink logo (links to dashboard)
//  2. Role switcher dropdown (simulates different user roles)
//  3. Notifications bell with unread badge and panel
//  4. Avatar shortcut to /profile
//
// Dropdowns close when clicking outside their ref containers.
// ──────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRole } from "@/lib/role-context";
import type { Role } from "@/lib/types";
import { Bell, ChevronDown, Check, X } from "lucide-react";

// ── Constants ─────────────────────────────────────────────

/** All possible roles in declaration order for the switcher list */
const ROLES: Role[] = ["Estudiante", "Egresado", "Empresa", "Colegio"];

/**
 * Colour dot shown next to each role in the dropdown.
 * Each colour visually reinforces which role is active.
 */
const ROLE_COLORS: Record<Role, string> = {
  Estudiante: "bg-cyan-500",
  Egresado:   "bg-emerald-500",
  Empresa:    "bg-violet-500",
  Colegio:    "bg-amber-500",
};

/** Emoji icon representing each role — displayed in the switcher button */
const ROLE_EMOJI: Record<Role, string> = {
  Estudiante: "🎓",
  Egresado:   "💼",
  Empresa:    "🏢",
  Colegio:    "🏫",
};

// ── Component ─────────────────────────────────────────────

export default function TopNavBar() {
  // Pull current role and notification helpers from global context
  const { role, setRole, notifications, unreadCount, markRead, markAllRead } = useRole();

  // Dropdown open/close state
  const [roleDdOpen,  setRoleDdOpen]  = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);

  // Refs for click-outside detection
  const roleDdRef = useRef<HTMLDivElement>(null);
  const notifRef  = useRef<HTMLDivElement>(null);

  /**
   * Close any open dropdown when the user clicks outside its container.
   * Attaches a mousedown listener to the document on mount and cleans up on unmount.
   */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (roleDdRef.current && !roleDdRef.current.contains(e.target as Node))
        setRoleDdOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/85 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
      <div className="flex justify-between items-center px-4 sm:px-6 h-16">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* Gradient square with "CL" initials */}
          <div className="w-8 h-8 rounded-lg primary-gradient flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
            <span className="text-white font-black text-sm">CL</span>
          </div>
          {/* Word mark — hidden on mobile to save space */}
          <span className="text-lg font-bold tracking-tight text-slate-900 hidden sm:block">
            Class<span className="text-cyan-600">Link</span>
          </span>
        </Link>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-1.5 sm:gap-2">

          {/* ══ Role Switcher ══════════════════════════════ */}
          {/* Allows simulating different user roles without logging in/out */}
          <div ref={roleDdRef} className="relative">
            <button
              onClick={() => { setRoleDdOpen(!roleDdOpen); setNotifOpen(false); }}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 px-3 py-1.5 rounded-full border border-slate-200/70 transition-all duration-150"
            >
              <span className="text-sm">{ROLE_EMOJI[role]}</span>
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">{role}</span>
              {/* Chevron rotates when dropdown is open */}
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-200 ${roleDdOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown panel — slides down from the button */}
            {roleDdOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-slate-100/80 py-1.5 z-50 animate-fade-in-down">
                {/* Section label */}
                <p className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Simular Perfil
                </p>

                {/* One button per role */}
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setRole(r); setRoleDdOpen(false); }}
                    className={`
                      w-full text-left px-3.5 py-2.5 flex items-center gap-2.5 text-sm transition-colors
                      ${r === role
                        ? "bg-cyan-50 text-cyan-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50"
                      }
                    `}
                  >
                    {/* Emoji icon */}
                    <span className="text-base">{ROLE_EMOJI[r]}</span>
                    {/* Coloured dot — acts as a secondary visual cue */}
                    <div className={`w-2 h-2 rounded-full shrink-0 ${ROLE_COLORS[r]}`} />
                    <span className="flex-1">{r}</span>
                    {/* Check mark for currently active role */}
                    {r === role && <Check size={14} className="text-cyan-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ══ Notifications Bell ════════════════════════ */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setRoleDdOpen(false); }}
              className="relative p-2 hover:bg-slate-100 active:bg-slate-200 rounded-full transition-all duration-150"
            >
              {/* Bell icon — plays ring animation when there are unread items */}
              <Bell
                size={20}
                className={`text-slate-500 ${unreadCount > 0 ? "animate-ring" : ""}`}
              />

              {/* Unread count badge — elastic pop-in animation */}
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full animate-pop-in shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification panel — slides down when open */}
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-slate-100/80 z-50 max-h-96 overflow-hidden flex flex-col animate-fade-in-down">

                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
                  <p className="text-xs font-bold text-slate-700 tracking-wide">Notificaciones</p>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700 hover:underline"
                      >
                        Marcar todo leído
                      </button>
                    )}
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X size={13} className="text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Notification list — scrollable */}
                <div className="overflow-y-auto thin-scrollbar">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-10 text-center text-sm text-slate-400">
                      Sin notificaciones
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`
                          w-full text-left px-4 py-3.5 flex gap-3 transition-colors hover:bg-slate-50/80
                          ${n.read ? "opacity-50" : ""}
                        `}
                      >
                        {/* Read/unread indicator dot */}
                        <div
                          className={`
                            w-2 h-2 rounded-full mt-1.5 shrink-0
                            ${n.read ? "bg-slate-300" : "bg-red-500 animate-pulse-dot"}
                          `}
                        />
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

          {/* ══ Avatar ════════════════════════════════════ */}
          {/* Links directly to the profile page */}
          <Link
            href="/profile"
            className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white shadow-sm hover:ring-cyan-200 transition-all"
          >
            AM
          </Link>
        </div>
      </div>
    </nav>
  );
}
