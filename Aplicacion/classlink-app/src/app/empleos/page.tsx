"use client";
import { useState, useEffect, useCallback } from "react";
import PageLayout from "@/components/layout/PageLayout";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/lib/auth-context";
import { useRole } from "@/lib/role-context";
import { supabase } from "@/lib/supabase";
import { jobPostingSchema } from "@/lib/schemas";
import { updateApplicationStatusSA } from "@/app/actions/company";
import {
  Briefcase, MapPin, Plus, Loader2, ChevronDown, X, Send, CheckCircle,
  Users, CheckCircle2, XCircle, ArrowUp, ArrowDown, Trophy,
} from "lucide-react";

interface JobPosting {
  id: string; title: string; description: string; location: string;
  type: string; specialty: string; salary_min: number | null;
  salary_max: number | null; active: boolean; created_at: string;
  company_id: string; max_candidates: number | null;
  company?: { name: string; avatar: string; };
}

interface Applicant {
  id: string; job_id: string; applicant_id: string;
  status: "pending" | "accepted" | "rejected" | "hired";
  priority: number; created_at: string;
  profile?: { id: string; name: string; avatar: string | null; specialty: string | null; };
}

interface Application {
  id: string; job_id: string; applicant_id: string;
  status: string; created_at: string;
}

export default function EmpleosPage() {
  const { user } = useAuth();
  const { role } = useRole();
  const isCompany = role === "Empresa";

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editJob, setEditJob] = useState<JobPosting | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form state
  const [fTitle, setFTitle] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fLocation, setFLocation] = useState("");
  const [fType, setFType] = useState("full-time");
  const [fSpecialty, setFSpecialty] = useState("");
  const [fMaxCandidates, setFMaxCandidates] = useState<number | "">(10);

  // Applicant management (company view)
  const [applicantMap, setApplicantMap] = useState<Record<string, Applicant[]>>({});
  const [loadingApplicants, setLoadingApplicants] = useState<string | null>(null);
  const [updatingApp, setUpdatingApp] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true); setError(null);
    let query;

    if (isCompany && user?.id) {
      query = supabase
        .from("job_postings")
        .select("*, company:profiles!job_postings_company_id_fkey(name,avatar)")
        .eq("company_id", user.id)
        .order("created_at", { ascending: false });
    } else {
      query = supabase
        .from("job_postings")
        .select("*, company:profiles!job_postings_company_id_fkey(name,avatar)")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(50);
    }

    const { data, error: err } = await query;
    if (err) { setError("No se pudieron cargar las vacantes."); }
    else { setJobs(data as JobPosting[]); }
    setLoading(false);
  }, [isCompany, user?.id]);

  const fetchMyApplications = useCallback(async () => {
    if (!user?.id || isCompany) return;
    const { data } = await supabase
      .from("job_applications")
      .select("job_id")
      .eq("applicant_id", user.id);
    setAppliedIds(new Set((data ?? []).map((a: any) => a.job_id)));
  }, [user?.id, isCompany]);

  useEffect(() => { fetchJobs(); fetchMyApplications(); }, [fetchJobs, fetchMyApplications]);

  const openCreate = () => {
    setEditJob(null);
    setFTitle(""); setFDesc(""); setFLocation(""); setFType("full-time"); setFSpecialty(""); setFMaxCandidates(10);
    setSaveError(null);
    setCreateOpen(true);
  };

  const openEdit = (job: JobPosting) => {
    setEditJob(job);
    setFTitle(job.title); setFDesc(job.description); setFLocation(job.location ?? "");
    setFType(job.type); setFSpecialty(job.specialty ?? ""); setFMaxCandidates(job.max_candidates ?? 10);
    setSaveError(null);
    setCreateOpen(true);
  };

  // ── Fetch applicants for a job (company only) ──────────
  const fetchApplicants = async (jobId: string) => {
    if (applicantMap[jobId]) {
      // Already loaded — toggle visibility via expandedId
      setExpandedId((prev) => prev === jobId ? null : jobId);
      return;
    }
    setLoadingApplicants(jobId);
    const { data } = await supabase
      .from("job_applications")
      .select("id, job_id, applicant_id, status, created_at, profiles!job_applications_student_id_fkey(id, name, avatar, specialty)")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true });

    const mapped: Applicant[] = (data ?? []).map((r: any, idx: number) => ({
      id:           r.id,
      job_id:       r.job_id,
      applicant_id: r.applicant_id,
      status:       ["pending","accepted","rejected","hired"].includes(r.status) ? r.status : "pending",
      priority:     idx + 1,
      created_at:   r.created_at,
      profile:      r.profiles ? { id: r.profiles.id, name: r.profiles.name, avatar: r.profiles.avatar, specialty: r.profiles.specialty } : undefined,
    }));
    setApplicantMap((prev) => ({ ...prev, [jobId]: mapped }));
    setLoadingApplicants(null);
    setExpandedId(jobId);
  };

  const updateApplicantStatus = async (jobId: string, appId: string, newStatus: "accepted" | "rejected" | "hired") => {
    setUpdatingApp(appId);
    // Server action enforces max_candidates limit and verifies company ownership
    const res = await updateApplicationStatusSA(appId, jobId, newStatus);
    setUpdatingApp(null);
    if ("error" in res && res.error) {
      alert(res.error);
      return;
    }
    setApplicantMap((prev) => ({
      ...prev,
      [jobId]: (prev[jobId] ?? []).map((a) => a.id === appId ? { ...a, status: newStatus } : a),
    }));
  };

  const movePriority = async (jobId: string, appId: string, direction: "up" | "down") => {
    const list = [...(applicantMap[jobId] ?? [])];
    const idx = list.findIndex((a) => a.id === appId);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    [list[idx], list[swapIdx]] = [list[swapIdx], list[idx]];
    const updated = list.map((a, i) => ({ ...a, priority: i + 1 }));
    // Optimistic UI update
    setApplicantMap((prev) => ({ ...prev, [jobId]: updated }));
    // Persist to DB (fire-and-forget — UI is already updated; failures are non-critical)
    Promise.all(
      updated.map((a) =>
        supabase.from("job_applications").update({ priority: a.priority }).eq("id", a.id)
      )
    ).catch(() => {});
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true); setSaveError(null);

    const parsed = jobPostingSchema.safeParse({ title: fTitle, description: fDesc, location: fLocation, type: fType, specialty: fSpecialty });
    if (!parsed.success) { setSaveError(parsed.error.issues[0]?.message ?? "Error de validación"); setSaving(false); return; }

    const maxCand = fMaxCandidates === "" ? null : Number(fMaxCandidates);
    if (editJob) {
      const { error: err } = await supabase
        .from("job_postings")
        .update({ title: fTitle, description: fDesc, location: fLocation, type: fType, specialty: fSpecialty, max_candidates: maxCand })
        .eq("id", editJob.id)
        .eq("company_id", user.id);
      if (err) { setSaveError(err.message); setSaving(false); return; }
    } else {
      const { error: err } = await supabase
        .from("job_postings")
        .insert({ title: fTitle, description: fDesc, location: fLocation, type: fType, specialty: fSpecialty, company_id: user.id, active: true, max_candidates: maxCand });
      if (err) { setSaveError(err.message); setSaving(false); return; }
    }

    await fetchJobs();
    setCreateOpen(false);
    setSaving(false);
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("¿Eliminar esta vacante?")) return;
    await supabase.from("job_postings").delete().eq("id", jobId).eq("company_id", user?.id ?? "");
    await fetchJobs();
  };

  const handleApply = async (jobId: string) => {
    if (!user?.id) return;
    setApplying(jobId);
    const { error: err } = await supabase
      .from("job_applications")
      .insert({ job_id: jobId, applicant_id: user.id, status: "pending" });
    if (!err) {
      setAppliedIds((prev) => new Set(prev).add(jobId));
      // Award XP for applying (fire-and-forget via server route)
      fetch("/api/xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, type: "job_apply", xp_amount: 50, metadata: { job_id: jobId } }),
      }).catch(() => {});
    }
    setApplying(null);
  };

  return (
    <PageLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-5">
        <div className="flex items-start justify-between animate-fade-in-up">
          <div>
            <p className="text-sm text-cyan-600 font-semibold mb-1">Oportunidades</p>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {isCompany ? "Mis Vacantes" : "Empleos y Pasantías"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isCompany ? "Gestiona tus publicaciones" : "Encuentra tu próxima oportunidad"}
            </p>
          </div>
          {isCompany && (
            <button onClick={openCreate}
              className="flex items-center gap-1.5 bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors shadow-sm btn-press"
            >
              <Plus size={16} /> Nueva vacante
            </button>
          )}
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>}

        {loading && <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-cyan-400" /></div>}

        {!loading && jobs.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/60">
            <Briefcase size={48} className="mx-auto mb-4 text-slate-200" />
            <p className="text-slate-400 font-medium">{isCompany ? "Aún no has publicado vacantes." : "No hay vacantes disponibles."}</p>
            {isCompany && <button onClick={openCreate} className="mt-3 text-sm text-violet-600 font-semibold hover:underline">Publicar primera vacante</button>}
          </div>
        )}

        <div className="space-y-4">
          {jobs.map((job, i) => {
            const isExpanded = expandedId === job.id;
            const hasApplied = appliedIds.has(job.id);
            const jobApplicants = applicantMap[job.id] ?? [];
            const acceptedCount = jobApplicants.filter((a) => a.status === "accepted" || a.status === "hired").length;
            const maxReached = job.max_candidates != null && acceptedCount >= job.max_candidates;

            return (
              <article key={job.id}
                className={`bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-md transition-all animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    {job.company?.avatar ? (
                      <img src={job.company.avatar} alt={job.company.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                        <Briefcase size={20} className="text-violet-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base">{job.title}</h3>
                      <p className="text-sm text-slate-500">{job.company?.name ?? "Empresa"}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                        {job.location && <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>}
                        <span className="bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md font-semibold capitalize">{job.type}</span>
                        {job.specialty && <span className="bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-md font-semibold">{job.specialty}</span>}
                        {isCompany && job.max_candidates != null && (
                          <span className={`px-2 py-0.5 rounded-md font-semibold ${maxReached ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>
                            {acceptedCount}/{job.max_candidates} cupos
                          </span>
                        )}
                        {!job.active && <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded-md font-semibold">Cerrada</span>}
                      </div>
                    </div>
                  </div>

                  {/* Description (non-company, expanded) */}
                  {isExpanded && !isCompany && (
                    <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-in-up">
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                    </div>
                  )}

                  {/* ── Applicant Management Panel (company only, expanded) ── */}
                  {isExpanded && isCompany && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-fade-in-up">
                      {/* Description */}
                      {job.description && (
                        <div className="bg-slate-50 rounded-xl p-4">
                          <p className="text-xs font-bold text-slate-500 mb-1.5">Descripción del puesto</p>
                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                        </div>
                      )}

                      {/* Candidate metrics */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                          <p className="text-xl font-extrabold text-amber-600">{jobApplicants.filter((a) => a.status === "pending").length}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Pendientes</p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                          <p className="text-xl font-extrabold text-emerald-600">{acceptedCount}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Aceptados</p>
                        </div>
                        <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-center">
                          <p className="text-xl font-extrabold text-violet-600">{jobApplicants.filter((a) => a.status === "hired").length}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Contratados</p>
                        </div>
                      </div>

                      {maxReached && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-red-600">
                          Límite de candidatos alcanzado ({job.max_candidates}). Rechaza alguno para aceptar nuevos.
                        </div>
                      )}

                      {/* Applicants list */}
                      <div>
                        <h4 className="font-bold text-sm text-slate-700 mb-3">Postulantes por Prioridad</h4>
                        {loadingApplicants === job.id ? (
                          <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-violet-400" /></div>
                        ) : jobApplicants.length === 0 ? (
                          <div className="text-center py-8 bg-slate-50 rounded-xl">
                            <Users size={32} className="mx-auto mb-2 text-slate-200" />
                            <p className="text-sm text-slate-400">Aún no hay postulantes.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {jobApplicants.map((app, idx) => (
                              <div
                                key={app.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                  app.status === "hired"    ? "border-violet-200 bg-violet-50/30"
                                  : app.status === "accepted" ? "border-emerald-200 bg-emerald-50/20"
                                  : app.status === "rejected" ? "border-red-100 bg-red-50/10 opacity-60"
                                  : "border-slate-100 bg-white"
                                }`}
                              >
                                {/* Priority badge */}
                                <span className="text-[11px] font-extrabold text-slate-400 w-5 text-center shrink-0">
                                  #{app.priority}
                                </span>

                                {/* Avatar */}
                                {app.profile?.avatar ? (
                                  <img src={app.profile.avatar} alt={app.profile.name} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                                    {(app.profile?.name ?? "?").charAt(0)}
                                  </div>
                                )}

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold truncate">{app.profile?.name ?? "Candidato"}</p>
                                  <p className="text-[11px] text-slate-400">{app.profile?.specialty ?? "Sin especialidad"}</p>
                                </div>

                                {/* Status badge */}
                                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  app.status === "hired"    ? "bg-violet-100 text-violet-700"
                                  : app.status === "accepted" ? "bg-emerald-100 text-emerald-700"
                                  : app.status === "rejected" ? "bg-red-50 text-red-500"
                                  : "bg-amber-50 text-amber-700"
                                }`}>
                                  {app.status === "hired" ? "Contratado" : app.status === "accepted" ? "Aceptado" : app.status === "rejected" ? "Rechazado" : "Pendiente"}
                                </span>

                                {/* Priority controls */}
                                <div className="flex flex-col gap-0.5 shrink-0">
                                  <button
                                    onClick={() => movePriority(job.id, app.id, "up")}
                                    disabled={idx === 0}
                                    className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20"
                                  >
                                    <ArrowUp size={11} />
                                  </button>
                                  <button
                                    onClick={() => movePriority(job.id, app.id, "down")}
                                    disabled={idx === jobApplicants.length - 1}
                                    className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20"
                                  >
                                    <ArrowDown size={11} />
                                  </button>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-1.5 shrink-0">
                                  {app.status === "pending" && (
                                    <>
                                      <button
                                        onClick={() => updateApplicantStatus(job.id, app.id, "accepted")}
                                        disabled={updatingApp === app.id || maxReached}
                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50"
                                      >
                                        {updatingApp === app.id ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={11} />}
                                        Aceptar
                                      </button>
                                      <button
                                        onClick={() => updateApplicantStatus(job.id, app.id, "rejected")}
                                        disabled={updatingApp === app.id}
                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50"
                                      >
                                        {updatingApp === app.id ? <Loader2 size={10} className="animate-spin" /> : <XCircle size={11} />}
                                        Rechazar
                                      </button>
                                    </>
                                  )}
                                  {app.status === "accepted" && (
                                    <button
                                      onClick={() => updateApplicantStatus(job.id, app.id, "hired")}
                                      disabled={updatingApp === app.id}
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-100 hover:bg-violet-200 text-violet-700 text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50"
                                    >
                                      {updatingApp === app.id ? <Loader2 size={10} className="animate-spin" /> : <Trophy size={11} />}
                                      Contratar
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => isCompany ? fetchApplicants(job.id) : setExpandedId(isExpanded ? null : job.id)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 font-medium"
                    >
                      {loadingApplicants === job.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      }
                      {isCompany
                        ? isExpanded ? "Cerrar" : "Ver postulantes"
                        : isExpanded ? "Menos" : "Ver descripción"
                      }
                    </button>
                    <div className="flex items-center gap-2">
                      {isCompany ? (
                        <>
                          <button onClick={() => openEdit(job)} className="px-3 py-1.5 rounded-xl text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 transition-colors">Editar</button>
                          <button onClick={() => handleDelete(job.id)} className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors">Eliminar</button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleApply(job.id)}
                          disabled={hasApplied || applying === job.id || !job.active}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all btn-press disabled:opacity-50 ${hasApplied ? "bg-emerald-500" : "bg-cyan-600 hover:bg-cyan-700"}`}
                        >
                          {applying === job.id ? <Loader2 size={12} className="animate-spin" /> :
                           hasApplied ? <><CheckCircle size={12} />Postulado</> :
                           <><Send size={12} />Postularse</>}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={editJob ? "Editar Vacante" : "Nueva Vacante"}>
        <div className="space-y-4">
          {saveError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{saveError}</div>}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Título del puesto</label>
            <input value={fTitle} onChange={(e) => setFTitle(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none" placeholder="Ej: Técnico en Mecatrónica" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Descripción</label>
            <textarea value={fDesc} onChange={(e) => setFDesc(e.target.value)} rows={4} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none resize-none" placeholder="Describe el puesto, requisitos y beneficios..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tipo</label>
              <select value={fType} onChange={(e) => setFType(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 outline-none bg-white">
                <option value="full-time">Tiempo completo</option>
                <option value="part-time">Medio tiempo</option>
                <option value="pasantia">Pasantía</option>
                <option value="contrato">Contrato</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Especialidad</label>
              <select value={fSpecialty} onChange={(e) => setFSpecialty(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 outline-none bg-white">
                <option value="">Todas</option>
                <option>Mecatrónica</option>
                <option>Electricidad</option>
                <option>Soldadura</option>
                <option>Ebanistería</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Ubicación</label>
            <input value={fLocation} onChange={(e) => setFLocation(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none" placeholder="Ej: San José, Costa Rica" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Límite máximo de candidatos aceptados</label>
            <input
              type="number" min={1} max={999}
              value={fMaxCandidates}
              onChange={(e) => setFMaxCandidates(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none"
              placeholder="Ej: 5"
            />
            <p className="text-[11px] text-slate-400 mt-1">El sistema bloqueará aceptar más candidatos cuando se alcance este límite.</p>
          </div>
          <button onClick={handleSave} disabled={saving || !fTitle.trim() || !fDesc.trim()}
            className="w-full bg-violet-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-violet-700 disabled:opacity-40 transition-colors btn-press flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={16} className="animate-spin" />Guardando…</> : editJob ? "Guardar cambios" : "Publicar vacante"}
          </button>
        </div>
      </Modal>
    </PageLayout>
  );
}
