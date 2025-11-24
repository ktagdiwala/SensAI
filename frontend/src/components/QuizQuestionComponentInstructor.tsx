import { useEffect, useState } from "react";
import TrashIcon from "../assets/Trash.svg";
import type { InstructorQuestion } from "./QuizCardInstructorComponent";

type QuestionType = "true_false" | "multiple_choice";

type ChoiceDraft = {
  id: string;
  label: string;
  isCorrect: boolean;
};

const questionTypeOptions: { value: QuestionType; label: string }[] = [
  { value: "true_false", label: "True / False" },
  { value: "multiple_choice", label: "Multiple Choice" },
];

const createChoiceId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `choice-${Math.random().toString(36).slice(2, 10)}`;

const buildDefaultChoices = (type: QuestionType): ChoiceDraft[] => {
  if (type === "true_false") {
    return [
      { id: "true", label: "True", isCorrect: true },
      { id: "false", label: "False", isCorrect: false },
    ];
  }

  return [
    { id: createChoiceId(), label: "", isCorrect: true },
    { id: createChoiceId(), label: "", isCorrect: false },
  ];
};

type QuizCreateQuestionProps = {
  nextId: number;
  onCancel: () => void;
  onSave: (question: InstructorQuestion, options: { isNew: boolean }) => Promise<void> | void;
  initialQuestion?: InstructorQuestion | null;
  displayNumber: number;
};

