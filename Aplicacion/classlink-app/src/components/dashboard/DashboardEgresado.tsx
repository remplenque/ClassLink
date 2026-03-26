"use client";
// ──────────────────────────────────────────────────────────
// DashboardEgresado – Alumni home dashboard
// ──────────────────────────────────────────────────────────
// Shown when the active role is "Egresado".
//
// Layout (two-column on desktop):
//  Left (2/3):
//   - Welcome hero banner with profile views and ranking
//   - KPI stat grid (vistas, mensajes, ranking, conexiones)
//   - Suggested actions grid (update profile, share, messages, CV)
//   - Recent feed activity
//   - Suggested connections
//  Right (1/3):
//   - Profile views highlight card (gradient)
//   - Notifications widget
//   - Skills snapshot
// ──────────────────────────────────────────────────────────

import Link from "next/link";
import { PROFILES, FEED_POSTS, NOTIFICATIONS, TALENT_PROFILES } from "@/lib/data";
import {
  Eye, Mail, Award, Edit, Share2, MessageCircle, Download, ArrowRight,
  Star, Users, Bell, Clock, ChevronRight,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";

export default function DashboardEgresado() {
  // ── Data ───────────────────────────────────────────────
  // Egresado profile reuses the student data for the mock
  const p            = PROFILES.student;
  const recentNotifs = NOTIFICATIONS.slice(0, 4);
  const recentPosts  = FEED_POSTS.slice(0, 3);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">

      {/* ── Hero Banner ───────────────────────────────── */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-700 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden animate-fade-in-up">
        <div className="absolute inset-0 opacity-10 hero-pattern" />

        <div className="relative flex flex-col md:flex-row md:items-center gap-5">
          <img
            src={p.avatar}
            alt={p.name}
            className="w-16 h-16 rounded-2xl border-2 border-white/30 object-cover shadow-lg"
          />
          <div className="flex-1">
            <p className="text-emerald-100 text-sm font-medium mb-1">Red Alumni</p>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Hola, {p.name.split(" ")[0]}
            </h1>
            <p className="text-white/70 text-sm mt-1">Egresado — {p.specialty}</p>
          </div>

          {/* Profile view count + ranking */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-extrabold">47</p>
              <p className="text-xs text-emerald-100">vistas</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-extrabold">#14</p>
              <p className="text-xs text-emerald-100">ranking</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Stat Cards ────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Vistas al Perfil"
          value="47"
          icon={<Eye    size={20} className="text-emerald-500" />}
          bg="bg-emerald-50"
          delay={1}
        />
        <StatCard
          label="Mensajes Nuevos"
          value="5"
          icon={<Mail   size={20} className="text-cyan-500" />}
          bg="bg-cyan-50"
          delay={2}
        />
        <StatCard
          label="Ranking Alumni"
          value="#14"
          icon={<Award  size={20} className="text-amber-500" />}
          bg="bg-amber-50"
          delay={3}
        />
        <StatCard
          label="Conexiones"
          value="23"
          icon={<Users  size={20} className="text-violet-500" />}
          bg="bg-violet-50"
          delay={4}
        />
      </div>

      {/* ── Main two-column grid ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ═════ Left column (2/3) ═════ */}
        <div className="lg:col-span-2 space-y-5">

          {/* Suggested actions — 2×2 action grid */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 animate-fade-in-up stagger-2">
            <h3 className="font-bold text-base mb-5">Acciones Sugeridas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  href:   "/profile",
                  icon:   <Edit         size={18} className="text-emerald-500" />,
                  bg:     "bg-emerald-50",
                  border: "border-emerald-100",
                  title:  "Actualiza tu perfil",
                  sub:    "Agrega tu último proyecto",
                },
                {
                  href:   "/muro",
                  icon:   <Share2       size={18} className="text-cyan-500" />,
                  bg:     "bg-cyan-50",
                  border: "border-cyan-100",
                  title:  "Comparte experiencia",
                  sub:    "Publica en El Muro",
                },
                {
                  href:   "/messages",
                  icon:   <MessageCircle size={18} className="text-violet-500" />,
                  bg:     "bg-violet-50",
                  border: "border-violet-100",
                  title:  "Mensajes pendientes",
                  sub:    "5 sin leer",
                },
                {
                  href:   "#",
                  icon:   <Download     size={18} className="text-amber-500" />,
                  bg:     "bg-amber-50",
                  border: "border-amber-100",
                  title:  "Descargar CV",
                  sub:    "Formato PDF",
                },
              ].map((a, i) => (
                <Link
                  key={a.title}
                  href={a.href}
                  className={`
                    p-4 ${a.bg} rounded-xl border ${a.border}
                    flex items-center gap-3
                    hover:shadow-md hover:-translate-y-0.5
                    transition-all duration-200 group
                    animate-fade-in-up stagger-${Math.min(i + 1, 4)}
                  `}
                >
                  {/* Icon on a white pill */}
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.sub}</p>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all"
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent feed activity */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 animate-fade-in-up stagger-3">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-base">Actividad Reciente</h3>
              <Link
                href="/muro"
                className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"
              >
                Ver El Muro <ChevronRight size={12} />
              </Link>
            </div>

            <div className="space-y-1">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50/80 transition-colors"
                >
                  <img
                    src={post.authorAvatar}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {post.authorName || post.author}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {(post.content || post.description).substring(0, 60)}…
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{post.createdAt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested connections */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 animate-fade-in-up stagger-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-base">Conexiones Sugeridas</h3>
              <Link
                href="/talent"
                className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"
              >
                Ver todos <ChevronRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TALENT_PROFILES.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all card-interactive"
                >
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{t.name}</p>
                    <p className="text-[11px] text-slate-500">{t.specialty}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═════ Right sidebar (1/3) ═════ */}
        <div className="space-y-5">

          {/* Profile views highlight */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white animate-fade-in-up stagger-1">
            <Eye size={28} className="mb-2 opacity-80" />
            <p className="text-3xl font-extrabold">47</p>
            <p className="text-sm opacity-90 mt-1">Vistas al Perfil</p>
            <p className="text-xs opacity-70 mt-0.5">+12 esta semana</p>
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
                      : "bg-emerald-50/50 border border-emerald-100/50"
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

          {/* Skills snapshot */}
          {p.skills && p.skills.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/60 animate-fade-in-up stagger-3">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Star size={14} className="text-amber-500" /> Habilidades
              </h3>
              <div className="flex flex-wrap gap-2">
                {p.skills.slice(0, 6).map((s) => (
                  <span
                    key={s}
                    className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-100 hover:bg-emerald-100 transition-colors"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
