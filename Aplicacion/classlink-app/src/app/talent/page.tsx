"use client";
import { useState, useMemo } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { useRole } from "@/lib/role-context";
import { TALENT_PROFILES } from "@/lib/data";
import { Search, SlidersHorizontal, MapPin, Award, Star, CheckCircle, Clock, XCircle, ChevronDown, X, ArrowUpDown, Briefcase, GraduationCap } from "lucide-react";

const SPECIALTIES = ["Todas", "Mecatrónica", "Electricidad", "Soldadura", "Ebanistería"];
const ROLE_FILTERS = ["Todos", "Estudiante", "Egresado"] as const;
const AVAILABILITY_FILTERS = ["Todos", "Disponible", "En prácticas", "No disponible"] as const;
const SORT_OPTIONS = [
  { value: "match", label: "Mayor compatibilidad" },
  { value: "level", label: "Mayor nivel" },
  { value: "name", label: "Nombre A-Z" },
  { value: "gpa", label: "Mayor promedio" },
] as const;

const AVAIL_CONFIG: Record<string, { color: string; icon: any; bg: string }> = {
  "Disponible": { color: "text-emerald-600", icon: CheckCircle, bg: "bg-emerald-50" },
  "En prácticas": { color: "text-amber-600", icon: Clock, bg: "bg-amber-50" },
  "No disponible": { color: "text-red-500", icon: XCircle, bg: "bg-red-50" },
};

