import type {
  UserProfile,
  AppNotification,
  FeedPost,
  TalentProfile,
  Conversation,
  ChatMessage,
  Badge,
  QueueRequest,
} from "./types";

// ═══════════════════════════════════════════════
// 3 MODEL PROFILES – Student, Company, School
// ═══════════════════════════════════════════════

export const PROFILES: Record<string, UserProfile> = {
  student: {
    id: "u-student",
    role: "Estudiante",
    name: "Alejandro Mendoza",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    email: "alejandro.mendoza@classlink.edu",
    bio: "Estudiante de ultimo anio en Mecatronica e IoT. Apasionado por la automatizacion industrial y la robotica. Buscando practicas profesionales.",
    location: "San Jose, Costa Rica",
    joinedDate: "2024-08-15",
    specialty: "Mecatronica",
    title: "Estudiante de Mecatronica",
    skills: ["PLC Siemens", "Arduino", "SolidWorks", "Python", "IoT", "SCADA"],
    xp: 2450,
    xpMax: 3000,
    level: 12,
    streak: 7,
    gpa: 92.5,
    availability: "Disponible",
    certifications: ["Siemens S7-1200", "Arduino Certified"],
    yearsExperience: 1,
    portfolio: [
      { id: "pf1", title: "Sistema SCADA Planta Solar", description: "Monitoreo en tiempo real con ESP32 y dashboard React.", tags: ["SCADA", "IoT", "React"], image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop", link: "https://github.com" },
      { id: "pf2", title: "Brazo Robotico 6DOF", description: "Control cinematico inverso con vision artificial.", tags: ["Robotica", "Python", "OpenCV"], image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop" },
      { id: "pf3", title: "Automatizacion Linea de Ensamble", description: "Secuencias PLC para produccion automotriz.", tags: ["PLC", "Siemens", "TIA Portal"], image: "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=600&h=400&fit=crop" },
    ],
  },
  company: {
    id: "u-company",
    role: "Empresa",
    name: "Tech Solutions S.A.",
    avatar: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop",
    email: "rrhh@techsolutions.cr",
    bio: "Empresa lider en automatizacion industrial y soluciones IoT para manufactura. Buscamos talento tecnico comprometido con la innovacion.",
    location: "Heredia, Costa Rica",
    joinedDate: "2025-01-10",
    companyName: "Tech Solutions S.A.",
    industry: "Automatizacion Industrial",
    employeeCount: "50-200",
    website: "techsolutions.cr",
    openPositions: 4,
  },
  school: {
    id: "u-school",
    role: "Colegio",
    name: "CTP Don Bosco",
    avatar: "https://images.unsplash.com/photo-1562774053-701939374585?w=200&h=200&fit=crop",
    email: "coordinacion@ctpdonbosco.ed.cr",
    bio: "Colegio Tecnico Profesional lider en formacion vocacional con especialidades en Mecatronica, Soldadura, Electricidad y Ebanisteria.",
    location: "Alajuela, Costa Rica",
    joinedDate: "2024-01-01",
    schoolName: "CTP Don Bosco",
    studentCount: 312,
    allianceCount: 42,
    employabilityRate: 88.4,
  },
};

// ═══════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════

export const NOTIFICATIONS: AppNotification[] = [
  { id: "n1", title: "Solicitud de contacto", description: "Tech Solutions S.A. desea contactar a 3 estudiantes de Mecatronica.", time: "Hace 5 min", read: false, forRoles: ["Colegio"] },
  { id: "n2", title: "Nueva alianza pendiente", description: "Innova Green quiere unirse al banco de talento.", time: "Hace 20 min", read: false, forRoles: ["Colegio"] },
  { id: "n3", title: "Solicitud de practicas", description: "AutoParts Ltda. busca 2 pasantes de soldadura.", time: "Hace 1 hora", read: false, forRoles: ["Colegio"] },
  { id: "n4", title: "Nueva Insignia!", description: "Has ganado la insignia Maestro en Soldadura TIG.", time: "Hace 10 min", read: false, forRoles: ["Estudiante"] },
  { id: "n5", title: "Reto completado", description: "Completaste el reto semanal de Ebanisteria. +150 XP", time: "Hace 30 min", read: false, forRoles: ["Estudiante"] },
  { id: "n6", title: "Mensaje de reclutador", description: "Tech Solutions S.A. reviso tu portafolio.", time: "Hace 1 hora", read: false, forRoles: ["Estudiante"] },
  { id: "n7", title: "Perfil visto", description: "3 empresas vieron tu perfil esta semana.", time: "Hace 2 horas", read: true, forRoles: ["Egresado"] },
  { id: "n8", title: "Nuevo candidato destacado", description: "Alejandro Mendoza cumple 95% de tu busqueda.", time: "Hace 15 min", read: false, forRoles: ["Empresa"] },
  { id: "n9", title: "Acceso aprobado", description: "CTP Don Bosco aprobo tu solicitud de acceso al talento.", time: "Hace 45 min", read: false, forRoles: ["Empresa"] },
];

// ═══════════════════════════════════════════════
// FEED POSTS
// ═══════════════════════════════════════════════

export const FEED_POSTS: FeedPost[] = [
  {
    id: "p1", title: "Estructura Tubular 400x", description: "Finalizacion de la estructura principal para el prototipo de movilidad sostenible. Soldadura TIG con acero inoxidable calibre 16.",
    author: "Marco Rivera", authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face", authorRole: "Estudiante",
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=400&fit=crop", tag: "Soldadura TIG", likes: 24, liked: false, comments: 8, category: "publicacion", createdAt: "2026-03-22",
  },
  {
    id: "p2", title: "Ensamble de Roble Artesanal", description: "Tecnica de cola de milano realizada completamente a mano. Tres semanas de trabajo meticuloso.",
    author: "Lucia Torres", authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face", authorRole: "Estudiante",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop", tag: "Ebanisteria", likes: 18, liked: false, comments: 5, category: "publicacion", createdAt: "2026-03-21",
  },
  {
    id: "p3", title: "Panel Solar IoT Monitor", description: "Sistema de monitoreo en tiempo real para paneles solares con ESP32 y dashboard React. Incluye alertas automaticas.",
    author: "Alejandro Mendoza", authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", authorRole: "Estudiante",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop", tag: "Mecatronica", likes: 31, liked: true, comments: 12, category: "portafolio", createdAt: "2026-03-20",
  },
  {
    id: "p4", title: "Diagnostico OBD-II Avanzado", description: "Diagnostico computarizado de inyeccion electronica usando escaner profesional.",
    author: "Ana Beltran", authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face", authorRole: "Egresado",
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop", tag: "Mecatronica", likes: 12, liked: false, comments: 3, category: "portafolio", createdAt: "2026-03-19",
  },
  {
    id: "p5", title: "Feria Tecnica 2026", description: "Participa en la feria de innovacion tecnica del 15 al 18 de abril! Inscripciones abiertas.",
    author: "CTP Don Bosco", authorAvatar: "https://images.unsplash.com/photo-1562774053-701939374585?w=100&h=100&fit=crop", authorRole: "Colegio",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop", tag: "Evento", likes: 45, liked: false, comments: 20, category: "publicacion", createdAt: "2026-03-18",
  },
  {
    id: "p6", title: "Instalacion Residencial NEC", description: "Cableado completo para casa de dos pisos segun norma NEC. Tablero de distribucion con 12 circuitos.",
    author: "Pedro Sanchez", authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face", authorRole: "Estudiante",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=400&fit=crop", tag: "Electricidad", likes: 9, liked: false, comments: 2, category: "portafolio", createdAt: "2026-03-17",
  },
];

// ═══════════════════════════════════════════════
// TALENT PROFILES
// ═══════════════════════════════════════════════

export const TALENT_PROFILES: TalentProfile[] = [
  {
    id: "t1", name: "Alejandro Mendoza", role: "Estudiante", title: "Tecnico en Mecatronica",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    skills: ["PLC Siemens", "Arduino", "SolidWorks", "Python", "IoT", "SCADA"],
    specialty: "Mecatronica", bio: "Estudiante de ultimo anio apasionado por la automatizacion industrial.", location: "San Jose",
    availability: "Disponible", matchScore: 95, xp: 2450, level: 12, gpa: 92.5,
    certifications: ["Siemens S7-1200", "Arduino Certified"],
    portfolio: [
      { id: "pf1", title: "Sistema SCADA", description: "Monitoreo solar con ESP32", tags: ["SCADA", "IoT"] },
      { id: "pf2", title: "Brazo Robotico", description: "6DOF con vision artificial", tags: ["Robotica", "Python"] },
    ],
  },
  {
    id: "t2", name: "Elena Rodriguez", role: "Egresado", title: "Ing. Electricista Industrial",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    skills: ["Instalaciones Industriales", "NEC", "Tableros", "PLC", "Iluminacion LED", "AutoCAD Electrical"],
    specialty: "Electricidad", bio: "Egresada 2024 con experiencia en instalaciones industriales.", location: "Heredia",
    availability: "Disponible", matchScore: 88, xp: 4200, level: 18, gpa: 95.0,
    certifications: ["NEC Certified", "AutoCAD Professional"], yearsExperience: 2,
    portfolio: [
      { id: "pf3", title: "Planta Procesadora", description: "Instalacion electrica completa", tags: ["Industrial", "NEC"] },
    ],
  },
  {
    id: "t3", name: "Diego Herrera", role: "Egresado", title: "Soldador Certificado AWS",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    skills: ["TIG", "MIG", "Plasma", "Lectura de Planos", "Inspeccion Visual", "AWS D1.1"],
    specialty: "Soldadura", bio: "Soldador certificado AWS con 3 anios de experiencia.", location: "Alajuela",
    availability: "En prácticas", matchScore: 82, xp: 5100, level: 22, gpa: 88.0,
    certifications: ["AWS D1.1", "CWI Level I", "OSHA 30"], yearsExperience: 3,
    portfolio: [
      { id: "pf4", title: "Estructura Puente Peatonal", description: "Soldadura TIG en acero A36", tags: ["Estructural", "TIG"] },
    ],
  },
  {
    id: "t4", name: "Valentina Ruiz", role: "Estudiante", title: "Tecnica en Electricidad",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    skills: ["Cableado Residencial", "NEC", "Tableros", "Domotica", "Energia Solar"],
    specialty: "Electricidad", bio: "Estudiante de electricidad con enfoque en energias renovables.", location: "Cartago",
    availability: "Disponible", matchScore: 78, xp: 1800, level: 9, gpa: 90.0,
    certifications: ["Electricidad Residencial Nivel I"],
    portfolio: [
      { id: "pf5", title: "Casa Inteligente", description: "Sistema domotico con Home Assistant", tags: ["IoT", "Domotica"] },
    ],
  },
  {
    id: "t5", name: "Camila Ortiz", role: "Estudiante", title: "Aprendiz de Ebanisteria",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
    skills: ["Cola de Milano", "Lacado", "Diseno 3D", "CNC Router", "Restauracion"],
    specialty: "Ebanisteria", bio: "Ebanista en formacion con pasion por tecnicas tradicionales y CNC.", location: "San Jose",
    availability: "Disponible", matchScore: 72, xp: 1200, level: 7, gpa: 87.0,
    certifications: [],
    portfolio: [
      { id: "pf6", title: "Mesa de Roble", description: "Ensamble tradicional con acabado natural", tags: ["Madera", "Artesanal"] },
    ],
  },
  {
    id: "t6", name: "Andres Lopez", role: "Egresado", title: "Ing. Mecatronico Jr.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    skills: ["PLC Allen Bradley", "Arduino", "CAD/CAM", "Robotica Industrial", "HMI"],
    specialty: "Mecatronica", bio: "Ingeniero mecatronico con experiencia en lineas de produccion.", location: "Heredia",
    availability: "No disponible", matchScore: 90, xp: 6800, level: 25, gpa: 94.0,
    certifications: ["Rockwell Automation", "Fanuc Robotics", "Six Sigma Green Belt"], yearsExperience: 4,
    portfolio: [
      { id: "pf7", title: "Linea Automotriz", description: "Automatizacion con 4 robots Fanuc", tags: ["Robotica", "PLC"] },
      { id: "pf8", title: "Sistema HMI", description: "Interfaz operador para planta de alimentos", tags: ["HMI", "SCADA"] },
    ],
  },
  {
    id: "t7", name: "Sofia Vargas", role: "Estudiante", title: "Tecnica en Soldadura",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face",
    skills: ["TIG Aluminio", "MIG", "Lectura de Planos", "Metalografia"],
    specialty: "Soldadura", bio: "Estudiante destacada en soldadura TIG de aluminio.", location: "Alajuela",
    availability: "Disponible", matchScore: 75, xp: 1600, level: 8, gpa: 91.0,
    certifications: ["Soldadura TIG Nivel I"],
    portfolio: [
      { id: "pf9", title: "Tanque de Presion", description: "Soldadura TIG en acero inoxidable 304", tags: ["TIG", "Presion"] },
    ],
  },
  {
    id: "t8", name: "Carlos Mendez", role: "Egresado", title: "Tecnico Electricista Senior",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
    skills: ["Alta Tension", "Transformadores", "Protecciones", "ETAP", "AutoCAD"],
    specialty: "Electricidad", bio: "Electricista senior especializado en subestaciones.", location: "San Jose",
    availability: "Disponible", matchScore: 85, xp: 7200, level: 28, gpa: 93.0,
    certifications: ["ETAP Certified", "Alta Tension Nivel III", "NEC Master"], yearsExperience: 5,
    portfolio: [
      { id: "pf10", title: "Subestacion 34.5kV", description: "Diseno y comisionamiento completo", tags: ["Potencia", "ETAP"] },
    ],
  },
];

// ═══════════════════════════════════════════════
// CONVERSATIONS & CHAT
// ═══════════════════════════════════════════════

export const CONVERSATIONS: Conversation[] = [
  { id: "c1", name: "Tech Solutions S.A.", initials: "TS", role: "Empresa - Reclutador", avatar: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop", lastMessage: "Has revisado la propuesta de practicas?", lastTime: "Ahora", unread: 2, online: true },
  { id: "c2", name: "Elena Rodriguez", initials: "ER", role: "Ing. Electricista", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face", lastMessage: "Excelente avance en el modulo de PLC!", lastTime: "10:24", unread: 0, online: true },
  { id: "c3", name: "Coordinacion CTP", initials: "CT", role: "Colegio - Staff", avatar: "https://images.unsplash.com/photo-1562774053-701939374585?w=100&h=100&fit=crop", lastMessage: "El cronograma de practicas esta actualizado.", lastTime: "Ayer", unread: 0, online: false },
];

export const CHAT_MESSAGES: ChatMessage[] = [
  { id: "m1", conversationId: "c1", sender: "them", text: "Hola Alejandro! Revisamos tu portafolio y nos impresiono el proyecto SCADA.", time: "10:15" },
  { id: "m2", conversationId: "c1", sender: "them", text: "Tenemos una vacante de pasantia en automatizacion que podria interesarte.", time: "10:16" },
  { id: "m3", conversationId: "c1", sender: "me", text: "Muchas gracias! Me encantaria saber mas sobre la posicion.", time: "10:18" },
  { id: "m4", conversationId: "c1", sender: "them", text: "Has revisado la propuesta de practicas?", time: "10:20" },
  { id: "m5", conversationId: "c2", sender: "them", text: "Hola! Vi tu proyecto del brazo robotico.", time: "09:30" },
  { id: "m6", conversationId: "c2", sender: "me", text: "Gracias Elena! Fue bastante retador pero aprendi mucho.", time: "09:35" },
  { id: "m7", conversationId: "c2", sender: "them", text: "Excelente avance en el modulo de PLC!", time: "10:24" },
  { id: "m8", conversationId: "c3", sender: "them", text: "Recordatorio: el cronograma de practicas para abril ya esta disponible en la plataforma.", time: "Ayer" },
  { id: "m9", conversationId: "c3", sender: "me", text: "Perfecto, lo revisare hoy mismo. Gracias!", time: "Ayer" },
];

// ═══════════════════════════════════════════════
// BADGES
// ═══════════════════════════════════════════════

export const BADGES: Badge[] = [
  { id: "b1", name: "Soldadura TIG Nivel I", icon: "flame", earned: true, date: "2026-02-15", description: "Completar modulo basico de soldadura TIG" },
  { id: "b2", name: "Ebanisteria Basica", icon: "hammer", earned: true, date: "2026-01-20", description: "Dominar tecnicas basicas de carpinteria" },
  { id: "b3", name: "Electricidad Residencial", icon: "zap", earned: true, date: "2026-03-01", description: "Aprobar evaluacion de instalaciones residenciales" },
  { id: "b4", name: "Seguridad Industrial", icon: "shield-check", earned: true, date: "2026-03-10", description: "Certificacion en normas de seguridad" },
  { id: "b5", name: "Mecatronica Avanzada", icon: "cpu", earned: false, description: "Completar proyecto integrador de mecatronica" },
  { id: "b6", name: "Proyecto Final", icon: "trophy", earned: false, description: "Presentar proyecto de graduacion" },
  { id: "b7", name: "Pasantia Completada", icon: "briefcase", earned: false, description: "Completar 480 horas de practica profesional" },
  { id: "b8", name: "Mentor Comunitario", icon: "users", earned: false, description: "Mentorear a 3 estudiantes de nivel inferior" },
];

// ═══════════════════════════════════════════════
// QUEUE REQUESTS
// ═══════════════════════════════════════════════

export const QUEUE_REQUESTS: QueueRequest[] = [
  { id: "q1", title: "Validacion de Practicas: Tech Solutions S.A.", description: "5 estudiantes esperando confirmacion para abril 2026", author: "Tech Solutions S.A.", urgent: true, type: "practica", date: "2026-03-24" },
  { id: "q2", title: "Nueva Alianza: Innova Green", description: "Solicitud de acceso al banco de talento de Electricidad", author: "Innova Green", urgent: false, type: "alianza", date: "2026-03-23" },
  { id: "q3", title: "Reporte de Asistencia: Modulo Soldadura", description: "Pendiente revision del instructor - 3 ausencias", author: "Instructor Solano", urgent: false, type: "reporte", date: "2026-03-22" },
  { id: "q4", title: "Certificacion AWS: 3 estudiantes", description: "Documentos listos para envio a certificadora", author: "Coord. Academica", urgent: true, type: "certificacion", date: "2026-03-21" },
  { id: "q5", title: "Practica AutoParts Ltda.", description: "2 pasantes de soldadura pendientes de asignacion", author: "AutoParts Ltda.", urgent: true, type: "practica", date: "2026-03-20" },
];
