"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/lib/role-context";
import { LayoutDashboard, Newspaper, Users, MessageCircle, User } from "lucide-react";

const links = [
  { path: "/muro", label: "Muro", icon: Newspaper },
  { path: "/talent", label: "Talento", icon: Users },
  { path: "/", label: "Home", icon: LayoutDashboard },
  { path: "/messages", label: "Chat", icon: MessageCircle },
  { path: "/profile", label: "Perfil", icon: User },
];

export default function BottomMobileNav() {
  const pathname = usePathname();
  const { unreadCount } = useRole();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pb-5 pt-2 bg-white/90 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
      {links.map((link) => {
        const isActive = pathname === link.path;
        const IconComp = link.icon;
        return (
          <Link
            key={link.path}
            href={link.path}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
              isActive ? "text-cyan-600" : "text-slate-400"
            }`}
          >
            <span className="relative">
              <IconComp size={22} strokeWidth={isActive ? 2.25 : 1.5} />
              {link.path === "/messages" && unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] flex items-center justify-center bg-red-500 text-white text-[8px] font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </span>
            <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
