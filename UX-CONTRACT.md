# NurseUp admin workflow contract

Visual identity: [DESIGN.md](DESIGN.md). Product facts: [PRODUCT.md](PRODUCT.md).

## Authoritative sources

| Concern | Source |
| --- | --- |
| Admin authorization and custom JWT | AGENTS.md; existing requireAdmin in src/actions/admin.ts |
| User details and two-row Excel policy | User-approved docs/superpowers/specs/2026-10-29-admin-user-management-design.md |
| Existing first/latest Pre/Post interpretation | src/actions/exam.ts, getProgressComparison |

## Canonical UI map

| Capability | Owner | Variant / behavior | Evidence |
| --- | --- | --- | --- |
| Table Selection | src/components/ui/checkbox.tsx; admin/users list state | Current-page select-all; selection retained while paging/searching | Admin list browser fixture |
| Search | UserSearch in admin/users/page.tsx | Explicit submit; immediate clear and input focus | List search browser fixture |
| Pagination | src/components/shared/pagination-controls.tsx | 25 results/page; exact total; previous/next and boundary states | test/admin-users.test.ts |
| Scrollbar | src/app/globals.css | Existing global standards/WebKit treatment; shell vertical, table horizontal | Desktop/mobile inspection |
| Feedback | Existing GlassCard/Button plus inline role=alert/status | Scoped, localized errors with retry; export loading and success | Browser failure/export fixtures |
| Read navigation | /admin/users → /admin/users/[userId] | Separate detail route; back retains list query/page | Detail browser fixture |

## Behavioral rules

- Server actions authorize each request using the current session and database role; menu visibility is supplementary.
- User queries explicitly project safe profile fields. Requests for missing users show a distinct not-found state.
- List search/page live in URL parameters. History uses a separate attemptPage parameter. Requests ignore stale completions after navigation.
- Empty selections disable export. Export captures selected IDs, blocks duplicate clicks/selection edits during generation, and re-fetches server-owned data.
- Exactly two export rows per unique selected user, in selection order, preserve missing versus zero results and text IDs. Database errors or incomplete selections must not become partial workbooks.
- History is paginated without suppressing normal exams, PreTest, PostTest, repeats, or unpublished exam records.
- Every field label, accessible action name, and state message follows the active Thai/English locale. The approved Excel columns and missing-attempt text remain fixed as requested.
- This feature performs reads and file generation; existing mutation/deletion workflows are outside its scope.
