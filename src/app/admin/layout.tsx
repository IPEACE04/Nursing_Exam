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
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AdminSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <AdminNavbar />
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-28 lg:pb-0">
            <div className="mx-auto max-w-7xl px-5 sm:px-8 xl:px-12 py-7 sm:py-10 xl:py-12">{children}</div>
          </main>
        </div>
      </div>
      <AdminMobileNav />
    </div>
  );
}
