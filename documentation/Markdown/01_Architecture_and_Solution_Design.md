# SensAI: Architecture and Solution Design

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Pattern](#architecture-pattern)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Data Flow](#data-flow)
6. [Database Schema](#database-schema)
7. [API Design](#api-design)
8. [Security Architecture](#security-architecture)
9. [Deployment Architecture](#deployment-architecture)

---

## System Overview

**SensAI** is an intelligent tutoring system that leverages AI-powered chat assistance to guide students through quiz attempts. The platform enables instructors to create and manage quizzes while providing students with contextual AI guidance to improve their learning outcomes.

### Key Features
- **Student Quiz System**: Answer multiple-choice questions with optional AI guidance
- **AI Chat Assistant**: Context-aware tutoring powered by Google Gemini API
- **Mistake Identification**: Automatic categorization of student errors
- **Analytics Dashboard**: Comprehensive instructor insights into student performance
- **Session Management**: Secure user authentication and session handling
- **Chat History**: Persistent storage and retrieval of student-AI interactions

---

## Architecture Pattern

SensAI follows a **three-tier client-server architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│          (React + TypeScript + Tailwind CSS)            │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Homepage │ Student Page │ Quiz Page │ Analytics  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↓ HTTP/REST
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                     │
│              (Express.js + Node.js Backend)              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Auth Routes │ Quiz Routes │ Attempt Routes │ AI │  │
│  │             │ Question Routes │ Analytics Routes   │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Middleware Layer (Sessions, Auth, CORS)         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↓ SQL
┌─────────────────────────────────────────────────────────┐
│                    DATA LAYER                            │
│          (MySQL Database + Google Gemini API)           │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Users │ Quizzes │ Questions │ Attempts │ Sessions│  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Design Principles
- **Separation of Concerns**: Each layer has distinct responsibilities
- **RESTful API**: Standard HTTP methods for resource operations
- **Stateless Server**: Sessions managed via secure cookies
- **Lazy Loading**: Circular dependency prevention (e.g., geminiUtils import in attemptUtils)

---

## Technology Stack

### Frontend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | React 18+ | UI library with hooks |
| **Language** | TypeScript | Type-safe development |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Build Tool** | Vite | Fast bundling and HMR |
| **Routing** | React Router v6 | Client-side navigation |
| **PDF Generation** | jsPDF | Chat history export |
| **State Management** | React Hooks (useState, useContext) | Local state management |
| **Testing** | Vitest + Testing Library | Unit and component tests |
| **E2E Testing** | Selenium WebDriver | Browser automation testing |

### Backend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | Express.js | HTTP server and routing |
| **Runtime** | Node.js | JavaScript execution |
| **Language** | JavaScript (ES6+) | Server-side logic |
| **Database** | MySQL | Relational data storage |
| **Connection Pool** | mysql2/promise | Async database queries |
| **Authentication** | bcrypt | Password hashing |
| **Encryption** | crypto (AES-256-GCM) | API key encryption |
| **AI Integration** | @google/generative-ai | Gemini API client |
| **Session Management** | Custom (cookies) | User session handling |
| **Environment Config** | dotenv | Environment variables |
| **Testing** | Jest | Unit test framework |

### External Services
| Service | Purpose | Integration |
|---------|---------|------------|
| **Google Gemini API** | AI chat and mistake identification | `/api/ai/*` routes |
| **MySQL Database** | Data persistence | Cloud or local instance |

---

## System Components

### 1. Frontend Components Structure

#### Pages (Routes)
- **`Homepage.tsx`**: Authentication entry point (Sign In/Sign Up modals)
- **`StudentPage.tsx`**: Quiz selection and attempt history
- **`QuizPage.tsx`**: Main quiz interface with chat and submissions
- **`InstructorPage.tsx`**: Quiz management for instructors
- **`QuizCreatePage.tsx`**: Quiz creation/editing interface
- **`InstructorAnalyticsPage.tsx`**: Performance analytics dashboard
- **`AccountPage.tsx`**: User profile management

#### Reusable Components
- **`ChatComponent.tsx`**: AI chat interface with message history
- **`QuizCardComponent.tsx`**: Individual question display
- **`SelfConfidence.tsx`**: Confidence rating widget (Low/Medium/High)
- **`QuizSubmissionsInstructor.tsx`**: Attempt lookup and filtering
- **`QuizSubmissions.tsx`**: Student submission history
- **`SignInComponent.tsx`**: Login form
- **`SignUpComponent.tsx`**: Registration form
- **`nav.tsx`**: Navigation bar with role-based links

#### Utilities & Context
- **`AuthContext.tsx`**: Global user state and authentication
- **`useQuizQuestions.ts`**: Custom hook for fetching quiz questions
- **`questionMapping.ts`**: Utility for mapping question data

### 2. Backend Route Structure

```
Routes (Express Routers)
├── authRoutes.js          # POST /login, POST /logout, POST /register
├── quizRoutes.js          # GET/POST quizzes, quiz details, access verification
├── questionRoutes.js      # GET/POST/PUT/DELETE questions
├── attemptRoutes.js       # POST submit answer, GET attempt history, GET student list
├── aiRoutes.js            # POST get chat response, POST get quiz summary
├── chatRoutes.js          # POST save chat history
├── analyticRoutes.js      # GET metrics, quiz stats, question insights
├── userRoutes.js          # GET/PUT user profile, API key management
└── testRoutes.js          # POST test database connection
```

### 3. Backend Utilities

| Module | Responsibility |
|--------|-----------------|
| **`dbConnection.js`** | MySQL pool initialization and connection management |
| **`sessionMiddleware.js`** | Session validation and role-based route protection |
| **`attemptUtils.js`** | Question attempt recording, answer checking, retrieval |
| **`geminiUtils.js`** | Gemini API integration (chat, mistake ID, summaries) |
| **`quizUtils.js`** | Quiz CRUD operations, access code generation |
| **`questionUtils.js`** | Question CRUD, option shuffling, quiz assignment |
| **`userUtils.js`** | Password hashing, API key encryption/decryption |
| **`analyticUtils.js`** | Platform metrics, quiz KPIs, question insights |
| **`sessionUtils.js`** | Session creation, validation, deletion |
| **`dbQueries.js`** | Reusable database queries (mistake types, correct answers) |

---

## Data Flow

### 1. Student Quiz Attempt Flow

```
┌─────────────────────┐
│  Student Page       │
│  Enter Quiz ID +    │
│  Password           │
└──────────┬──────────┘
           │ POST /api/quiz/:quizId/:accessCode
           ↓
┌─────────────────────┐
│ Backend Validation  │
│ Check access code   │
└──────────┬──────────┘
           │ JSON response: quiz details
           ↓
┌─────────────────────┐
│ Quiz Page Loads     │
│ Fetch questions     │
│ GET /api/question/  │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│ Student Answers Q   │
│ Opens Chat (opt)    │
└──────────┬──────────┘
           │ POST /api/attempt/submit
           ↓
┌──────────────────────────┐
│ Backend Processing       │
│ 1. Check answer          │
│ 2. Store attempt record  │
│ 3. Identify mistake (AI) │
│ 4. Return feedback       │
└──────────┬───────────────┘
           │
           ↓
┌────────────────────┐
│ Display Feedback   │
│ Allow Chat/Submit  │
└────────────────────┘
```

### 2. AI Chat Flow

```
┌──────────────────┐
│ Student Message  │
│ "How do I..."    │
└────────┬─────────┘
         │ POST /api/ai/chat
         ↓
┌──────────────────────────────────┐
│ Backend                          │
│ 1. Load question context         │
│ 2. Load chat history             │
│ 3. Call Gemini API with prompt   │
└────────┬─────────────────────────┘
         │ Stream response
         ↓
┌──────────────────┐
│ Display AI Reply │
│ in Chat Box      │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│ POST /api/chat   │
│ Save to DB       │
└──────────────────┘
```

### 3. Quiz Submission Flow

```
┌──────────────────────┐
│ Click Submit Quiz    │
│ Confirm dialog       │
└────────┬─────────────┘
         │ POST /api/attempt/submit (all answers)
         ↓
┌────────────────────────────────────┐
│ Backend Batch Processing           │
│ For each question:                 │
│ 1. Record final attempt            │
│ 2. Calculate score                 │
│ 3. Identify mistakes for wrong ones│
└────────┬───────────────────────────┘
         │ JSON: results, summary
         ↓
┌──────────────────────┐
│ Display Results      │
│ Score breakdown      │
│ Get AI summary       │
└────────┬─────────────┘
         │ POST /api/ai/summary
         ↓
┌──────────────────────┐
│ Show Summary Text    │
│ Performance feedback │
└──────────────────────┘
```

---

## Database Schema

### Core Tables

#### `user`
```sql
CREATE TABLE user (
  userId INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  roleId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (roleId) REFERENCES role(roleId)
);
```

#### `role`
```sql
CREATE TABLE role (
  roleId INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL  -- 'Student', 'Instructor'
);
```

#### `quiz`
```sql
CREATE TABLE quiz (
  quizId INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  accessCode VARCHAR(255) UNIQUE NOT NULL,
  prompt TEXT,  -- System instruction for AI
  courseId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (courseId) REFERENCES course(courseId)
);
```

#### `course`
```sql
CREATE TABLE course (
  courseId INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  instructorId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instructorId) REFERENCES user(userId)
);
```

#### `question`
```sql
CREATE TABLE question (
  questionId INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  correctAns VARCHAR(500) NOT NULL,
  otherAns TEXT,  -- JSON array of wrong answers
  prompt TEXT,    -- Optional guidance
  courseId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (courseId) REFERENCES course(courseId)
);
```

#### `quiz_questions`
```sql
CREATE TABLE quiz_questions (
  quizId INT NOT NULL,
  questionId INT NOT NULL,
  PRIMARY KEY (quizId, questionId),
  FOREIGN KEY (quizId) REFERENCES quiz(quizId),
  FOREIGN KEY (questionId) REFERENCES question(questionId)
);
```

#### `question_attempt`
```sql
CREATE TABLE question_attempt (
  attemptId INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  questionId INT NOT NULL,
  quizId INT NOT NULL,
  givenAns VARCHAR(500),
  isCorrect BOOLEAN,
  mistakeId INT,
  numMsgs INT DEFAULT 0,
  selfConfidence INT,  -- 0=Low, 1=Medium, 2=High
  dateTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES user(userId),
  FOREIGN KEY (questionId) REFERENCES question(questionId),
  FOREIGN KEY (quizId) REFERENCES quiz(quizId),
  FOREIGN KEY (mistakeId) REFERENCES mistake_type(mistakeId)
);
```

#### `mistake_type`
```sql
CREATE TABLE mistake_type (
  mistakeId INT PRIMARY KEY AUTO_INCREMENT,
  label VARCHAR(100) NOT NULL,
  description TEXT
  -- Examples: 'Misunderstanding', 'Calculation Error', 'No Attempt', etc.
);
```

#### `chat_history`
```sql
CREATE TABLE chat_history (
  chatId INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  quizId INT NOT NULL,
  questionId INT NOT NULL,
  messages LONGTEXT NOT NULL,  -- JSON array
  lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES user(userId),
  FOREIGN KEY (quizId) REFERENCES quiz(quizId),
  FOREIGN KEY (questionId) REFERENCES question(questionId)
);
```

#### `session`
```sql
CREATE TABLE session (
  sessionId VARCHAR(255) PRIMARY KEY,
  userId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiresAt TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(userId)
);
```

#### `user_api_key` (Optional - for per-user Gemini keys)
```sql
CREATE TABLE user_api_key (
  userId INT PRIMARY KEY,
  encryptedApiKey TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(userId)
);
```

### Relationships Diagram
```
user ─────┐
          ├──→ role
          ├──→ course (as instructor)
          ├──→ question_attempt
          ├──→ session
          └──→ chat_history

course ───→ quiz
        ├──→ question

quiz ─────→ quiz_questions ───→ question

question_attempt ───→ mistake_type
```

---

## API Design

### Authentication Endpoints

#### POST `/api/register`
Register a new user (student or instructor)
```
Request: { name, email, password, role }
Response: { userId, message }
```

#### POST `/api/login`
User login with email and password
```
Request: { email, password, role }
Response: { userId, userRole, redirectUrl }
Cookie: sessionId
```

#### POST `/api/logout`
Invalidate user session
```
Response: { message }
```

### Quiz Endpoints

#### GET `/api/quiz/:quizId/:accessCode`
Retrieve quiz details and questions (student access)
```
Response: { 
  quiz: { quizId, title, prompt },
  questions: [{ questionId, title, options }]
}
```

#### GET `/api/quiz` (Instructor)
Retrieve all quizzes for instructor
```
Response: { quizzes: [...] }
```

#### POST `/api/quiz`
Create new quiz
```
Request: { title, prompt, courseId }
Response: { quizId, accessCode }
```

### Attempt Endpoints

#### POST `/api/attempt/submit`
Submit a single question answer
```
Request: {
  userId, questionId, quizId,
  givenAns, selfConfidence,
  numMsgs, hasCheckedAnswer
}
Response: { correct, explanation, mistakeType }
```

#### POST `/api/attempt/submit-all`
Submit all quiz answers at once
```
Request: {
  quizId, userId, dateTime,
  questionArray: [{ questionId, givenAns, numMsgs, ... }]
}
Response: { results, summary, quizSummary }
```

#### GET `/api/attempt/student`
Get all attempts by current student
```
Response: { attempts: [...] }
```

#### GET `/api/attempt/quiz/:quizId`
Get all attempts for a specific quiz (instructor)
```
Response: { attempts: [...] }
```

### AI Endpoints

#### POST `/api/ai/chat`
Get AI response for student message
```
Request: {
  userId, studentMessage, quizId,
  questionId, chatHistory
}
Response: { message: "AI response text" }
```

#### POST `/api/ai/summary`
Generate quiz performance summary
```
Request: { quizResult, userId }
Response: { summary: "Personalized feedback..." }
```

### Analytics Endpoints

#### GET `/api/analytic/metrics`
Get platform-wide metrics (instructor)
```
Response: {
  totals: { user_count, student_count, ... },
  questionsByQuiz: [...],
  totalAttempts: [...]
}
```

#### GET `/api/analytic/quiz/:quizId`
Get KPIs for specific quiz
```
Response: {
  totalAttempts, averageScore,
  completionRate, avgAIMessages
}
```

#### GET `/api/analytic/question/:questionId`
Get per-question insights
```
Response: {
  title, percent_correct,
  avg_msgs, mistakeBreakdown
}
```

---

## Security Architecture

### 1. Authentication & Authorization

**Session-Based Authentication**
- Sessions stored in database with expiration
- Secure HTTP-only cookies (no JS access)
- Role-based access control (RBAC)

**Password Security**
- bcrypt hashing with configurable salt rounds
- Minimum password complexity recommended
- No plaintext storage

**Middleware Protection**
```javascript
// Verify session and role
verifySession middleware → verifySessionStudent/verifySessionInstructor
```

### 2. Data Encryption

**API Key Protection**
- User-provided Gemini API keys encrypted with AES-256-GCM
- Encryption key stored in environment variables
- Decrypted only when needed for API calls

**Sensitive Data**
- No API keys logged or exposed in responses
- Database credentials in `.env` file (not committed)

### 3. API Security

**CORS Configuration**
```javascript
// Only allow frontend origin
cors: { origin: process.env.FRONTEND_URL, credentials: true }
```

**Input Validation**
- Validate user inputs before database operations
- Prevent SQL injection via parameterized queries
- Trim and sanitize string inputs

**Rate Limiting** (Recommended)
- Implement for login attempts
- Limit API calls per user
- Protect against brute-force attacks

### 4. Database Security

**Parameterized Queries**
```javascript
const [rows] = await pool.query(sql, [userId, quizId]);
// Prevents SQL injection
```

**Least Privilege**
- Database user with minimal required permissions
- Separate read/write credentials (optional)

**Backup & Recovery**
- Regular database backups
- Transaction support for data consistency

---

## Deployment Architecture

### Development Environment
```
Local Machine
├── Frontend (Vite dev server on :5173)
├── Backend (Node.js on :3001)
└── Database (MySQL local or remote)
```

### Production Deployment (Recommended)

#### Frontend Deployment
- **Build**: `npm run build` → static files in `dist/`
- **Hosting**: 
  - Netlify / Vercel (recommended for React)
  - AWS S3 + CloudFront
  - Docker container
- **Environment**: Production API URL in `.env.production`

#### Backend Deployment
- **Host**: 
  - Heroku
  - AWS EC2 / ECS
  - DigitalOcean
  - Docker container
- **Process Manager**: PM2 or systemd
- **Environment Variables**: `.env` with production secrets
- **Reverse Proxy**: Nginx or Apache for SSL/TLS

#### Database
- **MySQL Hosting**:
  - AWS RDS MySQL
  - DigitalOcean Managed MySQL
  - Self-hosted with backups
- **Connection**: Secure credentials, SSL/TLS for remote connections

#### External Services
- **Google Gemini API**
  - API key stored securely in backend environment
  - Rate limiting per quota
  - Fallback strategies for failures

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] HTTPS/SSL enabled
- [ ] CORS properly configured
- [ ] Session secret randomized
- [ ] Encryption key generated and stored
- [ ] Logging configured
- [ ] Error handling and monitoring setup
- [ ] Database backups automated
- [ ] CI/CD pipeline (GitHub Actions recommended)

### Monitoring & Logging
- **Backend Logs**: Console output, file logging (optional)
- **Error Tracking**: Sentry or similar service
- **Performance Monitoring**: New Relic or DataDog
- **Uptime Monitoring**: Pingdom or UptimeRobot

---

## Summary

SensAI follows a modern, scalable three-tier architecture that separates concerns between the presentation, application, and data layers. The design prioritizes:

✅ **User Experience**: Real-time AI assistance and intuitive UI  
✅ **Security**: Session-based auth, encrypted keys, parameterized queries  
✅ **Scalability**: RESTful APIs, database connection pooling  
✅ **Maintainability**: Modular code organization, clear separation of concerns  
✅ **Extensibility**: Easy to add features (new routes, utilities, components)

The platform is production-ready with proper error handling, validation, and role-based access control.
