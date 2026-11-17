"use client";

import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Download,
  Loader2,
  Search,
  Users,
  X,
  ArrowUpRight,
} from "lucide-react";
import { getAdminUsers, getAdminUserScoreExport } from "@/actions/admin";
import { ADMIN_USERS_PAGE_SIZE } from "@/lib/admin-users";
import {
  getScoreSheetData,
  SCORE_WORKBOOK_OPTIONS,
} from "@/lib/score-workbook";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { PageSkeleton } from "@/components/premium/page-skeleton";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface UserSearchProps {
  initialSearch: string;
  onSearch: (search: string) => void;
}

function UserSearch({ initialSearch, onSearch }: UserSearchProps) {
  const { locale } = useLocale();
  const [value, setValue] = useState(initialSearch);
  const input = useRef<HTMLInputElement>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(value.trim());
  }
  return (
    <form noValidate onSubmit={submit} className="flex w-full max-w-xl gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-4 top-4 size-4 text-muted-foreground" />
        <Input
          ref={input}
          name="search"
          aria-label={t(locale, "admin.users.search")}
          placeholder={t(locale, "admin.users.search")}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={100}
          className="bg-card pl-11 pr-12 placeholder:text-muted-foreground"
        />
        {value && (
          <button
            type="button"
            aria-label={t(locale, "admin.users.clearSearch")}
            onClick={() => {
              setValue("");
              onSearch("");
              input.current?.focus();
            }}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <Button type="submit" variant="outline" className="h-12">
        {t(locale, "admin.users.searchButton")}
      </Button>
    </form>
  );
}

function UsersList() {
  const { locale } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const search = (params.get("q") ?? "").slice(0, 100);
  const parsedPage = Number(params.get("page") ?? 1);
  const page =
    Number.isSafeInteger(parsedPage) &&
    parsedPage > 0 &&
    parsedPage <= 1_000_000
      ? parsedPage
      : 1;
  const [revision, setRevision] = useState(0);
  const requestKey = `${page}:${search}:${revision}`;
  const [result, setResult] = useState<{
    key: string;
    data: Awaited<ReturnType<typeof getAdminUsers>>;
  } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState<{
    error: boolean;
    key: string;
    count?: number;
  } | null>(null);
  const data = result?.key === requestKey ? result.data : null;
  const failed = failedKey === requestKey;
  const loading = !data && !failed;
  const users = data?.users ?? [];
  const selectedOnPage = users.filter((user) => selected.has(user.id)).length;
  const pageSelected = users.length > 0 && selectedOnPage === users.length;

  useEffect(() => {
    document.title = `${t(locale, "admin.users.title")} | NurseUp`;
  }, [locale]);

  useEffect(() => {
    let active = true;
    getAdminUsers(search, page)
      .then((value) => {
        if (active) {
          setResult({ key: requestKey, data: value });
          setFailedKey(null);
        }
      })
      .catch(() => {
        if (active) setFailedKey(requestKey);
      });
    return () => {
      active = false;
    };
  }, [search, page, requestKey]);

  function navigate(nextSearch: string, nextPage: number) {
    const query = new URLSearchParams();
    if (nextSearch) query.set("q", nextSearch);
    if (nextPage > 1) query.set("page", String(nextPage));
    router.replace(`/admin/users${query.size ? `?${query}` : ""}`, {
      scroll: false,
    });
  }

  function selectUser(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
    setNotice(null);
  }

  function selectPage(checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      for (const user of users) {
        if (checked) next.add(user.id);
        else next.delete(user.id);
      }
      return next;
    });
    setNotice(null);
  }

  async function exportScores() {
    if (!selected.size || exporting) return;
    const ids = [...selected];
    setExporting(true);
    setNotice(null);
    try {
      const exported = await getAdminUserScoreExport(ids);
      if (exported.error) {
        setNotice({
          error: true,
          key: `admin.users.exportError.${exported.error}`,
        });
        return;
      }
      const { default: writeExcelFile } =
        await import("write-excel-file/browser");
      await writeExcelFile(
        getScoreSheetData(exported.rows),
        SCORE_WORKBOOK_OPTIONS,
      ).toFile(`NurseUp-scores-${new Date().toISOString().slice(0, 10)}.xlsx`);
      setNotice({
        error: false,
        key: "admin.users.exportSuccess",
        count: ids.length,
      });
    } catch {
      setNotice({ error: true, key: "admin.users.exportError.loadFailed" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={t(locale, "admin.users.title")}
        description={t(locale, "admin.users.description")}
        action={
          <Button
            className="h-12"
            onClick={exportScores}
            disabled={!selected.size || exporting}
            aria-busy={exporting}
          >
            {exporting ? <Loader2 className="animate-spin" /> : <Download />}
            {t(
              locale,
              exporting ? "admin.users.exporting" : "admin.users.export",
            )}
          </Button>
        }
      />
      {notice && (
        <p
          role={notice.error ? "alert" : "status"}
          className={
            notice.error
              ? "text-sm text-destructive"
              : "text-sm text-foreground"
          }
        >
          {t(locale, notice.key, { n: notice.count ?? 0 })}
        </p>
      )}
      <UserSearch
        key={search}
        initialSearch={search}
        onSearch={(value) => navigate(value, 1)}
      />
      <GlassCard animated={false} className="overflow-hidden">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 sm:px-6">
          <p className="text-sm font-medium" role="status">
            {t(locale, "admin.users.selected", { n: selected.size })}
          </p>
          {selected.size > 0 ? (
            <Button
              size="sm"
              variant="ghost"
              disabled={exporting}
              onClick={() => {
                setSelected(new Set());
                setNotice(null);
              }}
            >
              {t(locale, "admin.users.clearSelection")}
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              {t(locale, "admin.users.selectionHint")}
            </span>
          )}
        </div>
        {loading ? (
          <PageSkeleton variant="table" header={false} />
        ) : failed ? (
          <div className="space-y-4 p-8 text-center" role="alert">
            <p>{t(locale, "admin.users.loadError")}</p>
            <Button
              variant="outline"
              onClick={() => setRevision((value) => value + 1)}
            >
              {t(locale, "admin.users.retry")}
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className="space-y-3 px-5 py-16 text-center">
            <Users className="mx-auto size-9 text-muted-foreground" />
            <h2 className="text-base font-semibold">
              {t(
                locale,
                search ? "admin.users.noResults" : "admin.users.empty",
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(
                locale,
                search ? "admin.users.noResultsHint" : "admin.users.emptyHint",
              )}
            </p>
            {page > 1 && (
              <Button variant="outline" onClick={() => navigate(search, 1)}>
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
                  {t(locale, "admin.users.title")}
                </caption>
                <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                  <tr>
                    <th scope="col" className="w-16 px-5 py-4">
                      <Checkbox
                        checked={pageSelected}
                        indeterminate={selectedOnPage > 0 && !pageSelected}
                        onCheckedChange={selectPage}
                        disabled={exporting}
                        aria-label={t(locale, "admin.users.selectPage")}
                      />
                    </th>
                    <th scope="col" className="px-3 py-4 font-medium">
                      {t(locale, "admin.users.name")}
                    </th>
                    <th scope="col" className="px-3 py-4 font-medium">
                      {t(locale, "admin.users.studentId")}
                    </th>
                    <th scope="col" className="px-3 py-4 font-medium">
                      {t(locale, "admin.users.role")}
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-4 text-right font-medium"
                    >
                      {t(locale, "admin.users.details")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-5 py-5">
                        <Checkbox
                          checked={selected.has(user.id)}
                          onCheckedChange={(checked) =>
                            selectUser(user.id, checked)
                          }
                          disabled={exporting}
                          aria-label={t(locale, "admin.users.selectUser", {
                            name: user.name || user.email || user.id,
                          })}
                        />
                      </td>
                      <td className="max-w-72 px-3 py-5">
                        <p className="break-words font-medium text-foreground">
                          {user.name || "—"}
                        </p>
                        <p className="mt-1 break-all text-xs text-muted-foreground">
                          {user.email ?? "—"}
                        </p>
                      </td>
                      <td className="px-3 py-5 tabular-nums">
                        {user.student_id || "—"}
                      </td>
                      <td className="px-3 py-5">
                        <span className="rounded-lg bg-secondary px-2.5 py-1 text-xs">
                          {t(
                            locale,
                            user.role === "admin"
                              ? "common.admin"
                              : "admin.users.student",
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-5 text-right">
                        <Link
                          href={`/admin/users/${user.id}?${new URLSearchParams({ q: search, page: String(page) })}`}
                          className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2 font-medium text-primary hover:bg-secondary"
                        >
                          {t(locale, "admin.users.details")}
                          <ArrowUpRight className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {data && data.total > 0 && (
          <div className="border-t border-border px-5 sm:px-6">
            <PaginationControls
              page={page}
              total={data.total}
              pageSize={ADMIN_USERS_PAGE_SIZE}
              onPageChange={(value) => navigate(search, value)}
              disabled={loading || exporting}
            />
          </div>
        )}
      </GlassCard>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t(locale, "admin.users.exportHint")}
      </p>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="table" />}>
      <UsersList />
    </Suspense>
  );
}
