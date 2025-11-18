import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import QuizPage from "./QuizPage";

export default function StudentPage() {
    const navigate = useNavigate();
    const [quizId, setQuizId] = useState("");
    const [quizPassword, setQuizPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!quizId.trim() || !quizPassword.trim()) {
            setError("Quiz ID and password are required.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch("/api/quizzes/validate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ quizId: quizId.trim(), quizPassword }),
            });

            if (!response.ok) {
                const { message } = await response.json();
                throw new Error(message ?? "Unable to join quiz.");
            }

            navigate(`/quiz/${encodeURIComponent(quizId.trim())}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unexpected error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-6"
            >
                <div className="flex flex-col space-y-2">
                    <label
                        htmlFor="QuizId"
                        className="text-sm font-semibold text-gray-700"
                    >
                        Quiz Id
                    </label>
                    <input
                        type="text"
                        id="QuizId"
                        placeholder="Enter the Quiz ID"
                        className="rounded-full border border-black px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                        value={quizId}
                        onChange={(event) => setQuizId(event.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="flex flex-col space-y-2">
                    <label
                        htmlFor="QuizPassword"
                        className="text-sm font-semibold text-gray-700"
                    >
                        Quiz Password
                    </label>
                    <input
                        type="password"
                        id="QuizPassword"
                        placeholder="Enter the Quiz Password"
                        className="rounded-full border border-black px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                        value={quizPassword}
                        onChange={(event) => setQuizPassword(event.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                {error ? (
                    <p className="text-sm text-red-600 text-center">{error}</p>
                ) : null}

                <button
                    type="submit"
                    className="w-full rounded-full bg-black px-4 py-2 font-semibold text-white transition hover:bg-gray-900 disabled:opacity-60"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Submitting..." : "Submit"}
                </button>
            </form>
        </div>
    );
}

