import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import EditIcon from '../assets/Edit.svg';
import TrashIcon from '../assets/Trash.svg';
import InstructorAttemptsView from '../components/QuizSubmissionsInstructor';

interface Quiz {
    quizId: number;
    quizTitle: string;
    accessCode: string;
    courseTitle: string;
}

export default function InstructorPage() {

    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const navigate = useNavigate();

    const URL = "http://localhost:3000/api/quiz"
    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const response = await fetch(URL, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include' 
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.quizzes && Array.isArray(data.quizzes)) {
                        setQuizzes(data.quizzes);
                    } else {
                        setQuizzes([]);
                    }

                } else {
                    console.error('Failed to fetch quizzes');
                }
            } catch (error) {
                console.error('Error fetching quizzes:', error);
            }
        };

        fetchQuizzes();
    }, []);

    const handleDelete = async (quizId: number) => {
        const confirmed = window.confirm('Delete this quiz? This cannot be undone.');
        if (!confirmed) return;

        try {
            const response = await fetch(`http://localhost:3000/api/quiz/delete/${quizId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed with status ${response.status}`);
            }

            setQuizzes((prev) => prev.filter((quiz) => quiz.quizId !== quizId));
        } catch (error) {
            console.error('Error deleting quiz:', error);
            alert('Unable to delete quiz right now.');
        }
    };

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
                    {quizzes.length === 0 ? (
                        <div className="p-6 text-center text-slate-500">
                            No quizzes found.
                        </div>
                    ) : (
                        <ul>
                            {quizzes.map((quiz) => (
                                <li
                                    key={quiz.quizId}
                                    className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 last:border-b-0"
                                >
                                    <span className="text-base font-medium text-slate-800">
                                        {quiz.quizTitle}
                                    </span>
                                    <div className="flex items-center gap-4 text-sm font-medium">
                                        <button
                                            type="button"
                                            className="flex items-center gap-2 cursor-pointer"
                                            onClick={() => navigate(`/quiz-create/${quiz.quizId}`)}
                                        >
                                            <img src={EditIcon} alt="Edit" className="h-4 w-4" />
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="flex items-center gap-2 cursor-pointer"
                                            onClick={() => handleDelete(quiz.quizId)}
                                        >
                                            <img src={TrashIcon} alt="Delete" className="h-4 w-4" />
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">Quiz Submission Insights</h2>
                <InstructorAttemptsView />
            </section>
        </div>
    );
}