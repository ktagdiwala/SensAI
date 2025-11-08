import EditIcon from "../assets/Edit.svg";
import TrashIcon from "../assets/Trash.svg";

export type InstructorChoice = {
  id: string;
  label: string;
};

export type InstructorQuestion = {
  id: number;
  title: string;
  description: string;
  points: number;
  choices: InstructorChoice[];
  type?: "true_false" | "multiple_choice";
  correctChoiceId?: string;
};

type QuizCardInstructorProps = {
  question: InstructorQuestion;
  onDelete?: (id: number) => void;
  onEdit?: (question: InstructorQuestion) => void;
};

export default function QuizCardInstructor({ question, onDelete, onEdit }: QuizCardInstructorProps) {
  return (
    <article className="border border-gray-300 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-gray-300 bg-gray-100 px-4 py-2">
        <h2 className="text-lg font-semibold text-gray-800">{question.title}</h2>
        <div className="flex items-center gap-3 text-gray-500">
          <button
            type="button"
            onClick={() => onEdit?.(question)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-200"
            aria-label="Edit question"
          >
            <img src={EditIcon} alt="" className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(question.id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-200"
            aria-label="Delete question"
          >
            <img src={TrashIcon} alt="" className="h-5 w-5" />
          </button>
          <span className="ml-2 text-sm font-semibold text-gray-700">{question.points} pts</span>
        </div>
      </header>

      <div className="px-6 py-6 text-sm leading-6 text-gray-700">
        <p className="mb-6">{question.description}</p>

        <div className="border border-gray-200">
          {question.choices.map((choice, idx) => (
            <label
              key={choice.id}
              className={`flex items-center gap-3 px-4 py-3 text-sm text-gray-700 ${
                idx < question.choices.length - 1 ? "border-b border-gray-200" : ""
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                disabled
                className="h-4 w-4 cursor-default accent-gray-400"
                checked={choice.id === question.correctChoiceId}
                onChange={() => {}}
              />
              {choice.label}
            </label>
          ))}
        </div>
      </div>
    </article>
  );
}