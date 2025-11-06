import { Link } from 'react-router-dom';
import EditIcon from '../assets/Edit.svg';
import TrashIcon from '../assets/Trash.svg';

export default function InstructorPage() {

    //TODO replace this with api call to backend to get all quizes
    const quizzes = ['Quiz 1', 'Quiz 2', 'Quiz 3'];

    return (
        <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-10 px-6 py-12">
            <header className="flex justify-center">
                <Link
                    to="/quiz-create"
                    className="inline-flex items-center justify-center rounded-md bg bg-canvas-light-blue px-8 py-3 text-lg font-semibold text-white shadow-md transition hover:bg-(--color-blue-600,#01539a) focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
                >
                    Create Quiz
                </Link>
            </header>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">List of Quizzes</h2>
                <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                    <ul>
                        {quizzes.map((quiz) => (
                            <li
                                key={quiz}
                                className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 last:border-b-0"
                            >
                                <span className="text-base font-medium text-slate-800">{quiz}</span>
                                <div className="flex items-center gap-4 text-sm font-medium">
                                    <button className="flex items-center gap-2 ">
                                        <img src={EditIcon} alt="Edit" className="h-4 w-4" />
                                        Edit
                                    </button>
                                    <button className="flex items-center gap-2">
                                        <img src={TrashIcon} alt="Delete" className="h-4 w-4" />
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </div>
    );
}