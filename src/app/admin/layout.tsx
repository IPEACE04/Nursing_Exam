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
      router.push("/dashboard");
    }
  }, [user, profile, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center premium-gradient-bg">
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
        <main className="flex-1 overflow-y-auto premium-gradient-bg">
          <div className="mx-auto max-w-6xl p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
