import { useState } from "react";
import MainIcon from "../assets/MainIcon.svg"
import CloseIcon from "../assets/xIcon.svg"
type Message = {
    id: string,
    role: "user" | "ai",
    content: string
}

type ChatComponentProps = {
    onClose: () => void;
};

export default function ChatComponent({ onClose }: ChatComponentProps) {

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInput(event.target.value)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        sendMessage();
    };

    const sendMessage = () => {
        if (!input.trim()) return;

        const trimmed = input.trim();
        const timestamp = Date.now().toString();

        const userMessage: Message = {
            id: `${timestamp}-user`,
            role: "user",
            content: trimmed,
        };

        const aiMessage: Message = {
            id: `${timestamp}-ai`,
            role: "ai",
            content: `User said "${trimmed}"`,
        };

        setMessages((prev) => [...prev, userMessage, aiMessage]);
        setInput("");
    };


    return (
        <>
            <div className="flex justify-end pr-6 lg:pr-12 mt-4">

                {/**Header */}
                <div className="flex h-[540px] w-full max-w-md flex-col rounded-3xl bg-ai-blue-light shadow-xl">
                    <div className="flex items-center justify-between gap-4 px-6 py-4">
                       
                        <div className="flex items-center gap-2">
                            <img src={MainIcon} alt="SensAi logo" className="w-6 h-6" />
                            <p className="text-sm font-semibold text-gray-900">SensAi</p>
                        </div>

                        <button onClick={onClose} aria-label="Close chat" className="rounded-full p-1 hover:bg-gray-100 transition">
                            <img src={CloseIcon} alt="Close" className="w-4 h-4" />
                        </button>
                    </div>

                    {/**Info section */}
                    {/**TODO DECIDE TO KEEP THIS OR REMOVE IT */}
                    <div className="px-6 pb-6">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <img src={MainIcon} alt="SensAi" className="w-20 drop-shadow-2xl" />
                            <p className="font-light text-gray-800">
                                Ask me any questions you might have for Question ID
                            </p>
                        </div>
                    </div>

                    {/**Chat section */}
                    <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-6 [scrollbar-width:thin] [scrollbar-color:#9ca3af_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400">
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