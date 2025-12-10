import { useEffect, useState } from "react";

interface CourseQuestionPreview {
  questionId: number;
  title: string;
  correctAns: string;
  otherAns: string;
  prompt: string | null;
  courseId: number;
}

interface FindQuestionModalProps {
  isOpen: boolean;
  courseId: string;
  courseTitle?: string;
  onClose: () => void;
  quizId?: string;
  existingQuestionIds?: number[];
  onAddToQuiz?: (question: CourseQuestionPreview) => Promise<void>;
}

const COURSE_QUESTION_ENDPOINT = "http://localhost:3000/api/question/course";

export default function FindQuestionModal({
  isOpen,
  courseId,
  courseTitle,
  onClose,
  quizId,
  existingQuestionIds = [],
  onAddToQuiz,
}: FindQuestionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<CourseQuestionPreview[]>([]);
  const [addError, setAddError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [addedIds, setAddedIds] = useState<number[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !courseId) {
      setQuestions([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let isActive = true;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${COURSE_QUESTION_ENDPOINT}/${courseId}`, {
          credentials: "include",
        });
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
                question.prompt === null ||
                question.prompt === undefined ||
                question.prompt === "null"
                  ? null
                  : String(question.prompt),
              courseId: Number(question.courseId ?? courseId),
            }))
          : [];
        if (isActive) {
          setQuestions(normalized);
        }
      } catch (err) {
        console.error("[FindQuestionModal] Unable to fetch course questions.", err);
        if (isActive) {
          setQuestions([]);
          setError("Unable to load course questions for this course.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [isOpen, courseId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleAdd = async (question: CourseQuestionPreview) => {
    if (!quizId || !onAddToQuiz) return;
    setAddError(null);
    setDeleteError(null);
    setAddingId(question.questionId);
    try {
      await onAddToQuiz(question);
      setAddedIds((prev) => [...prev, question.questionId]);
    } catch (err) {
      console.error(err);
      setAddError(
        err instanceof Error ? err.message : "Unable to add question to quiz.",
      );
    } finally {
      setAddingId(null);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!questionId) return;
    const confirmed = window.confirm(
      "Delete this question from the database? This affects all quizzes using it.",
    );
    if (!confirmed) return;

    setDeleteError(null);
    setDeletingId(questionId);
    try {
      const response = await fetch(
        `http://localhost:3000/api/question/delete/${questionId}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? "Unable to delete question.");
      }
      setQuestions((prev) => prev.filter((q) => q.questionId !== questionId));
      setAddedIds((prev) => prev.filter((id) => id !== questionId));
    } catch (err) {
      console.error(err);
      setDeleteError(
        err instanceof Error ? err.message : "Unable to delete question.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Find Question</p>
            <p className="text-xs text-gray-500">{`List of questions for course: ${courseTitle}`}</p>
            <p className="text-xs text-gray-500">{`Course Id: #${courseId}`}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close find question modal"
          >
            ✕
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          {!courseId ? (
            <p className="text-sm text-gray-600">
              Select a course in the Details tab before searching for questions.
            </p>
          ) : (
            <>
              {isLoading && <p className="text-sm text-gray-500">Loading questions…</p>}
              {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
              {!isLoading && !error && questions.length === 0 && (
                <p className="text-sm text-gray-600">
                  No questions returned for the selected course yet.
                </p>
              )}
              {!isLoading && !error && questions.length > 0 && (
                <ul className="space-y-3">
                  {questions.map((question, index) => {
                    const distractors =
                      typeof question.otherAns === "string"
                        ? question.otherAns
                            .split("{|}")
                            .map((choice) => choice.trim())
                            .filter(Boolean)
                        : [];
                    const alreadyInQuiz =
                      existingQuestionIds.includes(question.questionId) ||
                      addedIds.includes(question.questionId);
                    return (
                      <li
                        key={`${question.questionId}-${index}`}
                        className="rounded-md border border-gray-100 bg-white p-3 text-sm text-gray-800 shadow-sm"
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
                        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={
                              !quizId ||
                              alreadyInQuiz ||
                              addingId === question.questionId
                            }
                            onClick={() => handleAdd(question)}
                            className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {addingId === question.questionId
                              ? "Adding..."
                              : alreadyInQuiz
                              ? "Added"
                              : "Add to quiz"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(question.questionId)}
                            disabled={deletingId === question.questionId}
                            className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === question.questionId
                              ? "Deleting..."
                              : "Delete question"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {addError && <p className="mt-3 text-xs text-red-600">{addError}</p>}
              {deleteError && <p className="mt-1 text-xs text-red-600">{deleteError}</p>}
            </>
          )}
        </div>

        <footer className="flex justify-end border-t border-gray-200 px-6 py-4">
        </footer>
      </div>
    </div>
  );
}