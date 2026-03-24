"use client";
// ──────────────────────────────────────────────
// Dashboard Page – Dynamic per role
// ──────────────────────────────────────────────
import PageLayout from "@/components/layout/PageLayout";
import { useRole } from "@/lib/role-context";
import DashboardColegio from "@/components/dashboard/DashboardColegio";
import DashboardEstudiante from "@/components/dashboard/DashboardEstudiante";
import DashboardEmpresa from "@/components/dashboard/DashboardEmpresa";
import DashboardEgresado from "@/components/dashboard/DashboardEgresado";

export default function DashboardPage() {
  const { role } = useRole();

  const dashboards = {
    Colegio: <DashboardColegio />,
    Estudiante: <DashboardEstudiante />,
    Empresa: <DashboardEmpresa />,
    Egresado: <DashboardEgresado />,
  };

  return <PageLayout>{dashboards[role]}</PageLayout>;
}
