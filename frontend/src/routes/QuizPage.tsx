// Parent component (e.g., a page or a quiz container)
// For now, use a mock validator. Later, swap to a real POST /answer.
import QuestionCard, { type QuestionData, type AnswerFeedback } from "../components/QuizCardComponent";
import { useState } from "react";

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