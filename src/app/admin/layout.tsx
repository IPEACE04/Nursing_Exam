"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { AdminNavbar } from "@/components/shared/admin-navbar";
import { AdminSidebar } from "@/components/shared/admin-sidebar";
import { AdminMobileNav } from "@/components/shared/admin-mobile-nav";
import { LoadingSpinner } from "@/components/premium/loading-spinner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/login");
    } else if (profile?.role !== "admin") {
      router.push("/community");
    }
  }, [user, profile, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || profile?.role !== "admin") {
    return null;
  }

  return (
    <div className="flex h-screen flex-col">
      <AdminNavbar />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">{children}</div>
        </main>
      </div>
      <AdminMobileNav />
    </div>
  );
}
