"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/lib/role-context";
import type { Role } from "@/lib/types";
import { LayoutDashboard, Newspaper, Users, MessageCircle, User, Settings } from "lucide-react";

const LINKS = [
  { path: "/muro", label: "El Muro", icon: Newspaper, visibleFor: ["Estudiante", "Egresado", "Empresa", "Colegio"] as Role[] },
  { path: "/talent", label: "Talento", icon: Users, visibleFor: ["Estudiante", "Egresado", "Empresa", "Colegio"] as Role[] },
  { path: "/", label: "Dashboard", icon: LayoutDashboard, visibleFor: ["Estudiante", "Egresado", "Empresa", "Colegio"] as Role[] },
  { path: "/messages", label: "Mensajes", icon: MessageCircle, visibleFor: ["Estudiante", "Egresado", "Empresa", "Colegio"] as Role[] },
  { path: "/profile", label: "Mi Perfil", icon: User, visibleFor: ["Estudiante", "Egresado", "Empresa", "Colegio"] as Role[] },
];

export default function SideNavBar() {
  const pathname = usePathname();
  const { role, unreadCount } = useRole();
  const filtered = LINKS.filter((l) => l.visibleFor.includes(role));

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 hidden lg:flex flex-col bg-white border-r border-slate-200/60 pt-20 z-40">
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {filtered.map((link) => {
          const isActive = pathname === link.path;
          const IconComp = link.icon;
          return (
            <Link
              key={link.path}
              href={link.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-[13px] font-medium ${
                isActive
                  ? "text-cyan-700 bg-cyan-50 font-semibold"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span className="relative shrink-0">
                <IconComp size={20} strokeWidth={isActive ? 2 : 1.5} />
                {link.path === "/messages" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-4 border-t border-slate-100 pt-2">
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all text-[13px] font-medium"
        >
          <Settings size={18} strokeWidth={1.5} />
          <span>Configuracion</span>
        </Link>
      </div>
    </aside>
  );
}
