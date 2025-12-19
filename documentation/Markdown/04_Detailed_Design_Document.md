# SensAI: Detailed Design Document

## Table of Contents
1. [User Personas](#user-personas)
2. [System Architecture](#system-architecture)
3. [Core User Workflows](#core-user-workflows)
4. [Sequence Diagrams](#sequence-diagrams)
5. [Activity Diagrams](#activity-diagrams)
6. [Data Models](#data-models)
7. [API Contract](#api-contract)
8. [UI/UX Design Patterns](#uiux-design-patterns)

---

## User Personas

### Persona 1: Sarah (Student)

**Profile:**
- **Name:** Sarah Chen
- **Role:** Undergraduate Computer Science Student
- **Age:** 20
- **Technical Level:** Intermediate (knows how to code, basic DB concepts)
- **Goals:** Understand algorithms better, improve quiz scores, manage time
- **Pain Points:** Struggles with complexity analysis, lacks real-time help during exams

**Behavior:**
- Attempts quizzes at last minute (night before deadline)
- Uses AI chat when stuck, averages 2-3 messages per question
- Retakes quiz multiple times to improve score
- Exports chat history to study later
- Prefers quick feedback over lengthy explanations

**Key Needs:**
- Non-invasive AI guidance (don't spoil answers)
- Mobile-friendly interface
- Clear answer explanations
- Chat history for review

---

### Persona 2: Dr. James (Instructor)

**Profile:**
- **Name:** Dr. James Mitchell
- **Role:** Associate Professor, Computer Science
- **Age:** 45
- **Technical Level:** High (strong pedagogy, moderate tech adoption)
- **Goals:** Improve student learning outcomes, identify struggling students early, reduce grading workload
- **Pain Points:** Manual grading is time-consuming, can't see where students struggle conceptually

**Behavior:**
- Creates 8-10 quizzes per semester
- Reviews analytics at end of week
- Makes curriculum adjustments based on question performance
- Meets with struggling students using analytics as reference
- Values data-driven insights over anecdotes

**Key Needs:**
- Intuitive analytics dashboard
- Per-question difficulty metrics
- Student mistake categorization
- Export capabilities for reports
- Mobile dashboard for quick checks

---

### Persona 3: Dean Patricia (Administrator)

**Profile:**
- **Name:** Dean Patricia Gonzalez
- **Role:** Associate Dean, Academic Affairs
- **Age:** 52
- **Technical Level:** Low (uses spreadsheets, basic dashboards)
- **Goals:** Ensure institutional compliance, monitor course effectiveness, plan budgets
- **Pain Points:** Limited visibility into teaching quality, difficulty comparing courses

**Behavior:**
- Reviews platform metrics quarterly
- Uses dashboards for accreditation reports
- Needs exportable data for presentations
- Concerned with data privacy and security
- Delegates detailed analysis to faculty

**Key Needs:**
- System health metrics
- Platform adoption statistics
- Data export for compliance
- Security assurance
- Minimal training required

---

### Persona 4: Alex (Teaching Assistant)

**Profile:**
- **Name:** Alex Rodriguez
- **Role:** Graduate Teaching Assistant
- **Age:** 24
- **Technical Level:** Intermediate
- **Goals:** Support students effectively, help professor with grading, learn about teaching
- **Pain Points:** Limited time, multiple courses to support

**Behavior:**
- Monitors quiz submissions in real-time
- Helps students interpret analytics
- Prepares summary reports for professor
- Uses attempt lookups to find specific student issues
- Works part-time, prefers quick access over depth

**Key Needs:**
- Quick filters and searches
- Real-time notifications (future feature)
- Easy data export
- Mobile accessibility
- Context-sensitive help

---

## System Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                     │
│  (React SPA - TypeScript + Tailwind CSS)               │
├──────────────────────────────────────────────────────────┤
│  Homepage │ StudentPage │ QuizPage │ InstructorPage     │
│  InstructorAnalyticsPage │ AccountPage                  │
└──────────┬──────────────────────────────────────────────┘
           │ HTTP/REST
┌──────────▼──────────────────────────────────────────────┐
│              APPLICATION LAYER                          │
│  (Express.js Router + Middleware)                      │
├──────────────────────────────────────────────────────────┤
│ authRoutes │ quizRoutes │ questionRoutes                │
│ attemptRoutes │ aiRoutes │ chatRoutes                   │
│ analyticRoutes │ userRoutes                             │
│                                                          │
│ Middleware: sessionMiddleware, CORS, auth checks       │
└──────────┬──────────────────────────────────────────────┘
           │ SQL/Queries
┌──────────▼──────────────────────────────────────────────┐
│                   DATA LAYER                            │
│  (MySQL + Utilities)                                   │
├──────────────────────────────────────────────────────────┤
│ dbConnection (pool) │ Table: user, role, quiz,         │
│ question, question_attempt, chat_history,              │
│ mistake_type, session, course                           │
│                                                          │
│ External: Google Gemini API (AI)                        │
└──────────────────────────────────────────────────────────┘
```

### Module Responsibility Map

| Module | Responsibility | Key Functions |
|--------|-----------------|----------------|
| **authRoutes.js** | User registration & login | POST /register, /login, /logout |
| **quizRoutes.js** | Quiz CRUD & access control | GET/POST/PUT /quiz, /quiz/:id/:code |
| **questionRoutes.js** | Question management | GET/POST/PUT/DELETE /question |
| **attemptRoutes.js** | Quiz submissions & tracking | POST /submit, GET /student, /quiz/:id |
| **aiRoutes.js** | AI chat & mistake ID | POST /chat, /summary |
| **chatRoutes.js** | Chat history storage | POST /saveChat |
| **analyticRoutes.js** | Metrics & insights | GET /metrics, /quiz/:id, /question/:id |
| **userRoutes.js** | User profile & API keys | GET/PUT /profile, /apiKey |

---

## Core User Workflows

### Workflow 1: Student Taking a Quiz

```
START
  │
  ├─ Student navigates to Homepage
  │
  ├─ Enters Quiz ID & Access Code
  │  (Frontend validates format)
  │
  ├─ [Backend: POST /api/quiz/:quizId/:accessCode]
  │  │ ├─ Verify session exists
  │  │ ├─ Check access code matches
  │  │ ├─ Fetch quiz + questions
  │  │ └─ Return quiz data
  │  │
  │  └─ [Frontend: Render Quiz Page]
  │
  ├─ Display Question 1 of N
  │
  ├─ Student inputs answer
  │
  ├─ DECISION: Click "Check Answer"?
  │  │
  │  ├─ YES:
  │  │  │ ├─ [Backend: POST /api/attempt/submit]
  │  │  │ │  ├─ Record attempt (userId, questionId, answer)
  │  │  │ │  ├─ Compare to correct answer
  │  │  │ │  ├─ If wrong: Call Gemini for mistake type
  │  │  │ │  ├─ Increment numMsgs if used AI
  │  │  │ │  └─ Return feedback
  │  │  │ │
  │  │  │ └─ Display result (✓ or ✗)
  │  │  │
  │  │  └─ DECISION: Use AI Chat?
  │  │     │
  │  │     ├─ YES:
  │  │     │  │ ├─ [Frontend: Open Chat Modal]
  │  │     │  │ ├─ Fetch prior chat history
  │  │     │  │ └─ Student types message
  │  │     │  │
  │  │     │  └─ [Backend: POST /api/ai/chat]
  │  │     │     ├─ Load question context
  │  │     │     ├─ Pass to Gemini API
  │  │     │     └─ Return AI response
  │  │     │
  │  │     └─ NO: Continue to next question
  │  │
  │  └─ NO: Skip to next question
  │
  ├─ DECISION: Last question?
  │  │
  │  ├─ YES: Show "Submit Quiz" prompt
  │  │  │
  │  │  └─ [Backend: POST /api/attempt/submit-all]
  │  │     ├─ Record all final attempts
  │  │     ├─ Calculate total score
  │  │     ├─ For each wrong Q: ID mistake
  │  │     └─ Return results + AI summary
  │  │
  │  └─ NO: Move to next question (loop back)
  │
  ├─ Display Results
  │  (Score, breakdown, AI-generated feedback)
  │
  └─ END (Option to retry)
```

### Workflow 2: Instructor Reviewing Analytics

```
START
  │
  ├─ Instructor logs in → Dashboard loads
  │
  ├─ [Backend: GET /api/analytic/metrics]
  │  ├─ Query user counts, quiz counts, attempt totals
  │  └─ Return 5 platform KPI cards
  │
  ├─ Select Course [Dropdown]
  │
  ├─ Select Quiz [Dropdown]
  │
  ├─ [Backend: GET /api/analytic/quiz/:quizId]
  │  ├─ Query question_attempt table filtered by quizId
  │  ├─ Calculate: attempts, avg score, completion rate, avg AI messages
  │  └─ Return 4 KPI cards
  │
  ├─ View Question Insights Table
  │  (Auto-populated from DB)
  │
  ├─ DECISION: Drill into specific question?
  │  │
  │  ├─ YES:
  │  │  │ ├─ [Backend: GET /api/analytic/question/:questionId]
  │  │  │ │  ├─ Return % correct, difficulty, mistakes
  │  │  │ │  └─ Mistake type breakdown
  │  │  │ │
  │  │  │ └─ Display question detail modal
  │  │
  │  └─ NO: Use Attempt Lookups
  │
  ├─ Use Filters (Student, Quiz, Question)
  │
  ├─ [Backend: GET /api/attempt/* with filters]
  │  └─ Return matching attempt records
  │
  ├─ Review attempt details (answer, correctness, mistakes)
  │
  ├─ DECISION: Export data?
  │  │
  │  ├─ YES:
  │  │  └─ [Browser: Download CSV/PDF]
  │  │
  │  └─ NO: Continue analyzing
  │
  └─ END (Use insights to make instructional decisions)
```

---

## Sequence Diagrams

### Diagram 1: Quiz Attempt with Feedback

```
Student        Frontend      Backend       Database    Gemini API
   │              │             │             │            │
   │ Enter quiz ID│             │             │            │
   ├─────────────>│             │             │            │
   │              │ POST /quiz/:id/:code      │            │
   │              ├────────────>│             │            │
   │              │             │ SELECT      │            │
   │              │             ├────────────>│            │
   │              │             │<────────────┤            │
   │              │<────────────┤             │            │
   │              │ quiz data   │             │            │
   │<─────────────┤             │             │            │
   │ Quiz loaded  │             │             │            │
   │              │             │             │            │
   │ Answer Q1    │             │             │            │
   ├─────────────>│             │             │            │
   │              │ POST /attempt/submit      │            │
   │              ├────────────>│             │            │
   │              │             │ INSERT      │            │
   │              │             ├────────────>│            │
   │              │             │<────────────┤            │
   │              │             │             │            │
   │              │             │ Compare ans │            │
   │              │             │ with correct│            │
   │              │             │             │            │
   │              │             │ If wrong:   │            │
   │              │             │ POST mistake│
   │              │             ├───────────────────────>│
   │              │             │             │  mistake │
   │              │             │<────────────────────────┤
   │              │             │  mistakeId  │            │
   │              │             │ UPDATE      │            │
   │              │             ├────────────>│            │
   │              │             │<────────────┤            │
   │              │<────────────┤             │            │
   │              │ ✓/✗ feedback│             │            │
   │<─────────────┤             │             │            │
   │ See result   │             │             │            │
   │              │             │             │            │
   │ Use AI chat? │             │             │            │
   ├─────────────>│             │             │            │
   │              │ POST /ai/chat             │            │
   │              ├────────────>│             │            │
   │              │             │ GET context │            │
   │              │             ├────────────>│            │
   │              │             │<────────────┤            │
   │              │             │             │            │
   │              │             │ POST request│
   │              │             ├───────────────────────>│
   │              │             │             │          │
   │              │             │             │  AI gen. │
   │              │             │<───────────────────────┤
   │              │             │  response   │            │
   │              │             │             │            │
   │              │             │ SAVE chat   │            │
   │              │             ├────────────>│            │
   │              │             │<────────────┤            │
   │              │<────────────┤             │            │
   │              │ AI response │             │            │
   │<─────────────┤             │             │            │
   │ Read reply   │             │             │            │
```

### Diagram 2: Login & Session Management

```
Student        Frontend      Backend       Database
   │              │             │             │
   │ Click Login  │             │             │
   ├─────────────>│             │             │
   │              │             │             │
   │ Enter email  │             │             │
   │ + password   │             │             │
   ├─────────────>│             │             │
   │              │ POST /login │             │
   │              ├────────────>│             │
   │              │             │ SELECT user │
   │              │             ├────────────>│
   │              │             │<────────────┤
   │              │             │ user found? │
   │              │             │             │
   │              │             │ bcrypt.compare(
   │              │             │   password, hash)
   │              │             │             │
   │              │             │ Match? ✓    │
   │              │             │             │
   │              │             │ INSERT INTO │
   │              │             │ session     │
   │              │             ├────────────>│
   │              │             │<────────────┤
   │              │             │ sessionId   │
   │              │<────────────┤             │
   │              │ Set cookie  │             │
   │              │ + redirect  │             │
   │<─────────────┤             │             │
   │ Dashboard    │             │             │
   │ visible      │             │             │
   │              │             │             │
   │ [Later]      │             │             │
   │ Logout       │             │             │
   ├─────────────>│             │             │
   │              │ POST /logout│             │
   │              ├────────────>│             │
   │              │             │ DELETE from │
   │              │             │ session     │
   │              │             ├────────────>│
   │              │             │<────────────┤
   │              │<────────────┤             │
   │              │ Clear cookie│             │
   │<─────────────┤             │             │
   │ Logged out   │             │             │
```

### Diagram 3: Analytics Data Collection

```
Student        Frontend    Backend      Database   Gemini API
   │              │          │            │          │
   │ Submit answer│          │            │          │
   ├─────────────>│          │            │          │
   │              │ attempt  │            │          │
   │              │ payload  │            │          │
   │              ├─────────>│            │          │
   │              │          │ VALIDATE   │          │
   │              │          │            │          │
   │              │          │ Check      │          │
   │              │          │ correctness│          │
   │              │          │            │          │
   │              │          │ INSERT INTO│          │
   │              │          │ attempt    │          │
   │              │          ├───────────>│          │
   │              │          │<───────────┤          │
   │              │          │ (recorded) │          │
   │              │          │            │          │
   │              │          │ If wrong:  │          │
   │              │          │ POST       │
   │              │          ├──────────────────────>│
   │              │          │ {question, │
   │              │          │  student ans,
   │              │          │  correct ans,
   │              │          │  context}  │          │
   │              │          │            │ (analyze)
   │              │          │<──────────────────────┤
   │              │          │ mistakeId  │          │
   │              │          │            │          │
   │              │          │ UPDATE     │          │
   │              │          │ attempt    │          │
   │              │          │ SET        │          │
   │              │          │ mistakeId=?│          │
   │              │          ├───────────>│          │
   │              │          │<───────────┤          │
   │              │          │            │          │
   │ [Chat]       │          │            │          │
   │ Send msg     │          │            │          │
   ├─────────────>│          │            │          │
   │              │ POST     │            │          │
   │              │ /ai/chat │            │          │
   │              ├─────────>│            │          │
   │              │          │ Fetch chat │
   │              │          │ history    │
   │              │          ├───────────>│          │
   │              │          │<───────────┤          │
   │              │          │ (history)  │          │
   │              │          │            │          │
   │              │          │ Increment  │
   │              │          │ numMsgs    │          │
   │              │          │            │          │
   │              │          │ POST       │
   │              │          ├──────────────────────>│
   │              │          │ (system + │
   │              │          │  context)  │ AI
   │              │          │<──────────────────────┤
   │              │          │ (response) │          │
   │              │          │            │          │
   │              │          │ SAVE TO    │
   │              │          │ chat_history          │
   │              │          ├───────────>│          │
   │              │          │<───────────┤          │
   │              │<─────────┤            │          │
   │              │ response │            │          │
   │<─────────────┤          │            │          │
   │ See reply    │          │            │          │
```

---

## Activity Diagrams

### Activity 1: Quiz Submission Process

```
┌─────────────────────────────────────────────────────┐
│           STUDENT QUIZ SUBMISSION FLOW              │
└─────────────────────────────────────────────────────┘

                      START
                        │
                        ▼
        ┌───────────────────────────┐
        │  Student on Quiz Page      │
        │  (M questions answered)    │
        └───────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────┐
        │ Click "Submit Quiz"        │
        │ (Confirmation modal)       │
        └───────────────────────────┘
                        │
                        ▼
             ┌──────────────────────┐
             │  Confirm Submission? │
             └──────────────────────┘
                 /              \
               YES              NO
               /                  \
              ▼                    ▼
     ┌──────────────┐    ┌──────────────┐
     │ POST /submit │    │ Return to    │
     │ (all answers)│    │ Quiz Page    │
     └──────────────┘    └──────────────┘
              │                   │
              │                   └──────┐
              │                          │
              ▼                          │
     ┌──────────────────────────┐        │
     │ Backend Processes Each Q  │        │
     │ (in loop):                │        │
     │ 1. Check correctness      │        │
     │ 2. If wrong → Call Gemini │        │
     │ 3. Categorize mistake     │        │
     │ 4. Record all data        │        │
     └──────────────────────────┘        │
              │                          │
              ▼                          │
     ┌──────────────────────────┐        │
     │ Calculate Total Score    │        │
     │ (correct / total)        │        │
     └──────────────────────────┘        │
              │                          │
              ▼                          │
     ┌──────────────────────────┐        │
     │ Call Gemini for Summary  │        │
     │ (AI-generated feedback)  │        │
     └──────────────────────────┘        │
              │                          │
              ▼                          │
     ┌──────────────────────────┐        │
     │ Display Results Page     │        │
     │ - Score                  │        │
     │ - Breakdown by Q         │        │
     │ - AI Summary             │        │
     │ - Option to Retry        │        │
     └──────────────────────────┘        │
              │                          │
              └──────────────┬───────────┘
                             │
                             ▼
                           END
```

### Activity 2: Analytics Dashboard Load

```
┌─────────────────────────────────────────────────────┐
│        INSTRUCTOR ANALYTICS DASHBOARD LOAD          │
└─────────────────────────────────────────────────────┘

                      START
                        │
                        ▼
        ┌───────────────────────────┐
        │ Instructor Logged In      │
        │ (Session verified)        │
        └───────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────┐
        │ Click "Analytics"         │
        │ from Navigation           │
        └───────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────┐
        │ GET /api/analytic/metrics │
        │ (load platform KPIs)      │
        └───────────────────────────┘
                        │
                        ▼
    ┌─────────────────────────────────┐
    │ Display 5 Platform Metric Cards:│
    │ - Total Users                   │
    │ - Total Students                │
    │ - Total Instructors             │
    │ - Total Quizzes                 │
    │ - Total Courses                 │
    └─────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────┐
        │ Select Course [Dropdown]  │
        │ (courses owned by inst.)   │
        └───────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────┐
        │ Select Quiz [Dropdown]    │
        │ (quizzes in course)       │
        └───────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────┐
        │ GET /api/analytic/quiz/:id│
        │ (load quiz stats)         │
        └───────────────────────────┘
                        │
                        ▼
    ┌─────────────────────────────────┐
    │ Display 4 Quiz KPI Cards:       │
    │ - Total Attempts                │
    │ - Average Score                 │
    │ - Completion Rate               │
    │ - Avg AI Messages               │
    └─────────────────────────────────┘
                        │
                        ▼
    ┌─────────────────────────────────┐
    │ GET /api/analytic/question-stats│
    │ (load per-question metrics)     │
    └─────────────────────────────────┘
                        │
                        ▼
    ┌─────────────────────────────────┐
    │ Render Question Insights Table: │
    │ [Sort controls]                 │
    │ [Color-coded difficulty]        │
    │ [All metrics displayed]         │
    └─────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────┐
        │ Dashboard Ready for Use   │
        │ (all data loaded & shown) │
        └───────────────────────────┘
                        │
                        ▼
             ┌──────────────────────┐
             │ User Can Now:        │
             │ - Sort by columns    │
             │ - Filter attempts    │
             │ - Export data        │
             │ - Drill into details │
             └──────────────────────┘
                        │
                        ▼
                      END
```

### Activity 3: Mistake Categorization Flow

```
┌─────────────────────────────────────────────────────┐
│     AI-DRIVEN MISTAKE CATEGORIZATION PROCESS       │
└─────────────────────────────────────────────────────┘

                      START
                        │
                        ▼
        ┌───────────────────────────┐
        │ Student Submits Answer    │
        │ (answer recorded)         │
        └───────────────────────────┘
                        │
                        ▼
             ┌──────────────────────┐
             │ Answer Correct?      │
             └──────────────────────┘
               /              \
              YES             NO
             /                 \
            ▼                   ▼
    ┌────────────┐    ┌──────────────────┐
    │ Set isCorrect  │ Set isCorrect=FALSE
    │ = TRUE         │ → Need Categorization
    │ → Done         │
    └────────────┘    └──────────────────┘
            │                  │
            │                  ▼
            │        ┌────────────────────┐
            │        │ Prepare Context:   │
            │        │ - Question text    │
            │        │ - Student answer   │
            │        │ - Correct answer   │
            │        │ - Chat history     │
            │        │ - Student confidence
            │        └────────────────────┘
            │                  │
            │                  ▼
            │        ┌────────────────────┐
            │        │ POST to Gemini API │
            │        │ (include prompt)   │
            │        │ "Categorize this   │
            │        │  student's mistake"
            │        └────────────────────┘
            │                  │
            │                  ▼
            │        ┌────────────────────┐
            │        │ Gemini Analyzes:   │
            │        │ - Concept grasp    │
            │        │ - Calc errors      │
            │        │ - Confidence bias  │
            │        │ - Effort level     │
            │        └────────────────────┘
            │                  │
            │                  ▼
            │        ┌────────────────────┐
            │        │ Return mistakeId:  │
            │        │ 1=Misunderstanding │
            │        │ 2=Calc Error       │
            │        │ 3=Careless         │
            │        │ 4=Incomplete       │
            │        │ 5=Wrong Method     │
            │        │ 6=Not Attempted    │
            │        │ 7=Guess            │
            │        └────────────────────┘
            │                  │
            │                  ▼
            │        ┌────────────────────┐
            │        │ UPDATE attempt rec │
            │        │ SET mistakeId=?    │
            │        └────────────────────┘
            │                  │
            └──────────┬───────┘
                       │
                       ▼
        ┌───────────────────────────┐
        │ Attempt Record Complete   │
        │ (all data saved)          │
        └───────────────────────────┘
                       │
                       ▼
                     END
```

### Activity 4: Quiz Creation Workflow

```
┌─────────────────────────────────────────────────────┐
│          INSTRUCTOR QUIZ CREATION FLOW              │
└─────────────────────────────────────────────────────┘

                      START
                        │
                        ▼
        ┌───────────────────────────┐
        │ Click "Create Quiz"       │
        │ (on Instructor Page)      │
        └───────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────┐
        │ Form: Select Course       │
        │ (courses owned by inst.)  │
        └───────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────┐
        │ Form: Enter Quiz Title    │
        │ (name the quiz)           │
        └───────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────┐
        │ Form: Enter System Prompt │
        │ (customize AI behavior)   │
        └───────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────┐
        │ Click "Create Quiz"       │
        │ (submit form)             │
        └───────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────┐
        │ POST /api/quiz            │
        │ (create quiz record)      │
        └───────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────┐
        │ Generate Access Code      │
        │ (random string)           │
        └───────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────┐
        │ INSERT quiz + code        │
        │ into database             │
        └───────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────┐
        │ Redirect to "Add Qs"      │
        │ page (quiz detail edit)   │
        └───────────────────────────┘
                        │
                        ▼
             ┌──────────────────────┐
             │ Loop: Add Questions? │
             └──────────────────────┘
               /              \
              YES              NO
             /                 \
            ▼                   ▼
    ┌─────────────┐    ┌──────────────┐
    │ Click "Add  │    │ Click "Save &
    │ Question"   │    │ Publish Quiz" 
    └─────────────┘    └──────────────┘
            │                  │
            ▼                  │
    ┌─────────────┐            │
    │ Choose from │            │
    │ question    │            │
    │ bank or     │            │
    │ create new  │            │
    └─────────────┘            │
            │                  │
            ▼                  │
    ┌─────────────┐            │
    │ Link to quiz│            │
    │ (via        │            │
    │ quiz_quest) │            │
    └─────────────┘            │
            │                  │
            └────────────┬─────┘
                         │
                         ▼
        ┌───────────────────────────┐
        │ Quiz Published            │
        │ (students can access)     │
        └───────────────────────────┘
                         │
                         ▼
                       END
```

---

## Data Models

### Entity-Relationship Diagram

```
user ──┬──────── role
       ├──────── session
       ├──────── question_attempt
       ├──────── chat_history
       └──────── course (as instructor)

course ──┬─────── quiz
         └─────── question

quiz ─────┬────── quiz_questions
          └────── question_attempt
                  chat_history

question ──┬───── quiz_questions
           ├───── question_attempt
           └───── chat_history

question_attempt ──── mistake_type

mistake_type (static lookup)

session (temporary)

chat_history (persistent)
```

### Core Tables Schema

#### question_attempt (Primary Analytics Table)

```
attemptId (PK, INT)
userId (FK, INT) → user.userId
questionId (FK, INT) → question.questionId
quizId (FK, INT) → quiz.quizId
givenAns (VARCHAR 500) - Student's answer
isCorrect (BOOLEAN) - Correctness
mistakeId (FK, INT) → mistake_type.mistakeId
numMsgs (INT) - AI chat messages used
selfConfidence (INT) - 0=Low, 1=Medium, 2=High
dateTime (TIMESTAMP) - When submitted

INDEXES: (userId, quizId), (questionId), (mistakeId)
```

#### quiz_questions (Junction)

```
quizId (FK, PK) → quiz.quizId
questionId (FK, PK) → question.questionId
ORDER BY: insertion order
```

#### chat_history (Temporal)

```
chatId (PK, INT)
userId (FK, INT) → user.userId
quizId (FK, INT) → quiz.quizId
questionId (FK, INT) → question.questionId
messages (LONGTEXT) - JSON array
lastUpdated (TIMESTAMP ON UPDATE)

INDEXES: (userId, quizId, questionId)
```

---

## API Contract

### Quiz Endpoints

**POST /api/quiz** - Create quiz
```json
Request: {
  "title": "Algorithms Final",
  "prompt": "You are a tutoring assistant...",
  "courseId": 5
}
Response: { "quizId": 12, "accessCode": "ABC123XYZ" }
```

**GET /api/quiz/:quizId/:accessCode** - Fetch quiz + questions
```json
Response: {
  "quiz": { "quizId": 12, "title": "...", "prompt": "..." },
  "questions": [
    { "questionId": 47, "title": "...", "options": [...] },
    ...
  ]
}
```

### Attempt Endpoints

**POST /api/attempt/submit** - Submit single answer
```json
Request: {
  "userId": 1,
  "questionId": 47,
  "quizId": 12,
  "givenAns": "B",
  "selfConfidence": 1,
  "numMsgs": 2
}
Response: {
  "correct": false,
  "mistakeType": "Misunderstanding",
  "feedback": "..."
}
```

### Analytics Endpoints

**GET /api/analytic/metrics** - Platform overview
```json
Response: {
  "totals": {
    "users": 245,
    "students": 198,
    "instructors": 47,
    "quizzes": 23,
    "courses": 8
  }
}
```

**GET /api/analytic/quiz/:quizId** - Quiz KPIs
```json
Response: {
  "totalAttempts": 324,
  "averageScore": 7.2,
  "completionRate": 0.76,
  "avgAIMessages": 0.87
}
```

---

## UI/UX Design Patterns

### Pattern 1: KPI Card Grid

```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│   Total     │  Students   │ Instructors │   Quizzes   │   Courses   │
│   Users     │             │             │             │             │
│   245       │   198       │    47       │    23       │     8       │
│   ↑ 12%     │   ↑ 8%      │   ↑ 5%      │   ↑ 15%     │   ↓ 2%      │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

**Design Principles:**
- Indigo 50 background (light)
- Large bold numbers for quick scanning
- Trend arrow (↑↓) for context
- Tooltip on hover for more detail

### Pattern 2: Data Grid with Sorting

```
┌──────────────────────────────────────────────────────────┐
│ [Sort Column ▼] [Order ▼] [Search Box]                  │
├──────────────────────────────────────────────────────────┤
│ Q# │ Title (sortable) │ Correct (color) │ AI (numeric) │
├──────────────────────────────────────────────────────────┤
│ 1  │ What is...      │ 87% 🟢          │ 0.45         │
│ 2  │ Explain...      │ 52% 🟡          │ 1.23         │
│ 3  │ Calculate...    │ 31% 🔴          │ 2.15         │
└──────────────────────────────────────────────────────────┘
```

**Design Principles:**
- Column headers clickable for sort
- Striped rows (white/gray alternating)
- Hover effects (bg-indigo-50)
- Color-coded values (red/yellow/green)

### Pattern 3: Filter Interface

```
┌─────────────────────────────────────────┐
│ FILTER OPTIONS                          │
├─────────────────────────────────────────┤
│ Student:    [Select Student ▼]          │
│ Quiz:       [Select Quiz ▼]             │
│ Question:   [Select Question ▼]         │
│ Correct:    [All ▼] (✓/✗/Any)           │
│                                         │
│ [Search] [Reset] [Apply Filters]       │
└─────────────────────────────────────────┘
```

**Design Principles:**
- Dropdown menus populate from DB
- Multiple filters combinable
- Reset button clears all
- Apply button triggers query

### Pattern 4: Modal/Dialog

```
┌─────────────────────────────────────────────────────┐
│ ╳ Question Details                                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Question: "What is the time complexity...?"        │
│ Correct Answer: "O(n log n)"                       │
│ Other Options: ["O(n²)", "O(n)", "O(log n)"]       │
│                                                     │
│ % Correct: 67% 🟡                                  │
│ Avg AI Messages: 1.23                              │
│ Avg Confidence: 1.34 / 2.0                         │
│                                                     │
│ Mistake Distribution:                              │
│ ├─ Misunderstanding: 45%                          │
│ ├─ Calculation Error: 28%                         │
│ └─ Careless: 27%                                   │
│                                                     │
│ [Close]                                             │
└─────────────────────────────────────────────────────┘
```

**Design Principles:**
- Overlay with semi-transparent background
- Close button (X) in top-right
- Organized sections with labels
- Scrollable if content exceeds viewport

---

## User Stories & Acceptance Criteria

### User Story 1: Student Attempts Quiz

**As a** student,  
**I want to** take a quiz and receive feedback,  
**So that** I can assess my understanding.

**Acceptance Criteria:**
- [ ] Can enter quiz ID and access code
- [ ] Quiz loads with all questions
- [ ] Can answer and submit each question
- [ ] Receives immediate ✓/✗ feedback
- [ ] Can use AI chat for help
- [ ] Can view final results and summary
- [ ] Can retry quiz

### User Story 2: Instructor Reviews Analytics

**As an** instructor,  
**I want to** view detailed analytics on student performance,  
**So that** I can identify struggling students and adjust instruction.

**Acceptance Criteria:**
- [ ] Dashboard shows platform metrics
- [ ] Can select course and quiz
- [ ] Sees 4 KPI cards per quiz
- [ ] Question insights table shows all metrics
- [ ] Can sort by any column
- [ ] Color-coded difficulty indicators
- [ ] Can drill into individual questions
- [ ] Can filter by student/quiz/question
- [ ] Can export data

### User Story 3: Identify Misconceptions

**As an** instructor,  
**I want to** see what types of mistakes students made,  
**So that** I can provide targeted re-instruction.

**Acceptance Criteria:**
- [ ] Mistake types clearly labeled
- [ ] Distribution shown per question
- [ ] Can see specific student mistakes
- [ ] AI categorization appears accurate
- [ ] Mistakes help inform instruction

---

## Conclusion

This detailed design document provides:

✅ **Persona-Based Design**: Solutions tailored to 4 key user types  
✅ **Visual Workflows**: Process flows showing user journeys  
✅ **Technical Sequences**: Detailed interaction diagrams between components  
✅ **Activity Diagrams**: Step-by-step processes (submission, analytics load, categorization)  
✅ **Data Models**: Complete ER diagram and schema  
✅ **API Contract**: Input/output specifications  
✅ **UI Patterns**: Reusable design components  
✅ **User Stories**: Requirements from user perspective

The system is designed to support the complete learning lifecycle: from student quiz attempt through instructor analysis to data-driven decision-making.

---

**Document Version**: 1.0  
**Last Updated**: December 10, 2025  
**Project**: SensAI Capstone
