"use client";
import { Award, Lock } from "lucide-react";

export interface UserBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
  earned_at: string | null;
}

interface BadgesGridProps {
  badges: UserBadge[];
}

export function BadgesGrid({ badges }: BadgesGridProps) {
  if (badges.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/60">
        <Award size={40} className="mx-auto mb-3 text-slate-200" />
        <p className="text-slate-400 font-medium">No se encontraron insignias.</p>
        <p className="text-xs text-slate-300 mt-1">Las insignias se asignan desde la base de datos.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {badges.map((b) => (
        <div
          key={b.id}
          className={`bg-white rounded-2xl p-5 border text-center transition-all ${
            b.earned ? "border-cyan-200 shadow-sm" : "border-slate-200/60 opacity-50"
          }`}
        >
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3 ${
              b.earned ? "bg-cyan-50" : "bg-slate-100"
            }`}
          >
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
  );
}
