import type { Metadata } from "next";
import "./globals.css";
import { RoleProvider } from "@/lib/role-context";

export const metadata: Metadata = {
  title: "ClassLink – Vocational Excellence",
  description: "Connecting vocational students with local companies",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="light">
      <body className="bg-[#f9f9ff] text-[#111c2d] font-manrope min-h-screen antialiased">
        <RoleProvider>{children}</RoleProvider>
      </body>
    </html>
  );
}
