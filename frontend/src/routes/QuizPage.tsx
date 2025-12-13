import QuestionCard, { type QuestionData, type AnswerFeedback } from "../components/QuizCardComponent";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../authentication/AuthContext";
import QuizSubmissions from "../components/QuizSubmissions";
import { jsPDF } from "jspdf";

type ConfidenceLevel = 0 | 1 | 2;

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
    const [selfConfidenceMap, setSelfConfidenceMap] = useState<Record<string, ConfidenceLevel | null>>({});
    const [questions, setQuestions] = useState<QuestionData[]>([]);
    const [showSubmissions, setShowSubmissions] = useState(false);
    const [submissionResults, setSubmissionResults] = useState<Record<string, boolean>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [submissionSummary, setSubmissionSummary] = useState<{ score: number; total: number } | null>(null);
    const [quizSummary, setQuizSummary] = useState<string | null>(null);
    const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});
    const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
    const [chatResetSignals, setChatResetSignals] = useState<Record<string, number>>({});
    const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});
    const { quizId, accessCode } = useParams<{ quizId: string; accessCode: string }>();
    const { user, setUser } = useAuth();
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
            
            // Helper function to remove emojis from text
            const removeEmojis = (text: string) => {
                return text.replace(/[\p{Emoji}\p{Emoji_Component}]/gu, '').trim();
            };
            
            const chats = Object.entries(chatMap)
                .filter(([_, chat]) => chat && chat.length > 0)
                .map(([questionId, chat]) => ({
                    quizId,
                    questionId,
                    chat: chat.map((msg: any) => ({
                        ...msg,
                        content: removeEmojis(msg.content || '')
                    }))
                }));
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

    // Store chats in sessionStorage for logout access
    useEffect(() => {
        if (chatMap && Object.keys(chatMap).length > 0) {
            sessionStorage.setItem('unsubmittedChats', JSON.stringify(chatMap));
        }
    }, [chatMap]);

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

    // Intercept navigation to other routes (React Router links) and logout button
    useEffect(() => {
        if (quizSubmitted) return;

        const handleClick = async (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            
            // Check if logout button was clicked
            const logoutButton = target.closest('button[onClick*="Logout"]') || 
                                (target.closest('button') && target.textContent?.includes('Logout'));
            
            if (logoutButton) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                const confirmLeave = window.confirm(
                    "Are you sure you want to leave? Your chat history will be saved, but you may lose unsaved quiz progress."
                );
                if (confirmLeave) {
                    await saveAllChats();
                    // Use the same logout logic as nav.tsx
                    setUser(null);
                    navigate('/');
                }
                return false;
            }
            
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

        // Build questionArray with questionId + givenAns + numMsgs + hasCheckedAnswer
        const questionArray = questions
            .map((q) => {
                const choiceId = answers[q.id];
                const choice = q.choices.find((c) => c.id === choiceId);
                const givenAns = choice?.label ?? "";
                return {
                    questionId: q.id,
                    givenAns,
                    numMsgs: messageCounts[q.id] ?? 0,
                    selfConfidence: selfConfidenceMap[q.id] ?? null,
                    hasCheckedAnswer: checkedQuestions[q.id] ?? false,
                };
            });      

        const answeredQuestions = questionArray.filter(q => q.givenAns !== "");
        if (answeredQuestions.length < 2) {
            alert("You must answer at least 2 questions before submitting.");
            return;
        }

        setIsSubmittingQuiz(true);
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

            // Delete all chat history for this quiz after successful submission
            try {
                await fetch(`${API_BASE_URL}/chat/${quizId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });
            } catch (err) {
                console.error('Failed to delete chat history:', err);
            }

            alert("Quiz submitted.");

        } catch (err) {
            console.error("Quiz submission failed", err);
            alert("Could not submit quiz.");
        } finally {
            setIsSubmittingQuiz(false);
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

        const selfConfidenceValue = selfConfidenceMap[questionId] ?? null;
        try {
            const res = await fetch(`${API_BASE_URL}/attempt/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    quizId,
                    questionId,
                    givenAns,
                    numMsgs: messageCounts[questionId] ?? 0,
                    selfConfidence: selfConfidenceValue,
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Validation failed");
            }

            const data = await res.json();
            const feedback: AnswerFeedback = {
                correct: !!data?.isCorrect,
                explanation: data?.message,
            };

            // Add mistake feedback if answer is incorrect
            if (!feedback.correct && data?.feedbackData) {
                feedback.mistakeLabel = data.feedbackData.mistakeLabel;
                feedback.mistakeFeedback = data.feedbackData.feedback;
            }

            return feedback;
        } catch (err) {
            console.error("Answer validation failed", err);
            return {
                correct: false,
                explanation: "Unable to validate answer. Please retry.",
            };
        }
    };

    const handleMessageCountUpdate = useCallback((questionId: string, count: number) => {
        setMessageCounts((prev) => {
            if (prev[questionId] === count) return prev;
            return { ...prev, [questionId]: count };
        });
    }, []);

    const handleConfidenceUpdate = useCallback((questionId: string, confidence: ConfidenceLevel) => {
        setSelfConfidenceMap((prev) => {
            if (prev[questionId] === confidence) return prev;
            return { ...prev, [questionId]: confidence };
        });
    }, []);

    const handleResetQuestion = useCallback((questionId: string) => {
        setAnswers((prev) => {
            const next = { ...prev };
            delete next[questionId];
            return next;
        });
        setSelfConfidenceMap((prev) => ({ ...prev, [questionId]: null }));
        setMessageCounts((prev) => ({ ...prev, [questionId]: 0 }));
        setCheckedQuestions((prev) => ({ ...prev, [questionId]: false }));
        setChatResetSignals((prev) => ({ ...prev, [questionId]: (prev[questionId] ?? 0) + 1 }));
    }, []);


    // Download all chats as PDF
    const downloadAllChats = () => {
        // Check if there are any chats to download
        const hasChats = Object.values(chatMap).some(chats => chats && chats.length > 0);
        if (!hasChats) {
            alert("No chat history to download.");
            return;
        }

        // Sanitize quiz title for filename
        const safeTitle = quizTitle
            ? quizTitle.replace(/[^a-z0-9\-_]+/gi, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '')
            : `quiz${quizId}`;

        // Create PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - 2 * margin;
        let yPosition = margin;

        // Set default font
        doc.setFont("helvetica");

        // Title
        doc.setFontSize(16);
        doc.text("SensAI Chat History - All Questions", margin, yPosition);
        yPosition += 10;

        // Quiz Title
        if (quizTitle) {
            doc.setFontSize(12);
            doc.text(`Quiz: ${quizTitle}`, margin, yPosition);
            yPosition += 8;
        }

        // Iterate through all questions and their chats
        questions.forEach((question, idx) => {
            const messages = chatMap[question.id];
            
            // Skip if no chats for this question
            if (!messages || messages.length === 0) {
                return;
            }

            // Add question heading and content
            doc.setFontSize(12);
            const qHeading = `Question ${idx + 1}: ${question.description}`;
            const qLines = doc.splitTextToSize(qHeading, maxWidth);
            if (yPosition + qLines.length * 7 > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
            }
            doc.text(qLines, margin, yPosition);
            yPosition += qLines.length * 7 + 1;

            // Add question options if available
            if (question.choices && question.choices.length > 0) {
                doc.setFontSize(11);
                const bulletOptions = question.choices.map((choice) => `- ${choice.label}`);
                const optLines = doc.splitTextToSize(bulletOptions.join("\n"), maxWidth);
                if (yPosition + optLines.length * 7 > pageHeight - margin) {
                    doc.addPage();
                    yPosition = margin;
                }
                doc.text(optLines, margin, yPosition);
                yPosition += optLines.length * 7 + 1;
            }

            // Add chat messages
            doc.setFontSize(11);
            messages.forEach((msg, idx) => {
                const role = msg.role === "user" ? "Student" : "SensAI";
                // Remove only emojis from message content for PDF display (preserve numbers and text)
                let cleanContent = (msg.content || "")
                    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
                    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
                    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
                    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
                    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
                    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
                    .trim();
                
                // Break up very long words with no spaces (replace runs of 50+ chars with line breaks)
                cleanContent = cleanContent.replace(/(\S{50})/g, '$1\n');
                
                const prefix = `${role}: `;
                const fullText = prefix + cleanContent;
                
                // Split content into lines with proper width calculation
                const textLines = doc.splitTextToSize(fullText, maxWidth);
                
                // Filter out empty lines that splitTextToSize might create
                const nonEmptyLines = textLines.filter((line: string) => line.trim().length > 0);

                // Check if we need a new page
                if (yPosition + nonEmptyLines.length * 5 > pageHeight - margin) {
                    doc.addPage();
                    yPosition = margin;
                }

                // Render each line individually to avoid splitTextToSize rendering issues
                nonEmptyLines.forEach((line: string) => {
                    doc.text(line, margin, yPosition);
                    yPosition += 5;
                });
                
                // Reduce spacing between consecutive messages from same sender, keep normal spacing for role changes
                const nextMsg = messages[idx + 1];
                const nextRole = nextMsg ? (nextMsg.role === "user" ? "Student" : "SensAI") : null;
                const spacing = nextRole === role ? 2 : 5;
                yPosition += spacing;
            });

            // Add spacing between questions
            yPosition += 10;
            if (yPosition > pageHeight - margin - 10) {
                doc.addPage();
                yPosition = margin;
            }
        });

        // Download PDF
        doc.save(`${safeTitle}_all_chats.pdf`);
    };

    // Mark a question as checked
    const handleQuestionChecked = useCallback((questionId: string) => {
        setCheckedQuestions((prev) => ({ ...prev, [questionId]: true }));
    }, []);

    return (
        <div className="mx-auto max-w-7xl">
            {questions.map((q, idx) => (
                <QuestionCard
                    key={`${q.id}-${idx}`}
                    data={q}
                    validate={submitAnswer}
                    selected={answers[q.id] ?? null}
                    onSelect={(choiceId) =>
                        setAnswers((prev) => ({ ...prev, [q.id]: choiceId }))
                    }
                    studentId={studentId}
                    lockAfterSubmit={false}
                    displayNumber={idx + 1}
                    forceDisabled={quizSubmitted || isSubmittingQuiz}
                    finalResult={quizSubmitted ? submissionResults[q.id] ?? null : null}
                    quizId={quizId}
                    onMessageCountChange={(count) => handleMessageCountUpdate(q.id, count)}
                    quizTitle={quizTitle}
                    onChatUpdate={handleChatUpdate}
                    initialChatMessages={chatMap[q.id] || []}
                    selfConfidence={selfConfidenceMap[q.id] ?? null}
                    onConfidenceChange={(value) => handleConfidenceUpdate(q.id, value)}
                    onResetQuestion={() => handleResetQuestion(q.id)}
                    onQuestionChecked={() => handleQuestionChecked(q.id)}
                    chatResetKey={chatResetSignals[q.id] ?? 0}
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
                className="bg bg-canvas-light-blue text-white m-8 p-4 rounded-md disabled:opacity-50"
                onClick={submitQuiz}
                disabled={isSubmittingQuiz}
            >
                {isSubmittingQuiz ? "Submitting..." : "Submit Quiz"}
            </button>


            <button
                className="bg-gray-200 text-gray-800 m-8 p-2 rounded-md"
                onClick={() => setShowSubmissions((prev) => !prev)}
            >
                {showSubmissions ? "Hide" : "View"} Quiz Submissions
            </button>

            <button
                className="bg-gray-200 text-gray-800 m-8 p-2 rounded-md"
                onClick={downloadAllChats}
            >
                Download All Chats
            </button>

            {showSubmissions && (
                <div className="m-8">
                    <QuizSubmissions quizId={quizId} />
                </div>
            )}
        </div>
    );
}
