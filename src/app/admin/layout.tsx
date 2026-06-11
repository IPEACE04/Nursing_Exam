"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { AdminNavbar } from "@/components/shared/admin-navbar";
import { AdminSidebar } from "@/components/shared/admin-sidebar";
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
      <div className="flex min-h-screen items-center justify-center bg-clinical-grid premium-gradient-bg-intense">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || profile?.role !== "admin") {
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-clinical-grid premium-gradient-bg">
      <AdminNavbar />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-5 sm:p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
