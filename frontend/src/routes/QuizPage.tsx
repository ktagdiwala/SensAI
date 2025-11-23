// Parent component (e.g., a page or a quiz container)
// For now, use a mock validator. Later, swap to a real POST /answer.
import QuestionCard, { type QuestionData, type AnswerFeedback } from "../components/QuizCardComponent";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../authentication/AuthContext";

const API_BASE_URL = "http://localhost:3000/api";

async function getQuestions({quizId,accessCode,}: {
    quizId?: string;
    accessCode?: string;
}) {
    if (!quizId || !accessCode) {
        console.warn("Missing quizId or accessCode.");
        return null;
    }

    try {
        const res = await fetch(
            `${API_BASE_URL}/question/quiz/${encodeURIComponent(quizId)}/accessCode/${encodeURIComponent(accessCode)}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            }
        );

        const rawBody = await res.text();
        console.log("Quiz API response (raw):", rawBody);

        if (!res.ok) throw new Error("Failed to load questions.");

        const data = JSON.parse(rawBody);
        console.log("Loaded quiz questions:", data);
        return data;
    } catch (err) {
        console.error("Unable to fetch quiz questions:", err);
        return null;
    }
}


export default function QuizPage() {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [questions, setQuestions] = useState<QuestionData[]>([]);
    const { quizId, accessCode } = useParams<{ quizId: string; accessCode: string }>();
    const { user } = useAuth();

    const studentId = user?.id ? String(user.id) : undefined;

    useEffect(() => {
        if (!quizId || !accessCode) return;

        getQuestions({ quizId, accessCode }).then((data) => {
            const rows = data?.questions ?? [];
            type QuizApiQuestion = {
                questionId: string | number;
                title?: string | null;
                options?: string[] | null;
            }

            const typedRows: QuizApiQuestion[] = rows as QuizApiQuestion[];

            setQuestions(
                typedRows.map((row) => ({
                    id: String(row.questionId),
                    description: row.title ?? "",
                    points: 1,
                    choices: (row.options ?? []).map((label, idx) => ({
                        id: `choice-${row.questionId}-${idx}`,
                        label,
                    })),
                }))
            );
        });
    }, [quizId, accessCode]);


    
    async function submitQuiz() {
        if (!confirm("Are you sure you want to submit this quiz?")) return;

        if (!quizId || !studentId) {
            alert("Missing quiz or user information.");
            return;
        }

        const payload = questions.map((q) => ({
            questionId: q.id,
            answer: answers[q.id] ?? "null",
        }));

        try {
            const res = await fetch(
                `/api/quiz/${encodeURIComponent(quizId)}/submit`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: studentId,    // match backend: userId
                        accessCode,          
                        answers: payload,
                    }),
                }
            );
            if (!res.ok) throw new Error("Submission failed");
            alert("Quiz submitted.");
        } catch (err) {
            console.error(err);
            alert("Could not submit quiz.");
        }
    }

    const submitAnswer = async ({
        questionId,
        choiceId,
    }: {
        questionId: string;
        choiceId: string;
        studentId?: string;
    }): Promise<AnswerFeedback> => {
        if (!quizId) {
            return { correct: false, explanation: "Quiz not loaded yet." };
        }

        // Find the question and choice so we can send the actual answer text
        const question = questions.find(q => q.id === questionId);
        const choice = question?.choices.find(c => c.id === choiceId);
        const givenAns = choice?.label ?? choiceId; // fall back to id if label missing

        try {
            const res = await fetch(`${API_BASE_URL}/attempt/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    quizId,
                    questionId,
                    givenAns,
                    numMsgs: 0,
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Validation failed");
            }

            const data = await res.json();
            return {
                correct: !!data?.isCorrect,
                explanation: data?.message,
            };
        } catch (err) {
            console.error("Answer validation failed", err);
            return {
                correct: false,
                explanation: "Unable to validate answer. Please retry.",
            };
        }
    };

    return (
        <div>
            {questions.map((q, idx) => (
                <QuestionCard
                    key={q.id}
                    data={q}
                    validate={submitAnswer}
                    selected={answers[q.id] ?? null}
                    onSelect={(choiceId) =>
                        setAnswers((prev) => ({ ...prev, [q.id]: choiceId }))
                    }
                    studentId={studentId}
                    lockAfterSubmit={true}
                    displayNumber={idx + 1}
                />
            ))}

            <button
                className="bg bg-canvas-light-blue text-white m-8 p-4 rounded-md"
                onClick={submitQuiz}
            >
                Submit Quiz
            </button>
        </div>
    );
}