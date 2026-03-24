"use client";
import { useState } from "react";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { useRole } from "@/lib/role-context";
import { PROFILES, BADGES, TALENT_PROFILES, FEED_POSTS, QUEUE_REQUESTS } from "@/lib/data";
import Icon from "@/components/ui/Icon";
import {
  MapPin, Mail, GraduationCap, Star, Award, Edit, ExternalLink, Lock, Briefcase,
  Globe, Building2, Users, TrendingUp, Handshake, Eye, Calendar, ChevronRight,
  Heart, Zap, Target, Shield, FileText
} from "lucide-react";

export default function ProfilePage() {
  const { role } = useRole();
  const [tab, setTab] = useState<string>("Resumen");

  const profile = role === "Empresa" ? PROFILES.company : role === "Colegio" ? PROFILES.school : PROFILES.student;
  const isStudent = role === "Estudiante" || role === "Egresado";
  const isCompany = role === "Empresa";
  const isSchool = role === "Colegio";

  const getTabs = () => {
    if (isStudent) return ["Resumen", "Portafolio", "Insignias"];
    if (isCompany) return ["Resumen", "Vacantes", "Candidatos"];
    return ["Resumen", "Estadisticas", "Solicitudes"];
  };

  const gradientClass = isCompany
    ? "from-violet-500 via-purple-500 to-violet-700"
    : isSchool
    ? "from-amber-500 via-orange-500 to-amber-700"
    : "from-cyan-500 via-teal-500 to-cyan-700";

  const btnClass = isCompany
    ? "bg-violet-600 hover:bg-violet-700"
    : isSchool
    ? "bg-amber-600 hover:bg-amber-700"
    : "bg-cyan-600 hover:bg-cyan-700";
  const activeTabClass = isCompany
    ? "bg-violet-50 text-violet-700 shadow-sm"
    : isSchool
    ? "bg-amber-50 text-amber-700 shadow-sm"
    : "bg-cyan-50 text-cyan-700 shadow-sm";

  return (
    <PageLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* ═══ COVER + AVATAR ═══ */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
          <div className={`h-44 md:h-56 bg-gradient-to-br ${gradientClass} relative`}>
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}} />
            {isCompany && (
              <div className="absolute bottom-4 right-5 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-xs font-semibold flex items-center gap-1.5">
                <Building2 size={14} /> Cuenta Empresa
              </div>
            )}
            {isSchool && (
              <div className="absolute bottom-4 right-5 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-xs font-semibold flex items-center gap-1.5">
                <GraduationCap size={14} /> Centro Educativo
              </div>
            )}
          </div>
          <div className="px-6 pb-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 sm:-mt-16">
              <img src={profile.avatar} alt={profile.name} className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-white object-cover shadow-lg ring-2 ring-white/50" />
              <div className="flex-1 pt-2 sm:pt-0 sm:pb-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{profile.name}</h1>
                <p className="text-base text-slate-500 mt-0.5">
                  {isCompany ? profile.industry : isSchool ? "Colegio Tecnico Profesional" : (profile.title || profile.specialty)}
                </p>
                {isCompany && profile.website && (
                  <a href={`https://${profile.website}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-violet-600 font-medium mt-1 hover:underline">
                    <Globe size={13} /> {profile.website}
                  </a>
                )}
              </div>
              <button className={`flex items-center gap-1.5 ${btnClass} text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors self-start sm:self-auto shadow-sm`}>
                <Edit size={15} /> Editar Perfil
              </button>
            </div>
          </div>
        </div>

        {/* ═══ QUICK INFO STRIP ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {profile.location && (
            <div className="bg-white rounded-xl border border-slate-200/60 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0"><MapPin size={17} className="text-slate-500" /></div>
              <div><p className="text-[11px] text-slate-400 font-medium">Ubicacion</p><p className="text-sm font-semibold text-slate-700 truncate">{profile.location}</p></div>
            </div>
          )}
          {profile.email && (
            <div className="bg-white rounded-xl border border-slate-200/60 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0"><Mail size={17} className="text-slate-500" /></div>
              <div><p className="text-[11px] text-slate-400 font-medium">Correo</p><p className="text-sm font-semibold text-slate-700 truncate">{profile.email}</p></div>
            </div>
          )}
          {isStudent && profile.specialty && (
            <div className="bg-white rounded-xl border border-slate-200/60 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0"><GraduationCap size={17} className="text-slate-500" /></div>
              <div><p className="text-[11px] text-slate-400 font-medium">Especialidad</p><p className="text-sm font-semibold text-slate-700">{profile.specialty}</p></div>
            </div>
          )}
          {isStudent && profile.xp !== undefined && (
            <div className="bg-white rounded-xl border border-slate-200/60 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0"><Star size={17} className="text-amber-500" /></div>
              <div><p className="text-[11px] text-slate-400 font-medium">Nivel</p><p className="text-sm font-semibold text-slate-700">Nv. {profile.level} - {profile.xp} XP</p></div>
            </div>
          )}
          {isCompany && (
            <>
              <div className="bg-white rounded-xl border border-slate-200/60 p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0"><Users size={17} className="text-violet-500" /></div>
                <div><p className="text-[11px] text-slate-400 font-medium">Empleados</p><p className="text-sm font-semibold text-slate-700">{profile.employeeCount}</p></div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/60 p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><Briefcase size={17} className="text-emerald-500" /></div>
                <div><p className="text-[11px] text-slate-400 font-medium">Vacantes Abiertas</p><p className="text-sm font-semibold text-slate-700">{profile.openPositions}</p></div>
              </div>
            </>
          )}
          {isSchool && (
            <>
              <div className="bg-white rounded-xl border border-slate-200/60 p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0"><Users size={17} className="text-amber-500" /></div>
                <div><p className="text-[11px] text-slate-400 font-medium">Estudiantes</p><p className="text-sm font-semibold text-slate-700">{profile.studentCount}</p></div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/60 p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><Handshake size={17} className="text-emerald-500" /></div>
                <div><p className="text-[11px] text-slate-400 font-medium">Alianzas</p><p className="text-sm font-semibold text-slate-700">{profile.allianceCount} empresas</p></div>
              </div>
            </>
          )}
        </div>

        {/* ═══ TABS ═══ */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200/60 p-1.5">
          {getTabs().map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t ? activeTabClass : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}>{t}</button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/*             STUDENT / EGRESADO TABS             */}
        {/* ═══════════════════════════════════════════════ */}
        {isStudent && tab === "Resumen" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              {profile.bio && (
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
                  <h3 className="font-bold text-base mb-3">Acerca de</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Promedio", value: profile.gpa?.toFixed(1) || "0", icon: <Target size={20} className="text-cyan-500" />, bg: "bg-cyan-50" },
                  { label: "Experiencia", value: `${profile.yearsExperience || 0} a.`, icon: <Briefcase size={20} className="text-teal-500" />, bg: "bg-teal-50" },
                  { label: "Insignias", value: BADGES.filter((b) => b.earned).length.toString(), icon: <Award size={20} className="text-amber-500" />, bg: "bg-amber-50" },
                  { label: "Certificaciones", value: (profile.certifications?.length || 0).toString(), icon: <Star size={20} className="text-purple-500" />, bg: "bg-purple-50" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl border border-slate-200/60 p-5 text-center">
                    <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2.5`}>{s.icon}</div>
                    <p className="text-2xl font-extrabold">{s.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              {profile.skills && profile.skills.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
                  <h3 className="font-bold text-base mb-4">Habilidades</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {profile.skills.map((s) => (
                      <span key={s} className="bg-cyan-50 text-cyan-700 px-4 py-2 rounded-xl text-sm font-medium border border-cyan-100">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-5">
              {/* XP Widget */}
              <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={16} className="text-cyan-600" />
                  <span className="text-sm font-bold">Progreso XP</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-2">
                  <div className="h-full rounded-full primary-gradient" style={{ width: `${((profile.xp || 0) / (profile.xpMax || 3000)) * 100}%` }} />
                </div>
                <p className="text-xs text-slate-500">{profile.xp} / {profile.xpMax} XP</p>
              </div>
              {/* Certifications */}
              {profile.certifications && profile.certifications.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Shield size={15} className="text-amber-500" /> Certificaciones</h3>
                  <div className="space-y-2.5">
                    {profile.certifications.map((c) => (
                      <div key={c} className="flex items-center gap-2.5 p-2.5 bg-amber-50/60 rounded-lg">
                        <Award size={14} className="text-amber-500 shrink-0" />
                        <span className="text-sm text-slate-700 font-medium">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Quick actions */}
              <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
                <h3 className="font-bold text-sm mb-3">Acciones</h3>
                <div className="space-y-2">
                  <Link href="/muro" className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group">
                    <Eye size={15} className="text-slate-400" /><span className="text-sm text-slate-600 flex-1">Ver mi actividad</span><ChevronRight size={14} className="text-slate-300" />
                  </Link>
                  <Link href="/talent" className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group">
                    <Users size={15} className="text-slate-400" /><span className="text-sm text-slate-600 flex-1">Explorar talento</span><ChevronRight size={14} className="text-slate-300" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {isStudent && tab === "Portafolio" && (
          <div>
            {profile.portfolio && profile.portfolio.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {profile.portfolio.map((p) => (
                  <div key={p.id} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-md transition-all group">
                    {p.image && (
                      <div className="aspect-video overflow-hidden">
                        <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="p-5">
                      <h4 className="font-bold text-base mb-1.5">{p.title}</h4>
                      <p className="text-sm text-slate-500 mb-3">{p.description}</p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {p.tags.map((t) => <span key={t} className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg text-xs font-medium">{t}</span>)}
                      </div>
                      {p.link && (
                        <a href={p.link} target="_blank" className="inline-flex items-center gap-1.5 text-sm text-cyan-600 font-semibold hover:underline">
                          <ExternalLink size={13} /> Ver proyecto
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/60">
                <Briefcase size={48} className="mx-auto mb-4 text-slate-200" />
                <p className="text-slate-400 text-base font-medium">No hay proyectos en el portafolio.</p>
              </div>
            )}
          </div>
        )}

        {isStudent && tab === "Insignias" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {BADGES.map((b) => (
              <div key={b.id} className={`bg-white rounded-2xl border p-5 text-center transition-all hover:shadow-sm ${b.earned ? "border-slate-200/60" : "border-dashed border-slate-200 opacity-50"}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${b.earned ? "bg-amber-50" : "bg-slate-100"}`}>
                  {b.earned ? <Icon name={b.icon} size={24} className="text-amber-500" /> : <Lock size={24} className="text-slate-300" />}
                </div>
                <p className="text-sm font-bold mb-1">{b.name}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{b.description}</p>
                {b.earned && b.date && <p className="text-[10px] text-emerald-500 font-semibold mt-2">Obtenida {b.date}</p>}
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/*               COMPANY TABS                      */}
        {/* ═══════════════════════════════════════════════ */}
        {isCompany && tab === "Resumen" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
                <h3 className="font-bold text-base mb-3">Acerca de la Empresa</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Vacantes Abiertas", value: profile.openPositions || 0, icon: <Briefcase size={20} className="text-violet-500" />, bg: "bg-violet-50" },
                  { label: "Empleados", value: profile.employeeCount || "N/A", icon: <Users size={20} className="text-cyan-500" />, bg: "bg-cyan-50" },
                  { label: "Perfiles Vistos", value: "156", icon: <Eye size={20} className="text-emerald-500" />, bg: "bg-emerald-50" },
                  { label: "Contratados", value: "3", icon: <TrendingUp size={20} className="text-amber-500" />, bg: "bg-amber-50" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl border border-slate-200/60 p-5 text-center">
                    <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2.5`}>{s.icon}</div>
                    <p className="text-2xl font-extrabold">{s.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
                <h3 className="font-bold text-sm mb-3">Informacion</h3>
                <div className="space-y-3">
                  {[
                    { icon: <Building2 size={15} className="text-slate-400" />, label: "Industria", value: profile.industry },
                    { icon: <Users size={15} className="text-slate-400" />, label: "Tamano", value: profile.employeeCount },
                    { icon: <Globe size={15} className="text-slate-400" />, label: "Web", value: profile.website },
                    { icon: <Calendar size={15} className="text-slate-400" />, label: "Miembro desde", value: profile.joinedDate },
                  ].map((item) => item.value && (
                    <div key={item.label} className="flex items-center gap-3">
                      {item.icon}
                      <div><p className="text-[11px] text-slate-400">{item.label}</p><p className="text-sm font-medium text-slate-700">{item.value}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/talent" className="flex items-center justify-center gap-2 w-full bg-violet-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors">
                <Users size={16} /> Buscar Talento
              </Link>
            </div>
          </div>
        )}

        {isCompany && tab === "Vacantes" && (
          <div className="space-y-4">
            {[
              { title: "Pasante de Automatizacion", dept: "Ingenieria", type: "Pasantia", status: "Activa" },
              { title: "Tecnico Electricista Jr.", dept: "Mantenimiento", type: "Tiempo completo", status: "Activa" },
              { title: "Operador de PLC", dept: "Produccion", type: "Tiempo completo", status: "Cerrada" },
              { title: "Asistente de Soldadura", dept: "Taller", type: "Pasantia", status: "Activa" },
            ].map((v, i) => (
              <div key={i} className={`bg-white rounded-2xl border p-5 flex items-center gap-4 ${v.status === "Cerrada" ? "border-slate-200/40 opacity-60" : "border-slate-200/60"}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${v.status === "Activa" ? "bg-violet-50" : "bg-slate-50"}`}>
                  <Briefcase size={18} className={v.status === "Activa" ? "text-violet-500" : "text-slate-400"} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm">{v.title}</h4>
                  <p className="text-xs text-slate-500">{v.dept} - {v.type}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${v.status === "Activa" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>{v.status}</span>
              </div>
            ))}
          </div>
        )}

        {isCompany && tab === "Candidatos" && (
          <div className="space-y-3">
            {TALENT_PROFILES.slice(0, 5).map((t) => (
              <div key={t.id} className="bg-white rounded-2xl border border-slate-200/60 p-5 flex items-center gap-4">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm">{t.name}</h4>
                  <p className="text-xs text-slate-500">{t.title} - {t.specialty}</p>
                  <div className="flex gap-1.5 mt-1.5">{t.skills.slice(0, 3).map((s) => <span key={s} className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-medium">{s}</span>)}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg font-extrabold text-violet-600">{t.matchScore}%</span>
                  <p className="text-[10px] text-slate-400">match</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/*                SCHOOL TABS                      */}
        {/* ═══════════════════════════════════════════════ */}
        {isSchool && tab === "Resumen" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
                <h3 className="font-bold text-base mb-3">Acerca del Centro</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Empleabilidad", value: `${profile.employabilityRate}%`, icon: <TrendingUp size={20} className="text-emerald-500" />, bg: "bg-emerald-50" },
                  { label: "Estudiantes", value: profile.studentCount, icon: <GraduationCap size={20} className="text-cyan-500" />, bg: "bg-cyan-50" },
                  { label: "Alianzas", value: profile.allianceCount, icon: <Handshake size={20} className="text-violet-500" />, bg: "bg-violet-50" },
                  { label: "Practicas Activas", value: "28", icon: <Briefcase size={20} className="text-amber-500" />, bg: "bg-amber-50" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl border border-slate-200/60 p-5 text-center">
                    <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2.5`}>{s.icon}</div>
                    <p className="text-2xl font-extrabold">{s.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              {/* Specialties offered */}
              <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
                <h3 className="font-bold text-base mb-4">Especialidades</h3>
                <div className="grid grid-cols-2 gap-3">
                  {["Mecatronica", "Soldadura", "Electricidad", "Ebanisteria"].map((spec) => (
                    <div key={spec} className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                      <GraduationCap size={16} className="text-amber-600 shrink-0" />
                      <span className="text-sm font-semibold text-slate-700">{spec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
                <h3 className="font-bold text-sm mb-3">Informacion</h3>
                <div className="space-y-3">
                  {[
                    { icon: <Building2 size={15} className="text-slate-400" />, label: "Nombre", value: profile.schoolName },
                    { icon: <MapPin size={15} className="text-slate-400" />, label: "Ubicacion", value: profile.location },
                    { icon: <Calendar size={15} className="text-slate-400" />, label: "En la plataforma", value: profile.joinedDate },
                  ].map((item) => item.value && (
                    <div key={item.label} className="flex items-center gap-3">
                      {item.icon}
                      <div><p className="text-[11px] text-slate-400">{item.label}</p><p className="text-sm font-medium text-slate-700">{item.value}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white">
                <TrendingUp size={28} className="mb-2 opacity-80" />
                <p className="text-3xl font-extrabold">{profile.employabilityRate}%</p>
                <p className="text-sm opacity-90 mt-1">Tasa de Empleabilidad</p>
                <p className="text-xs opacity-70 mt-0.5">+4.2% vs. semestre anterior</p>
              </div>
            </div>
          </div>
        )}

        {isSchool && tab === "Estadisticas" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { title: "Distribucion por Especialidad", items: [{ name: "Mecatronica", val: 89 }, { name: "Electricidad", val: 78 }, { name: "Soldadura", val: 65 }, { name: "Ebanisteria", val: 42 }] },
              { title: "Alianzas por Sector", items: [{ name: "Automatizacion", val: 15 }, { name: "Construccion", val: 10 }, { name: "Energia", val: 9 }, { name: "Manufactura", val: 8 }] },
            ].map((card) => (
              <div key={card.title} className="bg-white rounded-2xl border border-slate-200/60 p-6">
                <h3 className="font-bold text-sm mb-4">{card.title}</h3>
                <div className="space-y-3">
                  {card.items.map((item) => (
                    <div key={item.name}>
                      <div className="flex justify-between text-sm mb-1"><span className="font-medium text-slate-700">{item.name}</span><span className="font-bold text-slate-500">{item.val}</span></div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5"><div className="h-full rounded-full bg-amber-400" style={{ width: `${(item.val / 100) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {isSchool && tab === "Solicitudes" && (
          <div className="space-y-3">
            {QUEUE_REQUESTS.map((req) => (
              <div key={req.id} className={`bg-white rounded-2xl border p-5 flex items-center gap-4 ${req.urgent ? "border-red-200/60" : "border-slate-200/60"}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${req.urgent ? "bg-red-50" : "bg-slate-50"}`}>
                  <FileText size={18} className={req.urgent ? "text-red-500" : "text-slate-400"} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm">{req.title}</h4>
                  <p className="text-xs text-slate-500">{req.author} - {req.date}</p>
                </div>
                {req.urgent && <span className="text-xs font-bold bg-red-50 text-red-600 px-3 py-1.5 rounded-full">Urgente</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
