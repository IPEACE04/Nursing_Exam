"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/shared/navbar";
import { MobileNav } from "@/components/shared/mobile-nav";
import { LoadingSpinner } from "@/components/premium/loading-spinner";
import { getPrePostTestGate } from "@/actions/exam";

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCheckingGate(false);
      return;
    }

    if (pathname.startsWith("/progress") || pathname.startsWith("/exam/")) {
      setCheckingGate(false);
      return;
    }

    getPrePostTestGate(user.id).then((gate) => {
      if (!gate.preTestCompleted && gate.prePostExamId) {
        router.push(`/exam/${gate.prePostExamId}`);
      } else {
        setCheckingGate(false);
      }
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
    <div className="flex min-h-screen flex-col">
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
