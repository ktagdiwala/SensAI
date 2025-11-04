// Parent component (e.g., a page or a quiz container)
// For now, use a mock validator. Later, swap to a real POST /answer.
import QuestionCard, { type QuestionData, type AnswerFeedback } from "../components/QuizCardComponent";
import { useState } from "react";

// Example True/False question
const questions: QuestionData[] = [
    {
        id: "1",
        description: "The sky is blue during a clear day.",
        choices: [
            { id: "T", label: "True" },
            { id: "F", label: "False" },
        ],
        points: 1,
    },
    {
        id: "2",
        description: "2 + 2 equals 5.",
        choices: [
            { id: "T", label: "True" },
            { id: "F", label: "False" },
        ],
        points: 1,
    },
    {
        id: "3",
        description: "Water boils at 100°C at sea level.",
        choices: [
            { id: "T", label: "True" },
            { id: "F", label: "False" },
        ],
        points: 1,
    },
    {
        id: "4",
        description: "The capital of France is Berlin.",
        choices: [
            { id: "T", label: "True" },
            { id: "F", label: "False" },
        ],
        points: 1,
    },
    {
        id: "5",
        description: "Cats are mammals.",
        choices: [
            { id: "T", label: "True" },
            { id: "F", label: "False" },
        ],
        points: 1,
    },
];

//REMOVE THIS AFTER IMPLEMENTING VALIDATION FUNCTION IN BACKEND
// DEV-ONLY mock
const correctAnswers: Record<string, string> = {
    "1": "T", // The sky is blue during a clear day.
    "2": "F", // 2 + 2 equals 5.
    "3": "T", // Water boils at 100°C at sea level.
    "4": "F", // The capital of France is Berlin.
    "5": "T", // Cats are mammals.
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

export default function QuizPage() {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const quizId = "abc123"; // TODO: get from route params
    const studentId = "student-42"; // TODO: get from auth/user context

    async function submitQuiz() {
        if (!confirm("Are you sure you want to submit this quiz?")) return;

        const payload = questions.map((q) => ({
            questionId: q.id,
            answer: answers[q.id] ?? "null",
        }));

        try {
            const res = await fetch(`/api/quiz/${encodeURIComponent(quizId)}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId,          
                    answers: payload,
                }),
            });
            if (!res.ok) throw new Error("Submission failed");
            alert("Quiz submitted.");
        } catch (err) {
            console.error(err);
            alert("Could not submit quiz.");
        }
    }

    return (
        <div>
            {questions.map((q) => (
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