import React from "react";

const kpiData = [
    { label: "Avg Score", value: "75%" },
    { label: "Completion Rate", value: "90%" },
    { label: "Avg Attempts / Question", value: "1.4" },
    { label: "Avg AI Messages / Student", value: "2.6" }
];

const questionRows = [
    { id: 1, question: "Fill in the blank: The internet is composed of ____.", correct: "95%", attempts: "1.1", aiMsgs: "1.5" },
    { id: 2, question: "Fill in the blank: Hosts are also known as ____.", correct: "100%", attempts: "1.0", aiMsgs: "0.5" },
    { id: 3, question: "Which of the following is the core-level tier?", correct: "70%", attempts: "1.4", aiMsgs: "1.8" },
    { id: 4, question: "True/False: Communication links can be wired or wireless.", correct: "85%", attempts: "1.3", aiMsgs: "1.5" },
    { id: 5, question: "Calculate the delay for a link with 5 Mb data.", correct: "50%", attempts: "1.6", aiMsgs: "3.5" }
];

export default function InstructorAnalyticsPage() {
    return (
        <div className="min-h-screen bg-white px-6 py-10 text-slate-800">
            <h1 className="text-center text-3xl font-semibold">
                Instructor Analytics Dashboard
            </h1>

            <div className="mt-6 flex flex-wrap gap-4">
                <select
                    className="min-w-[200px] flex-1 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    defaultValue="Network Basics"
                >
                    <option disabled>Select Course</option>
                    <option>Network Basics</option>
                    <option>Operating Systems</option>
                    <option>Data Structures</option>
                </select>

                <select
                    className="min-w-[200px] flex-1 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    defaultValue="Midterm Review"
                >
                    <option disabled>Select Quiz</option>
                    <option>Midterm Review</option>
                    <option>Chapter 1 Quiz</option>
                    <option>Final Prep</option>
                </select>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpiData.map(({ label, value }) => (
                    <div
                        key={label}
                        className="rounded-2xl bg-white px-6 py-6 text-center shadow-xl shadow-slate-900/10"
                    >
                        <span className="text-3xl font-bold">{value}</span>
                        <p className="mt-2 text-sm text-gray-500">{label}</p>
                    </div>
                ))}
            </div>

            <div className="mt-8 rounded-2xl bg-white p-6 shadow-2xl shadow-slate-900/10">
                <h2 className="mb-4 text-lg font-semibold">Question Insights</h2>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                <th className="py-2">#</th>
                                <th className="py-2">Question</th>
                                <th className="py-2">% Correct</th>
                                <th className="py-2">Avg Attempts</th>
                                <th className="py-2">Avg AI Messages</th>
                            </tr>
                        </thead>
                        <tbody>
                            {questionRows.map((row) => (
                                <tr key={row.id} className="border-b border-gray-100 text-gray-800 last:border-b-0">
                                    <td className="py-3">{row.id}</td>
                                    <td className="py-3 pr-4">{row.question}</td>
                                    <td className="py-3">{row.correct}</td>
                                    <td className="py-3">{row.attempts}</td>
                                    <td className="py-3">{row.aiMsgs}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-8 rounded-2xl bg-white p-6 shadow-2xl shadow-slate-900/10">
                <h2 className="text-lg font-semibold">Top Mistake Heatmap</h2>
                <div className="mt-4 flex h-56 items-center justify-center rounded-xl bg-gradient-to-br from-rose-200 via-orange-400 to-amber-200 text-base font-semibold tracking-widest text-slate-800">
                    Heatmap Placeholder
                </div>
            </div>
        </div>
    );
}