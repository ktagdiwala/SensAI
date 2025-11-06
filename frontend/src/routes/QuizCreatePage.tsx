import { useState } from "react";

const tabs = [
  { id: "details", label: "Details" },
  { id: "questions", label: "Questions" },
];

export default function QuizCreatePage() {
  const [activeTab, setActiveTab] = useState<"details" | "questions">("details");

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <div className="mx-auto flex max-w-3xl justify-center gap-12 px-6">
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

      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        {activeTab === "details" ? (
          <form className="space-y-8">
            <div>
              <label
                htmlFor="quiz-name"
                className="text-sm font-semibold text-gray-700"
              >
                Quiz Name
              </label>
              <input
                id="quiz-name"
                type="text"
                placeholder="Enter a quiz name"
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>

            <div>
              <label
                htmlFor="quiz-instructions"
                className="text-sm font-semibold text-gray-700"
              >
                Quiz Instructions
              </label>
              <textarea
                id="quiz-instructions"
                rows={6}
                placeholder="Enter instructions"
                className="mt-2 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>

            <div>
              <label
                htmlFor="system-prompt"
                className="text-sm font-semibold text-gray-700"
              >
                Enter system prompt for AI
              </label>
              <textarea
                id="system-prompt"
                rows={6}
                placeholder="Enter a system prompt"
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
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
              >
                Save Quiz
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-16 text-center text-sm text-gray-500">
            TODO QUESTIONS DIV MAP
          </div>
        )}
      </main>
    </div>
  );
}