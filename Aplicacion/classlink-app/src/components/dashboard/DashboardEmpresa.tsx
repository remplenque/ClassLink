"use client";
import Link from "next/link";
import { PROFILES, TALENT_PROFILES, NOTIFICATIONS, FEED_POSTS } from "@/lib/data";
import {
  Briefcase, Users, TrendingUp, Eye, Search, ArrowRight, Building2,
  Bell, Clock, ChevronRight, MessageSquare, Star, Globe
} from "lucide-react";

export default function DashboardEmpresa() {
  const p = PROFILES.company;
  const topMatches = TALENT_PROFILES.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0)).slice(0, 5);
  const recentNotifs = NOTIFICATIONS.slice(0, 4);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-violet-700 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}} />
        <div className="relative flex flex-col md:flex-row md:items-center gap-5">
          <img src={p.avatar} alt={p.name} className="w-16 h-16 rounded-2xl border-2 border-white/30 object-cover" />
          <div className="flex-1">
            <p className="text-violet-100 text-sm font-medium mb-1">Panel Empresarial</p>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{p.companyName || p.name}</h1>
            <p className="text-white/70 text-sm mt-1">{p.industry}</p>
          </div>
          <Link href="/talent" className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/30 transition-colors">
            <Search size={16} /> Buscar Talento
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Vacantes Abiertas", value: p.openPositions || 3, icon: <Briefcase size={20} className="text-violet-500" />, bg: "bg-violet-50" },
          { label: "Empleados", value: p.employeeCount || "250+", icon: <Users size={20} className="text-cyan-500" />, bg: "bg-cyan-50" },
          { label: "Perfiles Vistos", value: 156, icon: <Eye size={20} className="text-emerald-500" />, bg: "bg-emerald-50" },
          { label: "Contratados", value: 3, icon: <TrendingUp size={20} className="text-amber-500" />, bg: "bg-amber-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-200/60 hover:shadow-sm transition-shadow">
            <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>{s.icon}</div>
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Top matches */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-base">Mejores Candidatos</h3>
              <Link href="/talent" className="text-xs text-violet-600 font-semibold hover:underline flex items-center gap-1">Ver todos <ChevronRight size={12} /></Link>
            </div>
            <div className="space-y-3">
              {topMatches.map((t) => (
                <div key={t.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all">
                  <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.title} - {t.specialty}</p>
                    <div className="flex gap-1.5 mt-1.5">
                      {t.skills.slice(0, 3).map((s) => (
                        <span key={s} className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="relative w-14 h-14">
                      <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                        <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                        <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray={`${t.matchScore}, 100`} />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-violet-600">{t.matchScore}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active positions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60">
            <h3 className="font-bold text-base mb-4">Vacantes Activas</h3>
            <div className="space-y-3">
              {[
                { title: "Pasante de Automatizacion", apps: 12, dept: "Ingenieria" },
                { title: "Tecnico Electricista Jr.", apps: 8, dept: "Mantenimiento" },
                { title: "Asistente de Soldadura", apps: 5, dept: "Taller" },
              ].map((v, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100">
                  <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
                    <Briefcase size={18} className="text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{v.title}</p>
                    <p className="text-xs text-slate-500">{v.dept}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-violet-600">{v.apps}</p>
                    <p className="text-[10px] text-slate-400">aplicaciones</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Company info */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60">
            <h3 className="font-bold text-sm mb-4">Tu Empresa</h3>
            <div className="space-y-3">
              {[
                { icon: <Building2 size={15} className="text-slate-400" />, label: "Industria", value: p.industry },
                { icon: <Users size={15} className="text-slate-400" />, label: "Empleados", value: p.employeeCount },
                { icon: <Globe size={15} className="text-slate-400" />, label: "Web", value: p.website },
              ].map((item) => item.value && (
                <div key={item.label} className="flex items-center gap-3">
                  {item.icon}
                  <div><p className="text-[11px] text-slate-400">{item.label}</p><p className="text-sm font-medium text-slate-700">{item.value}</p></div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Bell size={16} className="text-slate-500" /><span className="font-bold text-sm">Notificaciones</span></div>
              <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold">{recentNotifs.length}</span>
            </div>
            <div className="space-y-2.5">
              {recentNotifs.map((n) => (
                <div key={n.id} className={`p-3 rounded-lg text-xs ${n.read ? "bg-slate-50/50" : "bg-violet-50/50 border border-violet-100/50"}`}>
                  <p className="font-semibold text-slate-700 mb-0.5">{n.title}</p>
                  <p className="text-slate-500">{n.description.substring(0, 50)}...</p>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Clock size={9} />{n.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60">
            <h3 className="font-bold text-sm mb-4">Acciones</h3>
            <div className="space-y-2">
              {[
                { href: "/talent", icon: <Search size={16} className="text-violet-500" />, bg: "bg-violet-50", label: "Buscar Talento" },
                { href: "/profile", icon: <Building2 size={16} className="text-cyan-500" />, bg: "bg-cyan-50", label: "Editar Perfil" },
                { href: "/messages", icon: <MessageSquare size={16} className="text-emerald-500" />, bg: "bg-emerald-50", label: "Mensajes" },
                { href: "/muro", icon: <Star size={16} className="text-amber-500" />, bg: "bg-amber-50", label: "El Muro" },
              ].map((a) => (
                <Link key={a.label} href={a.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className={`w-9 h-9 ${a.bg} rounded-lg flex items-center justify-center shrink-0`}>{a.icon}</div>
                  <span className="text-sm font-semibold flex-1">{a.label}</span>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-violet-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
