import { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:3000/api";

type QuizAttempt = {
    dateTime: string;
    quizId: number;
    questionId: number;
    isCorrect: 0 | 1;
    numMsgs: number | null;
};

export default function QuizSubmissions() {
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
                if (isMounted) {
                    setAttempts(data?.attempts ?? []);
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
    }, []);

    if (loading) return <p>Loading submissions...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!attempts.length) return <p>No quiz submissions yet.</p>;

    return (
        <div className="border rounded-md p-4">
            <h3 className="text-lg font-semibold mb-2">Previous Quiz Submissions</h3>
            <ul className="space-y-2">
                {attempts.map((attempt) => (
                    <li key={`${attempt.quizId}-${attempt.questionId}-${attempt.dateTime}`} className="border p-2 rounded">
                        <p>Quiz ID: {attempt.quizId}</p>
                        <p>Question ID: {attempt.questionId}</p>
                        <p>Result: {attempt.isCorrect ? "Correct ✅" : "Incorrect ❌"}</p>
                        <p>
                            Submitted:{" "}
                            {new Date(attempt.dateTime).toLocaleString()}
                        </p>
                        {attempt.numMsgs != null && <p>Chat exchanges: {attempt.numMsgs}</p>}
                    </li>
                ))}
            </ul>
        </div>
    );
}