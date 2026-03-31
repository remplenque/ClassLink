"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { useRole } from "@/lib/role-context";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  Search, SlidersHorizontal, MapPin, Award, Star,
  CheckCircle, Clock, XCircle, ChevronDown, X, ArrowUpDown,
  Loader2, MessageCircle,
  type LucideIcon,
} from "lucide-react";

const SPECIALTIES = ["Todas", "Mecatrónica", "Electricidad", "Soldadura", "Ebanistería"];
const ROLE_FILTERS = ["Todos", "Estudiante", "Egresado"] as const;
const AVAILABILITY_FILTERS = ["Todos", "Disponible", "En prácticas", "No disponible"] as const;
const SORT_OPTIONS = [
  { value: "level", label: "Mayor nivel" },
  { value: "name",  label: "Nombre A-Z" },
  { value: "gpa",   label: "Mayor promedio" },
] as const;

const AVAIL_CONFIG: Record<string, { color: string; icon: LucideIcon; bg: string }> = {
  "Disponible":    { color: "text-emerald-600", icon: CheckCircle, bg: "bg-emerald-50" },
  "En prácticas":  { color: "text-amber-600",   icon: Clock,       bg: "bg-amber-50" },
  "No disponible": { color: "text-red-500",      icon: XCircle,     bg: "bg-red-50" },
};

interface TalentProfile {
  id: string; name: string; role: string; avatar: string;
  bio: string; location: string; specialty: string; title: string;
  xp: number; level: number; gpa: number | null; availability: string;
  years_experience: number; email: string;
}

const PAGE_SIZE = 20;

