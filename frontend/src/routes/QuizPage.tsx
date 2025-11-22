// Parent component (e.g., a page or a quiz container)
// For now, use a mock validator. Later, swap to a real POST /answer.
import QuestionCard, { type QuestionData, type AnswerFeedback } from "../components/QuizCardComponent";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../authentication/AuthContext";

const API_BASE_URL = "http://localhost:3000/api";

// Example True/False question
const questions: QuestionData[] = [
    {
        id: "1",
        description: "Which planet is commonly referred to as the Red Planet?",
        choices: [
            { id: "A", label: "Earth" },
            { id: "B", label: "Mars" },
            { id: "C", label: "Venus" },
            { id: "D", label: "Jupiter" },
        ],
        points: 1,
    },
    {
        id: "2",
        description: "What is the derivative of x² with respect to x?",
        choices: [
            { id: "A", label: "x" },
            { id: "B", label: "2x" },
            { id: "C", label: "x²" },
            { id: "D", label: "2" },
        ],
        points: 1,
    },
    {
        id: "3",
        description: "Which gas do plants primarily absorb during photosynthesis?",
        choices: [
            { id: "A", label: "Oxygen" },
            { id: "B", label: "Nitrogen" },
            { id: "C", label: "Carbon Dioxide" },
            { id: "D", label: "Hydrogen" },
        ],
        points: 1,
    },
    {
        id: "4",
        description: "True or False: The Pacific Ocean is the largest ocean on Earth.",
        choices: [
            { id: "A", label: "True" },
            { id: "B", label: "False" },
        ],
        points: 1,
    },
    {
        id: "5",
        description: "True or False: Sound travels faster in air than in water.",
        choices: [
            { id: "A", label: "True" },
            { id: "B", label: "False" },
        ],
        points: 1,
    },
];

//REMOVE THIS AFTER IMPLEMENTING VALIDATION FUNCTION IN BACKEND
// DEV-ONLY mock
const correctAnswers: Record<string, string> = {
    "1": "B", // Mars is known as the Red Planet.
    "2": "B", // d/dx (x²) = 2x.
    "3": "C", // Plants absorb CO₂.
    "4": "A", // Pacific Ocean is the largest.
    "5": "B", // Sound travels faster in water than in air.
};

async function mockValidate({
    questionId,
    choiceId,
    studentId,
}: {
    questionId: string;
    choiceId: string;
    studentId?: string;
}): Promise<AnswerFeedback> {
    const correct = correctAnswers[questionId] === choiceId;
    return {
        correct,
        explanation: correct ? "Nice job!" : "Review the lecture notes for this topic.",
    };
}

async function getQuestions({
    quizId,
    accessCode,
}: {
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
        async function loadQuiz() {
            const data = await getQuestions({ quizId, accessCode });
            if (!data) return;

            const rows = Array.isArray(data) ? data : data?.questions ?? [];

            const normalized = rows.map((row) => ({
                id: String(row.questionId),
                description: row.title ?? "",
                points: 1,
                choices: (row.options ?? []).map((label, idx) => ({
                    id: `choice-${row.questionId}-${idx}`,
                    label,
                })),
            })) satisfies QuestionData[];

            setQuestions(normalized);
        }
        loadQuiz();
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
                        accessCode,          // if your backend expects it
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

    return (
        
        <div>
            {questions.map((q, idx) => (
                <QuestionCard
                    key={q.id}
                    data={q}
                    validate={mockValidate}
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