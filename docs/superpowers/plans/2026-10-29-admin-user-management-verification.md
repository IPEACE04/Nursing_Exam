# User Management verification

## Delivered

- Admin menu and user list at `/admin/users`, with search, pagination, keyboard-operable multi-selection, and Excel export.
- Dedicated `/admin/users/[userId]` page with safe profile fields and complete paginated normal/PreTest/PostTest history.
- One `.xlsx` workbook containing exactly two records per selected user, matching the user-approved ID, score, duration, and missing-attempt rules.
- Existing student exam flows and prior uncommitted PostTest changes retained. No database writes or migration.

## Evidence

| Check | Result |
| --- | --- |
| `npm test` | 63 passed, 0 failed |
| `npx tsc --noEmit` | Passed |
| `npm run lint` | 0 errors, 10 pre-existing warnings outside this feature |
| `npm run build` | Passed; both new admin routes included |
| `git diff --check` | Passed |
| `designmd lint DESIGN.md` | 0 errors, 0 warnings |
| Supabase read-only schema checks | profiles, exam_attempts, and exams fields readable |
| Chrome, 1440px desktop / 390px mobile | Selection, paging, search/clear, details, every exam kind, actual workbook download, empty/error/recovery, English, dark theme, keyboard, and no document horizontal overflow passed |
| Workbook ZIP/XML tests | Correct headers/data, Thai, leading zeroes, explicit string cells, and no injected formulas |
| Premium static audit | 28 pre-existing findings in unrelated forms/selects; 0 in the new User Management UI |

Browser tests render the actual components and shared admin shell using explicitly synthetic user/action/auth fixtures. They do not mutate Supabase or create test accounts. The live Supabase check validates schema access only; a real admin-cookie login-to-export flow remains unverified.

## Independent reviews and fixes

- Builder check added an explicit failure for ambiguous multiple Pre/Post exams instead of silently choosing one.
- Fresh final code review found one stale-error recovery bug. Browser RED: failed search A → successful B → return to A stayed in error. Fixed by clearing active-request errors on success in list/profile/history; browser GREEN and the full suite passed.
- Impeccable initially requested viewport recaptures; replaced malformed full-page mobile captures with valid 390×844 captures and an additional inner-history capture.
- Impeccable's two material fixes were reproduced RED: export feedback outside the visible viewport and placeholder contrast 2.48:1. Moved feedback above search/table and used the full semantic placeholder color. Browser GREEN measured 5.48:1; final verdict scored both fixes resolved (`ship` at fix-list scope).
- Independent documenter compared product/design/UX records with runtime tokens, primitives, and screens. No documentation change or new system rule needed. Pre-existing shared Button height drift was not changed.

## Review artifacts

Local, ignored artifacts under `.impeccable/review/`: desktop/mobile list, profile/history and export-error screenshots; `scores-browser.xlsx` containing synthetic users only; unit-test log, premium audit JSON, and copied browser fixture sources. Browser tools were installed under `/private/tmp/nursing-ui-verification`, not added to project dependencies.

## Decisions and limits

- Work stayed in the shared checkout to preserve earlier authorized uncommitted changes and the running dev setup; no branch switch, commit, or deployment.
- Exactly one new runtime dependency: pinned `write-excel-file@4.1.1`, loaded only when generating an export.
- Impeccable's optional CLI engine was unavailable; followed its documented direct-context fallback. No detector result is claimed.
- Unrelated pre-existing lint/static-audit findings were not expanded into this feature's scope.