export default function TalentPage() {
  const { role: viewerRole } = useRole();
  const { user } = useAuth();

  const [profiles, setProfiles] = useState<TalentProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacting, setContacting] = useState<string | null>(null);
  const [contacted, setContacted] = useState<Set<string>>(new Set());

  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("Todas");
  const [roleFilter, setRoleFilter] = useState<string>("Todos");
  const [availability, setAvailability] = useState<string>("Todos");
  const [sortBy, setSortBy] = useState<string>("level");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchProfiles = useCallback(async (pageNum: number, append = false) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    let query = supabase
      .from("profiles")
      .select("id,name,role,avatar,bio,location,specialty,title,xp,level,gpa,availability,years_experience,email", { count: "exact" })
      .in("role", ["Estudiante", "Egresado"])
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    if (specialty !== "Todas") query = query.eq("specialty", specialty);
    if (roleFilter !== "Todos") query = query.eq("role", roleFilter);
    if (availability !== "Todos") query = query.eq("availability", availability);
    if (search.trim()) query = query.ilike("name", `%${search.trim()}%`);

    switch (sortBy) {
      case "level": query = query.order("level", { ascending: false }); break;
      case "name":  query = query.order("name", { ascending: true }); break;
      case "gpa":   query = query.order("gpa", { ascending: false, nullsFirst: false }); break;
    }

    const { data, error: err, count } = await query;
    if (err || !data) {
      setError("No se pudo cargar el directorio.");
    } else {
      setProfiles(append ? (prev) => [...prev, ...(data as TalentProfile[])] : (data as TalentProfile[]));
      setTotal(count ?? 0);
    }
    setLoading(false);
    setLoadingMore(false);
  }, [specialty, roleFilter, availability, search, sortBy]);

  useEffect(() => { setPage(0); fetchProfiles(0, false); }, [fetchProfiles]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchProfiles(next, true);
  };

  const handleContact = async (talent: TalentProfile) => {
    if (!user?.id || !talent.id) return;
    setContacting(talent.id);
    // Check if conversation already exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${talent.id}),and(user1_id.eq.${talent.id},user2_id.eq.${user.id})`)
      .maybeSingle();

    if (!existing) {
      await supabase.from("conversations").insert({
        user1_id: user.id,
        user2_id: talent.id,
        last_message_at: new Date().toISOString(),
      });
    }
    setContacted((prev) => new Set(prev).add(talent.id));
    setContacting(null);
  };

  const activeFilterCount = [
    specialty !== "Todas", roleFilter !== "Todos", availability !== "Todos",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSpecialty("Todas"); setRoleFilter("Todos");
    setAvailability("Todos"); setSearch("");
  };

  const ctaLabel = viewerRole === "Empresa" ? "Solicitar Contacto"
                 : viewerRole === "Colegio" ? "Solicitar vía Colegio"
                 : "Contactar";
  const ctaClass = viewerRole === "Empresa" ? "bg-violet-600 hover:bg-violet-700"
                 : viewerRole === "Colegio" ? "bg-amber-600 hover:bg-amber-700"
                 : "bg-cyan-600 hover:bg-cyan-700";

  return (
    <PageLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-5">
        <div className="animate-fade-in-up">
          <p className="text-sm text-cyan-600 font-semibold mb-1">Directorio Académico</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Buscador de Talento</h1>
          <p className="text-slate-500 text-sm mt-1">{total} perfiles en el sistema</p>
        </div>

        {/* Search + filter bar */}
        <div className="flex gap-3 animate-fade-in-up stagger-1">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, habilidad, especialidad..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none transition-shadow"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${showFilters || activeFilterCount > 0 ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
          >
            <SlidersHorizontal size={16} />
            Filtros
            {activeFilterCount > 0 && (
              <span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${showFilters ? "bg-white text-cyan-600" : "bg-cyan-600 text-white"}`}>
                {activeFilterCount}
              </span>
            )}
          </button>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 focus:ring-2 focus:ring-cyan-200 outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {showFilters && (
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 grid grid-cols-1 md:grid-cols-3 gap-4 animate-scale-in">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 block">Especialidad</label>
              <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 outline-none bg-white"
              >
                {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 block">Tipo</label>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 outline-none bg-white"
              >
                {ROLE_FILTERS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 block">Disponibilidad</label>
              <select value={availability} onChange={(e) => setAvailability(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 outline-none bg-white"
              >
                {AVAILABILITY_FILTERS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            {activeFilterCount > 0 && (
              <div className="md:col-span-3 flex justify-end">
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
                  <X size={14} /> Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error} <button onClick={() => fetchProfiles(0)} className="ml-2 underline hover:no-underline">Reintentar</button>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-cyan-400" />
          </div>
        )}

        {!loading && profiles.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/60">
            <Search size={48} className="mx-auto mb-4 text-slate-200" />
            <p className="text-slate-400 text-base font-medium">No se encontraron perfiles.</p>
            <button onClick={clearFilters} className="mt-3 text-sm text-cyan-600 font-semibold hover:underline">Limpiar filtros</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map((t, i) => {
            const avail = AVAIL_CONFIG[t.availability] ?? AVAIL_CONFIG["Disponible"];
            const AvailIcon = avail.icon;
            const isExpanded = expandedId === t.id;
            const hasContacted = contacted.has(t.id);

            return (
              <article key={t.id}
                className={`bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-md transition-all duration-200 animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-3.5">
                    {t.avatar ? (
                      <img src={t.avatar} alt={t.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shrink-0">
                        <span className="text-white font-black text-xl">{t.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-base leading-tight">{t.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{t.title || t.specialty}</p>
                        </div>
                        <span className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold ${avail.bg} ${avail.color}`}>
                          <AvailIcon size={10} /> {t.availability}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        {t.location && <span className="flex items-center gap-1"><MapPin size={11} />{t.location}</span>}
                        <span className="flex items-center gap-1"><Star size={11} />Niv. {t.level}</span>
                        {t.gpa && <span className="flex items-center gap-1"><Award size={11} />{t.gpa.toFixed(1)}</span>}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 animate-fade-in-up">
                      {t.bio && <p className="text-sm text-slate-600 leading-relaxed">{t.bio}</p>}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {t.specialty && <span className="bg-cyan-50 text-cyan-700 px-2.5 py-1 rounded-lg font-semibold">{t.specialty}</span>}
                        {t.years_experience > 0 && <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">{t.years_experience} {t.years_experience === 1 ? "año exp." : "años exp."}</span>}
                        {t.gpa && <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg font-semibold">Promedio {t.gpa.toFixed(1)}</span>}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <button onClick={() => setExpandedId(isExpanded ? null : t.id)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
                    >
                      <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      {isExpanded ? "Menos" : "Ver más"}
                    </button>
                    <button
                      onClick={() => handleContact(t)}
                      disabled={hasContacted || contacting === t.id || !user}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all btn-press disabled:opacity-50 ${hasContacted ? "bg-emerald-500" : ctaClass}`}
                    >
                      {contacting === t.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : hasContacted ? (
                        <><CheckCircle size={12} /> Contactado</>
                      ) : (
                        <><MessageCircle size={12} /> {ctaLabel}</>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {!loading && profiles.length < total && (
          <div className="flex justify-center pt-4">
            <button onClick={loadMore} disabled={loadingMore}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {loadingMore ? <Loader2 size={16} className="animate-spin" /> : null}
              Cargar más ({total - profiles.length} restantes)
            </button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
