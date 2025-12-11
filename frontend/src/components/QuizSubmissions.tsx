import { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:3000/api";

type QuizAttempt = {
    dateTime: string;
    quizId: number;
    quizTitle?: string;
    questionId: number;
    questionTitle?: string;
    isCorrect: 0 | 1;
    numMsgs: number | null;
    givenAns?: string | null;
    selfConfidence?: number | null;
};

interface QuizSubmissionsProps {
    quizId?: string | number;
}

export default function QuizSubmissions({ quizId }: QuizSubmissionsProps) {
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        async function loadAttempts() {
            try {
                const res = await fetch(`${API_BASE_URL}/attempt/student`, {
                    credentials: "include",
                });
                if (!res.ok) throw new Error("Failed to fetch quiz attempts.");
                const data = await res.json();
                console.log("Fetched quiz attempts:", data);
                if (isMounted) {
                    // Filter attempts by quizId if provided
                    const allAttempts = data?.attempts ?? [];
                    const filteredAttempts = quizId 
                        ? allAttempts.filter((attempt: QuizAttempt) => String(attempt.quizId) === String(quizId))
                        : allAttempts;
                    setAttempts(filteredAttempts);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) setError("Unable to load quiz submissions.");
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        loadAttempts();
        return () => {
            isMounted = false;
        };
    }, [quizId]);

    if (loading) return <p className="text-gray-600">Loading submissions...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!attempts.length) return <p className="text-gray-600">No quiz submissions yet.</p>;

    // Helper function to convert selfConfidence level to label
    const getConfidenceLabel = (level: number | null | undefined): string => {
        if (level === null || level === undefined) return "Not provided";
        return ["Not Confident", "Somewhat Confident", "Very Confident"][level] || "Not provided";
    };

    // Helper function to get confidence color
    const getConfidenceColor = (level: number | null | undefined): string => {
        if (level === null || level === undefined) return "text-gray-500";
        return ["text-red-600", "text-yellow-600", "text-green-600"][level] || "text-gray-500";
    };

    return (
        <div className="border rounded-lg p-6 bg-white shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Previous Attempts for This Quiz</h3>
            <div className="space-y-3">
                {attempts.map((attempt, index) => {
                    const questionTitle = attempt.questionTitle?.trim();
                    return (
                        <div
                            key={`${attempt.quizId}-${attempt.questionId}-${attempt.dateTime}-${index}`}
                            className="border border-gray-200 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            {/* Question Title and Result */}
                            <div className="flex items-start justify-between mb-2">
                                <p className="font-semibold text-gray-800 flex-1">
                                    {questionTitle || `Question ID: ${attempt.questionId}`}
                                </p>
                                <span className={`ml-4 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                                    attempt.isCorrect 
                                        ? "bg-green-100 text-green-800" 
                                        : "bg-red-100 text-red-800"
                                }`}>
                                    {attempt.isCorrect ? "✅ Correct" : "❌ Incorrect"}
                                </span>
                            </div>

                            {/* Given Answer */}
                            {attempt.givenAns && (
                                <div className="mt-2 text-sm text-gray-700">
                                    <span className="font-medium text-gray-700">Your Answer:</span>
                                    <span className="ml-2 text-gray-600">{attempt.givenAns}</span>
                                </div>
                            )}

                            {/* Confidence Score */}
                            <div className="mt-2 text-sm">
                                <span className="font-medium text-gray-700">Confidence:</span>
                                <span className={`ml-2 font-medium ${getConfidenceColor(attempt.selfConfidence)}`}>
                                    {getConfidenceLabel(attempt.selfConfidence)}
                                </span>
                            </div>

                            {/* Chat Exchanges and Submission Time */}
                            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                                <div className="flex gap-4">
                                    {attempt.numMsgs != null && (
                                        <span>💬 {attempt.numMsgs} chat exchange{attempt.numMsgs !== 1 ? "s" : ""}</span>
                                    )}
                                </div>
                                <span>{new Date(attempt.dateTime).toLocaleString()}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}