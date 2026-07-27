# Nursing Exam Platform — Security & Quality Audit Report

> วันที่ตรวจสอบ: 25 มิถุนายน 2026
> ผู้ตรวจสอบ: OpenCode Agent
> ขอบเขต: ตรวจสอบโค้ดทั้งหมดใน `src/`, `proxy.ts`, `schema.sql`, `supabase/*.sql`

---

## สรุปผลการทดสอบเบื้องต้น

| รายการ | ผลลัพธ์ |
| :--- | :--- |
| `npx tsc --noEmit` | ✅ ผ่าน (ไม่มี error) |
| `npm run lint` | ⚠️ ผ่าน แต่มี 5 warnings (img tags + unused eslint-disable) |
| ระดับความเสี่ยงโดยรวม | 🔴 **สูงมาก** — พบช่องโหว่หลักที่สามารถโจมตีได้จริง |

---

## ลำดับขั้นตอนการตรวจสอบที่ทำ

1. สำรวจโครงสร้างโปรเจกต์และ `AGENTS.md`
2. รันตรวจสอบ TypeScript (`npx tsc --noEmit`) และ ESLint (`npm run lint`)
3. ตรวจสอบระบบ Authentication (JWT, cookie, password hashing)
4. ตรวจสอบ Server Actions ทั้ง 6 ไฟล์ (`auth`, `exam`, `admin`, `community`, `satisfaction`, `profile`)
5. ตรวจสอบ Database Schema, Indexes, RPC Functions, RLS Policies
6. ตรวจสอบ Middleware/Route Protection (`proxy.ts`)
7. ตรวจสอบ UI/UX Components, State Management, Timer, Auth Context
8. สรุปจุดอ่อนพร้อมลำดับขั้นตอนการแก้ไข

---

## 🔴 Critical — ต้องแก้ไขทันที

### 1. Server Actions ของแอดมินแบบประเมิน (Satisfaction) ไม่มีการตรวจสอบสิทธิ์

**ไฟล์:** `src/actions/satisfaction.ts`

**ปัญหา:** ฟังก์ชันเหล่านี้ไม่มี `getSessionUserId()` หรือ `requireAdmin()` เลย ผู้ใช้ทั่วไป (หรือแม้ไม่ได้ล็อกอิน) สามารถเรียกได้:
- `getCategories()`
- `addCategory()`
- `updateCategory()`
- `deleteCategory()`
- `getAdminQuestions()`
- `addQuestion()`
- `updateQuestion()`
- `deleteQuestion()`
- `getAnalysis()`

**ผลกระทบ:** ใครก็ได้สามารถอ่านผลวิเคราะห์ความพึงพอใจ, สร้าง/แก้ไข/ลบหมวดหมู่และคำถามได้

**วิธีแก้:**
1. เพิ่ม `requireAdmin()` ใน `src/actions/satisfaction.ts` (คัดลอกจาก `src/actions/admin.ts`)
2. เรียก `await requireAdmin()` ในทุกฟังก์ชันด้านบน
3. หน้า `/admin/satisfaction` อยู่ภายใต้ `admin/layout.tsx` ที่มี client-side guard แต่ **client-side guard ไม่ใช่การป้องกัน** เพราะ server action ถูกเรียกโดยตรงได้

---

### 2. เผยเฉลยคำตอบ (`correct_option`) ไปยัง Client ก่อนสอบ

**ไฟล์:** `src/actions/exam.ts` → `getExamSession()`

**ปัญหา:**
```ts
const { data: questions } = await supabase
  .from("questions")
  .select("*")  // ← ดึง correct_option มาด้วย
  .eq("exam_id", examId)
```

ข้อมูลนี้ถูกส่งไปให้ `src/app/exam/[examId]/page.tsx` ก่อนที่ผู้ใช้จะกด "เริ่มทำข้อสอบ" ทำให้สามารถดูเฉลยจาก Network Tab หรือ API call ได้

**วิธีแก้:**
1. เปลี่ยน `.select("*")` เป็น `.select("id, question_text, options, sort_order, explanation_text")`
2. อย่าส่ง `correct_option` และ `is_correct` ออกไปก่อนส่งข้อสอบ
3. คำนวณคะแนนที่ฝั่ง Server ใน `submitExam` เท่านั้น

---

### 3. ดูผลสอบของคนอื่นได้ (IDOR บน `getExamResult`)

**ไฟล์:** `src/actions/exam.ts` → `getExamResult()`

