"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { useAuth } from "@/lib/auth-context";
import { useRole } from "@/lib/role-context";
import { supabase } from "@/lib/supabase";
import {
  Building2, Globe, Users, Briefcase, MapPin, ArrowLeft,
  Loader2, UserPlus, UserCheck, Clock, ChevronRight, Bell,
  GraduationCap,
} from "lucide-react";

interface CompanyProfile {
  id: string;
  name: string;
  company_name: string | null;
  bio: string | null;
  avatar: string | null;
  location: string | null;
  industry: string | null;
  employee_count: string | null;
  website: string | null;
  email: string;
  rut: string | null;
}

interface JobPosting {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  type: string | null;
  specialty: string | null;
  created_at: string;
}

export default function EmpresaProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { role } = useRole();

  const [company,       setCompany]       = useState<CompanyProfile | null>(null);
  const [jobs,          setJobs]          = useState<JobPosting[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing,   setIsFollowing]   = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const [profileRes, jobsRes, followersRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, company_name, bio, avatar, location, industry, employee_count, website, email, rut")
        .eq("id", id)
        .eq("role", "Empresa")
        .single(),
      supabase
        .from("job_postings")
        .select("id, title, description, location, type, specialty, created_at")
        .eq("company_id", id)
        .eq("active", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("company_follows")
        .select("student_id", { count: "exact", head: true })
        .eq("company_id", id),
    ]);

    if (profileRes.error || !profileRes.data) {
      setError("No se encontró esta empresa.");
      setLoading(false);
      return;
    }

    setCompany(profileRes.data as CompanyProfile);
    setJobs((jobsRes.data ?? []) as JobPosting[]);
    setFollowerCount(followersRes.count ?? 0);

    // Check if the current user already follows this company
    if (user?.id) {
      const { data: followRow } = await supabase
        .from("company_follows")
        .select("student_id")
        .eq("company_id", id)
        .eq("student_id", user.id)
        .maybeSingle();
      setIsFollowing(!!followRow);
    }

    setLoading(false);
  }, [id, user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFollowToggle = async () => {
    if (!user?.id || !id) return;
    setFollowLoading(true);

    if (isFollowing) {
      await supabase
        .from("company_follows")
        .delete()
        .eq("company_id", id)
        .eq("student_id", user.id);
      setFollowerCount((c) => Math.max(0, c - 1));
      setIsFollowing(false);
    } else {
      await supabase
        .from("company_follows")
        .insert({ company_id: id, student_id: user.id });
      setFollowerCount((c) => c + 1);
      setIsFollowing(true);
    }

    setFollowLoading(false);
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-64">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      </PageLayout>
    );
  }

  if (error || !company) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-64 gap-4">
          <Building2 size={48} className="text-slate-200" />
          <p className="text-slate-400 font-medium">{error ?? "Empresa no encontrada."}</p>
          <button
            onClick={() => router.back()}
            className="text-sm text-violet-600 hover:underline flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Volver
          </button>
        </div>
      </PageLayout>
    );
  }

  const displayName  = company.company_name || company.name;
  // Students and graduates can follow; companies viewing themselves cannot
  const canFollow    = user && user.id !== id && (role === "Estudiante" || role === "Egresado");
  const websiteHref  = company.website
    ? (company.website.startsWith("http") ? company.website : `https://${company.website}`)
    : null;

  return (
    <PageLayout>
      <div className="w-full max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">

        {/* Back navigation */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={15} /> Volver
        </button>

        {/* ── Company Header Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden animate-fade-in-up">

          {/* Banner gradient */}
          <div className="h-32 md:h-44 bg-gradient-to-br from-violet-500 via-purple-500 to-violet-700 relative overflow-hidden">
            <div className="absolute inset-0 hero-pattern opacity-10" />
          </div>

          {/* Avatar + actions row */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-10 mb-4">

              {/* Avatar */}
              <div className="shrink-0">
                {company.avatar ? (
                  <img
                    src={company.avatar}
                    alt={displayName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white object-cover shadow-lg bg-white"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-white font-black text-3xl sm:text-4xl">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Follow button */}
              {canFollow && (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
                    isFollowing
                      ? "bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200"
                      : "bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                  }`}
                >
                  {followLoading
                    ? <Loader2 size={15} className="animate-spin" />
                    : isFollowing
                    ? <><UserCheck size={15} /> Siguiendo</>
                    : <><UserPlus size={15} /> Seguir</>
                  }
                </button>
              )}
            </div>

            {/* Name + meta */}
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{displayName}</h1>
              {company.industry && (
                <p className="text-slate-500 text-sm mt-1">{company.industry}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm text-slate-400">
                {company.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} />{company.location}
                  </span>
                )}
                {company.employee_count && (
                  <span className="flex items-center gap-1.5">
                    <Users size={14} />{company.employee_count} empleados
                  </span>
                )}
                {websiteHref && (
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-violet-600 hover:underline"
                  >
                    <Globe size={14} />{company.website}
                  </a>
                )}
                <span className="flex items-center gap-1.5">
                  <Bell size={14} />
                  {followerCount} {followerCount === 1 ? "seguidor" : "seguidores"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Body Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left column: About + Info */}
          <div className="space-y-4">

            {company.bio && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200/60 animate-fade-in-up stagger-1">
                <h3 className="font-bold text-sm text-slate-700 mb-2">Acerca de</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{company.bio}</p>
              </div>
            )}

            <div className="bg-white rounded-2xl p-5 border border-slate-200/60 animate-fade-in-up stagger-2">
              <h3 className="font-bold text-sm text-slate-700 mb-4">Información</h3>
              <div className="space-y-3">
                {[
                  { icon: <Building2    size={15} className="text-slate-400" />, label: "Industria",  value: company.industry },
                  { icon: <Users        size={15} className="text-slate-400" />, label: "Empleados",  value: company.employee_count },
                  { icon: <Briefcase    size={15} className="text-slate-400" />, label: "Vacantes",   value: jobs.length > 0 ? `${jobs.length} abierta${jobs.length !== 1 ? "s" : ""}` : null },
                  { icon: <GraduationCap size={15} className="text-slate-400" />, label: "Seguidores", value: String(followerCount) },
                ].filter((item) => item.value).map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    {item.icon}
                    <div>
                      <p className="text-[11px] text-slate-400">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-700">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA for students: go to Empleos to apply */}
            {(role === "Estudiante" || role === "Egresado") && jobs.length > 0 && (
              <Link
                href="/empleos"
                className="flex items-center justify-between gap-3 bg-violet-600 hover:bg-violet-700 text-white px-5 py-3.5 rounded-2xl font-bold text-sm transition-colors animate-fade-in-up stagger-3"
              >
                <span>Ver y postularte a vacantes</span>
                <ChevronRight size={16} />
              </Link>
            )}
          </div>

          {/* Right column: Active job postings */}
          <div className="lg:col-span-2 space-y-4">

            <h2 className="font-bold text-base text-slate-800 animate-fade-in-up">
              Vacantes Activas
              {jobs.length > 0 && (
                <span className="ml-2 text-xs font-semibold bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full">
                  {jobs.length}
                </span>
              )}
            </h2>

            {jobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center animate-fade-in-up">
                <Briefcase size={40} className="mx-auto mb-3 text-slate-200" />
                <p className="text-slate-400 font-medium">Sin vacantes activas en este momento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job, i) => (
                  <div
                    key={job.id}
                    className={`bg-white rounded-2xl border border-slate-200/60 p-5 hover:border-violet-200 hover:shadow-sm transition-all animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-800">{job.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {job.type && (
                            <span className="text-[10px] font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">
                              {job.type}
                            </span>
                          )}
                          {job.specialty && (
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              {job.specialty}
                            </span>
                          )}
                          {job.location && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                              <MapPin size={10} />{job.location}
                            </span>
                          )}
                        </div>
                        {job.description && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                            {job.description}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock size={10} />
                          {new Date(job.created_at).toLocaleDateString("es-CR", { day: "numeric", month: "short" })}
                        </span>
                        <Link
                          href="/empleos"
                          className="text-xs font-bold text-violet-600 hover:underline flex items-center gap-0.5"
                        >
                          Postular <ChevronRight size={11} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
