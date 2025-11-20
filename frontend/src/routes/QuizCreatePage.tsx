import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QuizCardInstructor, {
  type InstructorQuestion,
} from "../components/QuizCardInstructorComponent";
import QuizQuestionInstructor from "../components/QuizQuestionComponentInstructor";
import SearchIcon from "../assets/Search.svg";

const tabs = [
  { id: "details", label: "Details" },
  { id: "questions", label: "Questions" },
];

export default function QuizCreatePage() {
  const { quizId } = useParams<{ quizId?: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"details" | "questions">("details");
  const [quizName, setQuizName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [courseId, setCourseId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [questions, setQuestions] = useState<InstructorQuestion[]>([]);
  const [isQuestionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<InstructorQuestion | null>(null);
  const [isLoadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isQuestionModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isQuestionModalOpen]);

  const nextQuestionId =
    (questions.length ? Math.max(...questions.map((question) => question.id)) : 0) + 1;

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

      // TODO: persist questions via dedicated endpoint once available
      navigate("/instructors");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }

  function handleDeleteQuestion(id: number) {
    setQuestions((prev) => prev.filter((question) => question.id !== id));
  }

  useEffect(() => {
    if (!quizId) {
      setQuestions([]);
      return;
    }

    let isMounted = true;
    setLoadingQuestions(true);
    setQuestionsError(null);

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
        const fetchedQuestions: InstructorQuestion[] = quiz.questions ?? [];
        setQuestions(
          fetchedQuestions.map((question, index) => ({
            ...question,
            id: question.id ?? index + 1,
          }))
        );
      } catch {
        if (!isMounted) return;
        setQuestionsError("Unable to load quiz questions.");
      } finally {
        if (isMounted) {
          setLoadingQuestions(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [quizId]);

  return (
    <div className="min-h-screen bg-white">
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
          <form className="space-y-8" onSubmit={handleSaveQuiz}>
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

            
            {/**TODO make this searchable for a course in the backend */}
            <div>
              <label htmlFor="course-id" className="text-sm font-semibold text-gray-700">
                Course ID
              </label>
              <input
                id="course-id"
                type="number"
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                required
              />
            </div>

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
          <div className="space-y-10">
            {questionsError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {questionsError}
              </div>
            )}

            {isLoadingQuestions ? (
              <div className="text-center text-sm text-gray-500">Loading questions...</div>
            ) : (
              <>
                {questions.map((question) => (
                  <QuizCardInstructor
                    key={question.id}
                    question={question}
                    onDelete={handleDeleteQuestion}
                    onEdit={(selected) => {
                      setEditingQuestion(selected);
                      setQuestionModalOpen(true);
                    }}
                  />
                ))}
              </>
            )}

            <div className="flex justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingQuestion(null);
                  setQuestionModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <span className="text-base">＋</span>
                New Question
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <img src={SearchIcon} alt="Find questions" className="h-4 w-4" />
                Find Questions
              </button>
            </div>
          </div>
        )}
      </main>

      {isQuestionModalOpen && (
        <QuizQuestionInstructor
          nextId={nextQuestionId}
          initialQuestion={editingQuestion}
          onCancel={() => {
            setQuestionModalOpen(false);
            setEditingQuestion(null);
          }}
          onSave={(question) => {
            setQuestions((previous) => {
              const exists = previous.some((item) => item.id === question.id);
              return exists
                ? previous.map((item) => (item.id === question.id ? question : item))
                : [...previous, question];
            });
            setQuestionModalOpen(false);
            setEditingQuestion(null);
            setActiveTab("questions");
          }}
        />
      )}
    </div>
  );
}