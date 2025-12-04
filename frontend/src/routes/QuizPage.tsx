// Parent component (e.g., a page or a quiz container)
// For now, use a mock validator. Later, swap to a real POST /answer.
import QuestionCard, { type QuestionData, type AnswerFeedback } from "../components/QuizCardComponent";
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // <-- add useNavigate
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
    // Guard to avoid re-entrant popstate handling
    const ignoringPopRef = (window as any).__sensaiIgnoringPopRef ?? { value: false };
    (window as any).__sensaiIgnoringPopRef = ignoringPopRef;
    const popGuardRef = useRef(false);

    const studentId = user?.id ? String(user.id) : undefined;
    const [quizTitle, setQuizTitle] = useState<string>("");
    const [chatMap, setChatMap] = useState<Record<string, any[]>>({});

    // Collect chat updates from ChatComponent
    const handleChatUpdate = (questionId: string, messages: any[]) => {
        setChatMap((prev) => ({ ...prev, [questionId]: messages }));
    };

    // Load existing chat history for all questions
    const loadChatHistory = async () => {
        try {
            if (!quizId || !questions.length) return;
            const loadedChats: Record<string, any[]> = {};
            for (const question of questions) {
                const res = await fetch(`${API_BASE_URL}/chat/${quizId}/${question.id}`, {
                    credentials: 'include',
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.chat && Array.isArray(data.chat) && data.chat.length > 0) {
                        loadedChats[question.id] = data.chat;
                    }
                }
            }
            if (Object.keys(loadedChats).length > 0) {
                setChatMap(loadedChats);
            }
        } catch (err) {
            console.error('Failed to load chat history:', err);
        }
    };

    // Save all chats to backend
    const saveAllChats = async (useBeacon: boolean = false) => {
        try {
            if (!quizId) return;
            const chats = Object.entries(chatMap)
                .filter(([_, chat]) => chat && chat.length > 0)
                .map(([questionId, chat]) => ({ quizId, questionId, chat }));
            if (chats.length === 0) return;
            const url = `${API_BASE_URL}/chat/save-batch`;
            const payload = JSON.stringify({ chats });
            if (useBeacon && typeof navigator.sendBeacon === 'function') {
                const blob = new Blob([payload], { type: 'application/json' });
                navigator.sendBeacon(url, blob);
            } else {
                await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: payload,
                    keepalive: true,
                    mode: 'cors',
                });
            }
        } catch (_) {
            // swallow errors; navigation shouldn't be blocked due to save failure
        }
    };

    // Handle browser refresh/close with alert and save
    useEffect(() => {
        if (quizSubmitted) return;
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Show browser's native confirmation dialog
            e.preventDefault();
            e.returnValue = '';
            // Save via beacon when user confirms leaving
            saveAllChats(true);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [quizSubmitted, chatMap, quizId]);

    // Intercept navigation to other routes (React Router links)
    useEffect(() => {
        if (quizSubmitted) return;

        const handleClick = async (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Check for any anchor tag or element with role="link"
            const link = target.closest('a, [role="link"]');
            
            if (link) {
                // Get the target path from href or data attributes
                const href = link.getAttribute('href');
                const currentPath = window.location.pathname;
                
                // Check if navigating away from current quiz page
                if (href && href !== currentPath && !href.startsWith('#')) {
                    const confirmLeave = window.confirm(
                        "Are you sure you want to leave? Your chat history will be saved, but you may lose unsaved quiz progress."
                    );
                    if (!confirmLeave) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        return false;
                    } else {
                        // Prevent default navigation, save, then navigate programmatically
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                            await saveAllChats();
                        } finally {
                            if (href) {
                                navigate(href);
                            }
                        }
                        return false;
                    }
                }
            }
        };

        // Use capture phase to intercept before React Router
        document.addEventListener('click', handleClick, { capture: true });
        
        // Push a state entry so back button will trigger popstate
        window.history.pushState(null, '', window.location.pathname);
        
        // Back button interception: prompt, save on OK, then navigate back
        const onPopState = async () => {
            if (popGuardRef.current) { 
                popGuardRef.current = false; 
                return; 
            }
            
            // Push state back to stay on current page while showing dialog
            window.history.pushState(null, '', window.location.pathname);
            
            const confirmLeave = window.confirm(
                "Are you sure you want to leave? Your chat history will be saved, but you may lose unsaved quiz progress."
            );
            
            if (confirmLeave) {
                // User confirmed - save chats and navigate
                popGuardRef.current = true;
                await saveAllChats();
                navigate('/students');
                window.scrollTo(0, 0);
            }
            // If cancelled, we already pushed state above so we stay on page
        };
        window.addEventListener('popstate', onPopState);

        return () => {
            document.removeEventListener('click', handleClick, { capture: true });
            window.removeEventListener('popstate', onPopState);
        };
    }, [quizSubmitted, chatMap, quizId, navigate]);
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

            const questionData = typedRows.map((row) => ({
                id: String(row.questionId),
                description: row.title ?? "",
                points: 1,
                choices: (row.options ?? []).map((label, idx) => ({
                    id: `choice-${row.questionId}-${idx}`,
                    label,
                })),
            }));
            
            setQuestions(questionData);
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

    // Load chat history after questions are loaded
    useEffect(() => {
        if (questions.length > 0 && quizId) {
            loadChatHistory();
        }
    }, [questions.length, quizId]);



    
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
                    onChatUpdate={handleChatUpdate}
                    initialChatMessages={chatMap[q.id] || []}
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
