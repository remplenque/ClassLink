"use client";
import TopNavBar from "./TopNavBar";
import SideNavBar from "./SideNavBar";
import BottomMobileNav from "./BottomMobileNav";

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <TopNavBar />
      <SideNavBar />
      <main className="flex-1 lg:ml-56 pt-16 pb-24 lg:pb-6 flex flex-col">
        {children}
      </main>
      <BottomMobileNav />
    </div>
  );
}
