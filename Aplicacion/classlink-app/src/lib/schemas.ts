import { z } from "zod";

// ── Auth ────────────────────────────────────────────────────
export const loginSchema = z.object({
  email:    z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

// Only Empresa and Colegio can self-register.
// Students are created exclusively by their school via the admin Server Action.
export const registerSchema = z.object({
  name:     z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  email:    z.string().email("Email inválido"),
  password: z.string()
    .min(12, "La contraseña debe tener al menos 12 caracteres")
    .regex(/[0-9]/, "Debe incluir al menos un número")
    .regex(/[^a-zA-Z0-9]/, "Debe incluir al menos un carácter especial"),
  confirmPassword: z.string(),
  role: z.enum(["Empresa", "Colegio"], {
    errorMap: () => ({ message: "Solo Empresa y Colegio pueden registrarse aquí." }),
  }),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// School creates a student account
export const createStudentSchema = z.object({
  firstName:    z.string().min(2, "Nombre muy corto").max(50),
  lastName:     z.string().min(2, "Apellido muy corto").max(50),
  email:        z.string().email("Email inválido"),
  tempPassword: z.string()
    .min(8,  "Mínimo 8 caracteres")
    .max(72, "Máximo 72 caracteres"),
  specialty: z.string().max(100).optional(),
  grade:     z.string().max(20).optional(),
});

// ── Profile ─────────────────────────────────────────────────
export const profileEditSchema = z.object({
  name:         z.string().min(2).max(100),
  bio:          z.string().max(500).optional(),
  location:     z.string().max(100).optional(),
  specialty:    z.string().max(100).optional(),
  title:        z.string().max(100).optional(),
  availability: z.enum(["Disponible", "En prácticas", "No disponible"]).optional(),
  website:      z.string().url("URL inválida").optional().or(z.literal("")),
});

// ── Post ─────────────────────────────────────────────────────
export const postSchema = z.object({
  title:       z.string().min(3, "El título es demasiado corto").max(120),
  description: z.string().max(2000).optional(),
  tag:         z.enum(["Soldadura TIG", "Ebanistería", "Mecatrónica", "Electricidad", "Evento"]),
  category:    z.enum(["publicacion", "portafolio"]),
});

// ── Message ──────────────────────────────────────────────────
export const messageSchema = z.object({
  text: z.string().min(1).max(2000),
  conversationId: z.string().uuid(),
});

// ── Job Posting ──────────────────────────────────────────────
export const jobPostingSchema = z.object({
  title:       z.string().min(5).max(150),
  description: z.string().min(20).max(5000),
  location:    z.string().max(100).optional(),
  type:        z.enum(["full-time", "part-time", "pasantia", "contrato"]),
  specialty:   z.string().max(100).optional(),
  salary_min:  z.number().nonnegative().optional(),
  salary_max:  z.number().nonnegative().optional(),
});

// ── File upload ──────────────────────────────────────────────
export const fileUploadSchema = z.object({
  size: z.number().max(5 * 1024 * 1024, "El archivo debe ser menor a 5MB"),
  type: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]).refine(
    (v) => ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(v),
    { message: "Solo se permiten imágenes (JPEG, PNG, WebP, GIF)" }
  ),
});