**ปัญหา:**
```ts
export async function getExamResult(attemptId: string) {
  const supabase = createSupabaseServerClient();
  // ไม่มีการตรวจสอบ session หรือว่า attempt เป็นของ user นี้
```

**ผลกระทบ:** ใครก็ได้เปลี่ยน `attemptId` ใน URL `/exam/{examId}/result/{attemptId}` เพื่อดูผลสอบของผู้อื่น

**วิธีแก้:**
1. เรียก `getSessionUserId()` ก่อน
2. JOIN `exam_attempts` แล้ว `.eq("user_id", userId)` หรือตรวจสอบจากฐานข้อมูลก่อน return
3. หรือ query `user_answers` ผ่าน `attempt_id` ที่เชื่อมกับ `exam_attempts.user_id`

---

### 4. IDOR บน Dashboard / History / Progress / Rank

**ไฟล์:** `src/actions/exam.ts`

**ฟังก์ชันที่มีปัญหา:**
- `getDashboardData(userId: string)`
- `getHistory(userId: string)`
- `getPrePostTestGate(userId: string)`
- `getProgressComparison(userId: string)`
- `getPrePostTestHistory(userId: string)`
- `getUserRank(userId: string)`

**ปัญหา:** รับ `userId` จาก client โดยตรง ไม่ตรวจสอบว่าตรงกับ session ของผู้เรียก

**วิธีแก้:**
1. ลบพารามิเตอร์ `userId` ออกจากทุกฟังก์ชัน
2. ใช้ `const userId = await getSessionUserId();` ภายในฟังก์ชันเอง
3. อัปเดตหน้า UI ที่เรียกใช้ให้ไม่ส่ง `user.id` ไป

---

### 5. JWT Secret เป็น fallback ค่าคงที่

**ไฟล์:** `src/lib/auth.ts`, `proxy.ts`

**ปัญหา:**
```ts
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback-secret-change-in-production"
);
```

หากตั้งค่า `AUTH_SECRET` ไม่ครบหรือลืมใส่ใน production ระบบจะใช้ secret ที่ทุกคนรู้ ทำให้ forge JWT ได้

**วิธีแก้:**
1. ถ้าไม่มี `AUTH_SECRET` ให้ throw Error ตอน build/start แทนการใช้ fallback
2. ตรวจสอบความยาว minimum (เช่น 32 bytes)
3. อัปเดตเอกสารการ deploy ให้ชัดเจน

---

### 6. `submitExam` ไม่ตรวจสอบความถูกต้องของข้อสอบและเวลา

**ไฟล์:** `src/actions/exam.ts` → `submitExam()`

**ปัญหา:**
- ไม่ตรวจสอบว่าข้อสอบ `is_published = true`
- ไม่ตรวจสอบว่าเป็น `pre_post_test` ที่ผู้ใช้มีสิทธิทำหรือไม่
- รับ `timeSpentSeconds` จาก client โดยตรง — ผู้ใช้สามารถส่งเวลาปลอมได้
- ใช้ cooldown 30 วินาทีเท่านั้น ซึ่งสามารถ bypass ได้ง่าย (แค่รอ 30 วิ)
- redirect โดยไม่ `revalidatePath` ทำให้อาจเห็นข้อมูลเก่า

**วิธีแก้:**
1. ตรวจสอบ `exam.is_published === true` ก่อนบันทึก
2. สำหรับ `pre_post_test` ตรวจสอบเงื่อนไขการปลดล็อคอีกครั้งที่ server
3. คำนวณเวลาที่ server เอง (เช่น บันทึก `started_at` ลง localStorage/session หรือฐานข้อมูล) หรืออย่างน้อยก็ cap ค่า `timeSpentSeconds` ไม่ให้เกิน `time_limit_minutes * 60`
4. ใช้ transaction ในการ insert `exam_attempts` + `user_answers`
5. เรียก `revalidatePath("/history")` ก่อน redirect

---

### 7. อัปโหลดรูปภาพไม่ตรวจสอบประเภทไฟล์

**ไฟล์:** `src/actions/profile.ts` → `uploadAvatar()`

**ปัญหา:**
```ts
const ext = file.name.split(".").pop() || "png";
```

ตรวจสอบแค่ขนาดไฟล์ แต่ไม่ตรวจสอบ MIME type ที่แท้จริง ทำให้อาจอัปโหลดไฟล์ HTML/JS ที่ดูเหมือนรูปภาพได้

