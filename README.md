# SensAI
https://github.com/ktagdiwala/SensAI

## Project Overview

**SensAI** is an intelligent online learning platform that transforms how students engage with quiz-based assessments through AI-powered guidance and comprehensive instructor analytics. Unlike traditional quiz platforms, SensAI provides real-time feedback and personalized learning support.

### Key Features

**For Students:**
- **Instant Feedback on Wrong Answers**: When a student submits an incorrect answer, an AI-powered mistake identifier provides a brief explanation of why the answer was wrong
- **Intelligent Tutoring with SensAI Chatbot**: An AI assistant (powered by Google Gemini) helps guide students through problems using Socratic methods. Instructors can customize SensAI's behavior with specific prompts and hints to tailor the learning experience
- **Adaptive Guidance**: SensAI provides leading questions and clarifications to help students discover the right approach, rather than simply giving away answers. If students go off-topic, they're gently redirected to the quiz
- **Chat History and Downloadable Records**: All conversations with SensAI can be downloaded per-question or for the entire quiz, creating a study reference. Chat history is automatically saved if students leave and return to the quiz
- **Mastery Summary**: After submitting a quiz, students receive a personalized summary highlighting which concepts they've mastered and which may need review
- **Self-Confidence Tracking**: Measures student confidence levels as they attempt questions to monitor learning progress

**For Instructors:**
- **Flexible Quiz Management**: Create and edit quizzes from existing questions or design new ones with customizable content and system prompts
- **Instructor-Customized AI Behavior**: Define quiz-specific and question-specific prompts to calibrate how SensAI guides students and what hints to provide
- **Advanced Analytics Dashboard**: Transform student interactions into meaningful metrics with per-question analytics that identify which concepts students struggle with most
- **Data-Driven Insights**: Pinpoint questions where students frequently request SensAI assistance, helping instructors focus class time on challenging topics

**Technical Excellence:**
- **Secure Architecture**: Role-Based Access Control (RBAC) for route protection ensures secure access for students and instructors
- **Reliability**: Implements retry logic, comprehensive error handling, and stability-focused design
- **Thoroughly Tested**: Unit-tested components and end-to-end tests validate communication and functionality across all system parts

The application features a React/TypeScript frontend and Node.js/Express backend with MySQL database storage.

---

## Testing Instructions

Follow these steps to set up and test the SensAI project locally:

### Prerequisites

Before you begin, ensure you have the following installed:
- Node.js and npm
- MySQL Workbench or MySQL Server
- A text editor or IDE (VS Code recommended)
- Git (optional, for cloning)

### Step 1: Set Up the Database

1. **Start MySQL**: Open MySQL Workbench and connect to your local MySQL instance
2. **Run the schema script**: 
   - Open `database/SensAI_Schema_Script.sql`
   - Execute the script in MySQL Workbench
3. **Run the insert statements**:
   - Open `database/SensAI_Insert_Statements.sql`
   - Execute the script in MySQL Workbench
4. **Run the question attempts**:
   - Open `database/question_attempts.sql`
   - Execute the script in MySQL Workbench

These scripts will create all necessary tables and populate them with sample data for testing.

### Step 2: Configure the Backend Environment

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install backend dependencies**:
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the `backend` directory with the following variables:
   ```
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASS=your_mysql_password
   PORT=3000
   SALT_ROUNDS=10
   FRONTEND_URL=http://localhost:5173
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   **Note**: Replace `your_db_user` and `your_mysql_password` with your actual MySQL user and password. Also replace `your_gemini_api_key_here` with the API key you will obtain in the next step.

### Step 3: Get a Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/api-keys)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Paste it into the `GEMINI_API_KEY` variable in your `.env` file

**Important**: The free tier of the Gemini API has rate limits. If you exceed these limits during testing, some quiz-taking features on the student frontend (such as the SensAI chatbot, mistake analysis, and quiz summary) may not work. For more information about rate limits, see the [Gemini API Rate Limits documentation](https://ai.google.dev/gemini-api/docs/rate-limits). 

**Workaround**: If you hit the rate limit for the default model, you can switch to a different Gemini model by updating the `gemini_model` constant in `backend/utils/geminiUtils.js`. For example, you can try `"gemini-2.5-flash-lite"` or another available model. For production use or heavy testing, consider upgrading to a paid plan.

### Step 4: Start the Backend

From the `backend` directory, run:
```bash
node app.js
```

You should see a message indicating the server is running on port 3000.

### Step 5: Set Up and Start the Frontend

1. **In a new terminal, navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

The frontend will typically run on `http://localhost:5173`.

### Step 6: Access the Application

Once both the backend and frontend are running, open your web browser and navigate to:
```
http://localhost:5173
```

You can now test the application by logging in with the sample credentials from the database or creating a new account.

### Troubleshooting

- **Database connection errors**: Verify that MySQL is running and your `.env` credentials are correct
- **API key errors**: Ensure your `GEMINI_API_KEY` is valid and has the necessary permissions
- **Frontend not loading**: Make sure the backend is running before trying to access the frontend
- **Port conflicts**: If ports 3000 or 5173 are in use, update the port numbers in your configuration

---

## Running Tests

### Backend Unit Tests

The backend uses Jest for unit testing and API endpoint testing.

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Run all tests**:
   ```bash
   npm test
   ```

3. **Run tests in watch mode** (automatically re-run on file changes):
   ```bash
   npm run test:watch
   ```

4. **Run tests with coverage report**:
   ```bash
   npm run test:coverage
   ```

Test files are located in `backend/test/` directory.

### Frontend Unit Tests

The frontend uses Vitest for unit testing React components.

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Run all unit tests**:
   ```bash
   npm run test:unit
   ```

Unit test files are located in `frontend/test/` directory with `.test.tsx` extensions.

### Frontend End-to-End (E2E) Tests

The frontend uses Mocha and Selenium WebDriver for end-to-end testing.

1. **Ensure both backend and frontend are running** (see Testing Instructions above)

2. **In a new terminal, navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

3. **Install Selenium WebDriver** (if not already installed):
   Selenium WebDriver should be automatically installed when you run `npm install` in the frontend directory. If you need to install it separately or update it, you can run:
   ```bash
   npm install selenium-webdriver
   ```
   
   For more information about Selenium WebDriver, visit: [Selenium WebDriver Documentation](https://www.selenium.dev/documentation/webdriver/)

4. **Run E2E tests**:
   ```bash
   npm run test:e2e
   ```

E2E test files are located in `frontend/test/` directory with `.spec.cjs` extensions.

**Note**: E2E tests require the application to be fully running (both backend and frontend servers) to interact with the live application.

---

CSUMB CST499 Capstone Project
