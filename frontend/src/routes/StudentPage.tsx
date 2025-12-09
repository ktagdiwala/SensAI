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
                        const rawTotal = attemptData.totalQuestions || attemptData.highestScoreTotalQuestions || attemptData.previousAttempts?.[0]?.totalQuestions || 0;
                        const quizTotalQuestions = rawTotal && rawTotal > 0 ? rawTotal : 'unknown';

                        // User has previous attempts - show them before continuing (denominator is quiz total)
                        const attemptSummary = attemptData.previousAttempts
                            .map((attempt: any) => `${attempt.datetime}: Score ${attempt.score}/${quizTotalQuestions}`)
                            .join("\n");
                        
                        const highestScoreLine = attemptData.highestScore !== null
                            ? `Highest Score: ${attemptData.highestScore}/${quizTotalQuestions}`
                            : `Highest Score: N/A`;

                        const highestScoreDatetimeLine = attemptData.highestScoreDatetime
                            ? `Datetime of Highest Score: ${attemptData.highestScoreDatetime}`
                            : `Datetime of Highest Score: N/A`;

                        const continueRetake = confirm(
                            `You have ${attemptData.totalAttempts} previous attempt(s):\n\n${attemptSummary}\n\n${highestScoreLine}\n${highestScoreDatetimeLine}\n\nDo you want to retake this quiz?`
                        );
                        
                        if (!continueRetake) {
                            setError("Quiz retake cancelled.");
                            return;
                        }
                    }
                }
            } catch (err) {
                console.error("Error checking previous attempts:", err);
                // Continue with navigation even if previous attempts check fails
            }

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

