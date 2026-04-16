"use client";
// ──────────────────────────────────────────────────────────
// DashboardEstudiante – Student home dashboard (live data)
// ──────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRole } from "@/lib/role-context";
import { supabase } from "@/lib/supabase";
import {
  Flame, Star, Trophy, Zap, ArrowRight, BookOpen, Briefcase,
  Bell, MessageSquare, ChevronRight, Clock, Award, Lock, Loader2,
} from "lucide-react";
import Icon                  from "@/components/ui/Icon";
import StatCard              from "@/components/ui/StatCard";
import TrustTriangleInsights from "@/components/dashboard/TrustTriangleInsights";

interface DashProfile {
  name: string; avatar: string; level: number; xp: number;
  streak: number; gpa: number | null; specialty: string;
}

interface DashBadge {
  id: string; name: string; icon: string; earned: boolean; earned_at: string | null;
}

interface DashPost {
  id: string; title: string; description: string; content: string;
  authorName: string; authorAvatar: string; createdAt: string;
}

export default function DashboardEstudiante() {
  const { user } = useAuth();
  const { notifications } = useRole();

  const [profile,  setProfile]  = useState<DashProfile | null>(null);
  const [badges,   setBadges]   = useState<DashBadge[]>([]);
  const [posts,    setPosts]    = useState<DashPost[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    Promise.all([
      supabase.from("profiles").select("name, avatar, level, xp, streak, gpa, specialty").eq("id", user.id).single(),
      supabase.from("user_badges").select("badge_id, earned_at").eq("user_id", user.id),
      supabase.from("badges").select("id, name, icon, description"),
      supabase
        .from("posts")
        .select("id, title, description, content, created_at, profiles!author_id(name, avatar)")
        .order("created_at", { ascending: false })
        .limit(3),
    ]).then(([pRes, ubRes, bRes, postsRes]) => {
      if (pRes.data) setProfile(pRes.data as DashProfile);

      const earnedMap = new Map(
        (ubRes.data ?? []).map((r: any) => [r.badge_id, r.earned_at])
      );
      setBadges(
        (bRes.data ?? []).map((b: any) => ({
          id: b.id, name: b.name, icon: b.icon,
          earned: earnedMap.has(b.id),
          earned_at: earnedMap.get(b.id) ?? null,
        }))
      );

      setPosts(
        (postsRes.data ?? []).map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description ?? "",
          content: p.content ?? "",
          authorName:   (p.profiles as any)?.name   ?? "Usuario",
          authorAvatar: (p.profiles as any)?.avatar ?? "",
          createdAt:    (p.created_at ?? "").split("T")[0],
        }))
      );

      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 size={28} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-slate-400 text-sm">No se pudo cargar el perfil.</p>
      </div>
    );
  }

  const earnedBadges = badges.filter((b) => b.earned);
  const xp           = profile.xp    ?? 0;
  const xpMax        = 500; // XP per level
  const xpPercent    = Math.min(100, Math.round(((xp % xpMax) / xpMax) * 100));
  const streak       = profile.streak ?? 0;
  const recentNotifs = notifications.slice(0, 4);
  const displayName  = user?.name ?? profile.name;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">

      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-br from-cyan-500 via-teal-500 to-cyan-700 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden animate-fade-in-up">
        <div className="absolute inset-0 opacity-10 hero-pattern" />

        <div className="relative flex flex-col md:flex-row md:items-center gap-5">
          {/* Avatar */}
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={displayName}
              className="w-16 h-16 rounded-2xl border-2 border-white/30 object-cover shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl border-2 border-white/30 bg-white/20 flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-2xl">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1">
            <p className="text-cyan-100 text-sm font-medium mb-1">Bienvenido/a</p>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {displayName.split(" ")[0]}
            </h1>
            <p className="text-white/70 text-sm mt-1">
              Nivel {profile.level ?? 1}
              {profile.specialty ? ` — ${profile.specialty}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-extrabold">{streak}</p>
              <p className="text-xs text-cyan-100">días de racha</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-extrabold">{earnedBadges.length}</p>
              <p className="text-xs text-cyan-100">insignias</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Nivel Actual"
          value={profile.level ?? 1}
          icon={<Star size={20} className="text-cyan-500" />}
          bg="bg-cyan-50"
          delay={1}
        />
        <StatCard
          label="Racha Diaria"
          value={`${streak} días`}
          icon={<Flame size={20} className="text-amber-500" />}
          bg="bg-amber-50"
          delay={2}
        />
        <StatCard
          label="Insignias"
          value={`${earnedBadges.length}/${badges.length}`}
          icon={<Trophy size={20} className="text-emerald-500" />}
          bg="bg-emerald-50"
          delay={3}
        />
        <StatCard
          label="Promedio"
          value={profile.gpa != null ? profile.gpa.toFixed(1) : "—"}
          icon={<Star size={20} className="text-violet-500" />}
          bg="bg-violet-50"
          delay={4}
        />
      </div>

      {/* ── Main two-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">

          {/* XP Progress */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 animate-fade-in-up stagger-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-cyan-600" />
                <span className="font-bold">Puntos de Experiencia</span>
              </div>
              <span className="text-sm font-bold text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-full">
                {xpPercent}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden mb-3">
              <div
                className="h-full rounded-full primary-gradient transition-all duration-1000 ease-out"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>{xp.toLocaleString()} XP</span>
              <span>
                Faltan{" "}
                <span className="font-bold text-cyan-600">
                  {Math.max(0, xpMax - (xp % xpMax)).toLocaleString()} XP
                </span>{" "}
                para Nivel {(profile.level ?? 1) + 1}
              </span>
            </div>
          </div>

          {/* Badges grid */}
          {badges.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 animate-fade-in-up stagger-3">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-base">Insignias Verificadas</h3>
                <Link
                  href="/profile"
                  className="text-xs text-cyan-600 font-semibold hover:underline flex items-center gap-1"
                >
                  Ver todas <ChevronRight size={12} />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {badges.map((badge, i) => (
                  <div
                    key={badge.id}
                    className={`
                      p-4 rounded-xl text-center transition-all
                      animate-scale-in stagger-${Math.min(i + 1, 6)}
                      ${badge.earned
                        ? "bg-amber-50/60 border border-amber-200/60 hover:shadow-md hover:-translate-y-0.5"
                        : "bg-slate-50 border border-slate-100 opacity-40"
                      }
                    `}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2.5 ${
                      badge.earned ? "bg-amber-100 text-amber-600" : "bg-slate-200 text-slate-400"
                    }`}>
                      {badge.earned
                        ? <Icon name={badge.icon} size={20} />
                        : <Lock size={16} />
                      }
                    </div>
                    <p className="text-xs font-bold truncate">{badge.name}</p>
                    {badge.earned && badge.earned_at && (
                      <p className="text-[10px] text-emerald-500 font-medium mt-1">
                        {new Date(badge.earned_at).toLocaleDateString("es-CR")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent feed */}
          {posts.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 animate-fade-in-up stagger-4">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-base">Actividad Reciente</h3>
                <Link
                  href="/muro"
                  className="text-xs text-cyan-600 font-semibold hover:underline flex items-center gap-1"
                >
                  Ver El Muro <ChevronRight size={12} />
                </Link>
              </div>
              <div className="space-y-1">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50/80 transition-colors"
                  >
                    {post.authorAvatar ? (
                      <img src={post.authorAvatar} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                        {post.authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{post.authorName}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {(post.content || post.description).substring(0, 60)}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{post.createdAt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">

          {/* Notifications */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 animate-fade-in-up stagger-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-slate-500" />
                <span className="font-bold text-sm">Notificaciones</span>
              </div>
              {recentNotifs.length > 0 && (
                <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold">
                  {recentNotifs.filter((n) => !n.read).length}
                </span>
              )}
            </div>
            {recentNotifs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Sin notificaciones.</p>
            ) : (
              <div className="space-y-2.5">
                {recentNotifs.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-lg text-xs ${
                      n.read ? "bg-slate-50/50" : "bg-cyan-50/50 border border-cyan-100/50"
                    }`}
                  >
                    <p className="font-semibold text-slate-700 mb-0.5">{n.title}</p>
                    <p className="text-slate-500">{n.description.substring(0, 60)}</p>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Clock size={9} /> {n.time}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Trust Triangle Insights ── */}
          {user?.id && (
            <div className="animate-fade-in-up stagger-3">
              <TrustTriangleInsights role="Estudiante" studentId={user.id} />
            </div>
          )}

          {/* Quick actions */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 animate-fade-in-up stagger-3">
            <h3 className="font-bold text-sm mb-4">Acciones Rápidas</h3>
            <div className="space-y-1">
              {[
                { href: "/profile",  icon: <BookOpen     size={16} className="text-cyan-500" />,    bg: "bg-cyan-50",    label: "Mi Perfil",   sub: "Portafolio y logros" },
                { href: "/muro",     icon: <Flame        size={16} className="text-amber-500" />,   bg: "bg-amber-50",   label: "El Muro",     sub: "Proyectos y eventos" },
                { href: "/talent",   icon: <Briefcase    size={16} className="text-violet-500" />,  bg: "bg-violet-50",  label: "Talento",     sub: "Conecta y aprende" },
                { href: "/messages", icon: <MessageSquare size={16} className="text-emerald-500" />, bg: "bg-emerald-50", label: "Mensajes",    sub: "Conversaciones" },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50/80 transition-colors group"
                >
                  <div className={`w-9 h-9 ${a.bg} rounded-lg flex items-center justify-center shrink-0`}>
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{a.label}</p>
                    <p className="text-[11px] text-slate-400">{a.sub}</p>
                  </div>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
