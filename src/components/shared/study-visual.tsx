"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";

interface StudyVisualProps {
  variant?: "login" | "register" | "recovery" | "dashboard" | "landing" | "landingPractice" | "landingProgress" | "landingCommunity" | "landingReview";
  className?: string;
  priority?: boolean;
  sizes?: string;
}

const visuals = {
  login: { src: "/images/nursing-study.webp", alt: "design.studyImage" },
  register: { src: "/images/nursing-register.webp", alt: "design.registerImage" },
  recovery: { src: "/images/nursing-recovery.webp", alt: "design.recoveryImage" },
  dashboard: { src: "/images/nursing-dashboard.webp", alt: "design.dashboardImage" },
  landing: { src: "/images/nursing-landing.webp", alt: "design.landingImage" },
  landingPractice: { src: "/images/landing-practice.webp", alt: "design.practiceImage" },
  landingProgress: { src: "/images/landing-progress.webp", alt: "design.progressImage" },
  landingCommunity: { src: "/images/landing-community.webp", alt: "design.communityImage" },
  landingReview: { src: "/images/landing-review.webp", alt: "design.reviewImage" },
};

export function StudyVisual({ variant = "login", className, priority = false, sizes = "(min-width: 1024px) 50vw, 100vw" }: StudyVisualProps) {
  const { locale } = useLocale();
  const visual = visuals[variant];
  return (
    <div className={cn("relative isolate overflow-hidden rounded-xl bg-muted", className)}>
      <Image src={visual.src} alt={t(locale, visual.alt)} fill sizes={sizes} fetchPriority={priority ? "high" : undefined} loading={priority ? "eager" : "lazy"} className="object-cover object-[center_35%]" />
    </div>
  );
}
