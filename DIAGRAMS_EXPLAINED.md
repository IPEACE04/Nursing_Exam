# Nursing Exam System — คำอธิบาย Diagrams ฉบับละเอียด

เอกสารนี้อธิบายแต่ละ Diagram ใน `DIAGRAMS.md` อย่างละเอียด รวมถึงความหมาย สัญลักษณ์ ตัวอย่างจากโปรเจคนี้ และวิธีอ่านให้เข้าใจ

---

## สารบัญ

1. [ER Diagram](#1-er-diagram)
2. [Sequence Diagram](#2-sequence-diagram)
3. [Data Flow Diagram](#3-data-flow-diagram)
4. [System Architecture Diagram](#4-system-architecture-diagram)
5. [Use Case Diagram](#5-use-case-diagram)
6. [เปรียบเทียบ Diagrams ทั้งหมด](#6-เปรียบเทียบ-diagrams-ทั้งหมด)
7. [แนวทางการอ่าน Diagrams ตามลำดับ](#7-แนวทางการอ่าน-diagrams-ตามลำดับ)

---

## 1. ER Diagram

### 1.1 ER Diagram คืออะไร

ER Diagram (Entity-Relationship Diagram) หรือ แผนภาพความสัมพันธ์ของข้อมูล เป็นเครื่องมือที่ใช้ในการออกแบบฐานข้อมูล โดยแสดงให้เห็นว่าในระบบมี **Entity (ตารางข้อมูล)** อะไรบ้าง แต่ละ Entity มี **Attribute (คอลัมน์)** อะไรบ้าง และ Entity ต่างๆ **เชื่อมโยงกันอย่างไร (Relationship)**

### 1.2 ทำไมต้องใช้ ER Diagram

- ช่วยให้เห็นภาพรวมของฐานข้อมูลทั้งหมดในระบบ
- ช่วยออกแบบว่าตารางไหนควรเชื่อมกับตารางไหน
- ป้องกันข้อมูลซ้ำซ้อน (Data Redundancy)
- เป็นพื้นฐานสำหรับการสร้าง Database Schema

### 1.3 ER Diagram ของ Nursing Exam System

ระบบนี้มี Entity หลัก 11 ตัว:

#### กลุ่มผู้ใช้และข้อสอบ

| Entity        | คำอธิบาย                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `profiles`  | ข้อมูลผู้ใช้ทั้งหมด ทั้ง Student และ Admin                             |
| `exams`     | ชุดข้อสอบ มีชื่อ รายละเอียด เวลาจำกัด สถานะเผยแพร่ |
| `questions` | คำถามแต่ละข้อในข้อสอบ มีตัวเลือกและเฉลย                    |

#### กลุ่มประวัติการสอบ

| Entity            | คำอธิบาย                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `exam_attempts` | บันทึกแต่ละครั้งที่นักเรียนทำข้อสอบ คะแนน เวลาที่ใช้ |
| `user_answers`  | คำตอบของนักเรียนในแต่ละข้อ บอกด้วยว่าถูก/ผิด                 |

#### กลุ่มชุมชน

| Entity                 | คำอธิบาย                         |
| ---------------------- | ---------------------------------------- |
| `community_posts`    | กระทู้/โพสต์ในชุมชน    |
| `community_comments` | ความคิดเห็นใต้กระทู้ |
| `community_likes`    | การกดถูกใจกระทู้         |

#### กลุ่มแบบประเมิน

| Entity                     | คำอธิบาย                                                 |
| -------------------------- | ---------------------------------------------------------------- |
| `satisfaction_questions` | คำถามในแบบประเมินความพึงพอใจ         |
| `satisfaction_responses` | การตอบแบบประเมินของผู้ใช้แต่ละคน |
| `satisfaction_scores`    | คะแนนที่ให้แต่ละข้อ สเกล 1-5              |

### 1.4 สัญลักษณ์ใน ER Diagram

| สัญลักษณ์ | ความหมาย                                                           | ตัวอย่าง |
| ------------------ | -------------------------------------------------------------------------- | ---------------- |
| `PK`             | Primary Key — คีย์หลัก ใช้ระบุข้อมูลแต่ละแถว | `id PK`        |
| `FK`             | Foreign Key — คีย์อ้างอิงตารางอื่น                    | `exam_id FK`   |
| `UK`             | Unique Key — ห้ามซ้ำ                                               | `email UK`     |
| `                  |                                                                            | --o{`            |
| `                  |                                                                            | --o              |

### 1.5 ความสัมพันธ์สำคัญในระบบ

```Shell
profiles ||--o{ exams : creates
```

**หมายความว่า:** 1 คน (Admin) สามารถสร้างข้อสอบได้หลายชุด แต่ข้อสอบแต่ละชุดถูกสร้างโดยคน 1 คน

```
exams ||--o{ questions : contains
```

**หมายความว่า:** 1 ข้อสอบมีได้หลายคำถาม แต่คำถามแต่ละข้ออยู่ในข้อสอบชุดเดียว

```
profiles ||--o{ exam_attempts : attempts
```

**หมายความว่า:** 1 คนสามารถทำข้อสอบได้หลายครั้ง แต่แต่ละครั้งบันทึกของคน 1 คน

```
exam_attempts ||--o{ user_answers : records
```

**หมายความว่า:** 1 ครั้งการสอบมีคำตอบหลายข้อ แต่คำตอบแต่ละข้อ принадлежит ครั้งการสอบครั้งเดียว

```
profiles ||--o| satisfaction_responses : submits
```

**หมายความว่า:** คน 1 คนส่งแบบประเมินได้ 1 ครั้ง (เพราะมี Unique ที่ user_id)

### 1.6 ตัวอย่างการอ่านตาราง

ตาราง `questions`:

```
questions {
    uuid id PK
    uuid exam_id FK
    text question_text
    jsonb options
    text correct_option
    text explanation_text
    int sort_order
}
```

**อ่านว่า:** ตาราง questions มีคอลัมน์หลักคือ `id` ซึ่งเป็น Primary Key มี `exam_id` เป็น Foreign Key ไปเชื่อมกับตาราง exams เก็บเนื้อหาคำถามใน `question_text` ตัวเลือกเป็น JSON ใน `options` เฉลยอยู่ใน `correct_option` คำอธิบายเฉลยใน `explanation_text` และลำดับข้อใน `sort_order`

### 1.7 สรุป ER Diagram

ER Diagram ของระบบนี้ช่วยให้เห็นว่า:

- มีผู้ใช้ 2 ประเภท เก็บในตารางเดียวกันผ่านฟิลด์ `role`
- ระบบข้อสอบแยกเป็น 3 ระดับ: ข้อสอบ (exams) → คำถาม (questions) → คำตอบผู้ใช้ (user_answers)
- ระบบชุมชนมีโครงสร้างคล้ายโซเชียลมีเดียง่ายๆ: Posts → Comments → Likes
- ระบบแบบประเมินแยกคำถาม คำตอบรวม และคะแนนรายข้อออกจากกัน

---

## 2. Sequence Diagram

### 2.1 Sequence Diagram คืออะไร

Sequence Diagram เป็นแผนภาพที่แสดง **ลำดับการทำงานของระบบในแต่ละกรณีใช้งาน (Use Case)** โดยแสดงว่าเมื่อผู้ใช้หรือระบบภายนอกทำอะไร แล้วข้อความ/ข้อมูลถูกส่งไปมาระหว่างส่วนต่างๆ อย่างไร ตามลำดับเวลาจากบนลงล่าง

### 2.2 ทำไมต้องใช้ Sequence Diagram

- เข้าใจ flow การทำงานละเอียดของแต่ละ feature
- เห็นว่าแต่ละส่วนของระบบต้องทำอะไรบ้าง
- ช่วยตรวจสอบว่ามีขั้นตอนไหนขาดหรือเกินไป
- เป็นพื้นฐานสำหรับการเขียนโค้ด

### 2.3 Sequence Diagram ของ Nursing Exam System

ระบบนี้มี Sequence Diagram 6 อัน:

#### 2.3.1 Login

แสดงว่าเมื่อนักเรียนใส่ Email/Password ระบบตรวจสอบยังไง:

1. นักเรียนใส่ Email + Password ในหน้า Login
2. Browser ส่งข้อมูลไป Next.js
3. Next.js เรียก Supabase Auth `signInWithPassword()`
4. Supabase ส่ง Session Token กลับ
5. Next.js ดึงข้อมูล Profile จากตาราง profiles
6. ตั้งค่า Cookie และ Redirect ไป Dashboard

#### 2.3.2 Take Exam (การทำข้อสอบ)

เป็น Flow ที่สำคัญที่สุดของระบบ:

1. นักเรียนเลือกข้อสอบที่จะทำ
2. Browser ขอข้อมูลข้อสอบจาก Next.js
3. Next.js ดึงข้อสอบและคำถามจาก Supabase
4. Browser แสดงข้อสอบและเริ่มจับเวลา
5. นักเรียนตอบคำถามทีละข้อ **คำตอบเก็บใน Browser State ไม่ได้บันทึกลงฐานข้อมูลทันที**
6. นักเรียนกดส่งข้อสอบ หรือหมดเวลา
7. Browser ส่งคำตอบทั้งหมดไป Next.js
8. Next.js ดึง `correct_option` ของทุกข้อมาตรวจคะแนน
9. Next.js คำนวณคะแนน
10. Next.js บันทึกผลลง `exam_attempts`
11. Next.js บันทึกคำตอบรายข้อลง `user_answers`
12. Redirect ไปหน้าประวัติ/ผลสอบ

> **หมายเหตุสำคัญ:** คำตอบระหว่างทำข้อสอบไม่ได้ถูกบันทึกลง Supabase ทีละข้อ แต่จะส่งทั้งหมดพร้อมกันตอน submit เท่านั้น

#### 2.3.3 Admin — Create Exam

แสดงว่า Admin สร้างข้อสอบอย่างไร:

1. Admin เข้าหน้า Admin Panel
2. ระบบแสดงรายการข้อสอบที่มีอยู่
3. Admin กดสร้างข้อสอบใหม่
4. กรอกชื่อ รายละเอียด เวลาจำกัด
5. Next.js บันทึกข้อสอบลง `exams`
6. Admin เพิ่มคำถามทีละข้อ พร้อมตัวเลือกและเฉลย
7. Next.js บันทึกคำถามลง `questions`
8. Admin กดเผยแพร่
9. Next.js อัปเดต `is_published = true`

#### 2.3.4 Community

แสดงการทำงานของระบบชุมชน:

1. User 1 สร้างกระทู้ใหม่ → บันทึกลง `community_posts`
2. User 2 เปิดดูกระทู้ → ดึงข้อมูลโพสต์ คอมเมนต์ จำนวน Like
3. User 2 แสดงความคิดเห็น → บันทึกลง `community_comments`
4. User 2 กดถูกใจ → บันทึกลง `community_likes` (มี Unique constraint ป้องกัน Like ซ้ำ)

#### 2.3.5 Satisfaction Survey

แสดงการทำแบบประเมิน:

1. นักเรียนเข้าหน้าแบบประเมิน
2. Next.js ดึงคำถามจาก `satisfaction_questions`
3. Browser แสดงฟอร์ม
4. นักเรียนให้คะแนน 1-5 และ Feedback
5. Next.js บันทึกคำตอบรวมลง `satisfaction_responses`
6. Next.js บันทึกคะแนนรายข้อลง `satisfaction_scores` แบบ batch

#### 2.3.6 Leaderboard

แสดงการแสดงอันดับ:

1. นักเรียนเข้าหน้า Ranking
2. Next.js เรียก RPC Function `get_leaderboard(50)`
3. Supabase คำนวณและส่ง Top 50 กลับ
4. Next.js เรียก RPC Function `get_user_rank(:uid)`
5. Supabase คำนวณอันดับของผู้ใช้คนนั้น
6. Browser แสดง Leaderboard พร้อมอันดับของตัวเอง

### 2.4 สัญลักษณ์ใน Sequence Diagram

| สัญลักษณ์                                   | ความหมาย                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| กล่องแนวตั้ง                             | Participant (ผู้เข้าร่วม) เช่น User, Browser, Next.js, Supabase |
| เส้นประแนวตั้ง                         | Lifeline — เส้นชีวิตของ Participant                               |
| ลูกศรแนวนอน                               | Message — ข้อความ/ข้อมูลที่ส่ง                             |
| กล่องสี่เหลี่มยาวบนเส้นประ | Activation Bar — ช่วงที่ Participant กำลังทำงาน              |
| `+` หลังชื่อ                               | เริ่ม Activation                                                          |
| `-` หลังชื่อ                               | จบ Activation                                                                |
| `loop`                                             | ทำซ้ำ                                                                     |
| `alt`                                              | เงื่อนไข if/else                                                       |
| `Note over`                                        | บันทึกเพิ่มเติม                                                 |

### 2.5 ตัวอย่างการอ่านลูกศร

```
U->>+B: Email + Password
```

อ่านว่า: User ส่ง Email และ Password ไปยัง Browser โดยเปิด Activation Bar ของ Browser

```
N-->>-B: Set Cookie + Redirect
```

อ่านว่า: Next.js ส่งข้อมูล Set Cookie และ Redirect กลับไป Browser โดยปิด Activation Bar ของ Next.js

> ลูกศร `->>` คือ synchronous message
> ลูกศร `-->>` คือ return/response message

### 2.6 สรุป Sequence Diagram

Sequence Diagram ของระบบนี้ช่วยให้เห็นว่า:

- ทุก Feature ต้องผ่านส่วนกลางคือ Browser → Next.js → Supabase
- การทำข้อสอบมี flow ที่แตกต่างจากความเข้าใจทั่วไป คือไม่ได้บันทึกคำตอบทีละข้อ
- Admin สร้างข้อสอบได้หลายขั้นตอน: สร้างข้อสอบ → เพิ่มคำถาม → เผยแพร่
- ระบบชุมชนและแบบประเมินทำงานเป็นกลุ่มการบันทึกข้อมูลลงหลายตาราง

---

## 3. Data Flow Diagram (DFD)

### 3.1 DFD คืออะไร

Data Flow Diagram (DFD) เป็นแผนภาพที่แสดง **การไหลของข้อมูล** ภายในระบบ เน้นที่ข้อมูลเป็นหลักว่าเข้ามาจากไหน ผ่าน process อะไรบ้าง เก็บที่ไหน และออกไปที่ไหน

### 3.2 ทำไมต้องใช้ DFD

- เห็นภาพรวมว่าข้อมูลเดินทางอย่างไรในระบบ
- เข้าใจว่าแต่ละ Module รับข้อมูลอะไรเข้าและส่งอะไรออก
- ช่วยตรวจสอบว่ามีข้อมูลไหนขาดหรือเกิน
- เป็นพื้นฐานสำหรับการออกแบบระบบ

### 3.3 DFD มีกี่ระดับ

DFD มักแบ่งเป็นระดับต่างๆ ตั้งแต่ภาพรวมไปสู่รายละเอียด:

| ระดับ | ชื่อ        | รายละเอียด                                                                                        |
| ---------- | --------------- | ----------------------------------------------------------------------------------------------------------- |
| Level 0    | Context Diagram | ระบบทั้งหมดเป็นกล่องเดียว แสดงเฉพาะผู้ใช้และระบบภายนอก |
| Level 1    | System Overview | แบ่งระบบเป็น Module ย่อย                                                                    |
| Level 2+   | Detailed DFD    | ย่อยแต่ละ Module ออกเป็นขั้นตอน                                                      |

### 3.4 DFD ของ Nursing Exam System

#### 3.4.1 Level 0 — Context Diagram

ในระดับนี้ ระบบทั้งหมดถูกมองเป็นกล่องเดียว:

```
Student ──> Nursing Exam System
Admin ────> Nursing Exam System
Nursing Exam System <──> Supabase
```

**อ่านว่า:**

- นักเรียนส่งข้อมูลเข้าระบบ (Login, ทำข้อสอบ, โพสต์ชุมชน)
- Admin ส่งข้อมูลเข้าระบบ (จัดการข้อสอบ, ดูรายงาน)
- ระบบอ่านและเขียนข้อมูลกับ Supabase (ฐานข้อมูล)
- ระบบส่งผลลัพธ์กลับไปให้ผู้ใช้ (คะแนน, Leaderboard, Dashboard)

#### 3.4.2 Level 1 — System Overview

แบ่งระบบเป็น Module ย่อย:

**Module หลัก:**

- **Auth** — ระบบเข้าสู่ระบบ/สมัครสมาชิก
- **Exam Management** — จัดการข้อสอบ (Admin)
- **Exam Taking** — ทำข้อสอบ (Student)
- **Community** — ระบบชุมชน
- **Satisfaction** — แบบประเมิน
- **Admin Panel** — หน้าจัดการของ Admin
- **Leaderboard** — ระบบอันดับคะแนน

**การไหลของข้อมูล:**

- Student เข้าถึง Auth, Exam Taking, Community, Satisfaction, Leaderboard
- Admin เข้าถึง Auth, Exam Management, Admin Panel
- ทุก Module ต้องอ่าน/เขียนข้อมูลกับ Supabase

#### 3.4.3 Level 2 — Exam Taking (ตัวอย่างการย่อย)

ย่อย flow การทำข้อสอบเป็นขั้นตอน:

```
Student -> Pick Exam -> Load Questions -> Timer Starts
-> Answer Question -> Submit/Timeout -> Grading
-> Save Result -> Show Result
```

**การไหลข้อมูล:**

- `Load Questions` อ่านข้อมูลจาก Supabase
- `Answer Question` เก็บข้อมูลใน Browser State
- `Save Result` เขียนข้อมูลลง Supabase

### 3.5 สัญลักษณ์ใน DFD

| สัญลักษณ์                           | ชื่อ        | ความหมาย                           |
| -------------------------------------------- | --------------- | ------------------------------------------ |
| วงกลม / วงรี                        | External Entity | ผู้ใช้หรือระบบภายนอก   |
| สี่เหลี่ยม                         | Process         | กระบวนการ/Module ในระบบ     |
| สี่เหลี่ยมเปิดด้านข้าง | Data Store      | ที่เก็บข้อมูล (Database)      |
| ลูกศร                                   | Data Flow       | ทิศทางการไหลของข้อมูล |

### 3.6 ตัวอย่างการอ่าน DFD

```
Student -->|Login · Exam · Community| Nursing Exam System
```

อ่านว่า: นักเรียนส่งข้อมูลการ Login, ทำข้อสอบ, และใช้ชุมชน เข้าไปในระบบ Nursing Exam

```
Nursing Exam System <-->|Read / Write| Supabase
```

อ่านว่า: ระบบ Nursing Exam อ่านและเขียนข้อมูลกับ Supabase ได้ทั้งสองทิศทาง

### 3.7 สรุป DFD

DFD ของระบบนี้ช่วยให้เห็นว่า:

- ข้อมูลหลักไหลระหว่าง User → Next.js → Supabase
- ระบบแบ่งเป็น Module ย่อยตามฟีเจอร์
- ทุก Module ต้องติดต่อกับฐานข้อมูล Supabase
- ข้อมูลการทำข้อสอบไม่ไหลไปฐานข้อมูลทันที แต่เก็บใน State ก่อน

---

## 4. System Architecture Diagram

### 4.1 System Architecture คืออะไร

System Architecture Diagram เป็นแผนภาพที่แสดง **โครงสร้างระบบทั้งหมด** ว่าประกอบด้วยส่วน/ชั้นอะไรบ้าง ใช้เทคโนโลยีอะไร และแต่ละส่วนเชื่อมต่อกันอย่างไร

### 4.2 ทำไมต้องใช้ System Architecture

- เข้าใจเทคโนโลยีทั้งหมดที่ใช้ในระบบ
- วางแผนการ Deploy
- ดูว่าส่วนไหนเป็นจุดเสี่ยง จุดที่ต้อง scale
- สื่อสารกับทีม DevOps/Backend

### 4.3 System Architecture ของ Nursing Exam System

ระบบนี้ใช้สถาปัตยกรรม 3-Tier แบบง่าย:

#### Tier 1: Client Layer

- **Browser** — ผู้ใช้เข้าถึงผ่านเว็บบราวเซอร์
- **React 19** — สร้าง User Interface
- **Tailwind CSS v4** — จัดการสไตล์
- **shadcn/ui + Base UI** — ชุด UI Components
- **Framer Motion** — Animation
- **Recharts** — กราฟ/แผนภูมิ

#### Tier 2: Application Layer

- **Next.js 16** — Framework หลัก
  - **App Router** — จัดการหน้าต่างๆ
  - **Server Components** — เรนเดอร์ฝั่งเซิร์ฟเวอร์ ดึงข้อมูลเริ่มต้น
  - **Server Actions** — จัดการ business logic และ mutation
  - **Middleware** — ตรวจสอบสิทธิ์ก่อนเข้าหน้า
- **Server Actions Files:**
  - `auth.ts` — จัดการ Login/Register/Logout
  - `exam.ts` — จัดการข้อสอบและการส่งคำตอบ
  - `community.ts` — จัดการโพสต์ คอมเมนต์ Like
  - `profile.ts` — จัดการโปรไฟล์
  - `satisfaction.ts` — จัดการแบบประเมิน
  - `admin.ts` — จัดการส่วน Admin

#### Tier 3: Data Layer

- **Supabase** — Backend-as-a-Service
  - **PostgreSQL** — ฐานข้อมูลหลัก
  - **Auth Service** — จัดการ Authentication และ JWT Sessions
  - **Row Level Security (RLS)** — ควบคุมสิทธิ์การเข้าถึงข้อมูล
  - **RPC Functions** — ฟังก์ชันพิเศษ เช่น `get_leaderboard`, `get_user_rank`

### 4.4 สัญลักษณ์ใน System Architecture

| สัญลักษณ์                 | ความหมาย                                   |
| ---------------------------------- | -------------------------------------------------- |
| กล่องทึบ                   | Component, Service, หรือ Application           |
| กล่องเปิดด้านข้าง | Database/Storage                                   |
| ก้อนเมฆ                     | External Service/Cloud                             |
| ลูกศร                         | การเชื่อมต่อหรือส่งข้อมูล |
| กรอบใหญ่                   | Tier/Group/Subsystem                               |

### 4.5 ตัวอย่างการอ่าน

```
Browser -->|HTTP| Next.js 16 App Router
Next.js 16 App Router -->|SQL / Auth| Supabase
```

**อ่านว่า:** ผู้ใช้เปิดเว็บผ่าน Browser ส่ง HTTP Request ไปยัง Next.js 16 App Router จากนั้น Next.js ส่งคำสั่ง SQL หรือ Auth Request ไปยัง Supabase

### 4.6 จุดสำคัญของ Architecture นี้

1. **Full-Stack บน Next.js** — ไม่มี Backend แยก เพราะใช้ Server Actions
2. **Supabase เป็น Backend** — ทั้ง Database และ Auth อยู่ที่ Supabase
3. **No REST API** — ใช้ Server Actions แทน API Routes
4. **SSR/CSR ผสม** — Server Components ดึงข้อมูลเริ่มต้น Client Components จัดการ UI

### 4.7 สรุป System Architecture

ระบบนี้ใช้สถาปัตยกรรมที่เรียบง่าย:

- ฝั่งผู้ใช้: React + Tailwind
- ฝั่งเซิร์ฟเวอร์: Next.js Server Components + Server Actions
- ฝั่งข้อมูล: Supabase (PostgreSQL + Auth)
- ทั้งหมดเชื่อมต่อผ่าน HTTP ระหว่าง Browser กับ Next.js และ SQL/Auth ระหว่าง Next.js กับ Supabase

---

## 5. Use Case Diagram

### 5.1 Use Case Diagram คืออะไร

Use Case Diagram เป็นแผนภาพที่แสดงว่า **ผู้ใช้แต่ละประเภท (Actors)** สามารถทำอะไรในระบบได้บ้าง เน้นที่ฟีเจอร์และสิทธิ์ของผู้ใช้เป็นหลัก

### 5.2 ทำไมต้องใช้ Use Case Diagram

- เก็บความต้องการของระบบ (Requirements)
- แยกสิทธิ์ของผู้ใช้แต่ละประเภท
- สื่อสารกับลูกค้า/ผู้ใช้ได้ง่าย
- เป็นพื้นฐานสำหรับการออกแบบฟีเจอร์

### 5.3 Use Case ของ Nursing Exam System

ระบบนี้มี Actors หลัก 2 ประเภท:

#### 5.3.1 Student (นักเรียน)

ฟีเจอร์ที่นักเรียนทำได้:

**Authentication:**

- Register — สมัครสมาชิก
- Login — เข้าสู่ระบบ

**Exam:**

- View Exams — ดูรายการข้อสอบที่เผยแพร่
- Take Exam — ทำข้อสอบพร้อมจับเวลา
- View Results — ดูผลสอบและเฉลย
- View History — ดูประวัติการทำข้อสอบ
- Leaderboard — ดูอันดับคะแนน

**Community:**

- Create Post — สร้างกระทู้
- Comment — แสดงความคิดเห็น
- Like — กดถูกใจโพสต์

**Profile:**

- Edit Profile — แก้ไขข้อมูลส่วนตัว
- Satisfaction Survey — ทำแบบประเมินความพึงพอใจ

#### 5.3.2 Admin (ผู้ดูแลระบบ)

ฟีเจอร์ที่ Admin ทำได้:

- Login — เข้าสู่ระบบ
- Create Exam — สร้างข้อสอบใหม่
- Add Questions — เพิ่มคำถามในข้อสอบ
- Publish Exam — เปิดให้นักเรียนเห็นข้อสอบ
- Dashboard — ดูภาพรวมสถิติ
- Satisfaction Reports — ดูรายงานแบบประเมิน

### 5.4 สัญลักษณ์ใน Use Case Diagram

| สัญลักษณ์           | ความหมาย                                              |
| ---------------------------- | ------------------------------------------------------------- |
| วงรี                     | Actor — ผู้ใช้หรือระบบภายนอก             |
| วงกลม                   | Use Case — ฟีเจอร์/กิจกรรม                     |
| เส้นตรง               | Association — ความสัมพันธ์ Actor กับ Use Case |
| กรอบสี่เหลี่ยม | Boundary/System — ขอบเขตของระบบ                 |
| `<<include>>`              | ต้องทำ Use Case นั้นก่อน                        |
| `<<extend>>`               | ทำเพิ่มเติมจาก Use Case หลัก                |

### 5.5 ตัวอย่างการอ่าน

```
Student ===> Take Exam
```

อ่านว่า: นักเรียนมีความสามารถในการทำข้อสอบ

```
View Results ..>> include ..>> Take Exam
```

อ่านว่า: การดูผลสอบ จำเป็นต้องทำข้อสอบก่อนเสมอ (ไม่มีทางดูผลโดยไม่ได้ทำ)

```
Admin ===> Publish Exam
```

อ่านว่า: ผู้ดูแลระบบสามารถเผยแพร่ข้อสอบได้

### 5.6 ความสัมพันธ์ระหว่าง Use Cases

ใน Use Case Diagram ของระบบนี้มีความสัมพันธ์ 2 แบบ:

#### Include Relationship

ใช้เมื่อ Use Case หนึ่งต้องพึ่ง Use Case อีกอันเสมอ

- `View Results` include `Take Exam` — ต้องทำข้อสอบก่อนถึงจะดูผลได้
- `View Results` include `Login` — ต้อง Login ก่อนถึงจะดูผลได้

#### Association Relationship

ใช้เมื่อ Actor เชื่อมโยงกับ Use Case

- `Student` เชื่อมกับ `Take Exam`
- `Admin` เชื่อมกับ `Create Exam`

### 5.7 สรุป Use Case Diagram

Use Case Diagram ของระบบนี้ช่วยให้เห็นว่า:

- ระบบมีผู้ใช้ 2 ประเภท: Student และ Admin
- นักเรียนมีฟีเจอร์หลักคือ ทำข้อสอบ ดูผล ดูอันดับ และใช้ชุมชน
- Admin มีฟีเจอร์หลักคือ จัดการข้อสอบและดูรายงาน
- บางฟีเจอร์ต้องทำฟีเจอร์อื่นก่อน เช่น ดูผลต้องทำข้อสอบก่อน

---

## 6. เปรียบเทียบ Diagrams ทั้งหมด

| Diagram                       | เน้นอะไร                         | มุมมอง        | ผู้ใช้หลัก                      | เหมาะกับ                                     |
| ----------------------------- | ---------------------------------------- | ------------------- | ----------------------------------------- | ---------------------------------------------------- |
| **ER Diagram**          | โครงสร้างฐานข้อมูล     | ข้อมูล        | นักพัฒนา/DBA                      | ออกแบบ Database, Schema                        |
| **Sequence Diagram**    | ลำดับการทำงาน               | เวลา/ลำดับ | นักพัฒนา                          | เข้าใจ Flow, Debug                             |
| **Data Flow Diagram**   | การไหลของข้อมูล           | ข้อมูล        | นักวิเคราะห์/นักพัฒนา | วิเคราะห์ข้อมูล, ออกแบบ Process |
| **System Architecture** | โครงสร้างระบบทั้งหมด | โครงสร้าง  | นักพัฒนา/DevOps                   | เลือก Tech Stack, Deploy                        |
| **Use Case Diagram**    | สิ่งที่ผู้ใช้ทำได้     | ผู้ใช้        | ลูกค้า/BA/นักพัฒนา          | เก็บ Requirements                                |

### 6.1 ความแตกต่างที่สำคัญ

- **ER vs DFD:** ER เน้นว่าข้อมูลเก็บยังไง DFD เน้นว่าข้อมูลไหลไปไหน
- **Sequence vs DFD:** Sequence เน้นลำดับเวลาและใครส่งอะไรให้ใคร DFD เน้นทิศทางข้อมูลระหว่าง process
- **Use Case vs Sequence:** Use Case บอกว่าทำอะไรได้ Sequence บอกว่าทำอย่างไรทีละขั้นตอน
- **Architecture vs ER:** Architecture บอกเทคโนโลยี ER บอกโครงสร้างข้อมูล

### 6.2 การใช้งานร่วมกัน

Diagrams ทั้งหมดทำงานร่วมกัน:

1. **Use Case** บอกว่าต้องมีฟีเจอร์อะไร
2. **ER Diagram** ออกแบบว่าข้อมูลฟีเจอร์นั้นเก็บยังไง
3. **System Architecture** เลือกเทคโนโลยีที่เหมาะสม
4. **Sequence Diagram** ออกแบบว่าฟีเจอร์ทำงานเป็นขั้นตอนอย่างไร
5. **DFD** ตรวจสอบว่าข้อมูลไหลถูกต้องหรือไม่

---

## 7. แนวทางการอ่าน Diagrams ตามลำดับ

### สำหรับคนใหม่ที่เพิ่งมาโปรเจค

แนะนำให้อ่านตามลำดับนี้:

#### ขั้นที่ 1: Use Case Diagram

- เข้าใจว่าระบบมีฟีเจอร์อะไรบ้าง
- รู้ว่าใครใช้ฟีเจอร์ไหนได้บ้าง
- ใช้เวลา: 5-10 นาที

#### ขั้นที่ 2: System Architecture

- รู้ว่าใช้เทคโนโลยีอะไรบ้าง
- เข้าใจว่าส่วนต่างๆ อยู่ชั้นไหน
- ใช้เวลา: 10-15 นาที

#### ขั้นที่ 3: ER Diagram

- เข้าใจว่าข้อมูลเก็บยังไง
- รู้ว่าตารางไหนเชื่อมกันยังไง
- ใช้เวลา: 15-20 นาที

#### ขั้นที่ 4: Sequence Diagram

- เข้าใจ flow การทำงานละเอียดของแต่ละฟีเจอร์
- เริ่มจาก Login → Take Exam → Community
- ใช้เวลา: 20-30 นาที

#### ขั้นที่ 5: Data Flow Diagram

- ตรวจสอบว่าข้อมูลไหลถูกต้องหรือไม่
- เข้าใจ module ย่อยของระบบ
- ใช้เวลา: 10-15 นาที

### สำหรับนักพัฒนาที่จะแก้ไขฟีเจอร์

- ถ้าจะแก้ฟีเจอร์ → อ่าน **Sequence Diagram** ก่อน
- ถ้าจะเพิ่มตารางข้อมูล → อ่าน **ER Diagram** ก่อน
- ถ้าจะเปลี่ยนเทคโนโลยี → อ่าน **System Architecture** ก่อน
- ถ้าจะเพิ่มฟีเจอร์ใหม่ → อ่าน **Use Case Diagram** ก่อน

---

## 8. ตัวอย่างการเชื่อมโยง Diagrams เข้าด้วยกัน

### ตัวอย่าง: ฟีเจอร์ "ทำข้อสอบ"

เราสามารถศึกษาฟีเจอร์นี้ได้จาก Diagrams ทั้งหมด:

1. **Use Case Diagram:** Student สามารถ Take Exam ได้
2. **ER Diagram:** ข้อมูลเก็บใน `exams`, `questions`, `exam_attempts`, `user_answers`
3. **System Architecture:** ทำงานผ่าน Browser → Next.js → Supabase
4. **Sequence Diagram:** แสดงขั้นตอนตั้งแต่เลือกข้อสอบจนถึงแสดงผล
5. **Data Flow Diagram:** ข้อมูลไหลจาก Student → Exam Taking Module → Supabase

### ตัวอย่าง: ฟีเจอร์ "สร้างข้อสอบ"

1. **Use Case Diagram:** Admin สามารถ Create Exam, Add Questions, Publish Exam ได้
2. **ER Diagram:** ข้อมูลเก็บใน `exams` และ `questions`
3. **System Architecture:** Admin Panel อยู่ใน Next.js App Router
4. **Sequence Diagram:** แสดงขั้นตอนการสร้างข้อสอบและเพิ่มคำถาม
5. **Data Flow Diagram:** ข้อมูลไหลจาก Admin → Exam Management → Supabase

---

## 9. ข้อควรระวังในการอ่าน Diagrams

### ER Diagram

- อย่าสับสนระหว่าง One-to-Many กับ Many-to-Many
- ดูให้ดีว่า FK ไปที่ตารางไหน และลบ cascading ยังไง

### Sequence Diagram

- ลูกศรไม่ใช่ลำดับเวลาจริง 100% แต่เป็นลำดับเชิงตรรกะ
- Activation Bar แสดงช่วงที่ส่วนนั้นกำลังทำงาน ไม่ใช่ระยะเวลาจริง

### Data Flow Diagram

- DFD ไม่แสดงการควบคุมเงื่อนไข (if/else) เหมือน Flowchart
- DFD เน้นข้อมูล ไม่เน้นลำดับการทำงาน

### System Architecture

- Architecture อาจเปลี่ยนแปลงได้ตามการ scale
- สถาปัตยกรรมปัจจุบันอาจไม่ใช่ optimal สำหรับระบบใหญ่

### Use Case Diagram

- Use Case ไม่ได้บอกว่าทำอย่างไร แต่บอกว่าทำอะไรได้
- อย่าใส่รายละเอียดมากเกินไปใน Use Case Diagram

---

## 10. สรุป

เอกสารนี้อธิบาย Diagrams ทั้งหมดของ Nursing Exam System:

| # | Diagram             | สิ่งที่ได้รู้                                                                                                                                        |
| - | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | ER Diagram          | มี 11 ตาราง เชื่อมโยงกันเป็นกลุ่ม User, Exam, Community, Satisfaction                                                                 |
| 2 | Sequence Diagram    | แต่ละฟีเจอร์ทำงานเป็นขั้นตอนอย่างไร โดยเฉพาะ Take Exam ที่เก็บคำตอบใน State แล้วส่งทีเดียว |
| 3 | Data Flow Diagram   | ข้อมูลไหลจาก User → Next.js → Supabase ผ่าน Module ต่างๆ                                                                                   |
| 4 | System Architecture | 3-Tier: React Client → Next.js Server → Supabase Backend                                                                                                        |
| 5 | Use Case Diagram    | มี Student และ Admin แต่ละคนทำอะไรได้บ้าง                                                                                                |

การอ่านทั้งหมดตามลำดับที่เหมาะสมจะช่วยให้เข้าใจระบบได้อย่างเป็นระบบ ตั้งแต่ระดับผู้ใช้ ไปจนถึงระดับฐานข้อมูล
