# Nursing Exam System — Design Diagrams

---

## 1. ER Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor':'#e0f2fe','primaryTextColor':'#0c4a6e','primaryBorderColor':'#0284c7','lineColor':'#0284c7','secondaryColor':'#fef3c7','tertiaryColor':'#fdf2f8'}}}%%
erDiagram
    profiles ||--o{ exams : creates
    profiles ||--o{ exam_attempts : attempts
    profiles ||--o{ community_posts : writes
    profiles ||--o{ community_comments : writes
    profiles ||--o{ community_likes : likes
    profiles ||--o| satisfaction_responses : submits

    exams ||--o{ questions : contains
    exams ||--o{ exam_attempts : has

    exam_attempts ||--o{ user_answers : records

    questions ||--o{ user_answers : answered_as

    community_posts ||--o{ community_comments : has
    community_posts ||--o{ community_likes : receives

    satisfaction_responses ||--o{ satisfaction_scores : rates
    satisfaction_questions ||--o{ satisfaction_scores : scored_as

    profiles {
        uuid id PK "##"
        text email UK
        text password_hash
        text name
        text avatar_url
        text university
        text role "student | admin"
    }

    exams {
        uuid id PK "##"
        text title
        text description
        int time_limit_minutes
        bool is_published
        uuid created_by FK
    }

    questions {
        uuid id PK "##"
        uuid exam_id FK
        text question_text
        jsonb options
        text correct_option
        text explanation_text
        int sort_order
    }

    exam_attempts {
        uuid id PK "##"
        uuid user_id FK
        uuid exam_id FK
        int score
        int total_questions
        int time_spent_seconds
        timestamp completed_at
    }

    user_answers {
        uuid id PK "##"
        uuid attempt_id FK
        uuid question_id FK
        text selected_option
        bool is_correct
        timestamp answered_at
    }

    community_posts {
        uuid id PK "##"
        uuid user_id FK
        text title
        text content
        text category
    }

    community_comments {
        uuid id PK "##"
        uuid post_id FK
        uuid user_id FK
        text content
    }

    community_likes {
        uuid id PK "##"
        uuid post_id FK
        uuid user_id FK
    }

    satisfaction_questions {
        uuid id PK "##"
        text question_text
        int sort_order
        bool is_active
    }

    satisfaction_responses {
        uuid id PK "##"
        uuid user_id FK_UK
        text feedback
    }

    satisfaction_scores {
        uuid id PK "##"
        uuid response_id FK
        uuid question_id FK
        int score "1-5"
    }
```

---

## 2. Data Flow Diagram

### Level 0 — Context

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor':'#dbeafe','lineColor':'#2563eb','fontSize':'15px'}}}%%
graph LR
    A([ Student ])
    B([ Admin ])

    S{{ Nursing Exam<br/>System }}

    D[( Supabase )]

    A -->|Login · Exam · Community| S
    S -->|Results · Leaderboard| A
    B -->|Manage Exams · Reports| S
    S -->|Analytics · Dashboard| B
    S <-->|Read / Write| D
```

### Level 1 — System Overview

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor':'#e0f2fe','secondaryColor':'#fef3c7','tertiaryColor':'#fdf2f8','lineColor':'#0284c7'}}}%%
graph TD
    ST([Student])
    AD([Admin])

    subgraph CORE[" Core Modules "]
        direction LR
        P1[Auth]
        P2[Exam Management]
        P3[Exam Taking]
        P4[Community]
        P5[Satisfaction]
        P6[Admin Panel]
        P7[Leaderboard]
    end

    DB[(Supabase)]

    ST --> P1
    ST --> P3
    ST --> P4
    ST --> P5
    ST --> P7

    AD --> P1
    AD --> P2
    AD --> P6

    P1 --> DB
    P2 --> DB
    P3 --> DB
    P4 --> DB
    P5 --> DB
    P6 --> DB
    P7 --> DB
```

### Level 2 — Exam Taking

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor':'#ccfbf1','lineColor':'#0d9488'}}}%%
graph LR
    ST([Student])

    subgraph PROCESS[" Exam Taking Flow "]
        direction LR
        S1[ 1. Pick Exam ] --> S2[ 2. Load Questions ]
        S2 --> S3[ 3. Timer Starts ]
        S3 --> S4[ 4. Answer Question ]
        S4 -->|Next| S4
        S4 -->|Submit / Timeout| S5[ 5. Grading ]
        S5 --> S6[ 6. Save Result ]
        S6 --> S7[ 7. Show Result ]
    end

    DB[(Supabase)]

    ST --> S1
    S7 --> ST
    S2 -.->|Read| DB
    S4 -- Save Answer --> DB
    S6 -- Insert Attempt --> DB
```

---

## 3. Use Case Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor':'#e0f2fe','secondaryColor':'#fef3c7','tertiaryColor':'#fdf2f8','lineColor':'#0284c7'}}}%%
graph LR
    ST([ Student ])
    AD([ Admin ])

    subgraph AUTH[" Authentication "]
        UC1[Register]
        UC2[Login]
    end

    subgraph EXAM[" Exam "]
        UC3[View Exams]
        UC4[Take Exam]
        UC5[View Results]
        UC6[View History]
        UC7[Leaderboard]
    end

    subgraph SOCIAL[" Community "]
        UC8[Create Post]
        UC9[Comment]
        UC10[Like]
    end

    subgraph USER[" Profile "]
        UC11[Edit Profile]
        UC12[Satisfaction Survey]
    end

    subgraph ADMIN[" Admin "]
        UC20[Create Exam]
        UC21[Add Questions]
        UC22[Publish Exam]
        UC23[Dashboard]
        UC24[Satisfaction Reports]
    end

    ST -...- UC1
    ST -...- UC2

    ST ===> UC3
    ST ===> UC4
    ST ===> UC5
    ST ===> UC6
    ST ===> UC7

    ST -.- UC8
    ST -.- UC9
    ST -.- UC10

    ST -.-> UC11
    ST -.-> UC12

    AD -...- UC2
    AD ===> UC20
    AD ===> UC21
    AD ===> UC22
    AD ===> UC23
    AD ===> UC24

    UC4 -..->|include| UC2
    UC5 -..->|include| UC4
```

### Summary

| # | Use Case      |  Actor  |                                      |
| :-: | ------------- | :-----: | ------------------------------------ |
| 1 | Register      | Student | สมัครสมาชิก               |
| 2 | Login         |  Both  | เข้าสู่ระบบ               |
| 3 | View Exams    | Student | ดูรายการข้อสอบ         |
| 4 | Take Exam     | Student | ทำข้อสอบ (Timer)             |
| 5 | View Results  | Student | ดูคะแนน + เฉลย            |
| 6 | View History  | Student | ประวัติการสอบ           |
| 7 | Leaderboard   | Student | อันดับคะแนน               |
| 8 | Create Post   | Student | สร้างกระทู้               |
| 9 | Comment       | Student | แสดงความคิดเห็น       |
| 10 | Like          | Student | ถูกใจโพสต์                 |
| 11 | Edit Profile  | Student | แก้ไขโปรไฟล์             |
| 12 | Survey        | Student | ประเมินความพึงพอใจ |
| 20 | Create Exam   |  Admin  | สร้างข้อสอบ               |
| 21 | Add Questions |  Admin  | เพิ่มคำถาม                 |
| 22 | Publish       |  Admin  | เผยแพร่ข้อสอบ           |
| 23 | Dashboard     |  Admin  | ดูสถิติ                       |
| 24 | Reports       |  Admin  | รายงานประเมิน           |

---

## 4. Sequence Diagrams

### 4.1 Login

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'actorBkg':'#dbeafe','actorBorder':'#2563eb','signalColor':'#334155','signalTextColor':'#334155','labelBoxBkgColor':'#e0f2fe','labelBoxBorderColor':'#0284c7','noteBkgColor':'#fef9c3','noteBorderColor':'#ca8a04'}}}%%
sequenceDiagram
    autonumber

    actor U as 👤 Student
    participant B as 🖥️ Browser
    participant N as ⚡ Next.js
    participant S as 🗄️ Supabase

    U->>+B: Email + Password
    B->>+N: POST /auth/login

    N->>+S: signInWithPassword()
    S-->>-N: Session Token

    N->>+S: SELECT profiles WHERE email = ?
    S-->>-N: User Profile

    N-->>-B: Set Cookie + Redirect
    B-->>-U: Dashboard
```

### 4.2 Take Exam

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'actorBkg':'#dbeafe','actorBorder':'#2563eb','signalColor':'#334155','signalTextColor':'#334155','labelBoxBkgColor':'#e0f2fe','labelBoxBorderColor':'#0284c7','noteBkgColor':'#fef9c3','noteBorderColor':'#ca8a04'}}}%%
sequenceDiagram
    autonumber

    actor U as 👤 Student
    participant B as 🖥️ Browser
    participant N as ⚡ Next.js
    participant S as 🗄️ Supabase

    U->>B: เลือกข้อสอบ
    B->>+N: GET /exam/:id
    N->>+S: SELECT exam + questions
    S-->>-N: Exam + Questions[]
    N-->>-B: แสดงข้อสอบ + เริ่ม Timer

    loop ตอบทีละข้อ
        U->>B: เลือกคำตอบ
        Note over B: เก็บคำตอบใน State
    end

    U->>B: กดส่งข้อสอบ / หมดเวลา
    B->>+N: POST submitExam(answers)

    N->>+S: SELECT correct_option FROM questions
    S-->>-N: Questions[]

    Note over N: ตรวจคำตอบ + คำนวณคะแนน

    N->>+S: INSERT exam_attempts
    S-->>-N: attempt_id

    N->>+S: INSERT user_answers
    S-->>-N: Saved

    N-->>-B: Redirect /history
    B-->>U: แสดงประวัติ + ผลสอบ
```

### 4.3 Admin — Create Exam

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'actorBkg':'#fef3c7','actorBorder':'#b45309','signalColor':'#334155','signalTextColor':'#334155','labelBoxBkgColor':'#fef3c7','labelBoxBorderColor':'#b45309','noteBkgColor':'#fef9c3','noteBorderColor':'#ca8a04'}}}%%
sequenceDiagram
    autonumber

    actor A as ⚙️ Admin
    participant B as 🖥️ Browser
    participant N as ⚡ Next.js
    participant S as 🗄️ Supabase

    A->>B: Admin Panel
    B->>N: GET /admin/exams
    N->>S: SELECT * FROM exams
    S-->>N: Exams[]
    N-->>B: Table

    A->>B: [ + สร้างข้อสอบ ]
    A->>B: ชื่อ / รายละเอียด / เวลา
    B->>N: POST create exam
    N->>S: INSERT exams
    S-->>N: New Exam

    loop เพิ่มคำถาม
        A->>B: [ + เพิ่มคำถาม ]
        A->>B: คำถาม + 4 ตัวเลือก + เฉลย
        B->>N: POST add question
        N->>S: INSERT questions
    end

    A->>B: [ เผยแพร่ ]
    B->>N: PATCH publish
    N->>S: UPDATE is_published = true
    S-->>N: OK
    N-->>B: Done
```

### 4.4 Community

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'actorBkg':'#dbeafe','actorBorder':'#2563eb','signalColor':'#334155','signalTextColor':'#334155','labelBoxBkgColor':'#e0f2fe','labelBoxBorderColor':'#0284c7','noteBkgColor':'#fef9c3','noteBorderColor':'#ca8a04'}}}%%
sequenceDiagram
    autonumber

    actor U1 as 👤 User 1
    actor U2 as 👤 User 2
    participant B as 🖥️ Browser
    participant N as ⚡ Next.js
    participant S as 🗄️ Supabase

    Note over U1,S: ── Create Post ──

    U1->>B: [ + สร้างกระทู้ ]
    B->>N: POST create post
    N->>S: INSERT community_posts
    S-->>N: Done
    N-->>B: Refresh Feed

    Note over U2,S: ── View & Interact ──

    U2->>B: เปิดกระทู้
    B->>N: GET /community/:id
    N->>S: SELECT post + comments + likes count
    S-->>N: Data
    N-->>B: Render

    U2->>B: แสดงความคิดเห็น
    B->>N: POST add comment
    N->>S: INSERT community_comments

    U2->>B: ถูกใจ
    B->>N: POST like
    N->>S: INSERT community_likes<br/>(unique: post+user)
```

### 4.5 Satisfaction Survey

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'actorBkg':'#dbeafe','actorBorder':'#2563eb','signalColor':'#334155','signalTextColor':'#334155','labelBoxBkgColor':'#e0f2fe','labelBoxBorderColor':'#0284c7','noteBkgColor':'#fef9c3','noteBorderColor':'#ca8a04'}}}%%
sequenceDiagram
    autonumber

    actor U as 👤 Student
    participant B as 🖥️ Browser
    participant N as ⚡ Next.js
    participant S as 🗄️ Supabase

    U->>B: หน้าแบบประเมิน
    B->>+N: GET /satisfaction
    N->>S: SELECT * FROM satisfaction_questions
    S-->>N: Questions[]
    N-->>-B: Render Form

    U->>B: ให้คะแนน 1-5 + Feedback
    B->>+N: POST submit
    N->>S: INSERT satisfaction_responses
    S-->>N: response_id
    N->>S: INSERT satisfaction_scores (batch)
    S-->>N: Done
    N-->>-B: Success
```

### 4.6 Leaderboard

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'actorBkg':'#dbeafe','actorBorder':'#2563eb','signalColor':'#334155','signalTextColor':'#334155','labelBoxBkgColor':'#e0f2fe','labelBoxBorderColor':'#0284c7','noteBkgColor':'#fef9c3','noteBorderColor':'#ca8a04'}}}%%
sequenceDiagram
    autonumber

    actor U as 👤 Student
    participant B as 🖥️ Browser
    participant N as ⚡ Next.js
    participant S as 🗄️ Supabase

    U->>B: หน้า Ranking
    B->>+N: GET /ranking
    N->>+S: get_leaderboard(50)
    S-->>-N: Top 50 []
    N->>+S: get_user_rank(:uid)
    S-->>-N: rank #
    N-->>-B: Leaderboard + My Rank
    B-->>U: อันดับที่ xx
```

---

## 5. Tech Stack

| Layer      | Tech                       |
| :--------- | :------------------------- |
| Framework  | Next.js 16 (App Router)    |
| Language   | TypeScript                 |
| UI         | React 19 + Tailwind CSS v4 |
| Components | shadcn/ui + Base UI        |
| Backend    | Server Actions             |
| Database   | Supabase PostgreSQL        |
| Auth       | Supabase Auth + bcryptjs   |
| Charts     | Recharts                   |
| Animation  | Framer Motion              |
| Icons      | Lucide React               |

### Routes

| Path                             | Page           |  Auth  |
| :------------------------------- | :------------- | :-----: |
| `/`                            | Landing        |   —   |
| `/login`                       | Login          |   —   |
| `/register`                    | Register       |   —   |
| `/exam`                        | Exam List      | Student |
| `/exam/:id`                    | Take Exam      | Student |
| `/exam/:id/result/:aid`        | Result         | Student |
| `/dashboard`                   | Home           | Student |
| `/history`                     | Exam History   | Student |
| `/ranking`                     | Leaderboard    | Student |
| `/community`                   | Posts Feed     | Student |
| `/community/:id`               | Post Detail    | Student |
| `/profile`                     | Edit Profile   | Student |
| `/satisfaction`                | Survey         | Student |
| `/admin`                       | Dashboard      |  Admin  |
| `/admin/exams`                 | Manage Exams   |  Admin  |
| `/admin/exams/:id`             | Edit Exam      |  Admin  |
| `/admin/satisfaction`          | Survey Reports |  Admin  |
| `/admin/satisfaction/analysis` | Analysis       |  Admin  |

---

## 6. System Architecture Diagram

### 6.1 Simple 3-Tier Architecture

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor':'#e0f2fe','secondaryColor':'#fef3c7','tertiaryColor':'#fdf2f8','lineColor':'#0284c7'}}}%%
graph LR
    A[Browser] -->|HTTP| B[Next.js 16
    App Router]
    B -->|SQL / Auth| C[Supabase]

    subgraph A1["Client Tier"]
        A
    end

    subgraph B1["Application Tier"]
        B
    end

    subgraph C1["Data Tier"]
        C[(PostgreSQL)]
        D[Auth Service]
    end

    C --> D
```

### 6.2 Request Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor':'#dbeafe','secondaryColor':'#fef3c7','lineColor':'#2563eb'}}}%%
graph LR
    U[User] --> P[Page
    /exam]
    P --> SC[Server Component
    fetch data]
    SC --> SA[Server Action
    business logic]
    SA --> DB[(Supabase
    PostgreSQL)]
    DB --> SA
    SA --> SC
    SC --> P
    P --> U
```

### 6.3 Auth Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor':'#fef3c7','secondaryColor':'#e0f2fe','lineColor':'#b45309'}}}%%
graph LR
    A[Login] --> B[Server Action]
    B --> C[Supabase Auth]
    C --> D[JWT Cookie]
    D --> E[Middleware]
    E -->|Student| F[Dashboard]
    E -->|Admin| G[Admin Panel]
    E -->|No token| A
```

---

## 7. Directory Structure

```
nursing-exam/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth routes (no sidebar)
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/          # Student routes (with sidebar)
│   │   │   ├── dashboard/
│   │   │   ├── history/
│   │   │   ├── ranking/
│   │   │   ├── community/
│   │   │   ├── profile/
│   │   │   └── satisfaction/
│   │   ├── admin/                # Admin routes
│   │   │   ├── dashboard/
│   │   │   ├── exams/
│   │   │   └── satisfaction/
│   │   ├── exam/                 # Exam taking
│   │   └── page.tsx              # Landing page
│   ├── actions/                  # Server Actions (Business Logic)
│   │   ├── auth.ts               # Login, Register, Logout
│   │   ├── exam.ts               # Exam CRUD, Submit
│   │   ├── community.ts          # Posts, Comments, Likes
│   │   ├── profile.ts            # Profile updates
│   │   ├── satisfaction.ts       # Survey submission
│   │   └── admin.ts              # Admin operations
│   ├── components/               # React Components
│   ├── context/                  # React Context (Auth)
│   ├── hooks/                    # Custom Hooks
│   ├── lib/                      # Utilities
│   │   ├── supabase-client.ts    # Browser Supabase client
│   │   ├── supabase-server.ts    # Server Supabase client
│   │   └── auth.ts               # Auth helpers
│   ├── types/                    # TypeScript types
│   └── styles/                   # Global styles
├── supabase/                     # Supabase config
├── schema.sql                    # Database schema
└── public/                       # Static assets
```
