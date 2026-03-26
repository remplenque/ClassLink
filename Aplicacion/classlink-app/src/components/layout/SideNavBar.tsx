"use client";
// ──────────────────────────────────────────────────────────
// SideNavBar – Desktop left sidebar navigation
// ──────────────────────────────────────────────────────────
// Visible only on large screens (lg: breakpoint, ≥1024px).
// Fixed to the left edge, starts below the TopNavBar (pt-20).
// Shows navigation links filtered by the current role.
//
// Active link styling:
//  - Cyan text + background highlight
//  - Left accent bar via border-l-2 + ring on the icon
// ──────────────────────────────────────────────────────────

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/lib/role-context";
import type { Role } from "@/lib/types";
import {
  LayoutDashboard, Newspaper, Users, MessageCircle, User, Settings,
} from "lucide-react";

// ── Navigation Link Definition ────────────────────────────

/**
 * A nav link entry.
 * visibleFor controls which roles see this link —
 * currently all links are shown to every role, but the
 * field is kept for future role-specific navigation.
 */
const LINKS = [
  {
    path: "/muro",
    label: "El Muro",
    icon: Newspaper,
    visibleFor: ["Estudiante", "Egresado", "Empresa", "Colegio"] as Role[],
  },
  {
    path: "/talent",
    label: "Talento",
    icon: Users,
    visibleFor: ["Estudiante", "Egresado", "Empresa", "Colegio"] as Role[],
  },
  {
    path: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    visibleFor: ["Estudiante", "Egresado", "Empresa", "Colegio"] as Role[],
  },
  {
    path: "/messages",
    label: "Mensajes",
    icon: MessageCircle,
    visibleFor: ["Estudiante", "Egresado", "Empresa", "Colegio"] as Role[],
  },
  {
    path: "/profile",
    label: "Mi Perfil",
    icon: User,
    visibleFor: ["Estudiante", "Egresado", "Empresa", "Colegio"] as Role[],
  },
];

// ── Component ─────────────────────────────────────────────

export default function SideNavBar() {
  // Determines which link gets the active style
  const pathname = usePathname();
  // role filters links; unreadCount drives the badge on Messages
  const { role, unreadCount } = useRole();

  // Only render links that are configured for the current role
  const filtered = LINKS.filter((l) => l.visibleFor.includes(role));

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 hidden lg:flex flex-col bg-white border-r border-slate-200/60 pt-20 z-40">

      {/* ── Navigation Links ── */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {filtered.map((link, idx) => {
          const isActive   = pathname === link.path;
          const IconComp   = link.icon;

          return (
            <Link
              key={link.path}
              href={link.path}
              // Stagger slide-in animation on mount — each item delayed by index
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-200 text-[13px] font-medium
                animate-slide-in-left stagger-${Math.min(idx + 1, 6)}
                ${isActive
                  ? "text-cyan-700 bg-cyan-50/80 font-semibold border-l-2 border-cyan-500 pl-[10px]"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-l-2 border-transparent"
                }
              `}
            >
              {/* Icon wrapper — holds the unread badge for the Messages link */}
              <span className="relative shrink-0">
                <IconComp
                  size={20}
                  strokeWidth={isActive ? 2.25 : 1.5}
                  // Active icon gets a subtle cyan tint
                  className={isActive ? "text-cyan-600" : ""}
                />
                {/* Unread messages indicator dot */}
                {link.path === "/messages" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse-dot" />
                )}
              </span>

              <span>{link.label}</span>

              {/* Unread count badge on the Messages link */}
              {link.path === "/messages" && unreadCount > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Settings Footer ── */}
      <div className="px-3 pb-5 border-t border-slate-100 pt-3">
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-200 text-[13px] font-medium"
        >
          <Settings size={18} strokeWidth={1.5} />
          <span>Configuración</span>
        </Link>
      </div>
    </aside>
  );
}