**วิธีแก้:**
1. whitelist MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
2. ตรวจสอบ magic bytes ของไฟล์
3. เปลี่ยน ext ตาม MIME type ที่ตรวจสอบ ไม่ใช่จาก `file.name`

---

## 🟠 High — ควรแก้ไขโดยเร็ว

### 8. ไม่มี Rate Limiting / Brute Force Protection

**ไฟล์:** `src/actions/auth.ts`

**ปัญหา:**
- `login` ไม่มี rate limiting สามารถ brute force รหัสผ่านได้
- `register` ไม่มี rate limiting สามารถสร้างบัญชี spam ได้
- ไม่มีการ normalize email (trim, lowercase) ทำให้อาจมีบัญชีซ้ำหลายรูปแบบ

**วิธีแก้:**
1. normalize email: `email.trim().toLowerCase()`
2. normalize name: `name.trim()`
3. เพิ่ม rate limiting ด้วย redis/memory-store หรือ captcha
4. ใช้ `bcrypt.compare` อาจช้า ซึ่งช่วยป้องกัน brute force ได้บ้าง แต่ควรมี rate limit ชัดเจน

---

### 9. Admin Actions ใช้ `throw new Error()` แทนการ return error

**ไฟล์:** `src/actions/admin.ts`

**ปัญหา:** ทุกฟังก์ชันใน `admin.ts` ใช้ `throw new Error(error.message)` เมื่อเกิดข้อผิดพลาด ซึ่งอาจส่งรายละเอียดฐานข้อมูลกลับไป client

**วิธีแก้:**
1. เปลี่ยนเป็น return `{ error: "..." }` ตาม convention ของโปรเจกต์
2. log error ที่ server เท่านั้น

---

### 10. ไม่มี Input Validation / Length Limits

**ไฟล์:**
- `src/actions/admin.ts` → `createExam`, `updateExam` ไม่ตรวจสอบ `title` ว่าง, `timeLimit` ติดลบ
- `src/actions/community.ts` → `createPost`, `addComment` ไม่จำกัดความยาว content
- `src/actions/satisfaction.ts` → `submitSurvey` ไม่ตรวจสอบว่า question id ที่ส่งมาถูกต้อง

**วิธีแก้:**
1. ตรวจสอบความยาวขั้นต่ำ/สูงสุดของ title, content, comment
2. ตรวจสอบว่า `timeLimit > 0`
3. ตรวจสอบว่า question ids ใน `scores` ตรงกับคำถามที่ active จริง
4. ตรวจสอบคะแนน `score` อยู่ในช่วง 1-5

---

### 11. `deleteExam` ไม่ใช่ Transaction

**ไฟล์:** `src/actions/admin.ts` → `deleteExam()`

**ปัญหา:** ลบ `user_answers` → `exam_attempts` → `questions` → `exams` แยกกัน หากขั้นตอนกลางล้มเหลว ข้อมูลจะค้างอยู่ในสภาพกลางคัน

**วิธีแก้:**
1. ใช้ Supabase RPC หรือ transaction (ถ้าใช้ raw postgres connection)
2. หรือลบด้วย foreign key `ON DELETE CASCADE` แล้วลบแค่ `exams` หนึ่งครั้ง

---

### 12. Timer เก็บใน localStorage ตาม `examId` ไม่ใช่ตาม attempt

**ไฟล์:** `src/hooks/use-timer.ts`

**ปัญหา:**
- ถ้าผู้ใช้ทำข้อสอบชุดเดิมซ้ำ timer เก่าจะยังคงอยู่
- ผู้ใช้สามารถแก้ไข localStorage เพื่อเพิ่มเวลาได้

**วิธีแก้:**
1. สร้าง attempt record ก่อนเริ่มทำข้อสอบ (status = "in_progress") และบันทึก `started_at`
2. ใช้ server-side time เป็นหลักในการตรวจสอบเวลาหมด
3. localStorage ใช้เฉพาะ UX สำรองเท่านั้น

---

### 13. Route Protection ใน `proxy.ts` ไม่ครอบคลุม

**ไฟล์:** `proxy.ts`

**ปัญหา:**
- `studentRoutes` ไม่มี `/satisfaction` ทำให้ผู้ใช้ที่ไม่ได้ล็อกอินเข้า `/satisfaction` ได้ (ถ้ารู้ URL)
- `/progress` ไม่ได้อยู่ใน `studentRoutes` (ตรวจสอบอีกครั้ง)
- ไม่มีการป้องกัน API routes ของ Next.js เอง

