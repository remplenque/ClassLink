"use server";
// ──────────────────────────────────────────────────────────
// School Server Actions — only callable by authenticated Colegio users
// ──────────────────────────────────────────────────────────

import { cookies } from "next/headers";
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase-server";
import { createStudentSchema } from "@/lib/schemas";

// ── createStudent ────────────────────────────────────────
// Creates a student Auth user + profile row owned by the calling school.
// Sets must_change_password in app_metadata so the student is forced
// to change their temp password on first login.
export async function createStudent(formData: {
  firstName:    string;
  lastName:     string;
  email:        string;
  tempPassword: string;
  specialty?:   string;
  grade?:       string;
}) {
  // 1. Validate input
  const parsed = createStudentSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // 2. Verify caller is an authenticated Colegio
  const cookieStore = await cookies();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerSupabaseClient(cookieStore as any);
  const { data: { user: caller }, error: sessionErr } = await supabase.auth.getUser();

  if (sessionErr || !caller) {
    return { error: "No autenticado." };
  }

  const { data: callerProfile, error: profileErr } = await supabase
    .from("profiles")
    .select("role, id")
    .eq("id", caller.id)
    .single();

  if (profileErr || !callerProfile) {
    return { error: "Perfil no encontrado." };
  }
  if (callerProfile.role !== "Colegio") {
    return { error: "Solo un Colegio puede crear estudiantes." };
  }

  const schoolId = callerProfile.id;

  // 3. Create the Auth user via admin client
  const admin = createAdminClient();
  const fullName = `${parsed.data.firstName.trim()} ${parsed.data.lastName.trim()}`;

  const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
    email:          parsed.data.email.trim(),
    password:       parsed.data.tempPassword,
    email_confirm:  true, // skip email confirmation for school-created accounts
    app_metadata: {
      role:                 "Estudiante",
      must_change_password: true,
    },
    user_metadata: {
      name: fullName,
    },
  });

  if (createErr || !newUser.user) {
    const msg = createErr?.message ?? "Error al crear usuario.";
    return { error: msg };
  }

  // 4. Insert profile row
  const { error: insertErr } = await admin
    .from("profiles")
    .insert({
      id:           newUser.user.id,
      name:         fullName,
      email:        parsed.data.email.trim(),
      role:         "Estudiante",
      school_id:    schoolId,
      specialty:    parsed.data.specialty ?? null,
      grade:        parsed.data.grade ?? null,
      created_at:   new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    });

  if (insertErr) {
    // Roll back: delete the auth user we just created
    await admin.auth.admin.deleteUser(newUser.user.id);
    return { error: insertErr.message };
  }

  return { success: true, userId: newUser.user.id };
}

// ── clearMustChangePassword ──────────────────────────────
// Called after student successfully sets their new password.
// Removes the must_change_password flag from app_metadata.
export async function clearMustChangePassword() {
  const cookieStore = await cookies();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerSupabaseClient(cookieStore as any);
  const { data: { user }, error: sessionErr } = await supabase.auth.getUser();

  if (sessionErr || !user) return { error: "No autenticado." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      must_change_password: false,
    },
  });

  if (error) return { error: error.message };
  return { success: true };
}

// ── graduateStudent ──────────────────────────────────────
// Promotes a student to Egresado. Only the owning school may call this.
export async function graduateStudent(studentId: string) {
  if (!studentId) return { error: "ID inválido." };

  const cookieStore = await cookies();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerSupabaseClient(cookieStore as any);
  const { data: { user: caller }, error: sessionErr } = await supabase.auth.getUser();

  if (sessionErr || !caller) return { error: "No autenticado." };

  // Verify caller is a Colegio and owns the student
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, id")
    .eq("id", caller.id)
    .single();

  if (!callerProfile || callerProfile.role !== "Colegio") {
    return { error: "Solo un Colegio puede graduar estudiantes." };
  }

  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("school_id, role")
    .eq("id", studentId)
    .single();

  if (!studentProfile || studentProfile.school_id !== callerProfile.id) {
    return { error: "Estudiante no pertenece a este centro." };
  }
  if (studentProfile.role !== "Estudiante") {
    return { error: "Este perfil ya no es Estudiante." };
  }

  const admin = createAdminClient();

  // Update profile row
  const { error: updateErr } = await admin
    .from("profiles")
    .update({ role: "Egresado", updated_at: new Date().toISOString() })
    .eq("id", studentId);

  if (updateErr) return { error: updateErr.message };

  // Update auth app_metadata role
  await admin.auth.admin.updateUserById(studentId, {
    app_metadata: { role: "Egresado" },
  });

  return { success: true };
}
