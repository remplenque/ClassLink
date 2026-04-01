"use client";
// ──────────────────────────────────────────────────────────
// SideNavBar – Desktop left sidebar navigation
// ──────────────────────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/lib/role-context";
import type { Role } from "@/lib/types";
import ConfigModal from "@/components/ui/ConfigModal";
import {
  LayoutDashboard, Newspaper, Users, MessageCircle, User, Settings, Briefcase,
} from "lucide-react";

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
    path: "/empleos",
    label: "Empleos",
    icon: Briefcase,
    visibleFor: ["Estudiante", "Egresado", "Empresa"] as Role[],
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

export default function SideNavBar() {
  const pathname             = usePathname();
  const { role, unreadCount } = useRole();
  const [configOpen, setConfigOpen] = useState(false);

  const filtered = LINKS.filter((l) => l.visibleFor.includes(role));

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-56 hidden lg:flex flex-col bg-white border-r border-slate-200/60 pt-20 z-40">

        {/* ── Navigation Links ── */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {filtered.map((link, idx) => {
            const isActive = pathname === link.path;
            const IconComp = link.icon;

            return (
              <Link
                key={link.path}
                href={link.path}
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
                <span className="relative shrink-0">
                  <IconComp
                    size={20}
                    strokeWidth={isActive ? 2.25 : 1.5}
                    className={isActive ? "text-cyan-600" : ""}
                  />
                  {link.path === "/messages" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse-dot" />
                  )}
                </span>

                <span>{link.label}</span>

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
          <button
            onClick={() => setConfigOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-200 text-[13px] font-medium"
          >
            <Settings size={18} strokeWidth={1.5} />
            <span>Configuración</span>
          </button>
        </div>
      </aside>

      {/* Config modal rendered outside the sidebar so it covers full screen */}
      <ConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />
    </>
  );
}