**วิธีแก้:**
1. เพิ่ม `/satisfaction`, `/progress` เข้า `studentRoutes`
2. ตรวจสอบว่ามี route สำคัญอื่นๆ อีกหรือไม่
3. พิจารณาใช้ matcher ที่รัดกุมขึ้น

---

### 14. Service Role Key Bypass RLS ทั้งหมด

**ไฟล์:** `src/lib/supabase-server.ts`

**ปัญหา:**
```ts
process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
```

เนื่องจากใช้ service role key ทุก server action จึง bypass RLS หมด ความปลอดภัยจึงพึ่งพา logic ใน server action ล้วนๆ ซึ่งขณะนี้มีหลายจุดที่ตรวจสอบไม่ครบ

**วิธีแก้:**
1. ตรวจสอบ auth/admin gate ในทุก server action ให้ครบถ้วน
2. พิจารณาใช้ `anon key` + RLS สำหรับ read operations ที่ไม่ซับซ้อน (ถ้าเป็นไปได้)
3. ห้าม leak service role key ไปยัง client

---

## 🟡 Medium — ควรปรับปรุง

### 15. Schema SQL ไม่สอดคล้องกัน

**ไฟล์:** `schema.sql` vs `supabase/migration.sql` vs `supabase/custom_auth.sql`

**ปัญหา:**
- `migration.sql` สร้าง `profiles.id` เป็น FK ไป `auth.users(id)`
- `schema.sql` สร้าง `profiles` เป็น standalone table
- `custom_auth.sql` ถอด FK ออกจาก `auth.users` และเพิ่ม `email`, `password_hash`

หากรัน migration ผิดลำดับ ระบบอาจพัง

**วิธีแก้:**
1. รวม schema ทั้งหมดเป็นไฟล์เดียวที่ถูกต้อง
2. ลบไฟล์ที่ซ้ำซ้อนหรือล้าสมัย
3. เพิ่ม migration version control

---

### 16. RLS Policies ไม่ครบทุกตาราง

**ไฟล์:** `supabase/rls_policies.sql`

**ปัญหา:** ไม่มี policies สำหรับ:
- `community_posts`
- `community_comments`
- `community_likes`
- `satisfaction_questions`
- `satisfaction_categories`
- `satisfaction_responses`
- `satisfaction_scores`

แม้ว่าจะใช้ service role key แต่ก็ควรมี policies เป็นชั้นป้องกันสำรอง

**วิธีแก้:**
1. เพิ่ม RLS policies สำหรับตารางที่ขาด
2. ทดสอบด้วย Supabase anon client

---

### 17. `deleteComment` ไม่ได้ `revalidatePath`

**ไฟล์:** `src/actions/community.ts` → `deleteComment()`

**ปัญหา:** ลบคอมเมนต์แล้วแต่ไม่ revalidate ทำให้ UI อาจแสดงคอมเมนต์ที่ลบไปแล้ว

**วิธีแก้:**
1. รับ `postId` เพิ่มเป็น parameter
2. เรียก `revalidatePath(`/community/${postId}`)`

---

### 18. ESLint Warnings

**ผลการตรวจสอบ:**
- `src/actions/profile.ts:31` — unused eslint-disable
- `src/app/error.tsx:15` — unused eslint-disable
- `src/app/page.tsx:69` — ใช้ `<img>` แทน `<Image />`
- `src/components/shared/admin-navbar.tsx:25` — ใช้ `<img>` แทน `<Image />`
- `src/components/shared/navbar.tsx:32` — ใช้ `<img>` แทน `<Image />`

**วิธีแก้:**
1. ลบ `eslint-disable` ที่ไม่จำเป็น
2. เปลี่ยน `<img>` เป็น `next/image` เพื่อประสิทธิภาพ

---

### 19. Error Handling ใน UI ไม่ครบ

**ไฟล์:**
- `src/app/(dashboard)/dashboard/page.tsx` — catch แล้ว set ค่าเริ่มต้น แต่ไม่แสดง error message ให้ผู้ใช้
- `src/app/exam/[examId]/page.tsx` — ถ้า `getExamSession` ล้มเหลว redirect ไป `/exam` โดยไม่บอกเหตุผล
- หลายหน้าใช้ `useAuth()` แล้ว redirect ทันทีถ้า `user` เป็น null ซึ่งอาจ redirect ขณะ auth ยังโหลดอยู่

**วิธีแก้:**
1. รอ `isLoading` ก่อน redirect
2. แสดง error state เมื่อ fetch ล้มเหลว
3. ใช้ toast หรือ error banner

