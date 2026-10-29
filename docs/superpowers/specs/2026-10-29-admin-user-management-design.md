# Admin User Management

## Intent and confirmed requirements

Add an admin-only User Management menu for inspecting registered users, reviewing every saved exam attempt, and exporting selected users' PreTest/PostTest scores as a real Excel `.xlsx` file.

Confirmed by the user:

- Export multiple selected users in one file.
- Use the student ID as `ID`; fall back to the profile UUID when absent. Preserve leading zeroes.
- Use five columns: `ID`, `Name`, `ประเภทสอบ`, `Score`, `ระยะเวลา`.
- Format scores as earned/full, and duration as hours:minutes:seconds.
- Always export exactly two rows per selected user: PreTest followed by PostTest. A missing attempt shows `ยังไม่ได้สอบ`; its duration is blank.

## Approach proposed for approval

Recommend a user list at `/admin/users` and a dedicated detail page at `/admin/users/[userId]`. This follows existing admin routes and accommodates long histories and mobile screens.

An alternative is a list with a detail drawer, which makes quick comparisons easier but adds overlay, focus, and nested scrolling complexity for long histories. The dedicated detail page is the proposed choice.

Inherit the existing NurseUp admin shell, Prompt typography, semantic colors, cards, spacing, light/dark themes, and Thai/English locale support. This is an addition to the established interface, not a redesign.

## Screens and behavior

- Add User Management to desktop and mobile admin navigation; keep it active on detail routes.
- The list shows student ID, name, email, role, and a detail link. Search name, email, or student ID. Paginate rather than silently truncating registered users.
- Each row has a labeled checkbox; select-all applies to the current page. Show the total selected count, allow clearing selection, and retain selections while paging/searching within the list.
- Place `Export score` in the page header. Disable it when selection is empty or an export is in progress; show success and actionable failure feedback.
- The detail page shows existing profile information: system ID, student ID, name, email, university, gender, age, GPA, role, and registration date. Optional missing values display a placeholder.
- Show all saved attempts for that user, including normal exams, PreTest, PostTest, repeats, and attempts for unpublished exams. Include exam name, type, completion date, score/full, and elapsed time. Paginate the history without dropping older attempts.
- Handle loading, empty users, no search matches, missing user, empty history, network failure with retry, and expired/forbidden sessions. Navigation, selection, and export must work with keyboard and narrow screens.

## Data and Excel rules

- Keep the existing interpretation: first attempt on the Pre/Post exam is PreTest; the latest subsequent attempt is PostTest. Use completion time and then attempt ID for deterministic ordering. History still displays every saved attempt.
- Resolve the Pre/Post exam regardless of publication status. No matching exam means both export rows are unattempted. Multiple matching exams or query failure must show an actionable export error rather than choose or combine exams silently; user history still shows every stored attempt.
- Export in selected-user order, with each user's PreTest row immediately followed by their PostTest row.
- Preserve zero scores and zero durations as valid results. A missing attempt must never become a zero score.
- Names and identifiers are explicit text cells, including values beginning with `=`, `+`, `-`, or `@`; do not create spreadsheet formulas from user content.
- Read all rows needed for the selected users in bounded batches, respecting Supabase pagination. Do not export a partial selection silently.
- Generate an actual `.xlsx` workbook with a header row, readable column widths, and one scores worksheet. Add one focused spreadsheet-writing dependency because the repository currently has none; load it only for export.

Example:

| ID | Name | ประเภทสอบ | Score | ระยะเวลา |
| --- | --- | --- | --- | --- |
| 001234 | ตัวอย่างนักศึกษา | PreTest | 12/20 | 00:15:30 |
| 001234 | ตัวอย่างนักศึกษา | PostTest | ยังไม่ได้สอบ | |

## Security and compatibility

- Reuse the existing `requireAdmin()` gate for every new data/export action. Client navigation checks are not authorization.
- Select an explicit allowlist of public-to-admin profile fields; never return password hashes, security-question answers, session tokens, or service keys.
- Validate identifiers, pagination, search inputs, and the selected user set on the server. Re-fetch export data after authorization instead of trusting client-supplied scores.
- Use existing custom JWT authentication and raw Supabase queries. No schema migration is needed.
- Preserve the existing student exam, history, progress, and result flows, including the preceding PostTest change. This feature only reads existing data.

## Verification

- Tests for admin access, student/guest/expired-session rejection, and absence of secret profile fields.
- Tests for list search/pagination, complete history, and correct first/latest Pre/Post classification.
- Export tests for multiple users, exactly two rows each, fallback ID, leading zeroes, missing attempts, zero scores/time, unsafe spreadsheet text, invalid selections, database errors, and data beyond a default query page.
- Validate the generated workbook structure and cell values, not only the download filename.
- Run `npm test`, `npx tsc --noEmit`, `npm run lint`, and an application build. Exercise list/detail/export at desktop and mobile widths when browser automation is available; disclose any unverified boundaries.

## Approval status

Approved by the user on 2026-10-29: dedicated detail pages and immediate implementation, including the three confirmed export-format decisions above. Independent builder check completed; its multiple-Pre/Post-exam safeguard is included above.
