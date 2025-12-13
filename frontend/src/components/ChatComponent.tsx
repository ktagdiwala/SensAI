import { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import MainIcon from "../assets/MainIcon.svg"
import CloseIcon from "../assets/xIcon.svg"
import DownloadIcon from "../assets/downloadicon.svg"

const API_BASE_URL = "http://localhost:3000/api";

type Message = {
    id: string,
    role: "user" | "ai",
    content: string
}

type ChatComponentProps = {
    onClose: () => void;
    quizId?: string;
    questionId: string;
    quizTitle?: string;
    questionNumber?: number;
    questionText?: string;
    questionOptions?: string[];
    onMessagesChange?: (messages: Message[]) => void;
    initialMessages?: Message[];
    isOpen?: boolean;
    onMessageCountChange?: (count: number) => void;
    chatDisabled?: boolean;
};


export default function ChatComponent({ onClose, quizId, questionId, quizTitle: quizTitleProp, questionNumber, questionText, questionOptions, onMessagesChange, initialMessages, isOpen, onMessageCountChange, chatDisabled = false }: ChatComponentProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages || []);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [quizTitle, setQuizTitle] = useState<string>(quizTitleProp || "");
    const chatSectionRef = useRef<HTMLDivElement>(null);
    const prevUserCount = useRef(0);

    // Update messages when initialMessages prop changes (for loading saved chats)
    useEffect(() => {
        if (initialMessages && initialMessages.length > 0) {
            setMessages(initialMessages);
            // Scroll to bottom when loading saved chats
            setTimeout(() => {
                if (chatSectionRef.current) {
                    chatSectionRef.current.scrollTop = chatSectionRef.current.scrollHeight;
                }
            }, 150);
        }
    }, [initialMessages]);

    // Handle chat disabled state
    useEffect(() => {
        if (chatDisabled) {
            // Add system message when chat is disabled
            const systemMessage: Message = {
                id: `system-${Date.now()}`,
                role: "ai",
                content: "Click the reset button to start a new conversation with SensAI",
            };
            setMessages((prev) => {
                // Only add if not already present
                if (prev.some(m => m.content === systemMessage.content)) {
                    return prev;
                }
                return [...prev, systemMessage];
            });
        } else {
            // Remove system message when chat is enabled (on reset)
            setMessages((prev) =>
                prev.filter(m => m.content !== "Click the reset button to start a new conversation with SensAI")
            );
            setInput("");
        }
    }, [chatDisabled]);

    // Fetch quiz title only if not provided as prop
    useEffect(() => {
        if (quizTitleProp) return;
        if (!quizId) return;
        fetch(`http://localhost:3000/api/quiz/id/${quizId}`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => {
                if (data && data.quiz && data.quiz.title) {
                    setQuizTitle(data.quiz.title);
                }
            })
            .catch(() => {});
    }, [quizId, quizTitleProp]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInput(event.target.value)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        sendMessage();
    };

    // Scroll to bottom when new messages arrive (user sends message or AI responds)
    useEffect(() => {
        if (messages.length > 0 && chatSectionRef.current) {
            setTimeout(() => {
                if (chatSectionRef.current) {
                    chatSectionRef.current.scrollTop = chatSectionRef.current.scrollHeight;
                }
            }, 0);
        }
    }, [messages]);

    // Scroll to bottom when chat window opens
    useEffect(() => {
        if (isOpen && chatSectionRef.current) {
            setTimeout(() => {
                if (chatSectionRef.current) {
                    chatSectionRef.current.scrollTop = chatSectionRef.current.scrollHeight;
                }
            }, 100);
        }
    }, [isOpen]);

    const sendMessage = async () => {
        if (!input.trim() || sending || chatDisabled) return;

        const trimmed = input.trim();
        const timestamp = Date.now().toString();

        if (!quizId || !questionId) {
            setMessages((prev) => [
                ...prev,
                { id: `${timestamp}-user`, role: "user", content: trimmed },
                { id: `${timestamp}-ai`, role: "ai", content: "Chat is unavailable for this question." },
            ]);
            setInput("");
            return;
        }

        const userMessage: Message = { id: `${timestamp}-user`, role: "user", content: trimmed };
        const chatHistory = [...messages, userMessage].map((m) => `${m.role}: ${m.content}`).join("\n");

        setMessages((prev) => {
            const next = [...prev, userMessage];
            onMessagesChange?.(next);
            return next;
        });
        setInput("");
        setSending(true);

        try {
            const res = await fetch(`${API_BASE_URL}/ai/gemini`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ studentMessage: trimmed, quizId, questionId, chatHistory }),
            });

            if (!res.ok) throw new Error(await res.text());

            const data = await res.json();

            setMessages((prev) => {
                const next: Message[] = [
                    ...prev,
                    {
                        id: `${Date.now()}-ai`,
                        role: "ai" as const,
                        content: data?.response ?? "No response from AI.",
                    },
                ];
                onMessagesChange?.(next);
                return next;
            });
        } catch (error) {
            setMessages((prev) => {
                const next: Message[] = [
                    ...prev,
                    {
                        id: `${Date.now()}-ai`,
                        role: "ai" as const,
                        content: "Sorry, I couldn't reach the assistant. Please try again.",
                    },
                ];
                onMessagesChange?.(next);
                return next;
            });
        } finally {
            setSending(false);
        }
    };

    const handleDownload = () => {
        if (messages.length === 0) {
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

        // Title
        doc.setFontSize(16);
        doc.text("SensAI Chat History", margin, yPosition);
        yPosition += 10;

        // Quiz Title
        if (quizTitle) {
            doc.setFontSize(12);
            doc.text(`Quiz: ${quizTitle}`, margin, yPosition);
            yPosition += 8;
        }

        // Question heading and content
        doc.setFontSize(12);
        const qHeading = typeof questionNumber === "number" ? `Question ${questionNumber}:` : `Question ID: ${questionId}`;
        doc.text(qHeading, margin, yPosition);
        yPosition += 8;

        if (questionText && questionText.trim().length > 0) {
            doc.setFontSize(11);
            const qLines = doc.splitTextToSize(questionText, maxWidth);
            if (yPosition + qLines.length * 7 > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
            }
            doc.text(qLines, margin, yPosition);
            // Minimal spacing between question text and options
            yPosition += qLines.length * 7 + 1;
        }

        if (Array.isArray(questionOptions) && questionOptions.length > 0) {
            doc.setFontSize(11);
            const bulletOptions = questionOptions.map((opt) => `- ${opt}`);
            const optLines = doc.splitTextToSize(bulletOptions.join("\n"), maxWidth);
            if (yPosition + optLines.length * 7 > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
            }
            doc.text(optLines, margin, yPosition);
            yPosition += optLines.length * 7 + 1;
        }

        // Messages
        doc.setFontSize(11);
        messages.forEach((msg, idx) => {
            const role = msg.role === "user" ? "Student" : "SensAI";
            // Remove emojis from message content for PDF display 
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
            const lines = doc.splitTextToSize(fullText, maxWidth);
            
            // Filter out empty lines that splitTextToSize might create
            const nonEmptyLines = lines.filter((line: string) => line.trim().length > 0);

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
            const spacing = nextRole === role ? 2 : 5; // 2 for same sender (3+2=5 total), 5 for role change (3+5=8 total)
            yPosition += spacing;
        });

        // Download
        const qNum = typeof questionNumber === "number" ? `Q${questionNumber}` : `Q${questionId}`;
        doc.save(`${safeTitle}_${qNum}.pdf`);
    };

    useEffect(() => {
        if (!onMessageCountChange) return;
        const totalSent = messages.filter((m) => m.role === "user").length;
        if (prevUserCount.current === totalSent) return;
        prevUserCount.current = totalSent;
        onMessageCountChange(totalSent);
    }, [messages, onMessageCountChange]);

    return (
        <>
            <div className="flex justify-end pr-6 lg:pr-12 mt-4">
                {/* Header */}
                <div className="flex h-[540px] w-full max-w-md flex-col rounded-3xl bg-ai-blue-light shadow-xl">
                    <div className="flex items-center justify-between gap-4 px-6 py-4">
                        <div className="flex items-center gap-2">
                            <img src={MainIcon} alt="SensAi logo" className="w-6 h-6" />
                            <p className="text-sm font-semibold text-gray-900">SensAI</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDownload}
                                aria-label="Download chat"
                                className="rounded-full p-1 hover:bg-gray-100 transition"
                            >
                                <img src={DownloadIcon} alt="Download" className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onClose}
                                aria-label="Close chat"
                                className="rounded-full p-1 hover:bg-gray-100 transition"
                            >
                                <img src={CloseIcon} alt="Close" className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/**Chat section */}
                    <div
                        ref={chatSectionRef}
                        className="flex-1 overflow-y-auto space-y-4 [scrollbar-width:thin] [scrollbar-color:#9ca3af_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400"
                    >
                        <div className="px-6 pb-1">
                            <div className="flex flex-col items-center gap-4 text-center">
                                <img src={MainIcon} alt="SensAi" className="w-12 drop-shadow-2xl" />
                                <p className="font-light text-gray-800 text-sm">
                                    Ask me any questions you might have
                                </p>
                            </div>
                        </div>

                        <div className="px-6 space-y-4 pb-6">
                            {messages.map((m) => (
                                <div
                                    key={m.id}
                                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                            m.role === "user"
                                                ? "bg-gray-100 text-gray-900"
                                                : "bg-white text-gray-700 shadow"
                                        }`}
                                    >
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/**Input section */}
                    <div className="px-6 pb-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Ask me any questions"
                                value={input}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                className="w-full rounded-full bg-white py-3 pl-5 pr-12 text-sm text-gray-900 placeholder-gray-400 shadow-md focus:outline-none focus:ring-2 focus:ring-chat-gold"
                            />
                            <button
                                type="button"
                                onClick={sendMessage}
                                disabled={chatDisabled}
                                aria-label="Send message"
                                className={`absolute inset-y-0 right-2 my-auto flex h-8 w-8 items-center justify-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-chat-gold ${
                                    chatDisabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
                                }`}
                            >
                                <img
                                    src="/arrow-right-circle-Icon.svg"
                                    alt=""
                                    className="h-6 w-6"
                                />
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </>
    );
}