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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (profile?.role === "admin") {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
