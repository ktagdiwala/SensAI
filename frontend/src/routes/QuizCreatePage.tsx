import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QuizCardInstructor, {
  type InstructorQuestion,
} from "../components/QuizCardInstructorComponent";
import QuizQuestionInstructor from "../components/QuizQuestionComponentInstructor";
import SearchIcon from "../assets/Search.svg";

const createChoiceId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `choice-${Math.random().toString(36).slice(2, 10)}`;

const extractQuestionId = (raw: any): number | null => {
  const candidateKeys = ["questionId", "question_id", "QuestionID", "questionID", "id"];
  for (const key of candidateKeys) {
    if (raw?.[key] != null) {
      const numeric = Number(raw[key]);
      if (Number.isFinite(numeric) && numeric > 0) {
        return numeric;
      }
    }
  }
  return null;
};

const normalizeOtherAnswers = (otherAns: unknown): string[] => {
  if (Array.isArray(otherAns)) {
    return otherAns.map((value) => (typeof value === "string" ? value : String(value)));
  }
  if (typeof otherAns === "string") {
    if (!otherAns.trim()) return [];
    try {
      const parsed = JSON.parse(otherAns);
      if (Array.isArray(parsed)) {
        return parsed.map((value) => (typeof value === "string" ? value : String(value)));
      }
    } catch {
      // ignore parse errors
    }
    return otherAns
      .split("{|}")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return [];
};

const inferQuestionType = (choices: string[]): "true_false" | "multiple_choice" => {
  if (choices.length === 2) {
    const normalized = choices.map((label) => label.trim().toLowerCase());
    if (normalized.includes("true") && normalized.includes("false")) {
      return "true_false";
    }
  }
  return "multiple_choice";
};

const mapServerQuestion = (raw: any): InstructorQuestion => {
  const questionId = extractQuestionId(raw);
  const instructorPrompt =
    typeof raw?.questionPrompt === "string"
      ? raw.questionPrompt
      : typeof raw?.promptContext === "string"
      ? raw.promptContext
      : "";
  const promptText =
    typeof raw?.prompt === "string" && raw.prompt.trim().length > 0
      ? raw.prompt
      : instructorPrompt;

  const normalizedPrompt =
    typeof promptText === "string" && promptText.trim().length > 0
      ? promptText
      : null;

  const otherAnswers = normalizeOtherAnswers(raw?.otherAns);
  const allChoices = [
    raw?.correctAns ?? "",
    ...otherAnswers.filter((label) => label != null),
  ].map((label) => (label == null ? "" : String(label)));

  const choiceEntries =
    allChoices.length > 0
      ? allChoices.map((label) => ({
          id: createChoiceId(),
          label,
        }))
      : [{ id: createChoiceId(), label: "" }];

  const correctChoiceId = choiceEntries[0].id;
  const questionType = inferQuestionType(allChoices);
  const numericPoints = Number(raw?.points);
  const points = Number.isNaN(numericPoints) ? 1 : numericPoints;
  const questionText =
    typeof raw?.title === "string" && raw.title.trim().length > 0
      ? raw.title
      : `Question ${raw?.id ?? ""}`.trim();

  return {
    id: questionId ?? 0,
    title: questionText,
    description: questionText,
    prompt: normalizedPrompt,
    points,
    choices: choiceEntries,
    type: questionType,
    correctChoiceId,
    isPersisted: Boolean(questionId),
  };
};

const tabs = [
  { id: "details", label: "Details" },
  { id: "questions", label: "Questions" },
];

interface CourseOption {
  id: number;
  title: string;
}

const COURSE_LIST_ENDPOINT = "http://localhost:3000/api/quiz/courses";

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
  const [modalQuestionNumber, setModalQuestionNumber] = useState<number>(1);
  const [isLoadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [isCoursesLoading, setCoursesLoading] = useState(false);
  const [courseListError, setCourseListError] = useState<string | null>(null);
  const [courseSearchTerm, setCourseSearchTerm] = useState("");

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isQuestionModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isQuestionModalOpen]);

  const visibleCourses = useMemo(() => {
    const query = courseSearchTerm.trim().toLowerCase();
    if (!query) {
      return courses;
    }
    const matches = courses.filter((course) =>
      course.title.toLowerCase().includes(query),
    );
    if (courseId && !matches.some((course) => String(course.id) === courseId)) {
      const selected = courses.find((course) => String(course.id) === courseId);
      return selected ? [selected, ...matches] : matches;
    }
    return matches;
  }, [courses, courseSearchTerm, courseId]);

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

  const handleDeleteQuestion = (id: number) => {
    setQuestionsError(null);
    const target = questions.find((question) => question.id === id);
    if (!target) return;

    const questionIdNumber = Number(target.id);
    if (!Number.isFinite(questionIdNumber) || questionIdNumber <= 0) {
      setQuestionsError("Cannot remove question: missing identifier.");
      return;
    }

    const previous = questions;
    setQuestions((prev) => prev.filter((question) => question.id !== id));

    if (!quizId || !target.isPersisted) {
      return;
    }

    const quizIdNumber = Number(quizId);
    if (Number.isNaN(quizIdNumber)) {
      setQuestions(previous);
      setQuestionsError("Invalid quiz identifier.");
      return;
    }

    (async () => {
      try {
        const response = await fetch("http://localhost:3000/api/question/removeFromQuiz", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ quizId: quizIdNumber, questionId: questionIdNumber }),
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          throw new Error(
            errorPayload?.message ?? "Failed to remove question from quiz.",
          );
        }

        const deleteResponse = await fetch(
          `http://localhost:3000/api/question/delete/${questionIdNumber}`,
          { method: "DELETE", credentials: "include" },
        );

        if (!deleteResponse.ok) {
          const errorPayload = await deleteResponse.json().catch(() => null);
          setQuestionsError(
            errorPayload?.message ?? "Question detached, but deletion failed.",
          );
        }
      } catch (error) {
        console.error(error);
        setQuestionsError(
          error instanceof Error ? error.message : "Failed to remove question.",
        );
        setQuestions(previous);
      }
    })();
  };

  useEffect(() => {
    if (!quizId) {
      setQuestions([]);
      setLoadingQuestions(false);
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
      } catch (error) {
        if (!isMounted) return;
        console.error(error);
      }

      try {
        const questionResponse = await fetch(
          `http://localhost:3000/api/question/quiz/${quizId}`,
          { credentials: "include" },
        );

        if (!questionResponse.ok) {
          if (questionResponse.status === 404) {
            if (isMounted) {
              setQuestions([]);
            }
          } else {
            const errorPayload = await questionResponse.json().catch(() => null);
            throw new Error(
              errorPayload?.message ?? `Failed with status ${questionResponse.status}`,
            );
          }
        } else {
          const questionData = await questionResponse.json();
          if (isMounted) {
            const fetched = Array.isArray(questionData.questions)
              ? questionData.questions
              : [];
            setQuestions(fetched.map(mapServerQuestion));
          }
        }
      } catch (error) {
        if (!isMounted) return;
        console.error(error);
        setQuestions([]);
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

  {/**Course search */}
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
        const potentialList = Array.isArray(payload?.courses)
          ? payload.courses
          : [];
        interface RawCourse {
          courseId?: number | string;
          id?: number | string;
          title?: string;
          name?: string;
        }

        interface CourseOption {
          id: number;
          title: string;
        }

        const normalized: CourseOption[] = potentialList
          .map((raw: RawCourse): CourseOption | null => {
            const idCandidate: number = Number(raw?.courseId ?? raw?.id);
            const titleCandidate: string | null =
              typeof raw?.title === "string"
          ? raw.title
          : typeof raw?.name === "string"
          ? raw.name
          : null;
            if (!Number.isFinite(idCandidate) || !titleCandidate) {
              return null;
            }
            return { id: idCandidate, title: titleCandidate };
          })
          .filter((item: CourseOption | null): item is CourseOption => item != null);
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
                {questions.map((question, index) => (
                  <QuizCardInstructor
                    key={question.id}
                    question={question}
                    position={index + 1}
                    onDelete={handleDeleteQuestion}
                    onEdit={() => {
                      setQuestionsError(null);
                      setEditingQuestion(question);
                      setModalQuestionNumber(index + 1);
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
                  setQuestionsError(null);
                  setEditingQuestion(null);
                  setModalQuestionNumber(questions.length + 1);
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
            setModalQuestionNumber(questions.length + 1);
          }}
          onSave={async (question, { isNew }) => {
            if (!quizId) {
              throw new Error("Save quiz details before adding questions.");
            }

            const quizIdNumber = Number(quizId);
            if (Number.isNaN(quizIdNumber)) {
              throw new Error("Invalid quiz identifier.");
            }

            const courseIdNumber = Number(courseId);
            if (Number.isNaN(courseIdNumber)) {
              throw new Error("Course ID is required before saving questions.");
            }

            const correctChoice = question.choices.find(
              (choice) => choice.id === question.correctChoiceId,
            );
            if (!correctChoice) {
              throw new Error("Select a correct answer before saving.");
            }

            const otherAnswers = question.choices
              .filter((choice) => choice.id !== question.correctChoiceId)
              .map((choice) => choice.label);

            setQuestionsError(null);

            if (isNew) {
              const createResponse = await fetch(
                "http://localhost:3000/api/question/create",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    title: question.description,
                    correctAns: correctChoice.label,
                    otherAns: otherAnswers.join("{|}"),
                    prompt: question.prompt ?? null,
                    questionPrompt: question.prompt ?? null,
                    courseId: courseIdNumber,
                  }),
                },
              );

              if (!createResponse.ok) {
                const errorBody = await createResponse.json().catch(() => null);
                throw new Error(errorBody?.message ?? "Unable to create question.");
              }

              const createData = await createResponse.json();
              const persistedQuestionId = Number(createData.questionId);

              if (!persistedQuestionId) {
                throw new Error("Question ID missing from server response.");
              }

              const addResponse = await fetch(
                "http://localhost:3000/api/question/addToQuiz",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    quizId: quizIdNumber,
                    questionId: persistedQuestionId,
                  }),
                },
              );

              if (!addResponse.ok) {
                const errorBody = await addResponse.json().catch(() => null);
                await fetch(
                  `http://localhost:3000/api/question/delete/${persistedQuestionId}`,
                  { method: "DELETE", credentials: "include" },
                ).catch(() => undefined);
                throw new Error(
                  errorBody?.message ?? "Unable to attach question to quiz.",
                );
              }

              setQuestions((previous) => [
                ...previous,
                {
                  ...question,
                  id: persistedQuestionId,
                  title: question.description,
                  isPersisted: true,
                },
              ]);
            } else {
              if (!question.id) {
                throw new Error("Missing question identifier.");
              }

              const updateResponse = await fetch(
                `http://localhost:3000/api/question/update/${question.id}`,
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    title: question.description,
                    correctAns: correctChoice.label,
                    otherAns: otherAnswers.join("{|}"),
                    prompt: question.prompt ?? null,
                    questionPrompt: question.prompt ?? null,
                    courseId: courseIdNumber,
                  }),
                },
              );

              if (!updateResponse.ok) {
                const errorBody = await updateResponse.json().catch(() => null);
                throw new Error(errorBody?.message ?? "Unable to update question.");
              }

              setQuestions((previous: InstructorQuestion[]) =>
                previous.map((item: InstructorQuestion) =>
                  item.id === question.id
                    ? { ...question, title: question.description, isPersisted: true }
                    : item,
                ),
              );
            }

            setQuestionModalOpen(false);
            setEditingQuestion(null);
            setActiveTab("questions");
            setModalQuestionNumber(questions.length + 1);
          }}
          displayNumber={modalQuestionNumber}
        />
      )}
    </div>
  );
}