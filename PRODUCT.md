# NurseUp

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Thai nursing students prepare for nursing examinations. Administrators maintain exams, community content, evaluation reports, and user/exam records.

## Product Purpose

Support exam practice, timed assessments, result review, and comparison of PreTest/PostTest progress.

## Capabilities and Constraints

- Next.js 16, React 19, TypeScript, Tailwind v4, Base UI, custom JWT cookies, and Supabase raw queries. See AGENTS.md.
- The first saved Pre/Post attempt is PreTest; the latest subsequent attempt is PostTest. Normal exam practice is separate.
- Admin User Management reads profiles and every saved attempt, including unpublished exams and repeats. Export selected users as an Excel workbook with exactly two rows per user.
- Export ID is the student ID, falling back to profile UUID. Scores are earned/full, durations HH:MM:SS, and missing attempts read `ยังไม่ได้สอบ`.
- Student exam behavior and existing data must remain compatible. User Management does not edit accounts or exam attempts.

## Brand Commitments

Retain NurseUp's existing identity, Thai-first content, and Thai/English locale support. Admin additions inherit the existing application UI.

## Evidence on Hand

AGENTS.md, implemented routes/actions, database types, and the user-approved design at `docs/superpowers/specs/2026-10-29-admin-user-management-design.md`. Browser-test fixtures are synthetic and must never be presented as live users.

## Product Principles

- Protect student records with server-enforced admin authorization.
- Distinguish no data from a failed request and provide recovery.
- Export complete selections without silently dropping users or attempts.
- Preserve the existing exam flow while adding administrative visibility.
