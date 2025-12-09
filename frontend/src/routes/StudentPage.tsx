import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import QuizPage from "./QuizPage";

interface AttemptData {
    totalAttempts: number;
    previousAttempts: Array<{ score: number; datetime: string; totalQuestions: number }>;
    highestScore: number | null;
    highestScoreDatetime: string | null;
    totalQuestions: number;
}

export default function StudentPage() {
    const navigate = useNavigate();
    const [quizId, setQuizId] = useState("");
    const [quizPassword, setQuizPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previousAttempts, setPreviousAttempts] = useState<AttemptData | null>(null);
    const [showAttemptHistory, setShowAttemptHistory] = useState(false);

    const formatDateTime = (value: string) => {
        try {
            const d = new Date(value);
            if (Number.isNaN(d.getTime())) return value;
            return d.toLocaleString();
        } catch {
            return value;
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!quizId.trim() || !quizPassword.trim()) {
            setError("Quiz ID and password are required.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setPreviousAttempts(null);
        setShowAttemptHistory(false);

        try {
            const trimmedQuizId = quizId.trim();
            const trimmedPassword = quizPassword.trim();

            // Ensure credentials (cookies) are sent with the request
            const response = await fetch(
                `http://localhost:3000/api/quiz/${encodeURIComponent(trimmedQuizId)}/${encodeURIComponent(trimmedPassword)}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include' 
                }
            );

            // Check content type to avoid JSON parsing errors on HTML responses (like 404 pages)
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Received non-JSON response from server. Please check your API URL.");
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message ?? "Quiz not found or access code invalid.");
            }

            if (!data?.quiz) {
                throw new Error("Quiz data is missing from response.");
            }

            // Check for previous attempts on this quiz
            try {
                const previousAttemptsRes = await fetch(
                    `http://localhost:3000/api/attempt/student/quiz/${encodeURIComponent(trimmedQuizId)}/previous-attempts`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );
                
                if (previousAttemptsRes.ok) {
                    const attemptData = await previousAttemptsRes.json();
                    if (attemptData.totalAttempts > 0) {
                        // User has previous attempts - show them on page for review
                        setPreviousAttempts(attemptData);
                        setShowAttemptHistory(true);
                        setIsSubmitting(false);
                        return;
                    }
                }
            } catch (err) {
                console.error("Error checking previous attempts:", err);
                // Continue with navigation even if previous attempts check fails
            }

            // No previous attempts, proceed to quiz
            navigate(
                `/quiz/${encodeURIComponent(trimmedQuizId)}/${encodeURIComponent(trimmedPassword)}`
            );
        } catch (err) {
            console.error("Quiz fetch error:", err);
            setError(err instanceof Error ? err.message : "Unexpected error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleProceedToQuiz = () => {
        if (quizId.trim() && quizPassword.trim()) {
            navigate(
                `/quiz/${encodeURIComponent(quizId.trim())}/${encodeURIComponent(quizPassword.trim())}`
            );
        }
    };

    const handleCancelRetake = () => {
        setPreviousAttempts(null);
        setShowAttemptHistory(false);
        setQuizId("");
        setQuizPassword("");
        setError(null);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
            {showAttemptHistory && previousAttempts ? (
                <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8 space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Quiz Attempt History</h2>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700 mb-4">
                            You have completed <span className="font-semibold">{previousAttempts.totalAttempts}</span> attempt(s) of this quiz.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-800">All Attempts</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {[...previousAttempts.previousAttempts].reverse().map((attempt, index) => (
                                <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <span className="text-gray-700">Attempt {index + 1}:</span>
                                    <span className="font-semibold text-gray-900">
                                        Score: {attempt.score}/{attempt.totalQuestions}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        {formatDateTime(attempt.datetime)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {previousAttempts.highestScore !== null && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-gray-800">
                                <span className="font-semibold">Highest Score:</span>{" "}
                                <span className="text-lg font-bold text-green-700">
                                    {previousAttempts.highestScore}/{previousAttempts.totalQuestions}
                                </span>
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                {previousAttempts.highestScoreDatetime && (
                                    <>
                                        Achieved on: {formatDateTime(previousAttempts.highestScoreDatetime)}
                                    </>
                                )}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={handleProceedToQuiz}
                            className="flex-1 rounded-full bg-black px-4 py-2 font-semibold text-white transition hover:bg-gray-900"
                        >
                            Proceed to Quiz
                        </button>
                        <button
                            onClick={handleCancelRetake}
                            className="flex-1 rounded-full bg-gray-300 px-4 py-2 font-semibold text-gray-900 transition hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
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
            )}
        </div>
    );
}

