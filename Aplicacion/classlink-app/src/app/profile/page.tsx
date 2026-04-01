"use client";
import { useState, useEffect, useCallback } from "react";
import PageLayout from "@/components/layout/PageLayout";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { profileEditSchema } from "@/lib/schemas";
import {
  MapPin, Mail, Edit, Loader2, Camera, Award, ExternalLink,
  GraduationCap, Lock, Globe, Building2, Users, TrendingUp,
} from "lucide-react";

type Role = "Estudiante" | "Egresado" | "Empresa" | "Colegio";

interface Profile {
  id: string; name: string; email: string; role: Role;
  avatar: string; bio: string; location: string;
  specialty: string; title: string; xp: number; level: number;
  streak: number; gpa: number | null; availability: string;
  years_experience: number;
  company_name: string; industry: string; employee_count: string;
  website: string; open_positions: number;
  school_name: string; student_count: number | null;
  alliance_count: number; employability_rate: number | null;
}

interface PortfolioItem {
  id: string; title: string; description: string; image: string; link: string;
}

interface UserBadge {
  id: string; name: string; icon: string; description: string;
  earned: boolean; earned_at: string | null;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [badges, setBadges]     = useState<UserBadge[]>([]);
  const [tab, setTab]           = useState("Resumen");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [editName,         setEditName]         = useState("");
  const [editBio,          setEditBio]          = useState("");
  const [editLocation,     setEditLocation]     = useState("");
  const [editSpecialty,    setEditSpecialty]    = useState("");
  const [editTitle,        setEditTitle]        = useState("");
  const [editAvailability, setEditAvailability] = useState("Disponible");
  const [editWebsite,      setEditWebsite]      = useState("");
  const [editIndustry,     setEditIndustry]     = useState("");

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    const { data, error: err } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (err || !data) { setError("No se pudo cargar el perfil."); setLoading(false); return; }
    setProfile(data as Profile);
    setLoading(false);
  }, [user?.id]);

  const fetchPortfolio = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("portfolio_items")
      .select("id, title, description, image, link")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setPortfolio(data ?? []);
  }, [user?.id]);

  const fetchBadges = useCallback(async () => {
    if (!user?.id) return;
    const [{ data: userBadges }, { data: allBadges }] = await Promise.all([
      supabase.from("user_badges").select("badge_id, earned_at").eq("user_id", user.id),
      supabase.from("badges").select("id, name, icon, description"),
    ]);
    const earned = new Map((userBadges ?? []).map((r: any) => [r.badge_id, r.earned_at]));
    setBadges(
      (allBadges ?? []).map((b: any) => ({
        id: b.id, name: b.name, icon: b.icon, description: b.description,
        earned: earned.has(b.id),
        earned_at: earned.get(b.id) ?? null,
      }))
    );
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
    fetchPortfolio();
    fetchBadges();
  }, [fetchProfile, fetchPortfolio, fetchBadges]);

  const openEdit = () => {
    if (!profile) return;
    setEditName(profile.name ?? "");
    setEditBio(profile.bio ?? "");
    setEditLocation(profile.location ?? "");
    setEditSpecialty(profile.specialty ?? "");
    setEditTitle(profile.title ?? "");
    setEditAvailability(profile.availability ?? "Disponible");
    setEditWebsite(profile.website ?? "");
    setEditIndustry(profile.industry ?? "");
    setSaveError(null);
    setSaveSuccess(false);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!user?.id || !profile) return;
    setSaving(true); setSaveError(null); setSaveSuccess(false);

    const parsed = profileEditSchema.safeParse({
      name:         editName,
      bio:          editBio         || undefined,
      location:     editLocation    || undefined,
      specialty:    editSpecialty   || undefined,
      title:        editTitle       || undefined,
      availability: editAvailability || undefined,
      website:      editWebsite     || undefined,
    });

    if (!parsed.success) {
      setSaveError(parsed.error.issues[0]?.message ?? "Error de validación");
      setSaving(false);
      return;
    }

    try {
      const updatePayload: Record<string, any> = {
        name:       editName.trim(),
        bio:        editBio.trim(),
        location:   editLocation.trim(),
        updated_at: new Date().toISOString(),
      };

      const isStudent = profile.role === "Estudiante" || profile.role === "Egresado";
      const isCompany = profile.role === "Empresa";

      if (isStudent) {
        updatePayload.specialty    = editSpecialty.trim();
        updatePayload.title        = editTitle.trim();
        updatePayload.availability = editAvailability || null;
      }
      if (isCompany) {
        updatePayload.website  = editWebsite.trim();
        updatePayload.industry = editIndustry.trim();
      }

      const { error: err } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", user.id);

      if (err) { setSaveError(err.message); setSaving(false); return; }

      setProfile((prev) => prev ? { ...prev, ...updatePayload } : prev);
      setSaveSuccess(true);
      setSaving(false);
      setTimeout(() => { setEditOpen(false); setSaveSuccess(false); }, 1200);
    } catch (e: any) {
      setSaveError(e?.message ?? "Error inesperado al guardar");
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (file.size > 5 * 1024 * 1024) { setError("La imagen debe ser menor a 5MB."); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Solo se permiten imágenes JPEG, PNG o WebP."); return;
    }
    setUploadingAvatar(true);
    const ext  = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar: publicUrl }).eq("id", user.id);
      setProfile((prev) => prev ? { ...prev, avatar: publicUrl } : prev);
    } else {
      setError("No se pudo subir la foto de perfil.");
    }
    setUploadingAvatar(false);
  };

  if (loading) return (
    <PageLayout>
      <div className="flex items-center justify-center min-h-64">
        <Loader2 size={32} className="animate-spin text-cyan-400" />
      </div>
    </PageLayout>
  );

  if (error || !profile) return (
    <PageLayout>
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-red-500 font-medium">{error ?? "Error al cargar el perfil."}</p>
          <button onClick={fetchProfile} className="mt-3 text-sm text-cyan-600 hover:underline">Reintentar</button>
        </div>
      </div>
    </PageLayout>
  );

  const role      = profile.role;
  const isStudent = role === "Estudiante" || role === "Egresado";
  const isCompany = role === "Empresa";
  const isSchool  = role === "Colegio";

  const getTabs = () => {
    if (isStudent) return ["Resumen", "Portafolio", "Insignias"];
    if (isCompany) return ["Resumen", "Vacantes", "Candidatos"];
    return ["Resumen", "Estadísticas", "Solicitudes"];
  };

  const gradientClass = isCompany ? "from-violet-500 via-purple-500 to-violet-700"
                      : isSchool  ? "from-amber-500 via-orange-500 to-amber-700"
                      :             "from-cyan-500 via-teal-500 to-cyan-700";

  const btnClass = isCompany ? "bg-violet-600 hover:bg-violet-700"
                 : isSchool  ? "bg-amber-600 hover:bg-amber-700"
                 :             "bg-cyan-600 hover:bg-cyan-700";

  const activeTabClass = isCompany ? "bg-violet-50 text-violet-700 shadow-sm"
                       : isSchool  ? "bg-amber-50 text-amber-700 shadow-sm"
                       :             "bg-cyan-50 text-cyan-700 shadow-sm";

  const accentText = isCompany ? "text-violet-600" : isSchool ? "text-amber-600" : "text-cyan-600";

  const xpPct = profile.xp && profile.level
    ? Math.min(100, Math.round(((profile.xp % 500) / 500) * 100))
    : 0;

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">

        {/* ── Profile Header Card ──────────────────────────────────────────
            Desktop layout: avatar centered on banner bottom edge (absolute),
            name/info sits to the RIGHT via md:pl-48.

            Measurements:
            · Banner  h-44 (176px) → md:h-60 (240px)
            · Avatar  w-24 h-24 (96px)  top-32 (128px) → center = 128+48 = 176 ✓
                      md:w-32 h-32 (128px) md:top-40 (160px) → center = 160+64 = 224... wait
                      md:h-60=240px; md:top-44=176px; center=176+64=240 ✓
            · Content mobile  pt-14 (56px): starts at 176+56=232 > avatar bottom (224) ✓
            · Content desktop pt-8  pl-48 : starts at 240+32=272px beside avatar (176-304px range) ✓
        ──────────────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/60 animate-fade-in-up relative">

          {/* Cover Banner */}
          <div className={`h-44 md:h-60 rounded-t-2xl bg-gradient-to-r ${gradientClass} overflow-hidden relative`}>
            <div className="absolute inset-0 hero-pattern opacity-20" />
            <button
              onClick={openEdit}
              className={`absolute top-4 right-4 flex items-center gap-1.5 ${btnClass} text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm btn-press`}
            >
              <Edit size={14} /> Editar perfil
            </button>
          </div>

          {/* Avatar — centered on the banner's bottom edge (absolute) */}
          <div className="absolute left-6 top-32 md:left-8 md:top-44 z-10">
            <div className="relative group">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white object-cover shadow-lg"
                />
              ) : (
                <div className={`w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg`}>
                  <span className="text-white font-black text-3xl md:text-4xl">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {uploadingAvatar
                  ? <Loader2 size={20} className="text-white animate-spin" />
                  : <Camera size={20} className="text-white" />
                }
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
          </div>

          {/* Name / title / chips
              Mobile : pt-14 clears the avatar bottom (avatar bottom = 128+96=224; banner=176; protrudes 48px)
              Desktop: pt-8 pl-48 — text starts beside avatar at banner-bottom level */}
          <div className="px-6 pb-6 pt-14 md:pt-8 md:pl-48">
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight tracking-tight">
              {profile.name}
            </h1>
            {profile.title && (
              <p className="text-sm md:text-base text-slate-500 mt-1">{profile.title}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm text-slate-400">
              {profile.location && (
                <span className="flex items-center gap-1.5"><MapPin size={14} />{profile.location}</span>
              )}
              <span className="flex items-center gap-1.5"><Mail size={14} />{profile.email}</span>
              {isStudent && profile.specialty && (
                <span className="flex items-center gap-1.5"><GraduationCap size={14} />{profile.specialty}</span>
              )}
              {isCompany && profile.website && (
                <a
                  href={`https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 ${accentText} hover:underline`}
                >
                  <Globe size={14} />{profile.website}
                </a>
              )}
              {isSchool && profile.school_name && (
                <span className="flex items-center gap-1.5"><Building2 size={14} />{profile.school_name}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Body: Persistent left sidebar + Tabbed main content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in-up stagger-2">

          {/* ── Left Sidebar (always visible, not tab-dependent) ── */}
          <div className="space-y-4">

            {profile.bio && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200/60">
                <h3 className="text-sm font-bold mb-2 text-slate-700">Acerca de</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            <div className="bg-white rounded-2xl p-5 border border-slate-200/60">
              <h3 className="text-sm font-bold mb-3 text-slate-700">Información</h3>
              <div className="space-y-3">
                {isStudent && (
                  <>
                    {profile.availability && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Disponibilidad</p>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          profile.availability === "Disponible"  ? "bg-emerald-50 text-emerald-700"
                          : profile.availability === "En prácticas" ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                        }`}>{profile.availability}</span>
                      </div>
                    )}
                    {profile.gpa != null && (
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Promedio</p>
                        <p className="text-sm font-semibold text-slate-700">{profile.gpa.toFixed(1)}</p>
                      </div>
                    )}
                    {profile.years_experience > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Experiencia</p>
                        <p className="text-sm font-semibold text-slate-700">
                          {profile.years_experience} {profile.years_experience === 1 ? "año" : "años"}
                        </p>
                      </div>
                    )}
                    {profile.streak > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Racha</p>
                        <p className="text-sm font-semibold text-slate-700">{profile.streak} días 🔥</p>
                      </div>
                    )}
                  </>
                )}
                {isCompany && (
                  <>
                    {profile.industry && (
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Industria</p>
                        <p className="text-sm font-semibold text-slate-700">{profile.industry}</p>
                      </div>
                    )}
                    {profile.employee_count && (
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Empleados</p>
                        <p className="text-sm font-semibold text-slate-700">{profile.employee_count}</p>
                      </div>
                    )}
                    {profile.open_positions > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Vacantes abiertas</p>
                        <p className="text-sm font-semibold text-slate-700">{profile.open_positions}</p>
                      </div>
                    )}
                  </>
                )}
                {isSchool && (
                  <>
                    {profile.student_count != null && (
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Estudiantes</p>
                        <p className="text-sm font-semibold text-slate-700">{profile.student_count}</p>
                      </div>
                    )}
                    {profile.alliance_count > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Alianzas</p>
                        <p className="text-sm font-semibold text-slate-700">{profile.alliance_count}</p>
                      </div>
                    )}
                    {profile.employability_rate != null && (
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Empleabilidad</p>
                        <p className="text-lg font-extrabold text-emerald-600">{profile.employability_rate}%</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {isStudent && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200/60">
                <h3 className="text-sm font-bold mb-3 text-slate-700">Progreso XP</h3>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-semibold">Nivel {profile.level ?? 1}</span>
                  <span>{profile.xp ?? 0} XP</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full transition-all duration-700"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 text-right">{xpPct}% al siguiente nivel</p>
              </div>
            )}
          </div>

          {/* ── Main Content (Tabs + Content) ── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Tabs */}
            <div className="flex gap-1.5 bg-white border border-slate-200/60 rounded-xl p-1.5 w-fit">
              {getTabs().map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    tab === t ? activeTabClass : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* ── Resumen ── */}
            {tab === "Resumen" && (
              <div className="space-y-4">
                {isStudent && badges.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/60">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-sm">Insignias</h3>
                      <button
                        onClick={() => setTab("Insignias")}
                        className={`text-xs ${accentText} font-semibold hover:underline`}
                      >
                        Ver todas
                      </button>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                      {badges.slice(0, 16).map((b) => (
                        <div
                          key={b.id}
                          title={b.name}
                          className={`p-2.5 rounded-xl text-center ${b.earned ? "bg-cyan-50 border border-cyan-100" : "bg-slate-50 opacity-40"}`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-1.5 ${b.earned ? "bg-cyan-100" : "bg-slate-200"}`}>
                            {b.earned
                              ? <Award size={16} className="text-cyan-600" />
                              : <Lock size={13} className="text-slate-400" />
                            }
                          </div>
                          <p className="text-[9px] font-bold leading-tight truncate">{b.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isStudent && portfolio.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/60">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-sm">Portafolio reciente</h3>
                      <button
                        onClick={() => setTab("Portafolio")}
                        className={`text-xs ${accentText} font-semibold hover:underline`}
                      >
                        Ver todo
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {portfolio.slice(0, 3).map((item) => (
                        <div key={item.id} className="rounded-xl border border-slate-100 overflow-hidden hover:shadow-sm transition-shadow">
                          {item.image ? (
                            <img src={item.image} alt={item.title} className="w-full h-32 object-cover" />
                          ) : (
                            <div className="w-full h-32 bg-slate-100 flex items-center justify-center">
                              <ExternalLink size={20} className="text-slate-300" />
                            </div>
                          )}
                          <div className="p-3">
                            <p className="text-xs font-bold truncate">{item.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isCompany && (
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/60">
                    <h3 className="font-bold text-sm mb-4">Vacantes Activas</h3>
                    {profile.open_positions > 0 ? (
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-violet-50 border border-violet-100">
                        <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                          <Users size={22} className="text-violet-600" />
                        </div>
                        <div>
                          <p className="font-bold text-violet-700">
                            {profile.open_positions} vacante{profile.open_positions > 1 ? "s" : ""} abierta{profile.open_positions > 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">Gestiona tus ofertas en la sección Empleos</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 text-center py-6">No hay vacantes activas.</p>
                    )}
                  </div>
                )}

                {isSchool && (
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/60">
                    <h3 className="font-bold text-sm mb-4">Estadísticas del Centro</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {profile.student_count != null && (
                        <div className="bg-amber-50 rounded-xl p-5 text-center">
                          <p className="text-3xl font-extrabold text-amber-600">{profile.student_count}</p>
                          <p className="text-xs text-slate-500 mt-1">Estudiantes</p>
                        </div>
                      )}
                      {profile.alliance_count > 0 && (
                        <div className="bg-violet-50 rounded-xl p-5 text-center">
                          <p className="text-3xl font-extrabold text-violet-600">{profile.alliance_count}</p>
                          <p className="text-xs text-slate-500 mt-1">Alianzas</p>
                        </div>
                      )}
                      {profile.employability_rate != null && (
                        <div className="bg-emerald-50 rounded-xl p-5 text-center">
                          <p className="text-3xl font-extrabold text-emerald-600">{profile.employability_rate}%</p>
                          <p className="text-xs text-slate-500 mt-1">Empleabilidad</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!isStudent && !isCompany && !isSchool && (
                  <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/60">
                    <p className="text-slate-400">Información del perfil.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Portafolio ── */}
            {tab === "Portafolio" && isStudent && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {portfolio.length === 0 ? (
                  <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-slate-200/60">
                    <p className="text-slate-400">No hay proyectos en el portafolio todavía.</p>
                  </div>
                ) : portfolio.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-md transition-shadow">
                    {item.image && (
                      <div className="aspect-[16/9] overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-sm">{item.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`mt-2 flex items-center gap-1 text-xs ${accentText} hover:underline font-medium`}
                        >
                          <ExternalLink size={12} /> Ver proyecto
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Insignias ── */}
            {tab === "Insignias" && isStudent && (
              <div>
                {badges.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/60">
                    <Award size={40} className="mx-auto mb-3 text-slate-200" />
                    <p className="text-slate-400 font-medium">No se encontraron insignias.</p>
                    <p className="text-xs text-slate-300 mt-1">Las insignias se asignan desde la base de datos.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {badges.map((b) => (
                      <div
                        key={b.id}
                        className={`bg-white rounded-2xl p-5 border text-center transition-all ${
                          b.earned ? "border-cyan-200 shadow-sm" : "border-slate-200/60 opacity-50"
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3 ${b.earned ? "bg-cyan-50" : "bg-slate-100"}`}>
                          {b.earned
                            ? <Award size={28} className="text-cyan-600" />
                            : <Lock size={22} className="text-slate-300" />
                          }
                        </div>
                        <p className="text-sm font-bold leading-tight">{b.name}</p>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{b.description}</p>
                        {b.earned && b.earned_at && (
                          <p className="text-[10px] text-cyan-500 mt-2 font-medium">
                            {new Date(b.earned_at).toLocaleDateString("es-CR")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Vacantes (Empresa) ── */}
            {tab === "Vacantes" && isCompany && (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/60">
                <Users size={44} className="mx-auto mb-3 text-slate-200" />
                <p className="text-slate-400 font-medium">Gestión de vacantes próximamente.</p>
              </div>
            )}

            {/* ── Candidatos (Empresa) ── */}
            {tab === "Candidatos" && isCompany && (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/60">
                <Users size={44} className="mx-auto mb-3 text-slate-200" />
                <p className="text-slate-400 font-medium">Candidatos próximamente.</p>
              </div>
            )}

            {/* ── Estadísticas (Colegio) ── */}
            {tab === "Estadísticas" && isSchool && (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/60">
                <TrendingUp size={44} className="mx-auto mb-3 text-slate-200" />
                <p className="text-slate-400 font-medium">Estadísticas detalladas próximamente.</p>
              </div>
            )}

            {/* ── Solicitudes (Colegio) ── */}
            {tab === "Solicitudes" && isSchool && (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/60">
                <Building2 size={44} className="mx-auto mb-3 text-slate-200" />
                <p className="text-slate-400 font-medium">Cola de solicitudes próximamente.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setSaveError(null); setSaveSuccess(false); }}
        title="Editar Perfil"
      >
        <div className="space-y-4">
          {saveError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              ¡Guardado con éxito!
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nombre</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Biografía</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none resize-none"
            />
            <p className="text-[10px] text-slate-400 text-right mt-1">{editBio.length}/500</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Ubicación</label>
            <input
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              placeholder="Ej: Santiago, Chile"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none"
            />
          </div>

          {isStudent && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Especialidad</label>
                <input
                  value={editSpecialty}
                  onChange={(e) => setEditSpecialty(e.target.value)}
                  placeholder="Ej: Mecatrónica"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Título / Cargo</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Ej: Estudiante de Mecatrónica"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Disponibilidad</label>
                <select
                  value={editAvailability}
                  onChange={(e) => setEditAvailability(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 outline-none bg-white"
                >
                  <option>Disponible</option>
                  <option>En prácticas</option>
                  <option>No disponible</option>
                </select>
              </div>
            </>
          )}

          {isCompany && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Industria</label>
                <input
                  value={editIndustry}
                  onChange={(e) => setEditIndustry(e.target.value)}
                  placeholder="Ej: Automatización Industrial"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Sitio web</label>
                <input
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="ejemplo.com"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none"
                />
              </div>
            </>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full ${btnClass} text-white py-3 rounded-xl font-bold text-sm disabled:opacity-40 transition-colors btn-press flex items-center justify-center gap-2`}
          >
            {saving
              ? <><Loader2 size={16} className="animate-spin" />Guardando…</>
              : "Guardar cambios"
            }
          </button>
        </div>
      </Modal>
    </PageLayout>
  );
}
