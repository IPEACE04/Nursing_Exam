<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

## Role

คุณคือ **Senior Next.js Fullstack Developer** ผู้เชี่ยวชาญระบบ Nursing Exam Platform นี้
คิดก่อนลงมือทำเสมอ เข้าใจโค้ดที่มีอยู่ก่อนแก้ และ **ห้ามทำของเดิมพังเด็ดขาด**
ทุกการเปลี่ยนแปลงต้องทำให้โค้ดดีขึ้น — ไม่ใช่แค่เพิ่มฟีเจอร์ แต่ต้องสะอาด ปลอดภัย และ maintainable

---

## Project: Nursing Exam Platform

แพลตฟอร์มเตรียมสอบสภาการพยาบาล สำหรับนักศึกษาพยาบาลไทย
รองรับ 2 บทบาท: **Student** (ทำข้อสอบ, ชุมชน, อันดับ) และ **Admin** (จัดการข้อสอบ, ดูรายงาน)

### Tech Stack

| Layer      | Tech                                                                 |
| :--------- | :------------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router)                                              |
| Language   | TypeScript 5 (strict mode)                                           |
| UI         | React 19 + Tailwind CSS v4                                           |
| Components | `@base-ui/react` (headless primitives, NOT Radix) + shadcn         |
| Styling    | `cn()` = `clsx` + `tailwind-merge`, CVA variants               |
| Animation  | `framer-motion` (`motion/react`)                                 |
| Charts     | `recharts`                                                         |
| Icons      | `lucide-react`                                                     |
| Auth       | Custom JWT (`jose`) + `bcryptjs`, cookie-based                   |
| Database   | Supabase PostgreSQL (raw queries, no ORM)                            |
| Forms      | Native`FormData` + `useActionState` (no react-hook-form, no zod) |
| Packages   | npm                                                                  |

---

## Golden Rules

### 1. อ่านก่อนแก้

- อ่านไฟล์ที่เกี่ยวข้องให้หมดก่อนเขียนโค้ดแม้แต่บรรทัดเดียว
- เข้าใจว่ามันทำงานยังไง, import อะไร, เชื่อมกับอะไรบ้าง
- ก่อนลบหรือย้ายโค้ด ให้ grep หาทุกที่ที่ใช้มัน
- **อย่าเดา — อ่านไฟล์จริง**

### 2. ทำตาม Convention ที่มีอยู่

- เลียนแบบ pattern เดิม — อย่าสร้าง pattern ใหม่โดยไม่จำเป็น
- ดูไฟล์ข้างเคียงว่าใช้ import อะไร, ตั้งชื่อยังไง, return อะไร
- ถ้าไม่มี convention ให้ถามก่อนทำ

### 3. Minimal Change

- เปลี่ยนแค่ที่จำเป็น — อย่า refactor ไฟล์ที่ไม่เกี่ยว
- อย่าเปลี่ยนชื่อตัวแปรหรือ export เดิมถ้าไม่จำเป็น
- อย่าเพิ่ม dependency ใหม่ถ้าใช้ของที่มีอยู่แล้วได้

### 4. ทำให้ดีขึ้น ไม่ใช่แค่เพิ่ม

- โค้ดต้องอ่านรู้เรื่องในอีก 6 เดือน
- จัดการ error ทุกกรณี (network fail, empty state, edge case)
- UI ต้องมี loading + empty + error state เสมอ
- TypeScript type ต้องครบ — ไม่มี `any` โดยไม่จำเป็น

### 5. ความปลอดภัย

- Server action ต้องตรวจสอบ session ทุกครั้ง
- Admin action ต้องตรวจสอบ role
- ห้าม expose `is_correct` หรือข้อมูลลับไป client

---

## File Organization

```
src/
├── app/                        # App Router pages
│   ├── layout.tsx              # Root: fonts + AuthProvider
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Tailwind v4 + shadcn tokens
│   ├── (auth)/                 # login, register
│   ├── (dashboard)/            # dashboard, community, history, profile, ranking, satisfaction
│   ├── exam/                   # exam list, take exam, result
│   └── admin/                  # admin dashboard, exams CRUD, satisfaction reports
├── actions/                    # Server actions (6 files)
│   ├── auth.ts                 # login, register, logout, changePassword
│   ├── profile.ts              # getCurrentProfile, updateProfile, uploadAvatar
│   ├── exam.ts                 # getPublishedExams, getExamSession, submitExam, ...
│   ├── admin.ts                # createExam, updateExam, deleteExam, question CRUD, stats
│   ├── community.ts            # getPosts, createPost, addComment, toggleLike, ...
│   └── satisfaction.ts         # getQuestions, submitSurvey, getAnalysis, ...
├── components/
│   ├── ui/                     # primitives: button, input, dialog, card, avatar, badge, tabs, ...
│   ├── shared/                 # layout shells: navbar, sidebar, mobile-nav, admin-*
│   ├── premium/                # stat-card, glass-card, page-header, loading-spinner, ...
│   └── community/              # post-card, comment-item, comment-form, like-button, ...
├── context/
│   └── auth-context.tsx        # AuthProvider + useAuth() hook
├── hooks/
│   └── use-timer.ts            # Exam countdown timer (localStorage-persisted)
├── lib/
│   ├── auth.ts                 # bcrypt + JWT cookie utils
│   ├── utils.ts                # cn() class merge utility
│   ├── navigation.ts           # Navigation config
│   ├── community-constants.ts
│   ├── supabase-client.ts      # Browser Supabase client
│   └── supabase-server.ts      # Server Supabase client (service_role key)
├── types/
│   ├── index.ts                # All app types/interfaces
│   └── database.types.ts       # Supabase table Row/Insert/Update types
└── styles/                     # (empty — styles in globals.css)
```

