// ──────────────────────────────────────────────────────────
// Root Layout – Next.js App Router root
// ──────────────────────────────────────────────────────────
// This is the outermost layout component.
// Next.js renders it once and keeps it mounted across all
// route navigations (it never unmounts between page changes).
//
// Responsibilities:
//  1. Sets the HTML lang attribute ("es" for Spanish)
//  2. Applies the global CSS (including Tailwind and animations)
//  3. Wraps the app in <RoleProvider> so every page has
//     access to the role context via useRole()
//  4. Sets default page metadata (title, description)
// ──────────────────────────────────────────────────────────

import type { Metadata } from "next";
import "./globals.css";
import { RoleProvider } from "@/lib/role-context";

// ── Page Metadata ─────────────────────────────────────────
// Next.js uses this to populate the <title> and <meta description>
// tags in the HTML <head>.
export const metadata: Metadata = {
  title:       "ClassLink – Vocational Excellence",
  description: "Connecting vocational students with local companies",
};

// ── Root Layout ───────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // lang="es" → tells browsers and screen readers the page is in Spanish
    // className="light" → reserved for a future dark-mode toggle
    <html lang="es" className="light">
      <body className="bg-cl-surface text-cl-on-surface font-manrope min-h-screen antialiased">
        {/*
          RoleProvider wraps everything so any component in the tree
          can call useRole() to read or switch the active user role.
        */}
        <RoleProvider>{children}</RoleProvider>
      </body>
    </html>
  );
}
