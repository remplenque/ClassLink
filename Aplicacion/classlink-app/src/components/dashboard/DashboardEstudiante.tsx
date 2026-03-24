"use client";
import { useState } from "react";
import Link from "next/link";
import { BADGES, PROFILES, FEED_POSTS, NOTIFICATIONS } from "@/lib/data";
import {
  Flame, Star, Trophy, Zap, ArrowRight, BookOpen, Briefcase, Target,
  Bell, TrendingUp, Calendar, MessageSquare, ChevronRight, Clock, Award
} from "lucide-react";
import Icon from "@/components/ui/Icon";

export default function DashboardEstudiante() {
  const p = PROFILES.student;
  const xp = p.xp || 2450;
  const xpMax = p.xpMax || 3000;
  const streak = p.streak || 7;
  const earnedBadges = BADGES.filter((b) => b.earned);
  const recentPosts = FEED_POSTS.slice(0, 3);
  const recentNotifs = NOTIFICATIONS.slice(0, 4);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-br from-cyan-500 via-teal-500 to-cyan-700 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}} />
        <div className="relative flex flex-col md:flex-row md:items-center gap-5">
          <img src={p.avatar} alt={p.name} className="w-16 h-16 rounded-2xl border-2 border-white/30 object-cover" />
          <div className="flex-1">
            <p className="text-cyan-100 text-sm font-medium mb-1">Buenos dias</p>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{p.name.split(" ")[0]}</h1>
            <p className="text-white/70 text-sm mt-1">Nivel {p.level} - {p.specialty}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-extrabold">{streak}</p>
              <p className="text-xs text-cyan-100">dias de racha</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-extrabold">{earnedBadges.length}</p>
              <p className="text-xs text-cyan-100">insignias</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Nivel Actual", value: p.level, sub: `${xp} XP`, icon: <Star size={20} className="text-cyan-500" />, bg: "bg-cyan-50" },
          { label: "Racha Diaria", value: streak, sub: "dias seguidos", icon: <Flame size={20} className="text-amber-500" />, bg: "bg-amber-50" },
          { label: "Insignias", value: `${earnedBadges.length}/${BADGES.length}`, sub: "obtenidas", icon: <Trophy size={20} className="text-emerald-500" />, bg: "bg-emerald-50" },
          { label: "Promedio", value: p.gpa, sub: "academico", icon: <Target size={20} className="text-violet-500" />, bg: "bg-violet-50" },
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
          {/* XP Progress */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-cyan-600" />
                <span className="font-bold">Puntos de Experiencia</span>
              </div>
              <span className="text-sm font-bold text-cyan-600">{Math.round((xp / xpMax) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden mb-3">
              <div className="h-full rounded-full primary-gradient transition-all duration-1000 ease-out" style={{ width: `${(xp / xpMax) * 100}%` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>{xp} XP</span>
              <span>Faltan <span className="font-bold text-cyan-600">{xpMax - xp} XP</span> para Nivel {(p.level || 5) + 1}</span>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-base">Insignias Verificadas</h3>
              <Link href="/profile" className="text-xs text-cyan-600 font-semibold hover:underline flex items-center gap-1">Ver todas <ChevronRight size={12} /></Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BADGES.map((badge) => (
                <div key={badge.id} className={`p-4 rounded-xl text-center transition-all ${badge.earned ? "bg-amber-50/60 border border-amber-200/60 hover:shadow-sm" : "bg-slate-50 border border-slate-100 opacity-40"}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2.5 ${badge.earned ? "bg-amber-100 text-amber-600" : "bg-slate-200 text-slate-400"}`}>
                    <Icon name={badge.icon} size={20} />
                  </div>
                  <p className="text-xs font-bold truncate">{badge.name}</p>
                  {badge.earned && badge.date && <p className="text-[10px] text-emerald-500 font-medium mt-1">{badge.date}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Feed */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-base">Actividad Reciente</h3>
              <Link href="/muro" className="text-xs text-cyan-600 font-semibold hover:underline flex items-center gap-1">Ver El Muro <ChevronRight size={12} /></Link>
            </div>
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <img src={post.authorAvatar} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{post.authorName || post.author}</p>
                    <p className="text-xs text-slate-500 truncate">{(post.content || post.description).substring(0, 60)}...</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{post.createdAt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Notifications widget */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Bell size={16} className="text-slate-500" /><span className="font-bold text-sm">Notificaciones</span></div>
              <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold">{recentNotifs.length}</span>
            </div>
            <div className="space-y-2.5">
              {recentNotifs.map((n) => (
                <div key={n.id} className={`p-3 rounded-lg text-xs ${n.read ? "bg-slate-50/50" : "bg-cyan-50/50 border border-cyan-100/50"}`}>
                  <p className="font-semibold text-slate-700 mb-0.5">{n.title}</p>
                  <p className="text-slate-500">{n.description.substring(0, 50)}...</p>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Clock size={9} />{n.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60">
            <h3 className="font-bold text-sm mb-4">Acciones Rapidas</h3>
            <div className="space-y-2">
              {[
                { href: "/profile", icon: <BookOpen size={16} className="text-cyan-500" />, bg: "bg-cyan-50", label: "Mi Perfil", sub: "Portafolio y logros" },
                { href: "/muro", icon: <Flame size={16} className="text-amber-500" />, bg: "bg-amber-50", label: "El Muro", sub: "Proyectos y eventos" },
                { href: "/talent", icon: <Briefcase size={16} className="text-violet-500" />, bg: "bg-violet-50", label: "Talento", sub: "Conecta y aprende" },
                { href: "/messages", icon: <MessageSquare size={16} className="text-emerald-500" />, bg: "bg-emerald-50", label: "Mensajes", sub: "Conversaciones" },
              ].map((a) => (
                <Link key={a.href} href={a.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className={`w-9 h-9 ${a.bg} rounded-lg flex items-center justify-center shrink-0`}>{a.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{a.label}</p>
                    <p className="text-[11px] text-slate-400">{a.sub}</p>
                  </div>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-cyan-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Skills snapshot */}
          {p.skills && p.skills.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/60">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Award size={14} className="text-amber-500" /> Habilidades</h3>
              <div className="flex flex-wrap gap-2">
                {p.skills.slice(0, 6).map((s) => (
                  <span key={s} className="bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-cyan-100">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
