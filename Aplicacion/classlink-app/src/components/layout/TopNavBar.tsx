"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRole } from "@/lib/role-context";
import type { Role } from "@/lib/types";
import { Bell, ChevronDown, Check, Settings, X } from "lucide-react";

const ROLES: Role[] = ["Estudiante", "Egresado", "Empresa", "Colegio"];
const ROLE_COLORS: Record<Role, string> = {
  Estudiante: "bg-cyan-500",
  Egresado: "bg-emerald-500",
  Empresa: "bg-violet-500",
  Colegio: "bg-amber-500",
};
const ROLE_EMOJI: Record<Role, string> = {
  Estudiante: "🎓",
  Egresado: "💼",
  Empresa: "🏢",
  Colegio: "🏫",
};

export default function TopNavBar() {
  const { role, setRole, notifications, unreadCount, markRead, markAllRead } = useRole();
  const [roleDdOpen, setRoleDdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const roleDdRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (roleDdRef.current && !roleDdRef.current.contains(e.target as Node)) setRoleDdOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
      <div className="flex justify-between items-center px-4 sm:px-6 h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg primary-gradient flex items-center justify-center">
            <span className="text-white font-black text-sm">CL</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 hidden sm:block">
            Class<span className="text-cyan-600">Link</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Role Switcher */}
          <div ref={roleDdRef} className="relative">
            <button
              onClick={() => setRoleDdOpen(!roleDdOpen)}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200/60 transition-colors"
            >
              <span className="text-sm">{ROLE_EMOJI[role]}</span>
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">{role}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {roleDdOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50">
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Simular Perfil</p>
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setRole(r); setRoleDdOpen(false); }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2.5 text-sm transition-colors ${r === role ? "bg-cyan-50 text-cyan-700 font-semibold" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    <span>{ROLE_EMOJI[r]}</span>
                    <div className={`w-2 h-2 rounded-full ${ROLE_COLORS[r]}`} />
                    {r}
                    {r === role && <Check size={14} className="ml-auto text-cyan-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 hover:bg-slate-100 rounded-full transition-all"
            >
              <Bell size={20} className="text-slate-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 max-h-96 overflow-auto">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-500">Notificaciones</p>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-bold text-cyan-600 hover:underline">Marcar todo leído</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">Sin notificaciones</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`w-full text-left px-4 py-3 flex gap-3 transition-colors hover:bg-slate-50 ${n.read ? "opacity-50" : ""}`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? "bg-slate-300" : "bg-red-500"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{n.title}</p>
                        <p className="text-xs text-slate-500 truncate">{n.description}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Avatar */}
          <Link href="/profile" className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 overflow-hidden ring-2 ring-white shadow-sm flex items-center justify-center text-white font-bold text-xs">
            AM
          </Link>
        </div>
      </div>
    </nav>
  );
}
