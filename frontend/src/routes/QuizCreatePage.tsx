import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QuizCardInstructor from "../components/QuizCardInstructorComponent";
import QuizQuestionInstructor from "../components/QuizQuestionComponentInstructor";
import SearchIcon from "../assets/Search.svg";
import { useQuizQuestions } from "../hooks/useQuizQuestions";

// ========================================
// UI CONFIG: Tabs and option interfaces
// ========================================
const tabs = [
  { id: "details", label: "Details" },
  { id: "questions", label: "Questions" },
];

interface CourseOption {
  id: number;
  title: string;
}

interface CourseQuestionPreview {
  questionId: number;
  title: string;
  correctAns: string;
  otherAns: string;
  prompt: string | null;
  courseId: number;
}

const COURSE_LIST_ENDPOINT = "http://localhost:3000/api/quiz/courses";

export default function QuizCreatePage() {
  // ========================================
  // ROUTER HOOKS
  // - quizId indicates edit vs create mode
  // ========================================
  const { quizId } = useParams<{ quizId?: string }>();
  const navigate = useNavigate();

  // ========================================
  // QUIZ FORM STATE (DETAILS TAB)
  // - quizName, systemPrompt, accessCode, courseId
  // ========================================
  const [activeTab, setActiveTab] = useState<"details" | "questions">("details");
  const [quizName, setQuizName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [courseId, setCourseId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ========================================
  // QUESTIONS STATE (QUESTIONS TAB)
  // - managed via custom hook to isolate CRUD logic
  // ========================================
  const {
    questions,
    questionsError,
    isLoadingQuestions,
    nextQuestionId,
    isQuestionModalOpen,
    editingQuestion,
    modalQuestionNumber,
    openNewQuestionModal,
    openEditQuestionModal,
    closeQuestionModal,
    handleDeleteQuestion,
    handleQuestionSave,
  } = useQuizQuestions(quizId, courseId);

  // ========================================
  // COURSE DROPDOWN + SEARCH STATE
  // - course list from backend
  // - search term and errors
  // ========================================
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [isCoursesLoading, setCoursesLoading] = useState(false);
  const [courseListError, setCourseListError] = useState<string | null>(null);
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [courseQuestionResults, setCourseQuestionResults] = useState<CourseQuestionPreview[]>([]);
  const [isCourseQuestionsLoading, setCourseQuestionsLoading] = useState(false);
  const [courseQuestionsError, setCourseQuestionsError] = useState<string | null>(null);

  const selectedCourseTitle = useMemo(() => {
    const selected = courses.find((course) => String(course.id) === courseId);
    return selected ? selected.title : "";
  }, [courses, courseId]);

  // ========================================
  // EFFECT: Lock/unlock body scroll when question modal is open
  // ========================================
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isQuestionModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isQuestionModalOpen]);

  // ========================================
  // DERIVED STATE: Filtered list of courses by search term
  // ========================================
  const visibleCourses = useMemo(() => {
    const query = courseSearchTerm.trim().toLowerCase();
    if (!query) {
      return courses;
    }
    return courses.filter((course) =>
      course.title.toLowerCase().includes(query),
    );
  }, [courses, courseSearchTerm]);

  // ========================================
  // HANDLER: Save quiz details (create or update)
  // - sends only quiz metadata, not questions
  // ========================================
  async function handleSaveQuiz(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const body = {
        title: quizName.trim(),
        prompt: systemPrompt.trim(),
        accessCode: accessCode.trim(),
        courseId: courseId ? Number(courseId) : null,
      };
      const endpoint = quizId
        ? `http://localhost:3000/api/quiz/update/${quizId}`
        : "http://localhost:3000/api/quiz/create";
      const method = quizId ? "PUT" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`Save failed with status ${response.status}`);
      }

      // NOTE: Questions are persisted via separate question endpoints
      navigate("/instructors");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }

  // ========================================
  // EFFECT: Load quiz details when editing existing quiz
  // - Populates form fields
  // ========================================
  useEffect(() => {
    if (!quizId) {
      setQuizName("");
      setSystemPrompt("");
      setAccessCode("");
      setCourseId("");
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/quiz/id/${quizId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const data = await response.json();
        if (!isMounted) return;

        const quiz = data.quiz ?? {};
        setQuizName(quiz.title ?? "");
        setSystemPrompt(quiz.prompt ?? "");
        setAccessCode(quiz.accessCode ?? "");
        setCourseId(quiz.courseId ? String(quiz.courseId) : "");
      } catch (error) {
        if (!isMounted) return;
        console.error(error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [quizId]);

  // ========================================
  // EFFECT: Load course list for dropdown + search
  // ========================================
  useEffect(() => {
    let isActive = true;
    setCoursesLoading(true);
    setCourseListError(null);

    fetch(COURSE_LIST_ENDPOINT, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }
        const payload = await response.json();
        const rawCourses: { courseId: number; title: string }[] =
          Array.isArray(payload?.courses) ? payload.courses : [];

        const normalized: CourseOption[] = rawCourses.map((course) => ({
          id: course.courseId,
          title: course.title,
        }));

        if (isActive) {
          setCourses(normalized);
        }
      })
      .catch((error: unknown) => {
        console.error(error);
        if (isActive) {
          setCourseListError("Unable to load courses.");
          setCourses([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setCoursesLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  // ========================================
  // HANDLER: Find questions for the selected course
  // ========================================
  async function handleFindQuestions() {
    if (!courseId) {
      console.warn("[QuizCreatePage] Select a course before fetching its questions.");
      return;
    }

    setCourseQuestionsLoading(true);
    setCourseQuestionsError(null);

    try {
      const endpoint = `http://localhost:3000/api/question/course/${courseId}`;
      const response = await fetch(endpoint, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Fetch failed with status ${response.status}`);
      }
      const payload = await response.json();
      const normalized: CourseQuestionPreview[] = Array.isArray(payload?.questions)
        ? payload.questions.map((question: Partial<CourseQuestionPreview>) => ({
            questionId: Number(question.questionId),
            title: question.title ?? "Untitled Question",
            correctAns: question.correctAns ?? "",
            otherAns: question.otherAns ?? "",
            prompt:
              question.prompt === null || question.prompt === undefined || question.prompt === "null"
                ? null
                : String(question.prompt),
            courseId: Number(question.courseId ?? courseId),
          }))
        : [];
      setCourseQuestionResults(normalized);
      console.log("[QuizCreatePage] Course question response:", normalized);
    } catch (error) {
      console.error("[QuizCreatePage] Unable to fetch course questions.", error);
      setCourseQuestionResults([]);
      setCourseQuestionsError("Unable to load course questions for this course.");
    } finally {
      setCourseQuestionsLoading(false);
    }
  }

  // ========================================
  // RENDER: Page layout and content
  // - Top nav tabs
  // - Details form
  // - Questions list + actions
  // ========================================
  return (
    <div className="min-h-screen bg-white">
      {/* ---------- Top navigation tabs ---------- */}
      <nav className="border-b border-gray-200">
        <div className="mx-auto flex max-w-4xl justify-center gap-12 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as "details" | "questions")}
              className={`relative -mb-px border-b-2 px-2 pb-4 pt-6 text-lg font-semibold transition-colors ${
                activeTab === tab.id
                  ? "border-sky-500 text-gray-900"
                  : "border-transparent text-sky-500 hover:text-sky-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        {activeTab === "details" ? (
          // ========================================
          // DETAILS TAB: Quiz metadata form
          // ========================================
          <form className="space-y-8" onSubmit={handleSaveQuiz}>
            {/* Quiz name */}
            <div>
              <label htmlFor="quiz-name" className="text-sm font-semibold text-gray-700">
                Quiz Name
              </label>
              <input
                id="quiz-name"
                type="text"
                placeholder="Enter a quiz name"
                value={quizName}
                onChange={(event) => setQuizName(event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>

            {/* System prompt for AI */}
            <div>
              <label htmlFor="system-prompt" className="text-sm font-semibold text-gray-700">
                Enter system prompt for AI
              </label>
              <textarea
                id="system-prompt"
                rows={6}
                placeholder="Enter a system prompt"
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
                className="mt-2 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>

            {/* Access code */}
            <div>
              <label htmlFor="access-code" className="text-sm font-semibold text-gray-700">
                Access Code
              </label>
              <input
                id="access-code"
                type="text"
                placeholder="Enter access code"
                value={accessCode}
                onChange={(event) => setAccessCode(event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>

            {/* Course selection + search */}
            <div>
              <label htmlFor="course-id" className="text-sm font-semibold text-gray-700">
                Course
              </label>
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  placeholder="Search courses"
                  value={courseSearchTerm}
                  onChange={(event) => setCourseSearchTerm(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                />
                <select
                  id="course-id"
                  value={courseId}
                  onChange={(event) => setCourseId(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  required
                  disabled={isCoursesLoading || (!!courseListError && !courses.length)}
                >
                  <option value="">Select a course</option>
                  {visibleCourses.map((course) => (
                    <option key={course.id} value={String(course.id)}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              {isCoursesLoading && (
                <p className="mt-1 text-xs text-gray-500">Loading courses...</p>
              )}
              {courseListError && (
                <p className="mt-1 text-xs text-red-600">{courseListError}</p>
              )}
              {!isCoursesLoading &&
                !courseListError &&
                visibleCourses.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    No courses match your search.
                  </p>
                )}
            </div>

            {/* Form actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
              >
                {isSaving ? "Saving..." : "Save Quiz"}
              </button>
            </div>
          </form>
        ) : (
          // ========================================
          // QUESTIONS TAB: List of questions + actions
          // ========================================
          <div className="space-y-10">
            {/* Error banner for question operations */}
            {questionsError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {questionsError}
              </div>
            )}

            {/* Loading state for questions */}
            {isLoadingQuestions ? (
              <div className="text-center text-sm text-gray-500">Loading questions...</div>
            ) : (
              <>
                {/* Existing questions list */}
                {questions.map((question, index) => (
                  <QuizCardInstructor
                    key={question.id}
                    question={question}
                    position={index + 1}
                    onDelete={handleDeleteQuestion}
                    onEdit={() => openEditQuestionModal(question)}
                  />
                ))}
              </>
            )}

            {/* Actions: New question & Find questions (future) */}
            <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
              <button
                type="button"
                onClick={openNewQuestionModal}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <span className="text-base">＋</span>
                New Question
              </button>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleFindQuestions}
                  disabled={!courseId}
                >
                  <img src={SearchIcon} alt="Find question" className="h-4 w-4" />
                  Find Question
                </button>
              </div>
            </div>

            {(isCourseQuestionsLoading ||
              courseQuestionsError ||
              courseQuestionResults.length > 0) && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">
                    {selectedCourseTitle
                      ? `List of questions for course: ${selectedCourseTitle}`
                      : "List of questions for course"}
                  </h3>
                  {courseId && (
                    <span className="text-xs text-gray-500">Course ID #{courseId}</span>
                  )}
                </div>
                {isCourseQuestionsLoading && (
                  <p className="mt-3 text-xs text-gray-500">Loading questions…</p>
                )}
                {courseQuestionsError && (
                  <p className="mt-3 text-xs text-red-600">{courseQuestionsError}</p>
                )}
                {!isCourseQuestionsLoading &&
                  !courseQuestionsError &&
                  courseQuestionResults.length === 0 && (
                    <p className="mt-3 text-xs text-gray-500">
                      No questions returned for the selected course yet.
                    </p>
                  )}
                {!isCourseQuestionsLoading &&
                  !courseQuestionsError &&
                  courseQuestionResults.length > 0 && (
                    <ul className="mt-3 space-y-3">
                      {courseQuestionResults.map((question, index) => {
                        const distractors =
                          typeof question.otherAns === "string"
                            ? question.otherAns
                                .split("{|}")
                                .map((choice) => choice.trim())
                                .filter(Boolean)
                            : [];
                        return (
                          <li
                            key={`${question.questionId}-${index}`}
                            className="rounded-md border border-white bg-white p-3 text-sm text-gray-800 shadow-sm"
                          >
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Question {index + 1}</span>
                              {question.questionId && <span>ID: {question.questionId}</span>}
                            </div>
                            <p className="mt-1 font-semibold text-gray-900">{question.title}</p>
                            {question.prompt && (
                              <p className="mt-1 text-xs italic text-gray-600">
                                Prompt: {question.prompt}
                              </p>
                            )}
                            <p className="mt-2 text-xs text-green-700">
                              Correct answer: {question.correctAns || "—"}
                            </p>
                            {distractors.length > 0 && (
                              <p className="text-xs text-gray-600">
                                Other answers: {distractors.join(", ")}
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================
         QUESTION MODAL
         - Handles create and update flows for questions
         ======================================== */}
      {isQuestionModalOpen && (
        <QuizQuestionInstructor
          nextId={nextQuestionId}
          initialQuestion={editingQuestion}
          onCancel={closeQuestionModal}
          onSave={async (question, { isNew }) => {
            await handleQuestionSave(question, { isNew });
            setActiveTab("questions");
          }}
          displayNumber={modalQuestionNumber}
        />
      )}
    </div>
  );
}