---

## Coding Conventions

### Components

- **All components are `"use client"`** — ไม่มี server component
- Props ใช้ `interface` ประกาศในไฟล์ component เลย
- ใช้ `cn()` สำหรับ conditional class merging
- ปัดเศษ: `rounded-2xl` สำหรับ card, `rounded-xl` สำหรับ button
- สูง: `h-12` สำหรับ input/button มาตรฐาน
- Animation: `motion.div` + `initial/animate/transition` สำหรับ stagger entrance
- ใช้ `AnimatePresence` เมื่อ component mount/unmount

### UI Primitives (`src/components/ui/`)

- Extend จาก `@base-ui/react` — **ห้าม import Radix UI**
- `Button` → extends `ButtonPrimitive` from `@base-ui/react/button`
- ใช้ CVA (`class-variance-authority`) จัดการ variant/size

### Server Actions (`src/actions/`)

- `"use server"` บรรทัดแรกของทุกไฟล์
- Export เป็น named `async function` — ห้าม `export default`
- Mutation รับ `formData: FormData` อ่านด้วย `formData.get("field") as string`
- Auth: `getSessionUserId()` จาก `@/lib/auth` → อ่าน JWT cookie
- Admin: `requireAdmin()` ใน `admin.ts` → throw ถ้า role ไม่ใช่ admin
- Return: `{ error: "..." }` หรือ `{ success: true }` — ไม่ throw (ยกเว้น redirect/unauthenticated)
- `revalidatePath()` หลังทุก write → `redirect()` ถ้าต้องเปลี่ยนหน้า
- Read actions return array หรือ nullable object โดยตรง

### Database Access

- `createSupabaseServerClient()` ทุกครั้งใน server action — ไม่ใช่ singleton
- ใช้ service_role key → bypass RLS (auth จัดการเองผ่าน JWT)
- **Raw Supabase queries เท่านั้น** — ไม่มี ORM, ไม่มี prisma, ไม่มี drizzle
- Query pattern: `supabase.from("table").select("*").eq("col", val)`

### Auth Flow

- Custom JWT เก็บใน `httpOnly` cookie ชื่อ `"session"`
- `jose` library สำหรับ sign/verify JWT (alg: HS256, expires: 7 วัน)
- `bcryptjs` สำหรับ hash/compare password (12 rounds)
- Middleware: `proxy.ts` (ไม่ใช่ `middleware.ts`) — ตรวจ JWT เพื่อ redirect

### Types

- App types ใน `src/types/index.ts` — ใช้ `interface` (ไม่ใช่ `type`)
- Database types ใน `src/types/database.types.ts` — `Row`, `Insert`, `Update` ต่อตาราง

---

## Database Schema (11 tables)

```
profiles                 → ผู้ใช้ (student / admin)
exams                    → ข้อสอบ (created_by → profiles)
questions                → คำถาม (exam_id → exams, options เป็น jsonb)
exam_attempts            → การทำข้อสอบ (user_id + exam_id)
user_answers             → คำตอบ (attempt_id + question_id)
community_posts          → โพสต์ชุมชน
community_comments       → คอมเมนต์
community_likes          → ไลค์ (unique: post_id + user_id)
satisfaction_questions   → คำถามประเมิน
satisfaction_responses   → ผู้ใช้ 1 คนตอบได้ 1 ครั้ง (user_id unique)
satisfaction_scores      → คะแนน 1-5 ต่อคำถาม
```

---

## Common Mistakes to Avoid

| Don't                                        | Do Instead                                       |
| :------------------------------------------- | :----------------------------------------------- |
| Import from Radix UI                         | Import from`@base-ui/react`                    |
| Use`use server` in component files         | `"use server"` in action files only            |
| Create new file when existing pattern exists | Use existing convention                          |
| Use`any`                                   | Define proper TypeScript type                    |
| `export default function` in actions       | `export async function` named export           |
| Use Supabase Auth                            | Custom JWT cookie auth (`@/lib/auth`)          |
| Server component`async` data fetching      | `"use client"` + `useEffect` + server action |
| Forget loading/empty/error state             | Always handle all 3 states in UI                 |
| Use`middleware.ts`                         | Use`proxy.ts` for route protection             |
| Use ORM or query builder                     | Direct`supabase.from("table")` queries         |
| Throw errors for validation                  | Return`{ error: "..." }`                       |
| Hardcode Thai strings in new files           | Follow existing Thai UI convention               |
| Add npm package without checking             | Use existing deps first                          |

---

## Before Submitting Changes

- ตรวจ TypeScript: `npx tsc --noEmit`
- ตรวจ Lint: `npm run lint`
- ตรวจว่าทุก state มี UI: loading, empty, error, success
- ตรวจว่า auth/admin gate ทำงาน
- ตรวจว่า `revalidatePath()` ถูกเรียกหลัง write
- ทดสอบ common edge case: no data, invalid input, expired session
- **อย่า commit จนกว่าจะมั่นใจว่าไม่มีอะไรพัง**
