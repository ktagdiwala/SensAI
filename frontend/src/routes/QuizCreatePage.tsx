import { useEffect, useState } from "react";
import QuizCardInstructor, {
  type InstructorQuestion,
} from "../components/QuizCardInstructorComponent";
import QuizQuestionInstructor from "../components/QuizQuestionComponentInstructor";
import SearchIcon from "../assets/Search.svg";

const tabs = [
  { id: "details", label: "Details" },
  { id: "questions", label: "Questions" },
];

const mockQuestions: InstructorQuestion[] = [
  {
    id: 1,
    title: "Question 1",
    description:
      "This is some sample text, pretend this is a question that is asking truth or false value.",
    points: 1,
    choices: [
      { id: "true", label: "True" },
      { id: "false", label: "False" },
    ],
    type: "true_false",
    correctChoiceId: "true",
  },
  {
    id: 2,
    title: "Question 2",
    description:
      "Which component is responsible for performing arithmetic and logic operations in a computer?",
    points: 2,
    choices: [
      { id: "alu", label: "Arithmetic Logic Unit" },
      { id: "gpu", label: "Graphics Processing Unit" },
      { id: "ssd", label: "Solid State Drive" },
      { id: "ram", label: "Random Access Memory" },
    ],
    type: "multiple_choice",
    correctChoiceId: "alu",
  },
  {
    id: 3,
    title: "Question 3",
    description:
      "When writing CSS, which selector targets an element with the id of “app-container”?",
    points: 1,
    choices: [
      { id: "class", label: ".app-container" },
      { id: "id", label: "#app-container" },
      { id: "tag", label: "<app-container>" },
    ],
    type: "multiple_choice",
    correctChoiceId: "id",
  },
];

export default function QuizCreatePage() {
  const [activeTab, setActiveTab] = useState<"details" | "questions">("details");
  const [quizName, setQuizName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [questions, setQuestions] = useState<InstructorQuestion[]>(mockQuestions);
  const [isQuestionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<InstructorQuestion | null>(null);

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
      const payload = {
        quiz: {
          name: quizName.trim(),
          instructions: instructions.trim(),
          systemPrompt: systemPrompt.trim(),
        },
        questions,
      };

      console.log("Quiz payload preview", payload);
      await new Promise((resolve) => setTimeout(resolve, 600));
    } finally {
      setIsSaving(false);
    }
  }

  function handleDeleteQuestion(id: number) {
    setQuestions((prev) => prev.filter((question) => question.id !== id));
  }

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
              <label htmlFor="quiz-instructions" className="text-sm font-semibold text-gray-700">
                Quiz Instructions
              </label>
              <textarea
                id="quiz-instructions"
                rows={6}
                placeholder="Enter instructions"
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                className="mt-2 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
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