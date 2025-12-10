import { useEffect, useMemo, useState } from "react";
import type { InstructorQuestion } from "../components/QuizCardInstructorComponent";
import { mapServerQuestion } from "../utils/questionMapping";

type CourseQuestionPreview = {
  questionId: number;
  title: string;
  correctAns: string;
  otherAns: string;
  prompt: string | null;
  courseId: number;
};

type SaveOptions = {
  isNew: boolean;
};

type UseQuizQuestionsResult = {
  questions: InstructorQuestion[];
  isLoadingQuestions: boolean;
  questionsError: string | null;
  nextQuestionId: number;
  isQuestionModalOpen: boolean;
  editingQuestion: InstructorQuestion | null;
  modalQuestionNumber: number;
  openNewQuestionModal: () => void;
  openEditQuestionModal: (question: InstructorQuestion) => void;
  closeQuestionModal: () => void;
  handleDeleteQuestion: (id: number) => void;
  handleQuestionSave: (question: InstructorQuestion, options: SaveOptions) => Promise<void>;
  addExistingQuestionToQuiz: (question: CourseQuestionPreview) => Promise<void>;
};

export function useQuizQuestions(
  quizId?: string,
  courseId?: string,
): UseQuizQuestionsResult {
  const [questions, setQuestions] = useState<InstructorQuestion[]>([]);
  const [isQuestionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<InstructorQuestion | null>(null);
  const [modalQuestionNumber, setModalQuestionNumber] = useState(1);
  const [isLoadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  const nextQuestionId = useMemo(() => {
    if (!questions.length) {
      return 1;
    }
    const maxId = Math.max(...questions.map((question) => question.id));
    return maxId + 1;
  }, [questions]);

  useEffect(() => {
    if (!quizId) {
      setQuestions([]);
      setLoadingQuestions(false);
      setEditingQuestion(null);
      setQuestionModalOpen(false);
      setModalQuestionNumber(1);
      return;
    }

    let isMounted = true;
    setLoadingQuestions(true);
    setQuestionsError(null);

    (async () => {
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
        if (!isMounted) {
          return;
        }
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

  function openNewQuestionModal() {
    setQuestionsError(null);
    setEditingQuestion(null);
    setModalQuestionNumber(questions.length + 1);
    setQuestionModalOpen(true);
  }

  function openEditQuestionModal(question: InstructorQuestion) {
    setQuestionsError(null);
    setEditingQuestion(question);
    const index = questions.findIndex((item) => item.id === question.id);
    setModalQuestionNumber(index >= 0 ? index + 1 : 1);
    setQuestionModalOpen(true);
  }

  function closeQuestionModal() {
    setQuestionModalOpen(false);
    setEditingQuestion(null);
    setModalQuestionNumber(questions.length + 1);
  }

  function handleDeleteQuestion(id: number) {
    setQuestionsError(null);
    const target = questions.find((question) => question.id === id);
    if (!target) return;

    const previous = questions;
    setQuestions((prev) => prev.filter((question) => question.id !== id));

    if (!quizId || !target.isPersisted) {
      return; // new/unsaved questions are only local
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
          body: JSON.stringify({ quizId: quizIdNumber, questionId: target.id }),
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          throw new Error(errorPayload?.message ?? "Failed to remove question from quiz.");
        }
      } catch (error) {
        console.error(error);
        setQuestionsError(
          error instanceof Error ? error.message : "Failed to remove question.",
        );
        setQuestions(previous); // roll back optimistic update
      }
    })();
  }

  async function handleQuestionSave(
    question: InstructorQuestion,
    { isNew }: SaveOptions,
  ): Promise<void> {
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
      const createResponse = await fetch("http://localhost:3000/api/question/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: question.description,
          correctAns: correctChoice.label,
          otherAns: otherAnswers.join("{|}"),
          prompt: question.prompt ?? null,
          courseId: courseIdNumber,
        }),
      });

      if (!createResponse.ok) {
        const errorBody = await createResponse.json().catch(() => null);
        throw new Error(errorBody?.message ?? "Unable to create question.");
      }

      const createData = await createResponse.json();
      const persistedQuestionId = Number(createData.questionId);

      if (!persistedQuestionId) {
        throw new Error("Question ID missing from server response.");
      }

      const addResponse = await fetch("http://localhost:3000/api/question/addToQuiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          quizId: quizIdNumber,
          questionId: persistedQuestionId,
        }),
      });

      if (!addResponse.ok) {
        const errorBody = await addResponse.json().catch(() => null);
        await fetch(`http://localhost:3000/api/question/delete/${persistedQuestionId}`, {
          method: "DELETE",
          credentials: "include",
        }).catch(() => undefined);
        throw new Error(errorBody?.message ?? "Unable to attach question to quiz.");
      }

      let updatedLength = 0;
      setQuestions((previousQuestions) => {
        const updated = [
          ...previousQuestions,
          {
            ...question,
            id: persistedQuestionId,
            title: question.description,
            isPersisted: true,
          },
        ];
        updatedLength = updated.length;
        return updated;
      });
      setModalQuestionNumber(updatedLength + 1);
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
            courseId: courseIdNumber,
          }),
        },
      );

      if (!updateResponse.ok) {
        const errorBody = await updateResponse.json().catch(() => null);
        throw new Error(errorBody?.message ?? "Unable to update question.");
      }

      let updatedLength = 0;
      setQuestions((previousQuestions) => {
        const updated = previousQuestions.map((item) =>
          item.id === question.id
            ? { ...question, title: question.description, isPersisted: true }
            : item,
        );
        updatedLength = updated.length;
        return updated;
      });
      setModalQuestionNumber(updatedLength + 1);
    }

    setQuestionModalOpen(false);
    setEditingQuestion(null);
  }

  async function addExistingQuestionToQuiz(question: CourseQuestionPreview): Promise<void> {
    if (!quizId) {
      throw new Error("Save quiz details before adding questions.");
    }

    const quizIdNumber = Number(quizId);
    if (Number.isNaN(quizIdNumber)) {
      throw new Error("Invalid quiz identifier.");
    }

    const alreadyAdded = questions.some((q) => q.id === question.questionId);
    if (alreadyAdded) {
      return;
    }

    setQuestionsError(null);

    const response = await fetch("http://localhost:3000/api/question/addToQuiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        quizId: quizIdNumber,
        questionId: question.questionId,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.message ?? "Unable to attach question to quiz.");
    }

    setQuestions((prev) => {
      const mapped = mapServerQuestion({
        questionId: question.questionId,
        title: question.title,
        correctAns: question.correctAns,
        otherAns: question.otherAns,
        prompt: question.prompt,
        courseId: question.courseId,
      });
      return [...prev, { ...mapped, isPersisted: true }];
    });
  }

  return {
    questions,
    isLoadingQuestions,
    questionsError,
    nextQuestionId,
    isQuestionModalOpen,
    editingQuestion,
    modalQuestionNumber,
    openNewQuestionModal,
    openEditQuestionModal,
    closeQuestionModal,
    handleDeleteQuestion,
    handleQuestionSave,
    addExistingQuestionToQuiz,
  };
}
