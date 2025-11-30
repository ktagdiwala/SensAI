import { useState } from 'react';
import type { FormEvent } from 'react';

type Attempt = {
    dateTime?: string;
    quizId?: number;
    quizTitle?: string;
    questionId?: number;
    questionTitle?: string;
    userId?: number;
    isCorrect?: 0 | 1 | boolean | null;
    numMsgs?: number | null;
    [key: string]: unknown;
};

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
            console.log(`[InstructorAttemptsView] Raw response for ${label}:`, data);
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

    const renderCheckbox = (checked: boolean) => (
        <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded border text-sm font-semibold ${
                checked
                    ? 'border-green-600 bg-green-50 text-green-600'
                    : 'border-red-600 bg-red-50 text-red-600'
            }`}
            aria-label={checked ? 'Correct' : 'Incorrect'}
        >
            {checked ? '✓' : '✕'}
        </span>
    );

    const formatFieldLabel = (key: string) => {
        if (key === 'correctAns') return 'Correct Answer';
        if (key === 'otherAns') return 'Other Choices';
        return key;
    };

    const renderAttempts = () => {
        if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
        if (error) return <p className="text-sm text-red-600">{error}</p>;
        if (!attempts) return null;
        if (attempts.length === 0) return <p className="text-sm text-slate-500">No attempts found for {context}.</p>;

        const reservedKeys = new Set([
            'dateTime',
            'quizId',
            'quizTitle',
            'questionId',
            'questionTitle',
            'userId',
            'isCorrect',
            'numMsgs',
        ]);

        return (
            <ul className="space-y-4">
                {attempts.map((attempt, idx) => {
                    const quizTitle = typeof attempt.quizTitle === 'string' ? attempt.quizTitle.trim() : '';
                    const questionTitle = typeof attempt.questionTitle === 'string' ? attempt.questionTitle.trim() : '';
                    const isCorrect = attempt.isCorrect === true || attempt.isCorrect === 1;
                    const otherFields = Object.entries(attempt).filter(([key]) => !reservedKeys.has(key));
                    const fieldLabel = isCorrect ? 'Correct' : 'Incorrect';

                    return (
                        <li key={idx} className="rounded-lg border border-slate-200 p-4 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-700">
                                    Attempted: {attempt.dateTime ? new Date(attempt.dateTime).toLocaleString() : '—'}
                                </p>
                                <p className="text-sm text-slate-500">User ID: {attempt.userId ?? '—'}</p>
                            </div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-md border border-slate-100 p-3">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Quiz</p>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {quizTitle || `Quiz ID: ${attempt.quizId ?? '—'}`}
                                    </p>
                                    {quizTitle && (
                                        <p className="text-sm text-slate-600">ID: {attempt.quizId ?? '—'}</p>
                                    )}
                                </div>
                                <div className="rounded-md border border-slate-100 p-3">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Question</p>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {questionTitle || `Question ID: ${attempt.questionId ?? '—'}`}
                                    </p>
                                    {questionTitle && (
                                        <p className="text-sm text-slate-600">ID: {attempt.questionId ?? '—'}</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-700">{fieldLabel}:</span>
                                    {renderCheckbox(isCorrect)}
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-700">Chat Messages:</span>{' '}
                                    {attempt.numMsgs ?? 0}
                                </div>
                            </div>

                            {otherFields.length > 0 && (
                                <div className="mt-3 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
                                    <p className="mb-1 font-semibold text-slate-700">Additional Data</p>
                                    <dl className="grid gap-1 sm:grid-cols-2">
                                        {otherFields.map(([key, value]) => (
                                            <div key={key}>
                                                <dt className="font-medium">{formatFieldLabel(key)}</dt>
                                                <dd className="break-words text-slate-700">
                                                    {typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
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