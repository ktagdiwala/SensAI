type ChatComponentProps = {
    onClose: () => void;
};

export default function ChatComponent({ onClose }: ChatComponentProps) {
    return (
        <>
            <p>Hello, I'm a chat</p>
            <button onClick={onClose}>Close Chat</button>
        </>
    );
}