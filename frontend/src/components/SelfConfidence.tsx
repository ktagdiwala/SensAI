import SadFace from "../assets/sad.svg";
import NeutralFace from "../assets/neutral.svg";
import SmileFace from "../assets/smile.svg";

type ConfidenceValue = 0 | 1 | 2;

type SelfConfidenceProps = {
    value: ConfidenceValue | null;
    onChange: (value: ConfidenceValue) => void;
    disabled?: boolean;
    name?: string;
};

const options: { label: string; value: ConfidenceValue; icon: string }[] = [
    { label: "Low", value: 0, icon: SadFace },
    { label: "Medium", value: 1, icon: NeutralFace },
    { label: "High", value: 2, icon: SmileFace },
];

const palette: Record<
    ConfidenceValue,
    { idle: string; active: string }
> = {
    0: {
        idle: "bg-red-50 text-red-700 hover:bg-red-100",
        active: "bg-red-200 text-red-900",
    },
    1: {
        idle: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
        active: "bg-yellow-200 text-yellow-900",
    },
    2: {
        idle: "bg-green-50 text-green-700 hover:bg-green-100",
        active: "bg-green-200 text-green-900",
    },
};

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
                        className={`border border-gray-300 flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer transition ${
                            disabled
                                ? "opacity-60 cursor-not-allowed"
                                : value === option.value
                                    ? palette[option.value].active
                                    : palette[option.value].idle
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
                        <img src={option.icon} alt={`${option.label} confidence icon`} className="w-5 h-5" />
                        {option.label}
                    </label>
                ))}
            </div>
        </div>
    );
}