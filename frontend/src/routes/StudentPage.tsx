// Parent component (e.g., a page or a quiz container)
// For now, use a mock validator. Later, swap to a real POST /answer.
import QuestionCard, { type QuestionData, type AnswerFeedback } from "../components/QuizCardComponent";

// Example True/False question
const q1: QuestionData = {
    id: "1",
    description: "This is some sample text, pretend this is a question that is asking truth or false value.",
    choices: [
        { id: "T", label: "True" },
        { id: "F", label: "False" },
    ],
    points: 1,
};


// DEV-ONLY mock (don’t ship answers to client in production)
async function mockValidate({
    questionId,
    choiceId,
}: {
    questionId: string;
    choiceId: string;
}): Promise<AnswerFeedback> {
    // pretend the correct answer for q1 is "True"
    const correct = questionId === "1" ? choiceId === "T" : false;
    return {
        correct,
        explanation: correct ? "Nice job!" : "Review the lecture notes for this topic.",
    };
}

export default function StudentPage() {
    return (
        <div>
            <QuestionCard data={q1} validate={mockValidate} />
            <QuestionCard data={q1} validate={mockValidate} />
            <QuestionCard data={q1} validate={mockValidate} />
            <QuestionCard data={q1} validate={mockValidate} />
            <QuestionCard data={q1} validate={mockValidate} />
        </div>
    )
}

