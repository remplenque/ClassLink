"use client";
// ──────────────────────────────────────────────────────────
// DashboardColegio – School admin home dashboard
// ──────────────────────────────────────────────────────────
// Shown when the active role is "Colegio".
//
// Layout (two-column on desktop):
//  Left (2/3):
//   - Welcome hero banner with employability % and alliance count
//   - KPI stat grid (empleabilidad, estudiantes, alianzas, prácticas)
//   - Urgent requests alert section (red, conditional)
//   - Full pending request queue
//   - Specialty placement performance bars
//  Right (1/3):
//   - Employability highlight card (gradient)
//   - Notifications widget
//   - Quick navigation actions
// ──────────────────────────────────────────────────────────

import Link from "next/link";
import { PROFILES, QUEUE_REQUESTS, NOTIFICATIONS } from "@/lib/data";
import {
  GraduationCap, Users, Handshake, TrendingUp, FileText, ArrowRight,
  Bell, Clock, ChevronRight, Briefcase, Search, MessageSquare, Building2,
  AlertTriangle,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";

export default function DashboardColegio() {
  // ── Data ───────────────────────────────────────────────
  const p            = PROFILES.school;
  const recentNotifs = NOTIFICATIONS.slice(0, 4);

  // Separate urgent from normal requests for the alert section
  const urgentRequests = QUEUE_REQUESTS.filter((r) => r.urgent);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">

      {/* ── Hero Banner ───────────────────────────────── */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-700 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden animate-fade-in-up">
        <div className="absolute inset-0 opacity-10 hero-pattern" />

        <div className="relative flex flex-col md:flex-row md:items-center gap-5">
          <img
            src={p.avatar}
            alt={p.name}
            className="w-16 h-16 rounded-2xl border-2 border-white/30 object-cover shadow-lg"
          />
          <div className="flex-1">
            <p className="text-amber-100 text-sm font-medium mb-1">Panel del Centro Educativo</p>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {p.schoolName || p.name}
            </h1>
            <p className="text-white/70 text-sm mt-1">{p.location}</p>
          </div>

          {/* Two key metrics displayed right on the banner */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-extrabold">{p.employabilityRate}%</p>
              <p className="text-xs text-amber-100">empleabilidad</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-extrabold">{p.allianceCount}</p>
              <p className="text-xs text-amber-100">alianzas</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Stat Cards ────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Empleabilidad"
          value={`${p.employabilityRate}%`}
          icon={<TrendingUp  size={20} className="text-emerald-500" />}
          bg="bg-emerald-50"
          delay={1}
        />
        <StatCard
          label="Estudiantes"
          value={p.studentCount}
          icon={<GraduationCap size={20} className="text-cyan-500" />}
          bg="bg-cyan-50"
          delay={2}
        />
        <StatCard
          label="Alianzas"
          value={p.allianceCount}
          icon={<Handshake   size={20} className="text-violet-500" />}
          bg="bg-violet-50"
          delay={3}
        />
        <StatCard
          label="Prácticas Activas"
          value={28}
          icon={<Briefcase   size={20} className="text-amber-500" />}
          bg="bg-amber-50"
          delay={4}
        />
      </div>

      {/* ── Main two-column grid ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ═════ Left column (2/3) ═════ */}
        <div className="lg:col-span-2 space-y-5">

          {/* Urgent requests alert — only rendered if urgent items exist */}
          {urgentRequests.length > 0 && (
            <div className="bg-red-50/60 rounded-2xl p-5 border border-red-200/60 animate-scale-in">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-red-500" />
                <h3 className="font-bold text-sm text-red-700">Solicitudes Urgentes</h3>
                {/* Count badge */}
                <span className="ml-auto text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                  {urgentRequests.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {urgentRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-xl p-4 flex items-center gap-3 border border-red-100 hover:border-red-200 transition-colors"
                  >
                    <FileText size={16} className="text-red-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold">{req.title}</p>
                      <p className="text-xs text-slate-500">{req.author} — {req.date}</p>
                    </div>
                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold shrink-0">
                      Urgente
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full pending request queue */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 animate-fade-in-up stagger-2">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-base">Cola de Solicitudes</h3>
              <span className="text-xs text-slate-400 font-semibold bg-slate-100 px-2.5 py-1 rounded-full">
                {QUEUE_REQUESTS.length} pendientes
              </span>
            </div>

            <div className="space-y-3">
              {QUEUE_REQUESTS.map((req, i) => (
                <div
                  key={req.id}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl border transition-all
                    animate-fade-in-up stagger-${Math.min(i + 1, 6)}
                    ${req.urgent
                      ? "border-red-200/60 hover:bg-red-50/30"
                      : "border-slate-100 hover:bg-slate-50/60"
                    }
                  `}
                >
                  {/* Type icon pill */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      req.urgent ? "bg-red-50" : "bg-amber-50"
                    }`}
                  >
                    <FileText
                      size={18}
                      className={req.urgent ? "text-red-500" : "text-amber-500"}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{req.title}</p>
                    <p className="text-xs text-slate-500">{req.author} — {req.date}</p>
                  </div>

                  {req.urgent && (
                    <span className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-full font-bold shrink-0">
                      Urgente
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Specialty placement performance */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 animate-fade-in-up stagger-3">
            <h3 className="font-bold text-base mb-5">Rendimiento por Especialidad</h3>
            <div className="space-y-4">
              {[
                { name: "Mecatrónica",  students: 89, rate: 92 },
                { name: "Electricidad", students: 78, rate: 88 },
                { name: "Soldadura",    students: 65, rate: 85 },
                { name: "Ebanistería",  students: 42, rate: 78 },
              ].map((spec, i) => (
                <div key={spec.name} className={`animate-fade-in-up stagger-${i + 1}`}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold text-slate-700">{spec.name}</span>
                    <span className="text-slate-500">
                      {spec.students} estudiantes —{" "}
                      <span className="font-bold text-emerald-600">{spec.rate}%</span> colocación
                    </span>
                  </div>
                  {/* Animated progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-1000 ease-out"
                      style={{ width: `${spec.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═════ Right sidebar (1/3) ═════ */}
        <div className="space-y-5">

          {/* Employability highlight card */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white animate-fade-in-up stagger-1">
            <TrendingUp size={28} className="mb-2 opacity-80" />
            <p className="text-3xl font-extrabold">{p.employabilityRate}%</p>
            <p className="text-sm opacity-90 mt-1">Tasa de Empleabilidad</p>
            <p className="text-xs opacity-70 mt-0.5">+4.2% vs. semestre anterior</p>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 animate-fade-in-up stagger-2">
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
                      : "bg-amber-50/50 border border-amber-100/50"
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
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 animate-fade-in-up stagger-3">
            <h3 className="font-bold text-sm mb-4">Acciones</h3>
            <div className="space-y-1">
              {[
                { href: "/talent",   icon: <Search        size={16} className="text-amber-500" />,   bg: "bg-amber-50",   label: "Explorar Talento"   },
                { href: "/profile",  icon: <Building2     size={16} className="text-cyan-500" />,     bg: "bg-cyan-50",    label: "Perfil del Centro"  },
                { href: "/messages", icon: <MessageSquare size={16} className="text-emerald-500" />,  bg: "bg-emerald-50", label: "Mensajes"            },
                { href: "/muro",     icon: <GraduationCap size={16} className="text-violet-500" />,   bg: "bg-violet-50",  label: "El Muro"             },
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
                    className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all"
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
