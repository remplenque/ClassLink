"use client";
// ──────────────────────────────────────────────────────────
// DashboardEmpresa – Company home dashboard
// ──────────────────────────────────────────────────────────
// Shown when the active role is "Empresa".
//
// Layout (two-column on desktop):
//  Left (2/3):
//   - Welcome hero banner with "Buscar Talento" shortcut
//   - KPI stat grid (vacantes, empleados, perfiles, contratados)
//   - Top matching candidates with circular match score
//   - Active job openings list
//  Right (1/3):
//   - Company info card
//   - Notifications widget
//   - Quick navigation actions
// ──────────────────────────────────────────────────────────

import Link from "next/link";
import { PROFILES, TALENT_PROFILES, NOTIFICATIONS } from "@/lib/data";
import {
  Briefcase, Users, TrendingUp, Eye, Search, ArrowRight, Building2,
  Bell, Clock, ChevronRight, MessageSquare, Star, Globe,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";

export default function DashboardEmpresa() {
  // ── Data ───────────────────────────────────────────────
  const p = PROFILES.company;

  // Sort candidates by match score (highest first) and take the top 5
  const topMatches  = [...TALENT_PROFILES]
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
    .slice(0, 5);

  const recentNotifs = NOTIFICATIONS.slice(0, 4);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">

      {/* ── Hero Banner ───────────────────────────────── */}
      <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-violet-700 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden animate-fade-in-up">
        <div className="absolute inset-0 opacity-10 hero-pattern" />

        <div className="relative flex flex-col md:flex-row md:items-center gap-5">
          <img
            src={p.avatar}
            alt={p.name}
            className="w-16 h-16 rounded-2xl border-2 border-white/30 object-cover shadow-lg"
          />
          <div className="flex-1">
            <p className="text-violet-100 text-sm font-medium mb-1">Panel Empresarial</p>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {p.companyName || p.name}
            </h1>
            <p className="text-white/70 text-sm mt-1">{p.industry}</p>
          </div>

          {/* CTA button — links to the talent directory */}
          <Link
            href="/talent"
            className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/30 active:bg-white/40 transition-colors btn-press"
          >
            <Search size={16} /> Buscar Talento
          </Link>
        </div>
      </div>

      {/* ── KPI Stat Cards ────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Vacantes Abiertas"
          value={p.openPositions ?? 3}
          icon={<Briefcase size={20} className="text-violet-500" />}
          bg="bg-violet-50"
          delay={1}
        />
        <StatCard
          label="Empleados"
          value={p.employeeCount ?? "250+"}
          icon={<Users size={20} className="text-cyan-500" />}
          bg="bg-cyan-50"
          delay={2}
        />
        <StatCard
          label="Perfiles Vistos"
          value={156}
          icon={<Eye size={20} className="text-emerald-500" />}
          bg="bg-emerald-50"
          delay={3}
        />
        <StatCard
          label="Contratados"
          value={3}
          icon={<TrendingUp size={20} className="text-amber-500" />}
          bg="bg-amber-50"
          delay={4}
        />
      </div>

      {/* ── Main two-column grid ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ═════ Left column (2/3) ═════ */}
        <div className="lg:col-span-2 space-y-5">

          {/* Top matching candidates */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 animate-fade-in-up stagger-2">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-base">Mejores Candidatos</h3>
              <Link
                href="/talent"
                className="text-xs text-violet-600 font-semibold hover:underline flex items-center gap-1"
              >
                Ver todos <ChevronRight size={12} />
              </Link>
            </div>

            <div className="space-y-3">
              {topMatches.map((t, i) => (
                <div
                  key={t.id}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl border border-slate-100
                    hover:border-violet-200 hover:bg-violet-50/30
                    transition-all card-interactive
                    animate-fade-in-up stagger-${Math.min(i + 1, 6)}
                  `}
                >
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.title} — {t.specialty}</p>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {t.skills.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Circular match score indicator (SVG donut) */}
                  <div className="text-right shrink-0">
                    <div className="relative w-14 h-14">
                      <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                        {/* Background track */}
                        <path
                          d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="#e2e8f0" strokeWidth="3"
                        />
                        {/* Filled arc — strokeDasharray tricks: first value = % out of 100 */}
                        <path
                          d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="#8b5cf6" strokeWidth="3"
                          strokeDasharray={`${t.matchScore}, 100`}
                        />
                      </svg>
                      {/* Percentage label centred inside the donut */}
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-violet-600">
                        {t.matchScore}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active job openings */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 animate-fade-in-up stagger-3">
            <h3 className="font-bold text-base mb-4">Vacantes Activas</h3>
            <div className="space-y-3">
              {[
                { title: "Pasante de Automatización", apps: 12, dept: "Ingeniería"    },
                { title: "Técnico Electricista Jr.",   apps:  8, dept: "Mantenimiento" },
                { title: "Asistente de Soldadura",     apps:  5, dept: "Taller"        },
              ].map((v, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-violet-100 hover:bg-violet-50/20 transition-all"
                >
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

        {/* ═════ Right sidebar (1/3) ═════ */}
        <div className="space-y-5">

          {/* Company info */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 animate-fade-in-up stagger-2">
            <h3 className="font-bold text-sm mb-4">Tu Empresa</h3>
            <div className="space-y-3">
              {[
                { icon: <Building2 size={15} className="text-slate-400" />, label: "Industria", value: p.industry },
                { icon: <Users     size={15} className="text-slate-400" />, label: "Empleados", value: p.employeeCount },
                { icon: <Globe     size={15} className="text-slate-400" />, label: "Web",       value: p.website },
              ].map((item) => item.value && (
                <div key={item.label} className="flex items-center gap-3">
                  {item.icon}
                  <div>
                    <p className="text-[11px] text-slate-400">{item.label}</p>
                    <p className="text-sm font-medium text-slate-700">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 animate-fade-in-up stagger-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-slate-500" />
                <span className="font-bold text-sm">Notificaciones</span>
              </div>
              <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold">
                {recentNotifs.length}
              </span>
            </div>
            <div className="space-y-2.5">
              {recentNotifs.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-lg text-xs ${
                    n.read
                      ? "bg-slate-50/50"
                      : "bg-violet-50/50 border border-violet-100/50"
                  }`}
                >
                  <p className="font-semibold text-slate-700 mb-0.5">{n.title}</p>
                  <p className="text-slate-500">{n.description.substring(0, 50)}…</p>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <Clock size={9} /> {n.time}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 animate-fade-in-up stagger-4">
            <h3 className="font-bold text-sm mb-4">Acciones</h3>
            <div className="space-y-1">
              {[
                { href: "/talent",   icon: <Search        size={16} className="text-violet-500" />, bg: "bg-violet-50", label: "Buscar Talento" },
                { href: "/profile",  icon: <Building2     size={16} className="text-cyan-500" />,   bg: "bg-cyan-50",   label: "Editar Perfil"  },
                { href: "/messages", icon: <MessageSquare size={16} className="text-emerald-500" />, bg: "bg-emerald-50", label: "Mensajes"      },
                { href: "/muro",     icon: <Star          size={16} className="text-amber-500" />,   bg: "bg-amber-50",  label: "El Muro"       },
              ].map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50/80 transition-colors group"
                >
                  <div className={`w-9 h-9 ${a.bg} rounded-lg flex items-center justify-center shrink-0`}>
                    {a.icon}
                  </div>
                  <span className="text-sm font-semibold flex-1">{a.label}</span>
                  <ArrowRight
                    size={14}
                    className="text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
