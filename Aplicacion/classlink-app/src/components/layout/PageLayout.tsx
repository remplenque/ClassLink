"use client";
// ──────────────────────────────────────────────────────────
// PageLayout – Shared page shell
// ──────────────────────────────────────────────────────────
// Wraps every page with the three persistent navigation
// components and adjusts content margins so nothing
// is hidden behind the nav bars:
//
//  ┌─────────────────────────────────────────────────┐
//  │  TopNavBar (h-16, fixed, z-50)                  │
//  ├───────────┬─────────────────────────────────────┤
//  │ SideNavBar│  <main> content area                │
//  │ (lg only, │  - pt-16: clears the top nav        │
//  │  w-56)    │  - pb-24 (mobile) / pb-6 (desktop)  │
//  │           │    clears the bottom mobile nav      │
//  │           │  - lg:ml-56: clears the sidebar      │
//  ├───────────┴─────────────────────────────────────┤
//  │  BottomMobileNav (lg:hidden, fixed, z-50)       │
//  └─────────────────────────────────────────────────┘
//
// The `animate-fade-in-up` on <main> gives every page a
// smooth entrance animation when navigating between routes.
// ──────────────────────────────────────────────────────────

import TopNavBar      from "./TopNavBar";
import SideNavBar     from "./SideNavBar";
import BottomMobileNav from "./BottomMobileNav";

interface PageLayoutProps {
  children: React.ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    // Root container fills the full viewport height
    <div className="flex min-h-screen bg-cl-surface">

      {/* Fixed top bar */}
      <TopNavBar />

      {/* Desktop-only sidebar */}
      <SideNavBar />

      {/* Main scrollable content area */}
      <main className="flex-1 lg:ml-56 pt-16 pb-24 lg:pb-6 flex flex-col animate-fade-in-up">
        {children}
      </main>

      {/* Mobile-only bottom tab bar */}
      <BottomMobileNav />
    </div>
  );
}
