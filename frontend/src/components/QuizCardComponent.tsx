import { useState, useEffect } from "react";
import ChatComponent from "../components/ChatComponent"; 

export type Choice = { id: string; label: string };
export type QuestionData = {
    id: string;
    description: string;
    choices: Choice[];
    points?: number;
};

export type AnswerFeedback = {
    correct: boolean;
    explanation?: string;
};

type QuestionCardProps = {
    data: QuestionData;
    validate: (args: { questionId: string; choiceId: string; studentId?: string }) => Promise<AnswerFeedback>;
    lockAfterSubmit?: boolean;
    selected?: string | null;
    onSelect?: (choiceId: string) => void;
    studentId?: string;
    displayNumber?: number;
    forceDisabled?: boolean;
    finalResult?: boolean | null;
    quizId?: string;
};

export default function QuestionCard({
    data,
    validate,
    lockAfterSubmit = false,
    selected: selectedProp = null,
    onSelect,
    studentId,
    displayNumber,
    forceDisabled = false,
    finalResult = null,
    quizId,
}: QuestionCardProps) {
    const [selected, setSelected] = useState<string | null>(selectedProp);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const disabled = forceDisabled || submitting || (lockAfterSubmit && !!feedback);

    useEffect(() => {
        setSelected(selectedProp ?? null);
    }, [selectedProp]);

    async function onCheckAnswer() {
        if (!selected) return;
        setSubmitting(true);
        try {
            const res = await validate({ questionId: data.id, choiceId: selected, studentId });
            setFeedback(res);
        } finally {
            setSubmitting(false);
        }
    }

    function handleSelect(choiceId: string) {
        if (disabled) return;
        setSelected(choiceId);
        onSelect?.(choiceId);
    }

    return (
        <div className="flex flex-row items-start">
            {/* Question Card */}
            <div className="flex-1">
                {/**Question */}
                <div className="mx-4 md:mx-16 my-8 border border-canvas-outline border-1.5 p-4 bg-white shadow">
                    
                    {/**Header */}
                    <div className="flex justify-between items-center bg-gray-100 -mx-4 -mt-4 px-4 py-2 border-b border-canvas-outline">
                        <h2 className="m-0 text-lg font-semibold">
                            Question {displayNumber ?? data.id}
                        </h2>
                        
                        <div className="flex gap-x-3">
                            <img
                                src="/message-square.svg"
                                alt="Open chat"
                                style={{ cursor: "pointer", width: 24, height: 24, verticalAlign: "middle" }}
                                onClick={() => setIsChatOpen((v) => !v)}
                            />
                            {data.points != null && (
                                <div className="text-sm text-gray-700 font-bold">{data.points} pts</div>
                            )}
                        </div>
                    </div>

                    {/**Description */}
                    <p className="mt-4 text-gray-800">{data.description}</p>

                    {/**Options */}
                    <div className="border-t border-gray-200 mt-4">
                        {data.choices.map((c, idx) => (
                            <label
                                key={c.id}
                                className={`block py-3 cursor-pointer ${
                                    disabled ? "opacity-80 cursor-not-allowed" : ""
                                } ${idx < data.choices.length - 1 ? "border-b border-gray-100" : ""}`}
                            >
                                <input
                                    type="radio"
                                    name={data.id}
                                    value={c.id}
                                    disabled={disabled}
                                    checked={selected === c.id}
                                    onChange={() => handleSelect(c.id)}
                                    className="mr-2 accent-blue-600"
                                />
                                {c.label}
                            </label>
                        ))}
                    </div>

                    {/**Submit*/}
                    <div className="text-center mt-6">
                        <button
                            onClick={onCheckAnswer}
                            disabled={!selected || disabled}
                            className={`px-6 py-3 rounded-sm font-semibold text-white ${
                                !selected || disabled
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-canvas-dark-blue hover:bg-canvas-gray cursor-pointer"
                            } border-none`}
                        >
                            {submitting ? "Checking…" : "Check Answer"}
                        </button>
                    </div>

                    {feedback && (
                        <div className="mt-3 font-semibold">
                            {feedback.correct ? "✅ Correct!" : "❌ Incorrect."}
                            {feedback.explanation && (
                                <div className="mt-1 font-normal opacity-90 text-gray-700">
                                    {feedback.explanation}
                                </div>
                            )}
                        </div>
                    )}

                    {finalResult !== null && (
                        <div className="mt-3 font-semibold text-blue-800">
                            Quiz submission result: {finalResult ? "✅ Correct" : "❌ Incorrect"}
                        </div>
                    )}
                </div>
            </div>


            <div
                className={`ml-6 w-100 ${isChatOpen ? "" : "hidden"}`}
                aria-hidden={!isChatOpen}
            >
                <ChatComponent
                    quizId={quizId}
                    questionId={data.id}
                    onClose={() => setIsChatOpen(false)}
                />
            </div>
        </div>
    );
}
