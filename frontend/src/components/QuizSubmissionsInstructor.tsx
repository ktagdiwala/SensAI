import { useState, useEffect, useMemo } from 'react';
import type { FormEvent } from 'react';

type Attempt = {
    dateTime?: string;
    quizId?: number;
    quizTitle?: string;
    questionId?: number;
    questionTitle?: string;
    userId?: number;
    userName?: string;
    isCorrect?: 0 | 1 | boolean | null;
    numMsgs?: number | null;
    [key: string]: unknown;
};

type Student = {
    userId: number;
    name: string;
    email: string;
};

type Quiz = {
    quizId: number;
    quizTitle: string;
    accessCode?: string;
    courseTitle?: string;
};

type Question = {
    questionId: number;
    title: string;
    correctAns: string;
    otherAns: string;
    prompt?: string;
};

const API_BASE = 'http://localhost:3000/api/attempt';
const API_QUIZ = 'http://localhost:3000/api/quiz';
const API_QUESTION = 'http://localhost:3000/api/question';

export default function InstructorAttemptsView() {
    const [attempts, setAttempts] = useState<Attempt[] | null>(null);
    const [context, setContext] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Student data
    const [students, setStudents] = useState<Student[]>([]);
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [studentsError, setStudentsError] = useState('');

    // Quiz data
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [quizzesLoading, setQuizzesLoading] = useState(true);
    const [quizzesError, setQuizzesError] = useState('');

    // Question data
    const [questions, setQuestions] = useState<Question[]>([]);
    const [questionsLoading, setQuestionsLoading] = useState(false);
    const [questionsError, setQuestionsError] = useState('');
    const [sortField, setSortField] = useState<'dateTime' | 'quizTitle' | 'questionTitle' | 'userName' | 'isCorrect'>('dateTime');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Form state
    const [quizId, setQuizId] = useState('');
    const [questionId, setQuestionId] = useState('');
    const [studentId, setStudentId] = useState('');
    const [studentQuestionId, setStudentQuestionId] = useState('');
    const [studentQuizId, setStudentQuizId] = useState('');

    // Fetch students list on component mount
    useEffect(() => {
        const fetchStudents = async () => {
            setStudentsLoading(true);
            setStudentsError('');
            try {
                const res = await fetch(`${API_BASE}/students`, {
                    method: 'GET',
                    credentials: 'include',
                });
                if (!res.ok) throw new Error(`Request failed with ${res.status}`);
                const data = await res.json();
                setStudents(Array.isArray(data.students) ? data.students : []);
            } catch (err) {
                setStudentsError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setStudentsLoading(false);
            }
        };
        fetchStudents();
    }, []);

    // Fetch quizzes list on component mount
    useEffect(() => {
        const fetchQuizzes = async () => {
            setQuizzesLoading(true);
            setQuizzesError('');
            try {
                const res = await fetch(`${API_QUIZ}`, {
                    method: 'GET',
                    credentials: 'include',
                });
                if (!res.ok) throw new Error(`Request failed with ${res.status}`);
                const data = await res.json();
                setQuizzes(Array.isArray(data.quizzes) ? data.quizzes : []);
            } catch (err) {
                setQuizzesError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setQuizzesLoading(false);
            }
        };
        fetchQuizzes();
    }, []);

    // Fetch questions for selected quiz
    useEffect(() => {
        if (!quizId) {
            setQuestions([]);
            setQuestionsError('');
            return;
        }

        const fetchQuestions = async () => {
            setQuestionsLoading(true);
            setQuestionsError('');
            try {
                const res = await fetch(`${API_QUESTION}/quiz/${quizId}`, {
                    method: 'GET',
                    credentials: 'include',
                });
                if (!res.ok) throw new Error(`Request failed with ${res.status}`);
                const data = await res.json();
                setQuestions(Array.isArray(data.questions) ? data.questions : []);
            } catch (err) {
                setQuestionsError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setQuestionsLoading(false);
            }
        };
        fetchQuestions();
    }, [quizId]);

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
            
            // Enrich attempts with student names
            const attemptsData = Array.isArray(data.attempts) ? data.attempts : [];
            const studentMap = new Map(students.map(s => [s.userId, s.name]));
            const enrichedAttempts = attemptsData.map((attempt: Attempt) => ({
                ...attempt,
                userName: attempt.userId ? (studentMap.get(attempt.userId) || `User ${attempt.userId}`) : 'Unknown User'
            }));
            
            setAttempts(enrichedAttempts);
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
		if (key === 'selfConfidence') return 'Self Confidence';
		if (key === 'mistakeTypeLabel') return 'Mistake Type';
		if (key === 'givenAns') return 'Student Answered';
        return key;
    };

    const renderFieldValue = (key: string, value: unknown) => {
        // Handle null values
        if (value === null || value === undefined) {
            return '-';
        }

        // Special handling for otherAns field
        if (key === 'otherAns' && typeof value === 'string') {
            const choices = value.split('{|}').filter(choice => choice.trim());
            if (choices.length > 0) {
                return (
                    <ul className="list-inside space-y-1">
                        {choices.map((choice, idx) => (
                            <li key={idx} className="text-slate-700">
                                • {choice.trim()}
                            </li>
                        ))}
                    </ul>
                );
            }
        }
        
        // Default rendering
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value ?? '-');
    };

    const sortedAttempts = useMemo(() => {
        if (!attempts) return null;
        const normalize = (value: unknown): string | number => {
            if (value === null || value === undefined) return '';
            if (typeof value === 'number') return value;
            if (typeof value === 'boolean') return value ? 1 : 0;
            return String(value).toLowerCase();
        };
        const valueGetter: Record<typeof sortField, (attempt: Attempt) => number | string> = {
            dateTime: (a) => new Date(a.dateTime ?? 0).getTime(),
            quizTitle: (a) => normalize(a.quizTitle),
            questionTitle: (a) => normalize(a.questionTitle),
            userName: (a) => normalize(a.userName),
            isCorrect: (a) => (a.isCorrect === true || a.isCorrect === 1 ? 1 : 0),
        };
        return [...attempts].sort((a, b) => {
            const valA = valueGetter[sortField](a);
            const valB = valueGetter[sortField](b);
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [attempts, sortField, sortOrder]);

    const renderAttempts = () => {
        if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
        if (error) return <p className="text-sm text-red-600">{error}</p>;
        if (!sortedAttempts) return null;
        if (sortedAttempts.length === 0) return <p className="text-sm text-slate-500">No attempts found for {context}.</p>;

        const reservedKeys = new Set([
            'dateTime',
            'quizId',
            'quizTitle',
            'questionId',
            'questionTitle',
            'userId',
            'userName',
            'isCorrect',
            'numMsgs',
        ]);

        return (
            <ul className="space-y-4">
                {sortedAttempts.map((attempt, idx) => {
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
                                <p className="text-sm text-slate-500">{attempt.userName + ` (ID: ${attempt.userId})`}</p>
                            </div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-md border border-slate-100 p-3">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Quiz Id: {attempt.quizId ?? '—'} </p>
                                  
                                    <p className="text-sm font-semibold text-slate-800">
                                        {`Quiz Title: ${quizTitle}`}
                                    </p>
                                    

                                </div>
                                <div className="rounded-md border border-slate-100 p-3">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Question Id: {attempt.questionId} </p>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {questionTitle || `Question ID: ${attempt.questionId ?? '—'}`}
                                    </p>
                            
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
                                                <dd className="wrap-break-word text-slate-700">
                                                    {renderFieldValue(key, value)}
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

            {/* Student Filter Dropdown */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                    Filter by Student
                    {studentsLoading ? (
                        <p className="text-sm text-slate-500">Loading students...</p>
                    ) : studentsError ? (
                        <p className="text-sm text-red-600">{studentsError}</p>
                    ) : (
                        <select
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                        >
                            <option value="">-- Select a Student --</option>
                            {students.map((student) => (
                                <option key={student.userId} value={student.userId}>
                                    {student.name} ({student.email})
                                </option>
                            ))}
                        </select>
                    )}
                </label>
                {studentId && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            onClick={() => fetchAttempts(`/student/${studentId}`, `student ${studentId}`)}
                            className="rounded-md bg-canvas-light-blue px-4 py-2 text-sm font-semibold text-white hover:bg-canvas-dark-blue"
                        >
                            View All Attempts
                        </button>

                    </div>
                )}
            </div>

            {/* Quiz Filter Dropdown */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                    Filter by Quiz
                    {quizzesLoading ? (
                        <p className="text-sm text-slate-500">Loading quizzes...</p>
                    ) : quizzesError ? (
                        <p className="text-sm text-red-600">{quizzesError}</p>
                    ) : (
                        <select
                            value={quizId}
                            onChange={(e) => setQuizId(e.target.value)}
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                        >
                            <option value="">-- Select a Quiz --</option>
                            {quizzes.map((quiz) => (
                                <option key={quiz.quizId} value={quiz.quizId}>
                                    {quiz.quizTitle}
                                </option>
                            ))}
                        </select>
                    )}
                </label>
                {quizId && (
                    <div className="mt-3">
                        <button
                            onClick={() => fetchAttempts(`/quiz/${quizId}`, `quiz ${quizId}`)}
                            className="rounded-md bg-canvas-light-blue px-4 py-2 text-sm font-semibold text-white hover:bg-canvas-dark-blue"
                        >
                            View Quiz Attempts
                        </button>
                    </div>
                )}
            </div>

            {/* Question Filter Dropdown (dependent on Quiz selection) */}
            {quizId && (
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                        Filter by Question (from selected quiz)
                        {questionsLoading ? (
                            <p className="text-sm text-slate-500">Loading questions...</p>
                        ) : questionsError ? (
                            <p className="text-sm text-red-600">{questionsError}</p>
                        ) : questions.length === 0 ? (
                            <p className="text-sm text-slate-500">No questions found for this quiz.</p>
                        ) : (
                            <select
                                value={questionId}
                                onChange={(e) => setQuestionId(e.target.value)}
                                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                            >
                                <option value="">-- Select a Question --</option>
                                {questions.map((question) => (
                                    <option key={question.questionId} value={question.questionId}>
                                        {question.title}
                                    </option>
                                ))}
                            </select>
                        )}
                    </label>
                    {questionId && (
                        <div className="mt-3">
                            <button
                                onClick={() => fetchAttempts(`/question/${questionId}`, `question ${questionId}`)}
                                className="rounded-md bg-canvas-light-blue px-4 py-2 text-sm font-semibold text-white hover:bg-canvas-dark-blue"
                            >
                                View Question Attempts
                            </button>
                        </div>
                    )}
                </div>
            )}

            {studentId && (
                <>
                    <form className="space-y-3" onSubmit={submitHandler(() => fetchAttempts(`/student/${studentId}/question/${studentQuestionId}`, `student ${studentId} & question ${studentQuestionId}`))}>
                        <div className="grid gap-3 sm:grid-cols-1">
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
                        <button className="rounded-md bg-canvas-light-blue px-4 py-2 text-sm font-semibold text-white hover:bg-canvas-dark-blue" type="submit">
                            Fetch Student & Question Attempts
                        </button>
                    </form>

                    <form className="space-y-3" onSubmit={submitHandler(() => fetchAttempts(`/student/${studentId}/quiz/${studentQuizId}`, `student ${studentId} & quiz ${studentQuizId}`))}>
                        <div className="grid gap-3 sm:grid-cols-1">
                            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                                Quiz
                                {quizzesLoading ? (
                                    <p className="text-sm text-slate-500">Loading quizzes...</p>
                                ) : quizzesError ? (
                                    <p className="text-sm text-red-600">{quizzesError}</p>
                                ) : (
                                    <select
                                        required
                                        value={studentQuizId}
                                        onChange={(e) => setStudentQuizId(e.target.value)}
                                        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                                    >
                                        <option value="">-- Select a Quiz --</option>
                                        {quizzes.map((quiz) => (
                                            <option key={quiz.quizId} value={quiz.quizId}>
                                                {quiz.quizTitle}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </label>
                        </div>
                        <button
                            className="rounded-md bg-canvas-light-blue px-4 py-2 text-sm font-semibold text-white hover:bg-canvas-dark-blue disabled:cursor-not-allowed disabled:bg-canvas-gray"
                            type="submit"
                            disabled={!studentQuizId}
                        >
                            Fetch Student & Quiz Attempts
                        </button>
                    </form>
                </>
            )}

            <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">Results</p>
                {attempts && attempts.length > 0 && (
                    <div className="flex flex-wrap gap-3 text-sm text-slate-700">
                        <label className="flex flex-col gap-1">
                            Sort by
                            <select
                                value={sortField}
                                onChange={(e) => setSortField(e.target.value as typeof sortField)}
                                className="rounded-md border border-slate-300 px-3 py-2"
                            >
                                <option value="dateTime">Date</option>
                                <option value="quizTitle">Quiz Title</option>
                                <option value="questionTitle">Question Title</option>
                                <option value="userName">Student Name</option>
                                <option value="isCorrect">Correctness</option>
                            </select>
                        </label>
                        <label className="flex flex-col gap-1">
                            Order
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                                className="rounded-md border border-slate-300 px-3 py-2"
                            >
                                <option value="asc">Ascending</option>
                                <option value="desc">Descending</option>
                            </select>
                        </label>
                    </div>
                )}
                {renderAttempts()}
            </div>
        </div>
    );
}