export default function TalentPage() {
  const { role: viewerRole } = useRole();
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("Todas");
  const [roleFilter, setRoleFilter] = useState<string>("Todos");
  const [availability, setAvailability] = useState<string>("Todos");
  const [sortBy, setSortBy] = useState<string>("match");
  const [contacted, setContacted] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let results = TALENT_PROFILES.filter((t) => {
      const matchSearch = search === "" ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.skills.some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.specialty.toLowerCase().includes(search.toLowerCase());
      const matchSpec = specialty === "Todas" || t.specialty === specialty;
      const matchRole = roleFilter === "Todos" || t.role === roleFilter;
      const matchAvail = availability === "Todos" || t.availability === availability;
      return matchSearch && matchSpec && matchRole && matchAvail;
    });

    results.sort((a, b) => {
      switch (sortBy) {
        case "match": return (b.matchScore || 0) - (a.matchScore || 0);
        case "level": return b.level - a.level;
        case "name": return a.name.localeCompare(b.name);
        case "gpa": return (b.gpa || 0) - (a.gpa || 0);
        default: return 0;
      }
    });
    return results;
  }, [search, specialty, roleFilter, availability, sortBy]);

  const activeFilterCount = [specialty !== "Todas", roleFilter !== "Todos", availability !== "Todos"].filter(Boolean).length;
  const clearFilters = () => { setSpecialty("Todas"); setRoleFilter("Todos"); setAvailability("Todos"); setSearch(""); };

  return (
    <PageLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-5">
        {/* Header */}
        <div>
          <p className="text-sm text-cyan-600 font-semibold mb-1">Directorio Académico</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Buscador de Talento</h1>
          <p className="text-slate-500 text-sm mt-1">{TALENT_PROFILES.length} perfiles en el sistema</p>
        </div>

        {/* Search + Filter Toggle */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, habilidad, especialidad..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={14} className="text-slate-400" /></button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${showFilters || activeFilterCount > 0 ? "bg-cyan-50 border-cyan-200 text-cyan-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            <SlidersHorizontal size={16} />
            <span>Filtros</span>
            {activeFilterCount > 0 && <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-[10px] flex items-center justify-center font-bold">{activeFilterCount}</span>}
          </button>
          <div className="relative">
            <select
              value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2.5 text-sm font-medium text-slate-600 focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ArrowUpDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-slate-200/60 p-4 flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[160px]">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Especialidad</label>
              <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-200 outline-none">
                {SPECIALTIES.map((s) => <option key={s} value={s}>{s === "Todas" ? "Todas las Especialidades" : s}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tipo de Perfil</label>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-200 outline-none">
                {ROLE_FILTERS.map((r) => <option key={r} value={r}>{r === "Todos" ? "Todos los Perfiles" : r}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Disponibilidad</label>
              <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-200 outline-none">
                {AVAILABILITY_FILTERS.map((a) => <option key={a} value={a}>{a === "Todos" ? "Cualquier estado" : a}</option>)}
              </select>
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs font-semibold text-red-500 hover:underline pb-2">Limpiar filtros</button>
            )}
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</p>
          {activeFilterCount > 0 && !showFilters && (
            <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"><X size={12} /> Limpiar</button>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t) => {
            const isContacted = contacted.has(t.id);
            const isExpanded = expandedId === t.id;
            const avail = AVAIL_CONFIG[t.availability];
            const AvailIcon = avail?.icon || CheckCircle;

            return (
              <div key={t.id} className="bg-white rounded-xl border border-slate-200/60 overflow-hidden hover:border-cyan-200 transition-all">
                <div className="p-4">
                  {/* Top row */}
                  <div className="flex gap-3 mb-3">
                    <img src={t.avatar} alt={t.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm truncate">{t.name}</h3>
                        {t.matchScore && (
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <Star size={12} className="text-amber-400 fill-amber-400" />
                            <span className="text-sm font-bold text-amber-600">{t.matchScore}%</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-cyan-600 font-medium">{t.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[11px] text-slate-400"><MapPin size={10} />{t.location}</span>
                        <span className={`flex items-center gap-1 text-[11px] ${avail?.color}`}><AvailIcon size={10} />{t.availability}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags row */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${t.role === "Egresado" ? "bg-emerald-50 text-emerald-700" : "bg-cyan-50 text-cyan-700"}`}>
                      {t.role === "Egresado" ? "💼" : "🎓"} {t.role}
                    </span>
                    <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{t.specialty}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">Nivel {t.level}</span>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {t.skills.slice(0, 4).map((skill) => (
                      <span key={skill} className="text-[10px] bg-slate-50 border border-slate-100 px-2 py-0.5 rounded font-medium text-slate-600">{skill}</span>
                    ))}
                    {t.skills.length > 4 && <span className="text-[10px] text-slate-400 font-medium">+{t.skills.length - 4} más</span>}
                  </div>

                  {/* Expandable Details */}
                  <button onClick={() => setExpandedId(isExpanded ? null : t.id)} className="text-[11px] text-cyan-600 font-medium hover:underline flex items-center gap-1 mb-3">
                    <ChevronDown size={12} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    {isExpanded ? "Menos detalles" : "Ver más detalles"}
                  </button>

                  {isExpanded && (
                    <div className="mb-3 p-3 bg-slate-50 rounded-lg space-y-2 text-xs">
                      <p className="text-slate-600">{t.bio}</p>
                      {t.gpa && <p className="text-slate-500">📊 Promedio: <span className="font-bold text-slate-700">{t.gpa}%</span></p>}
                      {t.yearsExperience && <p className="text-slate-500">⏱️ Experiencia: <span className="font-bold text-slate-700">{t.yearsExperience} años</span></p>}
                      {t.certifications.length > 0 && (
                        <div>
                          <p className="text-slate-500 mb-1">🏆 Certificaciones:</p>
                          <div className="flex flex-wrap gap-1">
                            {t.certifications.map((c) => (
                              <span key={c} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold">{c}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {t.portfolio.length > 0 && (
                        <div>
                          <p className="text-slate-500 mb-1">📂 Portafolio ({t.portfolio.length}):</p>
                          {t.portfolio.map((pi) => (
                            <div key={pi.id} className="bg-white p-2 rounded border border-slate-100 mb-1">
                              <p className="font-semibold text-slate-700">{pi.title}</p>
                              <p className="text-slate-500">{pi.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  {isContacted ? (
                    <div className="flex items-center justify-center gap-1.5 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold">
                      <CheckCircle size={14} /> Solicitud Enviada
                    </div>
                  ) : (
                    <button
                      onClick={() => setContacted((prev) => new Set(prev).add(t.id))}
                      className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
                        viewerRole === "Empresa"
                          ? "bg-violet-600 text-white hover:bg-violet-700"
                          : viewerRole === "Estudiante"
                          ? "border border-cyan-200 text-cyan-600 hover:bg-cyan-50"
                          : viewerRole === "Egresado"
                          ? "bg-cyan-600 text-white hover:bg-cyan-700"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {viewerRole === "Empresa" ? "Solicitar Contacto" : viewerRole === "Estudiante" ? "Solicitar vía Colegio" : viewerRole === "Egresado" ? "Contacto Directo" : "Ver Perfil Completo"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200/60">
            <Search size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">No se encontraron perfiles</p>
            <p className="text-sm text-slate-400 mt-1">Prueba ajustando los filtros de búsqueda</p>
            <button onClick={clearFilters} className="mt-3 text-sm text-cyan-600 font-semibold hover:underline">Limpiar filtros</button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
