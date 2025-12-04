type ConfidenceValue = 0 | 1 | 2;

type SelfConfidenceProps = {
    value: ConfidenceValue | null;
    onChange: (value: ConfidenceValue) => void;
    disabled?: boolean;
    name?: string;
};

const options: { label: string; value: ConfidenceValue }[] = [
    { label: "Low", value: 0 },
    { label: "Medium", value: 1 },
    { label: "High", value: 2 },
];

export default function SelfConfidence({
    value,
    onChange,
    disabled = false,
    name = "self-confidence",
}: SelfConfidenceProps) {
    return (
        <div className="mt-6">
            <p className="text-sm font-semibold text-gray-800 mb-2">
                How confident are you in your answer?
            </p>
            <div className="flex flex-wrap gap-3">
                {options.map((option) => (
                    <label
                        key={option.value}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm cursor-pointer ${
                            disabled
                                ? "opacity-60 cursor-not-allowed"
                                : value === option.value
                                    ? "border-canvas-dark-blue text-canvas-dark-blue bg-blue-50"
                                    : "border-gray-300 text-gray-700 hover:border-canvas-dark-blue"
                        }`}
                    >
                        <input
                            type="radio"
                            name={name}
                            className="accent-canvas-dark-blue"
                            disabled={disabled}
                            checked={value === option.value}
                            onChange={() => onChange(option.value)}
                        />
                        {option.label}
                    </label>
                ))}
            </div>
        </div>
    );
}