---

### 20. ไม่มี Pagination

**ไฟล์:**
- `src/actions/community.ts` → `getPosts()` ดึง posts ทั้งหมด
- `src/actions/exam.ts` → `getHistory()` จำกัด 100 แถว
- `src/actions/exam.ts` → `getDashboardData()` จำกัด 50 แถว

**วิธีแก้:**
1. เพิ่ม pagination parameters (`limit`, `offset` หรือ cursor)
2. ใช้ infinite scroll หรือ pagination UI

---

## ✅ สิ่งที่ทำได้ดีแล้ว

1. ใช้ `httpOnly` cookie สำหรับ JWT
2. ใช้ `bcryptjs` กับ 12 rounds สำหรับ hash รหัสผ่าน
3. ใช้ `jose` สำหรับ JWT แทน `jsonwebtoken` (แม้ package.json จะมี `jsonwebtoken` ติดตั้งอยู่)
4. มี `requireAdmin()` ใน `src/actions/admin.ts`
5. มี `revalidatePath` หลัง write ส่วนใหญ่
6. มี loading/empty/error UI ในหลายหน้า
7. ใช้ CVA + `cn()` ตาม convention
8. ใช้ `@base-ui/react` แทน Radix ตาม convention
9. มี optimization indexes และ RPC functions ที่เหมาะสม

---

## ลำดับขั้นตอนการแก้ไขที่แนะนำ

### Phase 1: ความปลอดภัยด่วน (1-2 วัน)
1. ✅ แก้ไข `src/actions/satisfaction.ts` ให้ทุก admin function เรียก `requireAdmin()`
2. ✅ แก้ไข `getExamSession()` ไม่ส่ง `correct_option` ออกไป
3. ✅ แก้ไข `getExamResult()` ให้ตรวจสอบ `user_id` ของ attempt
4. ✅ แก้ไข `getDashboardData`, `getHistory`, `getPrePostTestGate`, `getProgressComparison`, `getPrePostTestHistory`, `getUserRank` ให้ใช้ session userId ภายใน
5. ✅ ลบ JWT fallback secret หรือ throw error ถ้าไม่มี `AUTH_SECRET`
6. ✅ แก้ไข `submitExam` ให้ตรวจสอบ `is_published` และคำนวณเวลาที่ server

### Phase 2: ความปลอดภัยระดับสูง (3-5 วัน)
7. ✅ แก้ไข `uploadAvatar` ให้ตรวจสอบ MIME type
8. ✅ เพิ่ม rate limiting ให้ `login` และ `register`
9. ✅ normalize email/name ใน `login`/`register`
10. ✅ เปลี่ยน `throw new Error()` ใน `admin.ts` เป็น return `{ error }`
11. ✅ เพิ่ม input validation ใน `createExam`, `updateExam`, `createPost`, `addComment`, `submitSurvey`
12. ✅ แก้ไข `deleteExam` ให้ใช้ transaction หรือ ON DELETE CASCADE
13. ✅ แก้ไข `proxy.ts` ให้ครอบคลุม `/satisfaction`, `/progress`

### Phase 3: ปรับปรุงคุณภาพโค้ด (1-2 สัปดาห์)
14. ✅ รวบรวม schema SQL ให้เป็นไฟล์เดียวที่ถูกต้อง
15. ✅ เพิ่ม RLS policies สำหรับตารางที่ขาด
16. ✅ แก้ไข `deleteComment` ให้ revalidate
17. ✅ แก้ไข ESLint warnings
18. ✅ ปรับปรุง error handling ใน UI
19. ✅ เพิ่ม pagination สำหรับ posts, history
20. ✅ ปรับปรุง `useTimer` ให้ใช้ attempt-based หรือ server time

---

## สรุป

ระบบมีโครงสร้างที่ดีและ follow convention ส่วนใหญ่ แต่มีช่องโหว่ความปลอดภัยร้ายแรงหลายจุดที่ต้องแก้ไขก่อน deploy โดยเฉพาะ:
- การไม่ตรวจสอบสิทธิ์ใน Satisfaction admin actions
- การเผยเฉลยคำตอบก่อนสอบ
- IDOR บนผลสอบและข้อมูลส่วนตัว
- JWT fallback secret

หากแก้ไขตาม Phase 1 ให้ครบ ระบบจะปลอดภัยขึ้นมากในระดับที่สามารถใช้งานจริงได้