export default function QuizQuestionInstructor({
  nextId,
  onCancel,
  onSave,
  initialQuestion,
  displayNumber,
}: QuizCreateQuestionProps) {
  const isEditing = Boolean(initialQuestion);
  const [questionType, setQuestionType] = useState<QuestionType>(
    initialQuestion?.type ?? "true_false",
  );
  const [description, setDescription] = useState(initialQuestion?.description ?? "");
  const [questionPrompt, setQuestionPrompt] = useState(initialQuestion?.prompt ?? "");
  const [points, setPoints] = useState(initialQuestion ? String(initialQuestion.points) : "1");
  const [choices, setChoices] = useState<ChoiceDraft[]>(() =>
    initialQuestion
      ? initialQuestion.choices.map((choice) => ({
          id: choice.id,
          label: choice.label,
          isCorrect: choice.id === initialQuestion.correctChoiceId,
        }))
      : buildDefaultChoices("true_false"),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialQuestion) {
      setQuestionType(initialQuestion.type ?? "true_false");
      setDescription(initialQuestion.description ?? "");
      setQuestionPrompt(initialQuestion.prompt ?? "");
      setPoints(initialQuestion.points != null ? String(initialQuestion.points) : "1");
      setChoices(
        initialQuestion.choices.map((choice) => ({
          id: choice.id,
          label: choice.label,
          isCorrect: choice.id === initialQuestion.correctChoiceId,
        })),
      );
      setError(null);
      return;
    }

    // reset for new question
    setQuestionType("true_false");
    setDescription("");
    setQuestionPrompt("");
    setPoints("1");
    setChoices(buildDefaultChoices("true_false"));
    setError(null);
  }, [initialQuestion]);

  function handleQuestionTypeChange(newType: QuestionType) {
    setQuestionType(newType);
    setChoices(buildDefaultChoices(newType));
  }

  function handleChoiceLabelChange(id: string, label: string) {
    setChoices((prev) =>
      prev.map((choice) => (choice.id === id ? { ...choice, label } : choice)),
    );
  }

  function handleMarkCorrect(id: string) {
    setChoices((prev) => prev.map((choice) => ({ ...choice, isCorrect: choice.id === id })));
  }

  function handleAddChoice() {
    if (questionType !== "multiple_choice") return;
    setChoices((prev) => [
      ...prev,
      { id: createChoiceId(), label: "", isCorrect: false },
    ]);
  }

  function handleRemoveChoice(id: string) {
    setChoices((prev) => {
      if (prev.length <= 2) return prev;
      const updated = prev.filter((choice) => choice.id !== id);
      if (!updated.some((choice) => choice.isCorrect)) {
        updated[0] = { ...updated[0], isCorrect: true };
      }
      return updated;
    });
  }

  function resetForm() {
    setDescription("");
    setQuestionPrompt("");
    setPoints("1");
    setQuestionType("true_false");
    setChoices(buildDefaultChoices("true_false"));
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedPrompt = questionPrompt.trim();
    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      setError("Question text is required.");
      return;
    }

    const parsedPoints = Number(points);
    if (Number.isNaN(parsedPoints) || parsedPoints < 0) {
      setError("Points must be zero or a positive number.");
      return;
    }

    const normalizedChoices = choices.map((choice) => ({
      ...choice,
      label: choice.label.trim(),
    }));

    if (normalizedChoices.some((choice) => !choice.label)) {
      setError("Please fill in all answer choices.");
      return;
    }

    const correctChoice = normalizedChoices.find((choice) => choice.isCorrect);
    if (!correctChoice) {
      setError("Select a correct answer before saving.");
      return;
    }

    const payload: InstructorQuestion = {
      id: initialQuestion?.id ?? nextId,
      title: trimmedDescription,
      description: trimmedDescription,
      prompt: trimmedPrompt.length > 0 ? trimmedPrompt : "null",
      points: parsedPoints,
      choices: normalizedChoices.map(({ id, label }) => ({ id, label })),
      type: questionType,
      correctChoiceId: correctChoice.id,
      isPersisted: initialQuestion?.isPersisted,
    };

    try {
      setIsSubmitting(true);
      await Promise.resolve(onSave(payload, { isNew: !isEditing }));
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Unable to save question.";
      setError(message);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);

    if (!isEditing) {
      resetForm();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10">
      <div className="w-full max-w-4xl rounded-2xl border border-gray-200 bg-white shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <header className="flex flex-wrap items-center gap-4 border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-800">{`Question ${displayNumber}`}</h3>

            <select
              value={questionType}
              onChange={(event) => handleQuestionTypeChange(event.target.value as QuestionType)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            >
              {questionTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-600">pts:</span>
              <input
                type="number"
                min={0}
                value={points}
                onChange={(event) => setPoints(event.target.value)}
                className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>
          </header>

          <div className="px-6">
            <p className="text-sm text-gray-600">
              Enter your question description then select the correct answer.
            </p>

            <label className="mt-4 block text-sm font-semibold text-gray-700">
              Question
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              placeholder="Type the question text here..."
            />
          </div>

          <div className="px-6">
            <p className="text-sm text-gray-600">
              Optionally add instructions or context to show with this question.
            </p>

            <label className="mt-4 block text-sm font-semibold text-gray-700">
              Prompt (optional)
            </label>
            <textarea
              rows={5}
              value={questionPrompt}
              onChange={(event) => setQuestionPrompt(event.target.value)}
              className="mt-2 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              placeholder="Add optional guidance for the question..."
            />
          </div>

          <section className="px-6">
            <h4 className="text-sm font-semibold text-gray-700">Answers</h4>

            <div className="mt-4 space-y-4">
              {choices.map((choice, index) => (
                <div
                  key={choice.id}
                  className="flex flex-col gap-2 rounded-md border border-gray-200 p-4 md:flex-row md:items-center md:gap-3"
                >
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <input
                      type="radio"
                      name="correct-answer"
                      checked={choice.isCorrect}
                      onChange={() => handleMarkCorrect(choice.id)}
                      className="h-4 w-4 accent-sky-500"
                    />
                    Possible Answer
                  </label>

                  <input
                    type="text"
                    value={choice.label}
                    onChange={(event) => handleChoiceLabelChange(choice.id, event.target.value)}
                    placeholder="Enter answer option"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />

                  {questionType === "multiple_choice" && choices.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChoice(choice.id)}
                      className="self-start rounded-full p-1 hover:bg-gray-100"
                      aria-label="Remove answer"
                    >
                      <img src={TrashIcon} alt="" className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {questionType === "multiple_choice" && (
              <div className="mt-3 text-right">
                <button
                  type="button"
                  onClick={handleAddChoice}
                  className="text-sm font-semibold text-sky-600 transition hover:text-sky-500"
                >
                  + Add another Answer
                </button>
              </div>
            )}
          </section>

          {error && (
            <div className="mx-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <footer className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onCancel();
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
            >
              {isSubmitting ? "Saving..." : "Save Question"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}