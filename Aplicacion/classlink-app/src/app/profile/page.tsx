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

  // Edit form state
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
      supabase
        .from("user_badges")
        .select("badge_id, earned_at")
        .eq("user_id", user.id),
      supabase
        .from("badges")
        .select("id, name, icon, description"),
    ]);

    const earned = new Map(
      (userBadges ?? []).map((r: any) => [r.badge_id, r.earned_at])
    );
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
    // Use ?? "" to avoid null values that would break form inputs / Zod
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

      if (err) {
        setSaveError(err.message);
        setSaving(false);
        return;
      }

      // Update local state directly — avoids a re-fetch that could hang
      setProfile((prev) =>
        prev
          ? { ...prev, ...updatePayload }
          : prev
      );

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
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
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
          <button onClick={fetchProfile} className="mt-3 text-sm text-cyan-600 hover:underline">
            Reintentar
          </button>
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
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-5">

        {/* ── Profile Header Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200/60 animate-fade-in-up overflow-visible">

          {/* Cover Banner */}
          <div className={`relative h-36 md:h-44 rounded-t-2xl bg-gradient-to-r ${gradientClass} overflow-hidden`}>
            <div className="absolute inset-0 hero-pattern opacity-20" />
            <button
              onClick={openEdit}
              className={`absolute top-4 right-4 flex items-center gap-1.5 ${btnClass} text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm btn-press`}
            >
              <Edit size={14} /> Editar perfil
            </button>
          </div>

          {/* Avatar + Info below banner */}
          <div className="px-5 pb-5">
            {/* Avatar row — negative margin overlaps banner bottom */}
            <div className="-mt-10 md:-mt-12 mb-4 flex items-end gap-4">
              {/* Avatar with hover-to-upload */}
              <div className="relative group z-10 shrink-0">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-white object-cover shadow-lg"
                  />
                ) : (
                  <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-white bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-black text-3xl">
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

            {/* Name, title, quick info */}
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold leading-tight">
                {profile.name}
              </h1>
              {profile.title && (
                <p className="text-sm text-slate-500 mt-0.5">{profile.title}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={11} />{profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Mail size={11} />{profile.email}
                </span>
                {isStudent && profile.specialty && (
                  <span className="flex items-center gap-1">
                    <GraduationCap size={11} />{profile.specialty}
                  </span>
                )}
                {isCompany && profile.website && (
                  <a
                    href={`https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-1 ${accentText} hover:underline`}
                  >
                    <Globe size={11} />{profile.website}
                  </a>
                )}
                {isSchool && profile.school_name && (
                  <span className="flex items-center gap-1">
                    <Building2 size={11} />{profile.school_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 bg-white border border-slate-200/60 rounded-xl p-1.5 w-fit animate-fade-in-up stagger-2">
          {getTabs().map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t ? activeTabClass : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Resumen Tab ── */}
        {tab === "Resumen" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in-up stagger-3">
            <div className="lg:col-span-2 space-y-4">

              {profile.bio && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200/60">
                  <h3 className="text-sm font-bold mb-2 text-slate-700">Acerca de</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {isStudent && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200/60">
                  <h3 className="text-sm font-bold mb-3 text-slate-700">Progreso XP</h3>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>Nivel {profile.level ?? 1}</span>
                    <span>{profile.xp ?? 0} XP</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full transition-all duration-700"
                      style={{ width: `${xpPct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 text-right">{xpPct}% al siguiente nivel</p>
                </div>
              )}

              {isCompany && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200/60 space-y-3">
                  <h3 className="text-sm font-bold mb-2 text-slate-700">Información de la empresa</h3>
                  {profile.industry && (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Industria:</span> {profile.industry}
                    </p>
                  )}
                  {profile.employee_count && (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Empleados:</span> {profile.employee_count}
                    </p>
                  )}
                  {profile.open_positions > 0 && (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Vacantes abiertas:</span> {profile.open_positions}
                    </p>
                  )}
                </div>
              )}

              {isSchool && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200/60">
                  <h3 className="text-sm font-bold mb-3 text-slate-700">Estadísticas del centro</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {profile.student_count != null && (
                      <div>
                        <p className="text-2xl font-extrabold text-amber-600">{profile.student_count}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Estudiantes</p>
                      </div>
                    )}
                    {profile.alliance_count > 0 && (
                      <div>
                        <p className="text-2xl font-extrabold text-amber-600">{profile.alliance_count}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Alianzas</p>
                      </div>
                    )}
                    {profile.employability_rate != null && (
                      <div>
                        <p className="text-2xl font-extrabold text-emerald-600">{profile.employability_rate}%</p>
                        <p className="text-xs text-slate-400 mt-0.5">Empleabilidad</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/60">
                <h3 className="text-sm font-bold mb-3 text-slate-700">Detalles</h3>
                <div className="space-y-2.5 text-sm text-slate-600">
                  {isStudent && (
                    <>
                      {profile.availability && (
                        <p>
                          <span className="text-xs font-semibold text-slate-400 block">Disponibilidad</span>
                          <span className={`inline-flex items-center gap-1 text-xs font-medium mt-0.5 px-2 py-0.5 rounded-full ${
                            profile.availability === "Disponible"
                              ? "bg-emerald-50 text-emerald-700"
                              : profile.availability === "En prácticas"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {profile.availability}
                          </span>
                        </p>
                      )}
                      {profile.gpa != null && (
                        <p>
                          <span className="text-xs font-semibold text-slate-400 block">Promedio</span>
                          {profile.gpa.toFixed(1)}
                        </p>
                      )}
                      {profile.years_experience > 0 && (
                        <p>
                          <span className="text-xs font-semibold text-slate-400 block">Experiencia</span>
                          {profile.years_experience} {profile.years_experience === 1 ? "año" : "años"}
                        </p>
                      )}
                      {profile.streak > 0 && (
                        <p>
                          <span className="text-xs font-semibold text-slate-400 block">Racha</span>
                          {profile.streak} días 🔥
                        </p>
                      )}
                    </>
                  )}
                  {isCompany && (
                    <>
                      {profile.industry && (
                        <p>
                          <span className="text-xs font-semibold text-slate-400 block">Industria</span>
                          {profile.industry}
                        </p>
                      )}
                      {profile.employee_count && (
                        <p>
                          <span className="text-xs font-semibold text-slate-400 block">Empleados</span>
                          {profile.employee_count}
                        </p>
                      )}
                    </>
                  )}
                  {isSchool && (
                    <>
                      {profile.location && (
                        <p>
                          <span className="text-xs font-semibold text-slate-400 block">Ubicación</span>
                          {profile.location}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Portafolio Tab ── */}
        {tab === "Portafolio" && isStudent && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up stagger-3">
            {portfolio.length === 0 ? (
              <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-slate-200/60">
                <p className="text-slate-400">No hay proyectos en el portafolio todavía.</p>
              </div>
            ) : portfolio.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-md transition-shadow"
              >
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

        {/* ── Insignias Tab ── */}
        {tab === "Insignias" && isStudent && (
          <div className="animate-fade-in-up stagger-3">
            {badges.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60">
                <Award size={40} className="mx-auto mb-3 text-slate-200" />
                <p className="text-slate-400 font-medium">No se encontraron insignias.</p>
                <p className="text-xs text-slate-300 mt-1">Las insignias se asignan desde la base de datos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.map((b) => (
                  <div
                    key={b.id}
                    className={`bg-white rounded-2xl p-4 border text-center transition-all ${
                      b.earned ? "border-cyan-200 shadow-sm" : "border-slate-200/60 opacity-50"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
                      b.earned ? "bg-cyan-50" : "bg-slate-100"
                    }`}>
                      {b.earned
                        ? <Award size={24} className="text-cyan-600" />
                        : <Lock size={20} className="text-slate-300" />
                      }
                    </div>
                    <p className="text-xs font-bold leading-tight">{b.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{b.description}</p>
                    {b.earned && b.earned_at && (
                      <p className="text-[10px] text-cyan-500 mt-1.5 font-medium">
                        {new Date(b.earned_at).toLocaleDateString("es-CR")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Vacantes Tab (Empresa) ── */}
        {tab === "Vacantes" && isCompany && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 animate-fade-in-up stagger-3">
            <Users size={40} className="mx-auto mb-3 text-slate-200" />
            <p className="text-slate-400 font-medium">Gestión de vacantes próximamente.</p>
          </div>
        )}

        {/* ── Estadísticas Tab (Colegio) ── */}
        {tab === "Estadísticas" && isSchool && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 animate-fade-in-up stagger-3">
            <TrendingUp size={40} className="mx-auto mb-3 text-slate-200" />
            <p className="text-slate-400 font-medium">Estadísticas detalladas próximamente.</p>
          </div>
        )}
      </div>

      {/* ── Edit Profile Modal ── */}
      <Modal open={editOpen} onClose={() => { setEditOpen(false); setSaveError(null); setSaveSuccess(false); }} title="Editar Perfil">
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

          {/* Name — always shown */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nombre</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none"
            />
          </div>

          {/* Bio — always shown */}
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

          {/* Location — always shown */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Ubicación</label>
            <input
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              placeholder="Ej: Santiago, Chile"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none"
            />
          </div>

          {/* Student / Alumni fields */}
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

          {/* Company fields */}
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
