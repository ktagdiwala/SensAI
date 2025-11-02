import { useState } from "react";

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
    const [input, setInput] = useState("")

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInput(event.target.value)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== "Enter" || !input.trim()) return;

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
            <div>
                {messages.map((m) => (
                    <p key={m.id}>
                        {m.role}: {m.content}
                    </p>
                ))}
                <input
                    type="text"
                    placeholder="TYPE IN ME"
                    value={input}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                />
                <button onClick={onClose}>Close Chat</button>
            </div>
        </>
    );
}