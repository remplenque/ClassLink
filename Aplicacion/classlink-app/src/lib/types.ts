// ──────────────────────────────────────────────
// ClassLink – Global TypeScript Types
// ──────────────────────────────────────────────

export type Role = "Estudiante" | "Egresado" | "Empresa" | "Colegio";

/* ─── User / Profile Model ─── */
export interface UserProfile {
  id: string;
  role: Role;
  name: string;
  avatar: string;
  email: string;
  bio: string;
  location: string;
  joinedDate: string;
  specialty?: string;
  title?: string;
  skills?: string[];
  xp?: number;
  xpMax?: number;
  level?: number;
  streak?: number;
  gpa?: number;
  availability?: "Disponible" | "En prácticas" | "No disponible";
  certifications?: string[];
  yearsExperience?: number;
  portfolio?: PortfolioItem[];
  companyName?: string;
  industry?: string;
  employeeCount?: string;
  website?: string;
  openPositions?: number;
  schoolName?: string;
  studentCount?: number;
  allianceCount?: number;
  employabilityRate?: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  image?: string;
  link?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  forRoles: Role[];
}

export interface FeedPost {
  id: string;
  title: string;
  description: string;
  content?: string;
  author: string;
  authorName?: string;
  authorAvatar: string;
  authorRole: Role | string;
  image: string;
  tag: string;
  likes: number;
  liked: boolean;
  comments: number;
  category: "publicacion" | "portafolio";
  createdAt: string;
}

export interface TalentProfile {
  id: string;
  name: string;
  role: "Estudiante" | "Egresado";
  title: string;
  avatar: string;
  skills: string[];
  specialty: string;
  bio: string;
  location: string;
  availability: "Disponible" | "En prácticas" | "No disponible";
  matchScore?: number;
  xp: number;
  level: number;
  gpa?: number;
  certifications: string[];
  yearsExperience?: number;
  portfolio: PortfolioItem[];
}

export interface Conversation {
  id: string;
  name: string;
  initials: string;
  role: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  online: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: "me" | "them";
  text: string;
  time: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  earned: boolean;
  date?: string;
  description: string;
}

export interface SidebarLink {
  path: string;
  label: string;
  icon: string;
  visibleFor: Role[];
}

export interface QueueRequest {
  id: string;
  title: string;
  description: string;
  author: string;
  urgent: boolean;
  type: "practica" | "alianza" | "certificacion" | "reporte";
  date: string;
}
