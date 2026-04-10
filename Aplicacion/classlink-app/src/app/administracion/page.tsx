"use client";
// ──────────────────────────────────────────────────────────
// Administración – School admin panel (students, stats, solicitudes)
// Migrated from the Profile page tabs to a dedicated route.
// ──────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import PageLayout from "@/components/layout/PageLayout";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/lib/auth-context";
import { useRole } from "@/lib/role-context";
import { supabase } from "@/lib/supabase";
import {
  createStudent,
  graduateStudent,
  updateStudentProfile,
  upsertSchoolReport,
} from "@/app/actions/school";
import { updateInternshipRequest } from "@/app/actions/company";
import {
  GraduationCap, Plus, Search, TrendingUp, Users, FileText,
  Loader2, CheckCircle2, XCircle, ChevronRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────

interface DbStudent {
  id: string; name: string; email: string; avatar: string | null;
  specialty: string | null; grade: string | null;
  attendance: number | null; availability: string | null;
  soft_skills: string[] | null;
}

interface DbInternshipRequest {
  id: string; company_id: string; title: string;
  description: string | null; specialty: string | null;
  slots: number; urgent: boolean;
  status: "pendiente" | "aprobado" | "rechazado";
  created_at: string;
  profiles?: { name: string; company_name: string | null; avatar: string | null } | null;
}

type AdminTab = "Mis Estudiantes" | "Estadísticas" | "Solicitudes";

// ── Component ─────────────────────────────────────────────

export default function AdministracionPage() {
  const { user } = useAuth();
  const { role } = useRole();

  const [tab, setTab] = useState<AdminTab>("Mis Estudiantes");

  // ── Students ──────────────────────────────────────────
  const [dbStudents,      setDbStudents]      = useState<DbStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [schoolSearch,    setSchoolSearch]    = useState("");
  const [schoolSpecialty, setSchoolSpecialty] = useState("Todos");

  // ── Add student modal ─────────────────────────────────
  const [addStudentOpen,  setAddStudentOpen]  = useState(false);
  const [newStFirstName,  setNewStFirstName]  = useState("");
  const [newStLastName,   setNewStLastName]   = useState("");
  const [newStEmail,      setNewStEmail]      = useState("");
  const [newStPassword,   setNewStPassword]   = useState("");
  const [newStSpecialty,  setNewStSpecialty]  = useState("");
  const [newStGrade,      setNewStGrade]      = useState("");
  const [addStudentErr,   setAddStudentErr]   = useState<string | null>(null);
  const [addStudentOk,    setAddStudentOk]    = useState(false);
  const [addStudentBusy,  setAddStudentBusy]  = useState(false);

  // ── Graduate ──────────────────────────────────────────
  const [graduatingId,    setGraduatingId]    = useState<string | null>(null);

  // ── Per-student management panel ──────────────────────
  const [managingId,      setManagingId]      = useState<string | null>(null);
  const [mgmtAtt,         setMgmtAtt]         = useState(0);
  const [mgmtSkillsStr,   setMgmtSkillsStr]   = useState("");
  const [mgmtPeriod,      setMgmtPeriod]      = useState("");
  const [mgmtSummary,     setMgmtSummary]     = useState("");
  const [mgmtTeacher,     setMgmtTeacher]     = useState("");
  const [mgmtBehavior,    setMgmtBehavior]    = useState("");
  const [mgmtReportLoaded,setMgmtReportLoaded]= useState(false);
  const [mgmtSaving,      setMgmtSaving]      = useState<"att"|"skills"|"report"|null>(null);
  const [mgmtMsg,         setMgmtMsg]         = useState<{type:"ok"|"err"; text:string}|null>(null);

  // ── Internship requests ───────────────────────────────
  const [internshipReqs,  setInternshipReqs]  = useState<DbInternshipRequest[]>([]);
  const [reqsLoading,     setReqsLoading]     = useState(false);
  const [updatingReq,     setUpdatingReq]     = useState<string | null>(null);

  // ── Data fetching ──────────────────────────────────────

  const fetchStudents = useCallback(async () => {
    if (!user?.id) return;
    setStudentsLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, name, email, avatar, specialty, grade, attendance, availability, soft_skills")
      .eq("school_id", user.id)
      .eq("role", "Estudiante")
      .order("name");
    setDbStudents((data ?? []) as DbStudent[]);
    setStudentsLoading(false);
  }, [user?.id]);

  const fetchInternshipRequests = useCallback(async () => {
    if (!user?.id) return;
    setReqsLoading(true);
    const { data } = await supabase
      .from("internship_requests")
      .select("id, company_id, title, description, specialty, slots, urgent, status, created_at, profiles!internship_requests_company_id_fkey(name, company_name, avatar)")
      .eq("school_id", user.id)
      .order("created_at", { ascending: false });
    setInternshipReqs((data ?? []) as unknown as DbInternshipRequest[]);
    setReqsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (role !== "Colegio") return;
    fetchStudents();
  }, [role, fetchStudents]);

  useEffect(() => {
    if (tab === "Solicitudes" && role === "Colegio") fetchInternshipRequests();
  }, [tab, role, fetchInternshipRequests]);

  // ── Computed values ────────────────────────────────────

  const filteredStudents = dbStudents.filter((s) => {
    const matchSearch = schoolSearch === "" ||
      s.name.toLowerCase().includes(schoolSearch.toLowerCase()) ||
      (s.specialty ?? "").toLowerCase().includes(schoolSearch.toLowerCase());
    const matchSpec = schoolSpecialty === "Todos" || s.specialty === schoolSpecialty;
    return matchSearch && matchSpec;
  });

  const avgAttendance = dbStudents.length === 0 ? 0
    : Math.round(dbStudents.reduce((a, s) => a + (s.attendance ?? 0), 0) / dbStudents.length);
  const inPractice = dbStudents.filter((s) => s.availability === "En prácticas").length;
  const available  = dbStudents.filter((s) => s.availability === "Disponible").length;

  // ── Handlers ──────────────────────────────────────────

  const handleAddStudent = async () => {
    setAddStudentErr(null);
    setAddStudentBusy(true);
    const result = await createStudent({
      firstName:    newStFirstName,
      lastName:     newStLastName,
      email:        newStEmail,
      tempPassword: newStPassword,
      specialty:    newStSpecialty || undefined,
      grade:        newStGrade || undefined,
    });
    setAddStudentBusy(false);
    if ("error" in result && result.error) {
      setAddStudentErr(result.error);
    } else {
      setAddStudentOk(true);
      setNewStFirstName(""); setNewStLastName(""); setNewStEmail("");
      setNewStPassword(""); setNewStSpecialty(""); setNewStGrade("");
      setTimeout(() => {
        setAddStudentOpen(false);
        setAddStudentOk(false);
        fetchStudents();
      }, 1200);
    }
  };

  const handleGraduate = async (studentId: string) => {
    if (!window.confirm("¿Graduar este estudiante? Su rol cambiará a Egresado.")) return;
    setGraduatingId(studentId);
    const result = await graduateStudent(studentId);
    setGraduatingId(null);
    if ("error" in result && result.error) {
      alert(result.error);
    } else {
      fetchStudents();
    }
  };

  const openManageStudent = async (s: DbStudent) => {
    setManagingId(s.id);
    setMgmtAtt(s.attendance ?? 0);
    setMgmtSkillsStr(Array.isArray(s.soft_skills) ? (s.soft_skills as string[]).join(", ") : "");
    setMgmtMsg(null);
    setMgmtReportLoaded(false);
    setMgmtPeriod(""); setMgmtSummary(""); setMgmtTeacher(""); setMgmtBehavior("");
    const { data } = await supabase
      .from("school_reports")
      .select("period, summary, teacher_comment, behavior_note")
      .eq("student_id", s.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (data) {
      setMgmtPeriod(data.period ?? "");
      setMgmtSummary(data.summary ?? "");
      setMgmtTeacher(data.teacher_comment ?? "");
      setMgmtBehavior(data.behavior_note ?? "");
    }
    setMgmtReportLoaded(true);
  };

  const handleSaveAtt = async () => {
    if (!managingId) return;
    setMgmtSaving("att"); setMgmtMsg(null);
    const res = await updateStudentProfile(managingId, { attendance: mgmtAtt });
    setMgmtSaving(null);
    if ("error" in res && res.error) { setMgmtMsg({ type: "err", text: res.error }); return; }
    setMgmtMsg({ type: "ok", text: "Asistencia guardada." });
    setDbStudents((prev) => prev.map((s) => s.id === managingId ? { ...s, attendance: mgmtAtt } : s));
  };

  const handleSaveSkills = async () => {
    if (!managingId) return;
    const skills = mgmtSkillsStr.split(",").map((s) => s.trim()).filter(Boolean);
    setMgmtSaving("skills"); setMgmtMsg(null);
    const res = await updateStudentProfile(managingId, { soft_skills: skills });
    setMgmtSaving(null);
    if ("error" in res && res.error) { setMgmtMsg({ type: "err", text: res.error }); return; }
    setMgmtMsg({ type: "ok", text: "Habilidades guardadas." });
    setDbStudents((prev) => prev.map((s) => s.id === managingId ? { ...s, soft_skills: skills } : s));
  };

  const handleSaveReport = async () => {
    if (!managingId) return;
    setMgmtSaving("report"); setMgmtMsg(null);
    const res = await upsertSchoolReport(managingId, {
      period: mgmtPeriod, summary: mgmtSummary,
      teacher_comment: mgmtTeacher, behavior_note: mgmtBehavior,
    });
    setMgmtSaving(null);
    if ("error" in res && res.error) { setMgmtMsg({ type: "err", text: res.error }); return; }
    setMgmtMsg({ type: "ok", text: "Reporte guardado." });
  };

  const handleUpdateReq = async (reqId: string, status: "aprobado" | "rechazado") => {
    setUpdatingReq(reqId);
    const res = await updateInternshipRequest(reqId, status);
    setUpdatingReq(null);
    if ("error" in res && res.error) { alert(res.error); return; }
    setInternshipReqs((prev) => prev.map((r) => r.id === reqId ? { ...r, status } : r));
  };

  // ── Guard: only Colegio ───────────────────────────────

  if (role !== "Colegio") {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-64">
          <p className="text-slate-400 text-sm">Acceso restringido a centros educativos.</p>
        </div>
      </PageLayout>
    );
  }

  // ── Render ────────────────────────────────────────────

  return (
    <PageLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">

        {/* ── Page Header ── */}
        <div className="animate-fade-in-up">
          <p className="text-sm text-amber-600 font-semibold mb-1">Panel del Centro</p>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Administración</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestiona tus estudiantes, estadísticas y solicitudes de práctica.
          </p>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1.5 bg-white border border-slate-200/60 rounded-xl p-1.5 w-fit animate-fade-in-up stagger-1">
          {(["Mis Estudiantes", "Estadísticas", "Solicitudes"] as AdminTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t
                  ? "bg-amber-50 text-amber-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            TAB: Mis Estudiantes
        ══════════════════════════════════════════════ */}
        {tab === "Mis Estudiantes" && (
          <div className="space-y-4 animate-fade-in-up">

            {/* Header row */}
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-slate-800">Mis Estudiantes</h2>
              <button
                onClick={() => { setAddStudentErr(null); setAddStudentOk(false); setAddStudentOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                <Plus size={14} /> Agregar Alumno
              </button>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/60 text-center">
                <p className="text-2xl font-extrabold text-amber-600">{dbStudents.length}</p>
                <p className="text-xs text-slate-500 mt-1">Total estudiantes</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200/60 text-center">
                <p className="text-2xl font-extrabold text-emerald-600">{avgAttendance}%</p>
                <p className="text-xs text-slate-500 mt-1">Asistencia promedio</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200/60 text-center">
                <p className="text-2xl font-extrabold text-violet-600">{inPractice}</p>
                <p className="text-xs text-slate-500 mt-1">En práctica</p>
              </div>
            </div>

            {/* Search + specialty filter */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/60 space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  placeholder="Buscar por nombre o especialidad..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {["Todos", "Mecatronica", "Electricidad", "Soldadura", "Ebanisteria", "Informática"].map((sp) => (
                  <button
                    key={sp}
                    onClick={() => setSchoolSpecialty(sp)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      schoolSpecialty === sp
                        ? "bg-amber-500 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {sp}
                  </button>
                ))}
              </div>
            </div>

            {/* Student list */}
            {studentsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={24} className="animate-spin text-amber-400" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60">
                <GraduationCap size={40} className="mx-auto mb-3 text-slate-200" />
                <p className="text-slate-400 font-medium">No hay estudiantes registrados.</p>
                <p className="text-xs text-slate-400 mt-1">Usa &ldquo;Agregar Alumno&rdquo; para crear el primero.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredStudents.map((s) => {
                  const att = s.attendance ?? 0;
                  const attColor = att >= 90 ? "bg-emerald-500" : att >= 75 ? "bg-amber-400" : "bg-red-400";
                  const availColor = s.availability === "Disponible"
                    ? "bg-emerald-50 text-emerald-700"
                    : s.availability === "En prácticas"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-slate-100 text-slate-500";
                  const isManaging = managingId === s.id;

                  return (
                    <div
                      key={s.id}
                      className={`bg-white rounded-2xl border transition-all ${
                        isManaging ? "border-amber-300 shadow-md" : "border-slate-200/60"
                      }`}
                    >
                      {/* Student summary row */}
                      <div className="p-4 flex items-center gap-4">
                        {s.avatar ? (
                          <img src={s.avatar} alt={s.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                            {s.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="text-sm font-bold truncate">{s.name}</p>
                            {s.grade && <span className="text-[10px] text-slate-500">{s.grade}</span>}
                            {s.specialty && (
                              <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
                                {s.specialty}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                              <div className={`h-full ${attColor} rounded-full transition-all`} style={{ width: `${att}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-500">{att}% asistencia</span>
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                          {s.availability && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${availColor}`}>
                              {s.availability}
                            </span>
                          )}
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => isManaging ? setManagingId(null) : openManageStudent(s)}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                                isManaging ? "bg-amber-100 text-amber-700" : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                              }`}
                            >
                              {isManaging ? "Cerrar" : "Gestionar"}
                            </button>
                            <button
                              onClick={() => handleGraduate(s.id)}
                              disabled={graduatingId === s.id}
                              className="text-[10px] font-bold px-2.5 py-1 bg-violet-50 text-violet-600 hover:bg-violet-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {graduatingId === s.id ? "..." : "Graduar"}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Inline management panel */}
                      {isManaging && (
                        <div className="border-t border-amber-100 p-5 space-y-5 bg-amber-50/20">
                          {mgmtMsg && (
                            <div className={`text-xs font-semibold px-3 py-2 rounded-lg ${
                              mgmtMsg.type === "ok"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-600 border border-red-200"
                            }`}>
                              {mgmtMsg.text}
                            </div>
                          )}

                          {/* Asistencia */}
                          <div className="bg-white rounded-xl p-4 border border-slate-200/60">
                            <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                              Asistencia al Taller
                            </h5>
                            <div className="flex items-center gap-4">
                              <input
                                type="range" min={0} max={100} value={mgmtAtt}
                                onChange={(e) => setMgmtAtt(Number(e.target.value))}
                                className="flex-1 accent-amber-500"
                              />
                              <div className="flex items-center gap-2 shrink-0">
                                <input
                                  type="number" min={0} max={100} value={mgmtAtt}
                                  onChange={(e) => setMgmtAtt(Math.min(100, Math.max(0, Number(e.target.value))))}
                                  className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold text-center focus:ring-2 focus:ring-amber-200 outline-none"
                                />
                                <span className="text-sm font-bold text-slate-500">%</span>
                              </div>
                            </div>
                            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${mgmtAtt >= 90 ? "bg-emerald-500" : mgmtAtt >= 75 ? "bg-amber-400" : "bg-red-400"}`}
                                style={{ width: `${mgmtAtt}%` }}
                              />
                            </div>
                            <button
                              onClick={handleSaveAtt}
                              disabled={mgmtSaving === "att"}
                              className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              {mgmtSaving === "att"
                                ? <><Loader2 size={12} className="animate-spin" /> Guardando…</>
                                : "Guardar asistencia"}
                            </button>
                          </div>

                          {/* Habilidades Blandas */}
                          <div className="bg-white rounded-xl p-4 border border-slate-200/60">
                            <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                              Habilidades Blandas
                            </h5>
                            <input
                              type="text"
                              value={mgmtSkillsStr}
                              onChange={(e) => setMgmtSkillsStr(e.target.value)}
                              placeholder="Trabajo en equipo, Liderazgo, Comunicación…"
                              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Separa las habilidades con comas.</p>
                            {mgmtSkillsStr.trim() && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {mgmtSkillsStr.split(",").map((sk) => sk.trim()).filter(Boolean).map((sk) => (
                                  <span key={sk} className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-100 rounded-full text-[11px] font-semibold">
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            )}
                            <button
                              onClick={handleSaveSkills}
                              disabled={mgmtSaving === "skills"}
                              className="mt-3 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              {mgmtSaving === "skills"
                                ? <><Loader2 size={12} className="animate-spin" /> Guardando…</>
                                : "Guardar habilidades"}
                            </button>
                          </div>

                          {/* Reporte del Colegio */}
                          <div className="bg-white rounded-xl p-4 border border-slate-200/60">
                            <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                              Reporte del Colegio
                            </h5>
                            {!mgmtReportLoaded ? (
                              <div className="flex justify-center py-4">
                                <Loader2 size={18} className="animate-spin text-slate-300" />
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div>
                                  <label className="text-[11px] font-bold text-slate-500 mb-1 block">Período *</label>
                                  <input
                                    type="text" value={mgmtPeriod}
                                    onChange={(e) => setMgmtPeriod(e.target.value)}
                                    placeholder="Ej: I Semestre 2026"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] font-bold text-slate-500 mb-1 block">Resumen</label>
                                  <textarea
                                    value={mgmtSummary} rows={2}
                                    onChange={(e) => setMgmtSummary(e.target.value)}
                                    placeholder="Rendimiento general…"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none resize-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] font-bold text-slate-500 mb-1 block">Comentario del Docente</label>
                                  <textarea
                                    value={mgmtTeacher} rows={2}
                                    onChange={(e) => setMgmtTeacher(e.target.value)}
                                    placeholder="Observaciones del docente…"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none resize-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] font-bold text-slate-500 mb-1 block">Nota de Conducta</label>
                                  <textarea
                                    value={mgmtBehavior} rows={2}
                                    onChange={(e) => setMgmtBehavior(e.target.value)}
                                    placeholder="Comportamiento y actitud…"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none resize-none"
                                  />
                                </div>
                                <button
                                  onClick={handleSaveReport}
                                  disabled={mgmtSaving === "report" || !mgmtPeriod.trim()}
                                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                  {mgmtSaving === "report"
                                    ? <><Loader2 size={12} className="animate-spin" /> Guardando…</>
                                    : "Guardar reporte"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB: Estadísticas
        ══════════════════════════════════════════════ */}
        {tab === "Estadísticas" && (
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="font-bold text-base text-slate-800">Estadísticas del Centro</h2>

            {dbStudents.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60">
                <TrendingUp size={44} className="mx-auto mb-3 text-slate-200" />
                <p className="text-slate-400 font-medium">Carga los estudiantes primero.</p>
                <button onClick={fetchStudents} className="mt-3 text-xs text-amber-600 hover:underline font-semibold">
                  Cargar datos
                </button>
              </div>
            ) : (
              <>
                {/* Overview KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Total alumnos",    value: dbStudents.length,  color: "amber" },
                    { label: "Asistencia prom.", value: `${avgAttendance}%`, color: "emerald" },
                    { label: "En práctica",      value: inPractice,          color: "violet" },
                    { label: "Disponibles",      value: available,           color: "cyan" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-2xl p-5 text-center`}>
                      <p className={`text-3xl font-extrabold text-${color}-600`}>{value}</p>
                      <p className="text-xs text-slate-500 mt-1">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Attendance distribution */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60">
                  <h4 className="font-bold text-sm mb-4 text-slate-700">Distribución de Asistencia</h4>
                  {(() => {
                    const buckets = [
                      { label: "90-100%", count: dbStudents.filter((s) => (s.attendance ?? 0) >= 90).length, color: "#10b981" },
                      { label: "75-89%",  count: dbStudents.filter((s) => { const a = s.attendance ?? 0; return a >= 75 && a < 90; }).length, color: "#f59e0b" },
                      { label: "60-74%",  count: dbStudents.filter((s) => { const a = s.attendance ?? 0; return a >= 60 && a < 75; }).length, color: "#f97316" },
                      { label: "< 60%",   count: dbStudents.filter((s) => (s.attendance ?? 0) < 60).length, color: "#ef4444" },
                    ];
                    const maxCount = Math.max(...buckets.map((b) => b.count), 1);
                    return (
                      <div className="space-y-4">
                        {buckets.map((b) => (
                          <div key={b.label}>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="font-semibold text-slate-600">{b.label}</span>
                              <span className="font-bold" style={{ color: b.color }}>{b.count} alumnos</span>
                            </div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${(b.count / maxCount) * 100}%`, background: b.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Specialty distribution */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60">
                  <h4 className="font-bold text-sm mb-4 text-slate-700">Distribución por Especialidad</h4>
                  {(() => {
                    const specMap: Record<string, number> = {};
                    dbStudents.forEach((s) => {
                      const sp = s.specialty || "Sin especialidad";
                      specMap[sp] = (specMap[sp] ?? 0) + 1;
                    });
                    const specs = Object.entries(specMap).sort((a, b) => b[1] - a[1]);
                    const maxCount = Math.max(...specs.map(([, c]) => c), 1);
                    const specColors = ["#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626", "#9333ea"];
                    return specs.length === 0 ? (
                      <p className="text-sm text-slate-400">Sin datos de especialidad.</p>
                    ) : (
                      <div className="space-y-3">
                        {specs.map(([sp, count], i) => (
                          <div key={sp}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-semibold text-slate-600 truncate max-w-[65%]">{sp}</span>
                              <span className="font-bold" style={{ color: specColors[i % specColors.length] }}>{count}</span>
                            </div>
                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${(count / maxCount) * 100}%`, background: specColors[i % specColors.length] }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Soft skills cloud */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60">
                  <h4 className="font-bold text-sm mb-4 text-slate-700">Habilidades Blandas Más Frecuentes</h4>
                  {(() => {
                    const skillMap: Record<string, number> = {};
                    dbStudents.forEach((s) => {
                      (s.soft_skills ?? []).forEach((sk) => {
                        skillMap[sk] = (skillMap[sk] ?? 0) + 1;
                      });
                    });
                    const skills = Object.entries(skillMap).sort((a, b) => b[1] - a[1]).slice(0, 20);
                    return skills.length === 0 ? (
                      <p className="text-sm text-slate-400">Sin habilidades blandas registradas.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {skills.map(([sk, count]) => (
                          <span key={sk} className="px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-100 rounded-full text-xs font-semibold">
                            {sk} <span className="text-teal-500 font-bold">×{count}</span>
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB: Solicitudes
        ══════════════════════════════════════════════ */}
        {tab === "Solicitudes" && (
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="font-bold text-base text-slate-800">Solicitudes de Práctica</h2>

            {reqsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={28} className="animate-spin text-amber-400" />
              </div>
            ) : internshipReqs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/60">
                <FileText size={40} className="mx-auto mb-3 text-slate-200" />
                <p className="text-slate-400 font-medium">No hay solicitudes de práctica.</p>
                <p className="text-xs text-slate-400 mt-1">Las empresas pueden enviarlas desde su perfil.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {internshipReqs.map((req) => {
                  const company = req.profiles;
                  const isPending = req.status === "pendiente";
                  return (
                    <div
                      key={req.id}
                      className={`bg-white rounded-2xl border overflow-hidden ${
                        req.urgent ? "border-red-200/60" : "border-slate-200/60"
                      }`}
                    >
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Company avatar */}
                          {company?.avatar ? (
                            <img src={company.avatar} alt={company.company_name ?? company.name} className="w-11 h-11 rounded-xl object-cover shrink-0" />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                              <Users size={18} className="text-violet-600" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-bold text-sm">{req.title}</h3>
                              {req.urgent && (
                                <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full">
                                  Urgente
                                </span>
                              )}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                req.status === "pendiente"  ? "bg-amber-50 text-amber-700 border border-amber-100"
                                : req.status === "aprobado" ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-red-50 text-red-600 border border-red-100"
                              }`}>
                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              {company?.company_name || company?.name || "Empresa"} ·{" "}
                              {new Date(req.created_at).toLocaleDateString("es-CR")}
                            </p>
                            {req.description && (
                              <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{req.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {req.specialty && (
                                <span className="text-[10px] font-semibold bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full">
                                  {req.specialty}
                                </span>
                              )}
                              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                {req.slots} cupo{req.slots !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons for pending requests */}
                        {isPending && (
                          <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                            <button
                              onClick={() => handleUpdateReq(req.id, "aprobado")}
                              disabled={updatingReq === req.id}
                              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                              {updatingReq === req.id
                                ? <Loader2 size={12} className="animate-spin" />
                                : <CheckCircle2 size={13} />}
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleUpdateReq(req.id, "rechazado")}
                              disabled={updatingReq === req.id}
                              className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                              {updatingReq === req.id
                                ? <Loader2 size={12} className="animate-spin" />
                                : <XCircle size={13} />}
                              Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add Student Modal ── */}
      <Modal
        open={addStudentOpen}
        onClose={() => setAddStudentOpen(false)}
        title="Agregar Estudiante"
      >
        <div className="space-y-4">
          {addStudentErr && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {addStudentErr}
            </div>
          )}
          {addStudentOk && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
              <CheckCircle2 size={14} /> Estudiante creado exitosamente.
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nombre *</label>
              <input
                value={newStFirstName}
                onChange={(e) => setNewStFirstName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                placeholder="Nombre"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Apellidos *</label>
              <input
                value={newStLastName}
                onChange={(e) => setNewStLastName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                placeholder="Apellidos"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Correo electrónico *</label>
            <input
              type="email"
              value={newStEmail}
              onChange={(e) => setNewStEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
              placeholder="estudiante@correo.com"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Contraseña temporal *</label>
            <input
              type="password"
              value={newStPassword}
              onChange={(e) => setNewStPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
              placeholder="Mín. 8 caracteres"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Especialidad</label>
              <select
                value={newStSpecialty}
                onChange={(e) => setNewStSpecialty(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-amber-200 outline-none bg-white"
              >
                <option value="">Sin especialidad</option>
                <option>Mecatrónica</option>
                <option>Electricidad</option>
                <option>Soldadura</option>
                <option>Ebanistería</option>
                <option>Informática</option>
                <option>Refrigeración</option>
                <option>Construcción</option>
                <option>Automotriz</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nivel / Año</label>
              <input
                value={newStGrade}
                onChange={(e) => setNewStGrade(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                placeholder="Ej: 3er año"
              />
            </div>
          </div>
          <button
            onClick={handleAddStudent}
            disabled={addStudentBusy || !newStFirstName.trim() || !newStLastName.trim() || !newStEmail.trim() || !newStPassword.trim()}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {addStudentBusy ? <><Loader2 size={16} className="animate-spin" /> Creando…</> : "Crear Estudiante"}
          </button>
        </div>
      </Modal>
    </PageLayout>
  );
}
