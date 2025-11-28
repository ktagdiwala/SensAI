import { useState, useRef, useEffect } from "react";
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
};

export default function ChatComponent({ onClose, quizId, questionId }: ChatComponentProps) {

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const chatSectionRef = useRef<HTMLDivElement>(null);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInput(event.target.value)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        sendMessage();
    };

    // Scroll to bottom when messages change
    useEffect(() => {
        if (chatSectionRef.current) {
            chatSectionRef.current.scrollTop = chatSectionRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || sending) return;

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

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setSending(true);

        try {
            const res = await fetch(`${API_BASE_URL}/chat/gemini`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ studentMessage: trimmed, quizId, questionId, chatHistory }),
            });

            if (!res.ok) throw new Error(await res.text());

            const data = await res.json();

            setMessages((prev) => [
                ...prev,
                {
                    id: `${Date.now()}-ai`,
                    role: "ai",
                    content: data?.response ?? "No response from AI.",
                },
            ]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    id: `${Date.now()}-ai`,
                    role: "ai",
                    content: "Sorry, I couldn't reach the assistant. Please try again.",
                },
            ]);
        } finally {
            setSending(false);
        }
    };

    // Example download handler (customize as needed)
    const handleDownload = () => {
        // Implement your download logic here
        alert("Download clicked!");
    };

    return (
        <>
            <div className="flex justify-end pr-6 lg:pr-12 mt-4">
                {/* Header */}
                <div className="flex h-[540px] w-full max-w-md flex-col rounded-3xl bg-ai-blue-light shadow-xl">
                    <div className="flex items-center justify-between gap-4 px-6 py-4">
                        <div className="flex items-center gap-2">
                            <img src={MainIcon} alt="SensAi logo" className="w-6 h-6" />
                            <p className="text-sm font-semibold text-gray-900">SensAi</p>
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
                                aria-label="Send message"
                                className="absolute inset-y-0 right-2 my-auto flex h-8 w-8 items-center justify-center rounded-full transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-chat-gold"
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