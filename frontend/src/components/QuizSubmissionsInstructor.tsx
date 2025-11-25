import { useState } from 'react';
import type { FormEvent } from 'react';

type Attempt = Record<string, unknown>;

const API_BASE = 'http://localhost:3000/api/attempt';

export default function InstructorAttemptsView() {
    const [attempts, setAttempts] = useState<Attempt[] | null>(null);
    const [context, setContext] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [quizId, setQuizId] = useState('');
    const [questionId, setQuestionId] = useState('');
    const [studentId, setStudentId] = useState('');
    const [studentQuestionId, setStudentQuestionId] = useState('');
    const [studentQuizId, setStudentQuizId] = useState('');

    const fetchAttempts = async (endpoint: string, label: string) => {
        setLoading(true);
        setError('');
        setAttempts(null);
        setContext(label);
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'GET',
                credentials: 'include',
            });
            if (!res.ok) throw new Error(`Request failed with ${res.status}`);
            const data = await res.json();
            setAttempts(Array.isArray(data.attempts) ? data.attempts : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const submitHandler = (cb: () => void) => (evt: FormEvent<HTMLFormElement>) => {
        evt.preventDefault();
        cb();
    };

    const renderAttempts = () => {
        if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
        if (error) return <p className="text-sm text-red-600">{error}</p>;
        if (!attempts) return null;
        if (attempts.length === 0) return <p className="text-sm text-slate-500">No attempts found for {context}.</p>;

        const columns = Array.from(new Set(attempts.flatMap((attempt) => Object.keys(attempt))));

        return (
            <div className="overflow-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            {columns.map((col) => (
                                <th key={col} className="px-3 py-2 text-left font-semibold text-slate-600 uppercase tracking-wide">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {attempts.map((attempt, idx) => (
                            <tr key={idx}>
                                {columns.map((col) => (
                                    <td key={col} className="px-3 py-2 text-slate-800">
                                        {String(attempt[col] ?? '')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-6 rounded-lg border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800">Attempt Lookups</h3>

            <form className="space-y-3" onSubmit={submitHandler(() => fetchAttempts(`/quiz/${quizId}`, `quiz ${quizId}`))}>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                    Quiz ID
                    <input
                        required
                        type="number"
                        value={quizId}
                        onChange={(e) => setQuizId(e.target.value)}
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                </label>
                <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" type="submit">
                    Fetch Quiz Attempts
                </button>
            </form>

            <form className="space-y-3" onSubmit={submitHandler(() => fetchAttempts(`/question/${questionId}`, `question ${questionId}`))}>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                    Question ID
                    <input
                        required
                        type="number"
                        value={questionId}
                        onChange={(e) => setQuestionId(e.target.value)}
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                </label>
                <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" type="submit">
                    Fetch Question Attempts
                </button>
            </form>

            <form className="space-y-3" onSubmit={submitHandler(() => fetchAttempts(`/student/${studentId}`, `student ${studentId}`))}>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                    Student ID
                    <input
                        required
                        type="number"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                </label>
                <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" type="submit">
                    Fetch Student Attempts
                </button>
            </form>

            <form
                className="space-y-3"
                onSubmit={submitHandler(() =>
                    fetchAttempts(`/student/${studentId}/question/${studentQuestionId}`, `student ${studentId} & question ${studentQuestionId}`)
                )}
            >
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                        Student ID
                        <input
                            required
                            type="number"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                        Question ID
                        <input
                            required
                            type="number"
                            value={studentQuestionId}
                            onChange={(e) => setStudentQuestionId(e.target.value)}
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                    </label>
                </div>
                <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" type="submit">
                    Fetch Student & Question Attempts
                </button>
            </form>

            <form
                className="space-y-3"
                onSubmit={submitHandler(() => fetchAttempts(`/student/${studentId}/quiz/${studentQuizId}`, `student ${studentId} & quiz ${studentQuizId}`))}
            >
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                        Student ID
                        <input
                            required
                            type="number"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                        Quiz ID
                        <input
                            required
                            type="number"
                            value={studentQuizId}
                            onChange={(e) => setStudentQuizId(e.target.value)}
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                    </label>
                </div>
                <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" type="submit">
                    Fetch Student & Quiz Attempts
                </button>
            </form>

            <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">Results</p>
                {renderAttempts()}
            </div>
        </div>
    );
}