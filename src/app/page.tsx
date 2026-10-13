"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Activity,
  BarChart3,
  Radio,
  CheckLine,
  Clock3,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { LocaleToggle } from "@/components/shared/locale-toggle";
import { t } from "@/lib/translations";
import { Brand } from "@/components/shared/brand";
import { StudyVisual } from "@/components/shared/study-visual";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import styles from "./landing.module.css";

export default function Home() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [activeFeature, setActiveFeature] = useState("practice");
  const { user, profile, isLoading } = useAuth();
  const { locale } = useLocale();

  useEffect(() => {
    if (!isLoading && user) {
      if (profile?.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/community");
      }
    }
  }, [isLoading, user, profile, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return null;

  const features = [
    {
      icon: Activity,
      id: "practice",
      visual: "landingPractice" as const,
      detail: t(locale, "landing.step2Desc"),
      title: t(locale, "landing.f1_title"),
      desc: t(locale, "landing.f1_desc"),
    },
    {
      icon: BarChart3,
      id: "progress",
      visual: "landingProgress" as const,
      detail: t(locale, "landing.step3Desc"),
      title: t(locale, "landing.f2_title"),
      desc: t(locale, "landing.f2_desc"),
    },
    {
      icon: Radio,
      id: "community",
      visual: "landingCommunity" as const,
      detail: t(locale, "landing.communityDetail"),
      title: t(locale, "landing.f3_title"),
      desc: t(locale, "landing.f3_desc"),
    },
    {
      icon: CheckLine,
      id: "review",
      visual: "landingReview" as const,
      detail: t(locale, "landing.reviewDetail"),
      title: t(locale, "landing.f4_title"),
      desc: t(locale, "landing.f4_desc"),
    },
  ];

  const steps = [
    { title: "landing.step1Title", desc: "landing.step1Desc" },
    { title: "landing.step2Title", desc: "landing.step2Desc" },
    { title: "landing.step3Title", desc: "landing.step3Desc" },
  ];
  const activeFeatureData = features.find((feature) => feature.id === activeFeature) ?? features[0];
  const ActiveFeatureIcon = activeFeatureData.icon;

  return (
    <div id="top" className={styles.page}>
      <header className={styles.header}>
        <div className={styles.navInner}>
          <Link href="/" aria-label="NurseUp" className={styles.brand}><Brand /></Link>
          <div className={styles.navActions}>
            <LocaleToggle />
            <Link href="/login" className={styles.navLogin}>{t(locale, "landing.login")}</Link>
            <Link href="/register" className={styles.navCta}>{t(locale, "landing.startFree")} <ArrowRight size={16} /></Link>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <motion.div className={styles.heroCopy} initial={reducedMotion ? false : { opacity: 0.95, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            <h1 className={styles.heroTitle}>{t(locale, "landing.hero")}<span>{t(locale, "landing.heroSub")}</span></h1>
            <p className={styles.heroDescription}>{t(locale, "landing.desc")}</p>
            <div className={styles.heroActions}>
              <Link href="/register" className={styles.primaryButton}>{t(locale, "landing.cta")} <ArrowRight size={19} /></Link>
              <Link href="/login" className={styles.secondaryButton}>{t(locale, "landing.hasAccount")} <ArrowRight size={17} /></Link>
            </div>
            <ul className={styles.capabilities}>
              <li><GraduationCap size={19} />{t(locale, "landing.prepost")}</li>
              <li><Clock3 size={18} />{t(locale, "landing.timedPractice")}</li>
            </ul>
          </motion.div>
        </section>

        <section id="features" className={styles.tourSection}>
          <Tabs value={activeFeature} onValueChange={(value) => { if (typeof value === "string") setActiveFeature(value); }} className={styles.tour}>
            <TabsList aria-label={t(locale, "landing.featuresNav")} className={styles.tourTabs}>
              {features.map((feature) => {
                const Icon = feature.icon;
                return <TabsTrigger key={feature.id} value={feature.id} className={styles.tourTab}><Icon size={18} />{feature.title}</TabsTrigger>;
              })}
            </TabsList>
            <div className={styles.tourBody}>
              <figure className={styles.heroVisual}>
                <StudyVisual key={activeFeatureData.id} variant={activeFeatureData.visual} priority sizes="(min-width: 1280px) 490px, (min-width: 1024px) 42vw, 100vw" className={styles.heroImage} />
                <figcaption className={styles.heroCaption}><ActiveFeatureIcon size={22} /><span>{activeFeatureData.title}</span></figcaption>
              </figure>
              <div className={styles.tourPanels}>
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <TabsContent key={feature.id} value={feature.id} className={styles.tourPanel}>
                      <div className={styles.tourIcon}><Icon size={26} /></div>
                      <h2>{feature.title}</h2>
                      <p className={styles.tourLead}>{feature.desc}</p>
                      <p className={styles.tourDetail}>{feature.detail}</p>
                      <Link href="/register" className={styles.tourLink}>{t(locale, "landing.cta")} <ArrowRight size={18} /></Link>
                    </TabsContent>
                  );
                })}
              </div>
            </div>
          </Tabs>
        </section>

        <section id="journey" className={styles.journey}>
          <h2 className={styles.journeyTitle}>{t(locale, "landing.journeyTitle")}</h2>
          <ol className={styles.steps}>
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <h3>{t(locale, step.title)}</h3>
                <p>{t(locale, step.desc)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.closing}>
          <div className={styles.closingPanel}>
            <div><h2>{t(locale, "landing.finalTitle")}</h2><p>{t(locale, "landing.finalDesc")}</p></div>
            <Link href="/register" className={styles.lightButton}>{t(locale, "landing.cta")} <ArrowRight size={18} /></Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div><Brand /><p>© {new Date().getFullYear()} NurseUp · Rangsit University</p></div>
          <nav aria-label={t(locale, "common.navigation")} className={styles.footerLinks}>
            <Link href="/login">{t(locale, "landing.login")}</Link>
            <Link href="/register">{t(locale, "auth.register")}</Link>
            <a href="#top">{t(locale, "landing.backToTop")}</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
