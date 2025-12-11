import React, { useEffect, useState } from "react";

interface Course {
    courseId: number;
    title: string;
}

interface Quiz {
    quizId: number;
    quizTitle: string;
    accessCode: string;
    courseTitle: string;
}

interface Metrics {
    totals: {
        user_count: number;
        student_count: number;
        instructor_count: number;
        quiz_count: number;
        course_count: number;
    };
    questionsByQuiz: Array<{
        courseId: number;
        courseName: string;
        quizId: number;
        quizTitle: string;
        question_count: number;
    }>;
    questionsByCourse: Array<{
        courseId: number;
        courseName: string;
        total_questions_per_course: number;
    }>;
    totalAttempts: Array<{
        quizId: number;
        quizTitle: string;
        attempt_count: number;
    }>;
}

interface QuizStats {
    totalAttempts: number;
    averageScore: number;
    completionRate: number;
    avgAIMessages: number;
}

interface QuestionStat {
    questionNumber: number;
    title: string;
    correctAns: string;
    percent_correct: number;
    avg_msgs: number;
    avg_confidence: number;
}

const API_BASE = "http://localhost:3000/api";

export default function InstructorAnalyticsPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
    
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
    const [questionStats, setQuestionStats] = useState<QuestionStat[]>([]);
    
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingQuizzes, setLoadingQuizzes] = useState(false);
    const [loadingMetrics, setLoadingMetrics] = useState(true);
    const [loadingStats, setLoadingStats] = useState(false);
    const [loadingQuestionStats, setLoadingQuestionStats] = useState(false);
    
    const [error, setError] = useState<string | null>(null);

    // Fetch all courses on component mount
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await fetch(`${API_BASE}/quiz/courses`, {
                    credentials: "include",
                });
                if (!response.ok) throw new Error("Failed to fetch courses");
                const data = await response.json();
                setCourses(Array.isArray(data.courses) ? data.courses : []);
                if (data.courses && data.courses.length > 0) {
                    setSelectedCourseId(data.courses[0].courseId);
                }
            } catch (err) {
                console.error("Error fetching courses:", err);
                setError("Failed to load courses");
            } finally {
                setLoadingCourses(false);
            }
        };

        fetchCourses();
    }, []);

    // Fetch quizzes for selected course
    useEffect(() => {
        if (!selectedCourseId) {
            setQuizzes([]);
            setSelectedQuizId(null);
            return;
        }

        const fetchQuizzes = async () => {
            setLoadingQuizzes(true);
            try {
                const response = await fetch(`${API_BASE}/quiz/course/${selectedCourseId}`, {
                    credentials: "include",
                });
                if (!response.ok) throw new Error("Failed to fetch quizzes");
                const data = await response.json();
                setQuizzes(Array.isArray(data.quizzes) ? data.quizzes : []);
                if (data.quizzes && data.quizzes.length > 0) {
                    setSelectedQuizId(data.quizzes[0].quizId);
                } else {
                    setSelectedQuizId(null);
                }
            } catch (err) {
                console.error("Error fetching quizzes:", err);
                setError("Failed to load quizzes");
                setQuizzes([]);
                setSelectedQuizId(null);
            } finally {
                setLoadingQuizzes(false);
            }
        };

        fetchQuizzes();
    }, [selectedCourseId]);

    // Fetch platform metrics
    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await fetch(`${API_BASE}/analytic/metrics`, {
                    credentials: "include",
                });
                if (!response.ok) throw new Error("Failed to fetch metrics");
                const data = await response.json();
                setMetrics(data.metrics);
            } catch (err) {
                console.error("Error fetching metrics:", err);
                setError("Failed to load platform metrics");
            } finally {
                setLoadingMetrics(false);
            }
        };

        fetchMetrics();
    }, []);

    // Fetch quiz statistics
    useEffect(() => {
        if (!selectedQuizId) {
            setQuizStats(null);
            return;
        }

        const fetchQuizStats = async () => {
            setLoadingStats(true);
            try {
                const response = await fetch(`${API_BASE}/analytic/quizStats/${selectedQuizId}`, {
                    credentials: "include",
                });
                if (!response.ok) throw new Error("Failed to fetch quiz stats");
                const data = await response.json();
                setQuizStats(data.stats);
            } catch (err) {
                console.error("Error fetching quiz stats:", err);
                setError("Failed to load quiz statistics");
                setQuizStats(null);
            } finally {
                setLoadingStats(false);
            }
        };

        fetchQuizStats();
    }, [selectedQuizId]);

    // Fetch question statistics
    useEffect(() => {
        if (!selectedQuizId) {
            setQuestionStats([]);
            return;
        }

        const fetchQuestionStats = async () => {
            setLoadingQuestionStats(true);
            try {
                const response = await fetch(`${API_BASE}/analytic/questionStats/${selectedQuizId}`, {
                    credentials: "include",
                });
                if (!response.ok) throw new Error("Failed to fetch question stats");
                const data = await response.json();
                setQuestionStats(Array.isArray(data.insights) ? data.insights : []);
            } catch (err) {
                console.error("Error fetching question stats:", err);
                setError("Failed to load question statistics");
                setQuestionStats([]);
            } finally {
                setLoadingQuestionStats(false);
            }
        };

        fetchQuestionStats();
    }, [selectedQuizId]);

    const metricCards = metrics ? [
        { label: "Total Users", value: metrics.totals.user_count, icon: "👥" },
        { label: "Students", value: metrics.totals.student_count, icon: "🎓" },
        { label: "Instructors", value: metrics.totals.instructor_count, icon: "👨‍🏫" },
        { label: "Total Quizzes", value: metrics.totals.quiz_count, icon: "📝" },
        { label: "Total Courses", value: metrics.totals.course_count, icon: "📚" }
    ] : [];

    const quizStatCards = quizStats ? [
        { label: "Attempts", value: quizStats.totalAttempts, icon: "📊" },
        { label: "Avg Score", value: `${quizStats.averageScore}`, icon: "⭐" },
        { label: "Completion Rate", value: `${quizStats.completionRate}%`, icon: "✅" },
        { label: "Avg AI Messages", value: quizStats.avgAIMessages, icon: "💬" }
    ] : [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-10 text-slate-800">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-center text-4xl font-bold text-gray-900">
                        Instructor Analytics Dashboard
                    </h1>
                    <p className="mt-2 text-center text-gray-600">
                        Track platform metrics and dive deep into quiz performance
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800 border border-red-200">
                        {error}
                    </div>
                )}

                {/* Platform Metrics Section */}
                <div className="mb-10">
                    <h2 className="mb-4 text-2xl font-bold text-gray-900">Platform Overview</h2>
                    {loadingMetrics ? (
                        <div className="text-center text-gray-600">Loading metrics...</div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            {metricCards.map(({ label, value, icon }) => (
                                <div
                                    key={label}
                                    className="rounded-xl bg-white px-6 py-6 text-center shadow-md hover:shadow-lg transition-shadow"
                                >
                                    <div className="text-3xl mb-2">{icon}</div>
                                    <span className="text-3xl font-bold text-indigo-600">{value}</span>
                                    <p className="mt-2 text-sm text-gray-600">{label}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quiz Selection and Statistics Section */}
                <div className="mb-10">
                    <h2 className="mb-4 text-2xl font-bold text-gray-900">Quiz Analysis</h2>
                    
                    {/* Dropdowns */}
                    <div className="mb-6 flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Course
                            </label>
                            <select
                                value={selectedCourseId || ""}
                                onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                                disabled={loadingCourses}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                            >
                                <option value="">-- Select a Course --</option>
                                {courses.map((course) => (
                                    <option key={course.courseId} value={course.courseId}>
                                        {course.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Quiz
                            </label>
                            <select
                                value={selectedQuizId || ""}
                                onChange={(e) => setSelectedQuizId(Number(e.target.value))}
                                disabled={loadingQuizzes || quizzes.length === 0}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                            >
                                <option value="">-- Select a Quiz --</option>
                                {quizzes.map((quiz) => (
                                    <option key={quiz.quizId} value={quiz.quizId}>
                                        {quiz.quizTitle}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Quiz Stats Cards */}
                    {loadingStats ? (
                        <div className="text-center text-gray-600">Loading quiz statistics...</div>
                    ) : selectedQuizId && quizStats ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {quizStatCards.map(({ label, value, icon }) => (
                                <div
                                    key={label}
                                    className="rounded-xl bg-white px-6 py-6 shadow-md hover:shadow-lg transition-shadow"
                                >
                                    <div className="text-3xl mb-2">{icon}</div>
                                    <span className="text-3xl font-bold text-indigo-600">{value}</span>
                                    <p className="mt-2 text-sm text-gray-600">{label}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-600">
                            Select a quiz to view its statistics
                        </div>
                    )}
                </div>

                {/* Placeholder sections */}
                <div className="mt-8 rounded-xl bg-white p-6 shadow-md">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Question Insights</h2>
                    {loadingQuestionStats ? (
                        <div className="flex h-32 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
                            Loading question statistics...
                        </div>
                    ) : selectedQuizId && questionStats.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200">
                                        <th className="px-2 py-3 text-center text-sm font-semibold text-gray-700 w-12">
                                            Question #
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                            Question Title
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                            Correct Answer
                                        </th>
                                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                            % Correct (1st Attempt)
                                        </th>
                                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                            Avg AI Messages
                                        </th>
                                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                            Avg Confidence
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {questionStats.map((stat, index) => (
                                        <tr
                                            key={stat.questionNumber}
                                            className={`border-b border-gray-200 hover:bg-indigo-50 transition-colors ${
                                                index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                            }`}
                                        >
                                            <td className="px-2 py-4 text-sm font-medium text-gray-900 w-12 text-center">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {stat.title}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                                                <span className="inline-block bg-blue-50 border border-blue-200 rounded px-3 py-1 text-blue-900">
                                                    {stat.correctAns}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-gray-700">
                                                <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-semibold ${
                                                    stat.percent_correct >= 75 ? "bg-green-100 text-green-800" :
                                                    stat.percent_correct >= 50 ? "bg-yellow-100 text-yellow-800" :
                                                    "bg-red-100 text-red-800"
                                                }`}>
                                                    {stat.percent_correct}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-gray-700">
                                                {stat.avg_msgs}
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-gray-700">
                                                <div className="flex items-center justify-center">
                                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-indigo-600 h-2 rounded-full"
                                                            style={{ width: `${(stat.avg_confidence / 2) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="ml-2 text-sm font-medium">
                                                        {stat.avg_confidence.toFixed(2)} / 2.0
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex h-32 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
                            {selectedQuizId ? "No question data available" : "Select a quiz to view question insights"}
                        </div>
                    )}
                </div>

                <div className="mt-8 rounded-xl bg-white p-6 shadow-md">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Visualizations</h2>
                    <div className="flex h-56 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
                        Coming soon: Visualizations and charts
                    </div>
                </div>
            </div>
        </div>
    );
}