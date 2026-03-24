"use client";
import { icons, type LucideIcon } from "lucide-react";

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 20, className = "", strokeWidth = 1.75 }: IconProps) {
  // Convert kebab-case to PascalCase for lucide lookup
  const pascalName = name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("") as keyof typeof icons;

  const LucideComponent: LucideIcon | undefined = icons[pascalName];

  if (!LucideComponent) {
    return <span className={`inline-block ${className}`} style={{ width: size, height: size }} />;
  }

  return <LucideComponent size={size} strokeWidth={strokeWidth} className={className} />;
}
