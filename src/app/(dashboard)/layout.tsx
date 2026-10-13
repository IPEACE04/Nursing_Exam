"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/shared/navbar";
import { MobileNav } from "@/components/shared/mobile-nav";
import { LoadingSpinner } from "@/components/premium/loading-spinner";
import { getPrePostTestGate } from "@/actions/exam";
import { WorkspaceHeader } from "@/components/shared/workspace-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, user, isLoading } = useAuth();
  const [checkingGate, setCheckingGate] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    if (profile?.role === "admin") {
      router.push("/admin");
      return;
    }

    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (pathname.startsWith("/progress") || pathname.startsWith("/exam/")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCheckingGate(false);
      return;
    }

    getPrePostTestGate()
      .then((gate) => {
        if (!gate.preTestCompleted && gate.prePostExamId) {
          router.replace(`/exam/${gate.prePostExamId}`);
        } else {
          setCheckingGate(false);
        }
      })
      .catch(() => {
        setCheckingGate(false);
      });
  }, [profile, isLoading, user, router, pathname]);

  if (isLoading || checkingGate) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (profile?.role === "admin") {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col lg:pl-[264px] xl:pl-[284px]">
      <Navbar />
      <WorkspaceHeader />
      <main className="min-w-0 flex-1 pb-28 lg:pb-0">
        <div className={`mx-auto w-full max-w-7xl px-5 sm:px-8 xl:px-12 ${pathname === "/dashboard" ? "py-6 sm:py-7 xl:py-8" : "py-7 sm:py-10 xl:py-12"}`}>
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
