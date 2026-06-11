"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/shared/navbar";
import { MobileNav } from "@/components/shared/mobile-nav";
import { LoadingSpinner } from "@/components/premium/loading-spinner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { profile, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (profile?.role === "admin") {
      router.push("/admin");
    }
  }, [profile, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-clinical-grid">
        <LoadingSpinner />
      </div>
    );
  }

  if (profile?.role === "admin") {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-clinical-grid">
      <Navbar />
      <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
        <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 md:p-8 lg:p-10">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
