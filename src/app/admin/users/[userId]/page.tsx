"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { getAdminUserDetail, getAdminUserAttempts } from "@/actions/admin";
import { ADMIN_USERS_PAGE_SIZE, formatExamDuration } from "@/lib/admin-users";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";
import type { AdminUserDetail } from "@/types";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Button } from "@/components/ui/button";

interface UserDetailPageProps {
  params: Promise<{ userId: string }>;
}

function UserDetail({ params }: UserDetailPageProps) {
  const { userId } = use(params);
  const { locale } = useLocale();
  const router = useRouter();
  const query = useSearchParams();
  const parsedPage = Number(query.get("attemptPage") ?? 1);
  const page =
    Number.isSafeInteger(parsedPage) &&
    parsedPage > 0 &&
    parsedPage <= 1_000_000
      ? parsedPage
      : 1;
  const [revision, setRevision] = useState(0);
  const profileKey = `${userId}:${revision}`;
  const historyKey = `${profileKey}:${page}`;
  const [profileResult, setProfileResult] = useState<{
    key: string;
    user: AdminUserDetail | null;
  } | null>(null);
  const [historyResult, setHistoryResult] = useState<{
    key: string;
    data: Awaited<ReturnType<typeof getAdminUserAttempts>>;
  } | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const profile =
    profileResult?.key === profileKey ? profileResult.user : undefined;
  const history = historyResult?.key === historyKey ? historyResult.data : null;
  const historyLoading = !history && historyError !== historyKey;
  const backQuery = new URLSearchParams();
  if (query.get("q")) backQuery.set("q", query.get("q")!);
  if (query.get("page")) backQuery.set("page", query.get("page")!);
  const backHref = `/admin/users${backQuery.size ? `?${backQuery}` : ""}`;

  useEffect(() => {
    let active = true;
    getAdminUserDetail(userId)
      .then((user) => {
        if (active) {
          setProfileResult({ key: profileKey, user });
          setProfileError(null);
        }
      })
      .catch(() => {
        if (active) setProfileError(profileKey);
      });
    return () => {
      active = false;
    };
  }, [userId, profileKey]);

  useEffect(() => {
    let active = true;
    getAdminUserAttempts(userId, page)
      .then((data) => {
        if (active) {
          setHistoryResult({ key: historyKey, data });
          setHistoryError(null);
        }
      })
      .catch(() => {
        if (active) setHistoryError(historyKey);
      });
    return () => {
      active = false;
    };
  }, [userId, page, historyKey]);

  useEffect(() => {
    document.title = `${profile?.name || t(locale, "admin.users.details")} | NurseUp`;
  }, [locale, profile?.name]);

  function changePage(nextPage: number) {
    const next = new URLSearchParams(query.toString());
    if (nextPage > 1) next.set("attemptPage", String(nextPage));
    else next.delete("attemptPage");
    router.replace(`/admin/users/${userId}${next.size ? `?${next}` : ""}`, {
      scroll: false,
    });
  }

  const backLink = (
    <Link
      href={backHref}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      {t(locale, "admin.users.back")}
    </Link>
  );
  if (profileError === profileKey)
    return (
      <div className="space-y-6">
        {backLink}
        <GlassCard className="space-y-4 p-8 text-center" role="alert">
          <p>{t(locale, "admin.users.loadError")}</p>
          <Button
            variant="outline"
            onClick={() => setRevision((value) => value + 1)}
          >
            {t(locale, "admin.users.retry")}
          </Button>
        </GlassCard>
      </div>
    );
  if (profile === undefined)
    return (
      <div className="space-y-6">
        {backLink}
        <div className="flex min-h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  if (profile === null)
    return (
      <div className="space-y-6">
        {backLink}
        <PageHeader
          title={t(locale, "admin.users.notFound")}
          description={t(locale, "admin.users.notFoundHint")}
        />
      </div>
    );

  const date = (value: string) =>
    new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  const genderKey =
    profile.gender === "ชาย"
      ? "register.gender.male"
      : profile.gender === "หญิง"
        ? "register.gender.female"
        : profile.gender === "อื่นๆ"
          ? "register.gender.other"
          : null;
  const fields = [
    { key: "studentId", value: profile.student_id },
    { key: "systemId", value: profile.id },
    { key: "email", value: profile.email },
    { key: "university", value: profile.university },
    { key: "gender", value: genderKey ? t(locale, genderKey) : profile.gender },
    { key: "age", value: profile.age == null ? null : String(profile.age) },
    {
      key: "gpa",
      value:
        profile.gpa == null
          ? null
          : new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(
              profile.gpa,
            ),
    },
    {
      key: "role",
      value: t(
        locale,
        profile.role === "admin" ? "common.admin" : "admin.users.student",
      ),
    },
    { key: "registered", value: date(profile.created_at) },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {backLink}
      <PageHeader
        title={profile.name || t(locale, "admin.users.unnamed")}
        description={t(locale, "admin.users.detailDescription")}
      />
      <GlassCard animated={false} className="p-5 sm:p-7">
        <h2 className="mb-6 text-lg font-semibold">
          {t(locale, "admin.users.profile")}
        </h2>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
          {fields.map(({ key, value }) => (
            <div key={key} className="min-w-0">
              <dt className="text-xs text-muted-foreground">
                {t(locale, `admin.users.${key}`)}
              </dt>
              <dd className="mt-1.5 break-words text-sm text-foreground [overflow-wrap:anywhere]">
                {value || "—"}
              </dd>
            </div>
          ))}
        </dl>
      </GlassCard>
      <GlassCard animated={false} className="overflow-hidden">
        <div className="border-b border-border px-5 py-5 sm:px-7">
          <h2 className="text-lg font-semibold">
            {t(locale, "admin.users.history")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(locale, "admin.users.historyHint")}
          </p>
        </div>
        {historyLoading ? (
          <div
            className="flex min-h-64 items-center justify-center"
            aria-busy="true"
          >
            <LoadingSpinner />
          </div>
        ) : historyError === historyKey ? (
          <div className="space-y-4 p-8 text-center" role="alert">
            <p>{t(locale, "admin.users.historyError")}</p>
            <Button
              variant="outline"
              onClick={() => setRevision((value) => value + 1)}
            >
              {t(locale, "admin.users.retry")}
            </Button>
          </div>
        ) : !history?.attempts.length ? (
          <div className="space-y-3 px-5 py-12 text-center">
            <ClipboardList className="mx-auto size-9 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t(locale, "admin.users.noAttempts")}
            </p>
            {page > 1 && (
              <Button variant="outline" onClick={() => changePage(1)}>
                {t(locale, "admin.users.firstPage")}
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="px-5 pt-3 text-xs text-muted-foreground sm:hidden">
              {t(locale, "admin.users.scrollHint")}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <caption className="sr-only">
                  {t(locale, "admin.users.history")}
                </caption>
                <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                  <tr>
                    {["exam", "testType", "completed", "score", "duration"].map(
                      (key) => (
                        <th
                          key={key}
                          scope="col"
                          className="px-5 py-4 font-medium"
                        >
                          {t(locale, `admin.users.${key}`)}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.attempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-muted/30">
                      <td className="max-w-72 break-words px-5 py-4 font-medium">
                        {attempt.exam_title ||
                          t(locale, "admin.users.unnamedExam")}
                      </td>
                      <td className="px-5 py-4">
                        <span className="whitespace-nowrap rounded-lg bg-secondary px-2.5 py-1 text-xs">
                          {attempt.test_phase ??
                            t(locale, "admin.users.normalExam")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                        {date(attempt.completed_at)}
                      </td>
                      <td className="px-5 py-4 tabular-nums">
                        {attempt.score}/{attempt.total_questions}
                      </td>
                      <td className="px-5 py-4 tabular-nums">
                        {formatExamDuration(attempt.time_spent_seconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {(history?.total ?? historyResult?.data.total ?? 0) > 0 && (
          <div className="border-t border-border px-5 sm:px-7">
            <PaginationControls
              page={page}
              total={history?.total ?? historyResult?.data.total ?? 0}
              pageSize={ADMIN_USERS_PAGE_SIZE}
              disabled={historyLoading || historyError === historyKey}
              onPageChange={changePage}
            />
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default function AdminUserDetailPage(props: UserDetailPageProps) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <UserDetail {...props} />
    </Suspense>
  );
}
