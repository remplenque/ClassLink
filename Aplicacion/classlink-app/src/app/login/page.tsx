"use client";
// ──────────────────────────────────────────────────────────
// Login Page – route: /login
// ──────────────────────────────────────────────────────────
// The entry point for all ClassLink users.
// Validates credentials against the mock user database
// defined in auth-context.tsx, then redirects to the dashboard.
//
// Includes:
//  - Email + password fields with show/hide password toggle
//  - "Recordarme" checkbox (UI only in prototype)
//  - Error feedback for invalid credentials
//  - Quick-fill buttons for each demo account
//  - Cursor glow ambient background
// ──────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, MOCK_USERS } from "@/lib/auth-context";
import CursorGlow from "@/components/layout/CursorGlow";
import {
  Eye, EyeOff, LogIn, AlertCircle, ChevronRight, Zap,
} from "lucide-react";

// ── Role badge colours ────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  Estudiante: "bg-cyan-100 text-cyan-700",
  Egresado:   "bg-emerald-100 text-emerald-700",
  Empresa:    "bg-violet-100 text-violet-700",
  Colegio:    "bg-amber-100 text-amber-700",
};

const ROLE_EMOJI: Record<string, string> = {
  Estudiante: "🎓",
  Egresado:   "💼",
  Empresa:    "🏢",
  Colegio:    "🏫",
};

// ── Component ─────────────────────────────────────────────

export default function LoginPage() {
  const { login, user } = useAuth();
  const router          = useRouter();

  // Form state
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [remember,    setRemember]    = useState(false);
  const [showPass,    setShowPass]    = useState(false);
  const [error,       setError]       = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, skip the login screen
  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  /** Handle form submission */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Small artificial delay for UX (feels like a real network request)
    await new Promise((r) => setTimeout(r, 600));

    const ok = login(email.trim(), password);
    if (ok) {
      router.replace("/");
    } else {
      setError("Correo o contraseña incorrectos.");
      setIsSubmitting(false);
    }
  };

  /** Pre-fill the form with a demo account's credentials */
  const fillDemo = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
    setError("");
  };

  return (
    // Full-screen container with the same surface colour as the app
    <div className="min-h-screen bg-cl-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient cursor glow — same as the rest of the app */}
      <CursorGlow />

      {/* Decorative gradient blobs in the background */}
      <div
        aria-hidden="true"
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, #00687a, transparent)" }}
      />

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-200/60 overflow-hidden">

          {/* ── Gradient header ── */}
          <div className="primary-gradient px-8 pt-8 pb-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 hero-pattern" />
            <div className="relative">
              {/* Logo */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-white font-black text-base">CL</span>
                </div>
                <span className="text-white font-bold text-xl tracking-tight">ClassLink</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Bienvenido de vuelta
              </h1>
              <p className="text-cyan-100 text-sm mt-1">
                Ingresa a tu cuenta para continuar
              </p>
            </div>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200/60 text-red-600 px-4 py-3 rounded-xl text-sm animate-scale-in">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="tu@correo.cr"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none transition-all"
              />
            </div>

            {/* Password field with show/hide toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password row */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <div
                  onClick={() => setRemember(!remember)}
                  className={`w-4 h-4 rounded border-2 transition-colors flex items-center justify-center ${
                    remember
                      ? "bg-cyan-600 border-cyan-600"
                      : "border-slate-300 group-hover:border-cyan-400"
                  }`}
                >
                  {remember && (
                    <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-white">
                      <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-xs text-slate-500 font-medium">Recordarme</span>
              </label>
              <button
                type="button"
                className="text-xs text-cyan-600 font-semibold hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="w-full primary-gradient text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-cyan-200/40 flex items-center justify-center gap-2 btn-press"
            >
              {isSubmitting ? (
                <>
                  {/* Loading spinner */}
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Ingresando…
                </>
              ) : (
                <>
                  <LogIn size={16} /> Ingresar
                </>
              )}
            </button>
          </form>

          {/* ── Demo accounts section ── */}
          <div className="px-8 pb-8">
            <div className="border-t border-slate-100 pt-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                <Zap size={11} /> Cuentas de demostración
              </p>
              <div className="space-y-2">
                {MOCK_USERS.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => fillDemo(u.email, u.password)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-cyan-200 hover:bg-cyan-50/40 transition-all group text-left"
                  >
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${ROLE_COLORS[u.role]}`}>
                      {ROLE_EMOJI[u.role]} {u.role}
                    </span>
                    <ChevronRight size={13} className="text-slate-300 group-hover:text-cyan-500 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-slate-400 mt-4">
          ClassLink © 2024 — Prototipo de plataforma vocacional
        </p>
      </div>
    </div>
  );
}
