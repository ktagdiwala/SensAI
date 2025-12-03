// Parent component (e.g., a page or a quiz container)
// For now, use a mock validator. Later, swap to a real POST /answer.
import QuestionCard, { type QuestionData, type AnswerFeedback } from "../components/QuizCardComponent";
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useBlocker } from "react-router-dom"; // <-- add useNavigate
import { useAuth } from "../authentication/AuthContext";
import QuizSubmissions from "../components/QuizSubmissions";

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
        // console.log("Quiz API response (raw):", rawBody);

        if (!res.ok) throw new Error("Failed to load questions.");

        const data = JSON.parse(rawBody);
        // console.log("Loaded quiz questions:", data);
        return data;
    } catch (err) {
        console.error("Unable to fetch quiz questions:", err);
        return null;
    }
}


export default function QuizPage() {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [questions, setQuestions] = useState<QuestionData[]>([]);
    const [showSubmissions, setShowSubmissions] = useState(false);
    const [submissionResults, setSubmissionResults] = useState<Record<string, boolean>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [submissionSummary, setSubmissionSummary] = useState<{ score: number; total: number } | null>(null);
    const [quizSummary, setQuizSummary] = useState<string | null>(null);
    const { quizId, accessCode } = useParams<{ quizId: string; accessCode: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();               

    const studentId = user?.id ? String(user.id) : undefined;
    const [quizTitle, setQuizTitle] = useState<string>("");
    const [shouldBlockNavigation, setShouldBlockNavigation] = useState(true);

    // Block navigation when user tries to leave the page
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            shouldBlockNavigation &&
            !quizSubmitted &&
            currentLocation.pathname !== nextLocation.pathname
    );

    // Handle browser back/forward/refresh
    useEffect(() => {
        if (quizSubmitted) {
            setShouldBlockNavigation(false);
            return;
        }

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
            return '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [quizSubmitted]);

    // Handle blocked navigation with confirmation dialog
    useEffect(() => {
        if (blocker.state === "blocked") {
            const confirmLeave = window.confirm(
                "Are you sure you want to leave? Your chat history will be saved, but you may lose unsaved quiz progress."
            );
            if (confirmLeave) {
                setShouldBlockNavigation(false);
                blocker.proceed();
            } else {
                blocker.reset();
            }
        }
    }, [blocker]);

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

        // Fetch quiz details (student-accessible) to get the title
        fetch(`${API_BASE_URL}/quiz/${encodeURIComponent(quizId)}/${encodeURIComponent(accessCode)}`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => {
                const title = data?.quiz?.title;
                if (typeof title === "string") setQuizTitle(title);
            })
            .catch(() => {});
    }, [quizId, accessCode]);


    
    async function submitQuiz() {
        if (!confirm("Are you sure you want to submit this quiz?")) return;

        if (!quizId) {
            alert("Missing quiz information.");
            return;
        }

        // Build questionArray with questionId + givenAns + numMsgs
        const questionArray = questions.map((q) => {
            const choiceId = answers[q.id];           // stored selected choice id
            const choice = q.choices.find(c => c.id === choiceId);
            const givenAns = choice?.label ?? "";  // send label text (or empty if none)
            return {
                questionId: q.id,
                givenAns,
                numMsgs: 0,
            };
        });

        if (questionArray.filter(q => q.givenAns !== "").length === 0) {
            alert("You have not answered any questions.");
            return;
        }

        try {
            const res = await fetch(
                `${API_BASE_URL}/attempt/submit-quiz`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        quizId,
                        questionArray,
                    }),
                }
            );
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Submission failed");
            }

            const data = await res.json();
            // console.log("Quiz submit result:", data);

            const feedback = Array.isArray(data?.result?.questionFeedback)
                ? data.result.questionFeedback
                : [];
            const mapped: Record<string, boolean> = {};
            feedback.forEach((item: { questionId: string | number; isCorrect: number | boolean }) => {
                mapped[String(item.questionId)] = !!item.isCorrect;
            });

            const totalQuestions = data?.result?.totalQuestions ?? questionArray.length;
            const score = data?.result?.score ?? feedback.filter((f: any) => f?.isCorrect).length;
            const summary = data?.summary ?? null;

            setSubmissionResults(mapped);
            setQuizSubmitted(true);
            setSubmissionSummary({ score, total: totalQuestions });
            setQuizSummary(summary);
            setShouldBlockNavigation(false); // Allow navigation after submission

            alert("Quiz submitted.");

        } catch (err) {
            console.error("Quiz submission failed", err);
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
                    forceDisabled={quizSubmitted}
                    finalResult={quizSubmitted ? submissionResults[q.id] ?? null : null}
                    quizId={quizId}
                    quizTitle={quizTitle}
                />
            ))}

            {quizSubmitted && submissionSummary && (
                <div className="m-8 p-4 rounded-md border border-canvas-outline bg-green-50 text-green-900">
                    Score: {submissionSummary.score} / {submissionSummary.total}
                </div>
            )}

            {quizSubmitted && quizSummary && (
                <div className="m-8 p-6 rounded-md border border-canvas-outline bg-blue-50 text-blue-900">
                    <h3 className="text-lg font-semibold mb-3">Quiz Summary</h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{quizSummary}</p>
                </div>
            )}

            <button
                className="bg bg-canvas-light-blue text-white m-8 p-4 rounded-md"
                onClick={submitQuiz}
            >
                Submit Quiz
            </button>

            <button
                className="bg-gray-200 text-gray-800 m-8 p-2 rounded-md"
                onClick={() => setShowSubmissions((prev) => !prev)}
            >
                {showSubmissions ? "Hide" : "View"} Quiz Submissions
            </button>

            {showSubmissions && (
                <div className="m-8">
                    <QuizSubmissions />
                </div>
            )}
        </div>
    );
}