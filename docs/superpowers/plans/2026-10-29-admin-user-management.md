# Admin User Management Implementation Plan

> Execute inline using superpowers:executing-plans; user approved the design and immediate development.

**Goal:** Admin user details, every saved exam attempt, and selected-user Pre/Post Excel exports.
**Architecture:** Extend existing admin server actions and role gate; add `/admin/users` and `/admin/users/[userId]` client pages. Reuse the admin shell and primitives. Generate `.xlsx` on demand using one focused library.
**Tech stack:** Existing Next.js 16, React 19, TypeScript, Base UI, Tailwind, custom JWT, Supabase.
**Spec:** `docs/superpowers/specs/2026-10-29-admin-user-management-design.md` (approved).

## Global constraints

- Preserve prior uncommitted PostTest work and all student flows. No database writes or migration.
- Every new server action uses the existing admin gate and explicit profile projections.
- Export exactly two rows per selected user with the five approved columns and missing-attempt policy.
- Keep Thai/English messages and the established design; selection applies to the current page and persists across paging/searching.

## Review focus

Profile secrets; expired or changed admin role; data exceeding Supabase's default page; ambiguous Pre/Post exams; zero scores/time and formula-like names/leading-zero IDs.

## Task 1 — Authorized data and workbook

- [x] Add failing action tests using the repository's transpile/VM pattern: authorization, safe projections, list/detail/history pagination, selected-only export, first/latest attempts, missing/zero values, malformed IDs, database failures, and ambiguous exams.
- [x] Add the user/profile/history/export interfaces to `src/types/index.ts`; implement `getAdminUsers(search, page)`, `getAdminUserDetail(userId)`, `getAdminUserAttempts(userId, page)`, and `getAdminUserScoreExport(userIds)` in `src/actions/admin.ts`.
- [x] Add pure formatting/Pre-Post selection in `src/lib/admin-users.ts` with unit tests. Paginate history on the server; batch export IDs and iterate result pages rather than truncate.
- [x] Pin one `write-excel-file` dependency. Add `src/lib/score-workbook.ts`, explicitly typed text cells, and a real ZIP/XML workbook test.
- [x] Run the targeted tests, then `npm test`; expected all green.

## Task 2 — Admin UI and navigation

- [x] Add list and detail client pages, safe async states/retry, server search, numbered pagination, current-page selection, selected count, and export feedback. Reuse PageHeader, GlassCard, Button, Input; add a Base UI Checkbox primitive because none exists.
- [x] Wire desktop/mobile navigation and localized copy. Preserve active state on user detail; keep six mobile items usable.
- [x] Record incumbent product/design/behavior context in PRODUCT.md, DESIGN.md, and UX-CONTRACT.md without changing runtime tokens.
- [x] Verify TypeScript, lint, and build; expected no errors (existing unrelated lint warnings may remain).

## Task 3 — Verification and review

- [x] Exercise UI/Excel in a browser at desktop/mobile widths using isolated synthetic fixtures when real account credentials are unavailable; never create or modify live user data for tests.
- [x] Run the premium static audit and one bounded visual inspection/fix batch. Keep existing unrelated findings separate.
- [x] Request a fresh final code/UX review under the invoked skills; resolve material defects and rerun relevant checks.
- [x] Report delivered behavior, test evidence, and any unverified live-user boundary. Leave changes uncommitted for user review.

## Execution record

- Baseline: 52 tests passed; TypeScript passed; lint had 0 errors and 10 existing warnings.
- Working in the shared checkout to preserve prior authorized uncommitted changes and the running dev environment; do not switch branches, discard files, or commit automatically.

- Completed: 63 tests, TypeScript, lint (0 errors / 10 existing warnings), production build, workbook ZIP/XML validation, and desktop/mobile browser fixtures passed.
- Final code-review stale error finding reproduced RED and fixed GREEN; final UX verdict resolved both listed fixes. Independent documentation comparison complete. See the adjacent verification report for scope and limitations.
