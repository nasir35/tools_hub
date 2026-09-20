"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStudyVault = pathname?.startsWith("/tools/study-vault");

  if (isStudyVault) {
    return <main className="w-full min-h-screen p-0 m-0 overflow-x-hidden">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </>
  );
}
