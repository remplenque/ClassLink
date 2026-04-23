# 🚀 ClassLink

### Red Social Laboral para Técnicos Profesionales
### Desarrollado para el Centro Educacional Cardenal José María Caro (CECJMC), Lo Espejo, Chile.

## 📖 Sobre el Proyecto

ClassLink es una plataforma web-first orientada a visibilizar y conectar el talento técnico-manual con el sector privado.

#### El Problema: Actualmente, los estudiantes de liceos Técnico Profesionales enfrentan barreras para conseguir prácticas relacionadas a sus especialidades, lo que genera desmotivación y abandono. Las empresas locales desconocen el talento real y práctico que estos alumnos poseen por falta de una vitrina laboral adecuada.

#### La Solución: Un ecosistema digital tipo "LinkedIn" adaptado a oficios. Permite a los estudiantes y egresados mostrar portafolios visuales de su trabajo manual (ej. soldadura, electricidad), validar sus conocimientos mediante el colegio y conectar de forma segura con empresas que buscan talento técnico.

## ✨ Características Principales (Reglas de Negocio)

La plataforma maneja 4 roles dinámicos con flujos de experiencia e interfaces distintas:

### 🏫 Colegio (Administrador/Validador): 
Son los únicos autorizados para crear perfiles de estudiantes. Validan insignias de habilidades y actúan como puente obligatorio de comunicación entre empresas y estudiantes menores de edad.

### 🎓 Estudiante (Menor de edad): 
Interfaz enfocada en la gamificación. Los alumnos completan desafíos para ganar puntos de experiencia (XP) y mantener rachas. Pueden generar y descargar un Currículum Vitae en PDF con un clic. Privacidad: No pueden ser contactados directamente por empresas.

### 🛠️ Egresado Técnico (Adulto): 
Perfil similar al estudiante, conservando sus insignias validadas por el colegio, pero con permisos de edición desbloqueados y un botón de "Contacto Directo" habilitado para reclutadores.

### 🏢 Empresa (Reclutador): 
Cuentan con un buscador avanzado para filtrar talento por especialidad y zona. Si desean contactar a un estudiante, el sistema enruta la solicitud al Profesor Jefe.

### 📱 Diseño Web-First y Accesibilidad

- Tema Claro (Light Mode): Diseño estricto en colores claros y alto contraste para garantizar la usabilidad en usuarios con menor alfabetización digital.

- Responsividad: Diseño 100% responsivo. En escritorio utiliza un menú lateral, el cual se transforma en una barra de navegación inferior (estilo Instagram) en dispositivos móviles.

- El Muro: Dividido en dos pestañas ("Publicaciones y Eventos" y "Portafolios Destacados") para evitar la sobrecarga cognitiva y enfocarse en el contenido visual de los talleres. Las imágenes subidas se comprimen automáticamente (tamaño < 500kb) para optimizar el rendimiento.

### 💻 Stack Tecnológico

El proyecto está construido sobre una arquitectura moderna, escalable y rápida:

**Frontend:** React.js / Next.js (App Router)

**Lenguaje:** TypeScript

**Estilos:** Tailwind CSS (con componentes base de shadcn/ui o Radix)

**Backend / API:** Node.js

**Base de Datos:** PostgreSQL / Prisma ORM

**Control de Versiones:** Git / GitHub

## La aplicación estará disponible en: https://class-link-six.vercel.app/muro

## 👥 Equipo de Desarrollo

- Vicente Rodríguez - Jefe de Proyecto / Dev Frontend

- María Emilia Matosas - Dev Frontend / UX-UI

- Thomas Von Riegen - Dev Backend / Base de Datos

## 📄 Estado del Proyecto

Fase actual: MVP (Producto Viable Mínimo) en desarrollo. Piloto exclusivo para el CECJMC.
