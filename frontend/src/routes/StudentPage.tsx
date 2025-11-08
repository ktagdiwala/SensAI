import QuizPage from "./QuizPage";

export default function StudentPage() {
    //TODO
    // Use a protected route flow: keep StudentPage as a form that collects quiz code/password,
    // validate with the backend, and on success navigate to `/quiz/:quizId`, letting QuizPage load by URL.
    
    //Uncomment this to view quizpage
    // return <QuizPage />;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <form className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-6">
                <div className="flex flex-col space-y-2">
                    <label
                        htmlFor="QuizId"
                        className="text-sm font-semibold text-gray-700"
                    >
                        Quiz Id
                    </label>
                    <input
                        type="text"
                        id="QuizId"
                        placeholder="Enter the Quiz ID"
                        className="rounded-full border border-black px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    />
                </div>

                <div className="flex flex-col space-y-2">
                    <label
                        htmlFor="QuizPassword"
                        className="text-sm font-semibold text-gray-700"
                    >
                        Quiz Password
                    </label>
                    <input
                        type="password"
                        id="QuizPassword"
                        placeholder="Enter the Quiz Password"
                        className="rounded-full border border-black px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full rounded-full bg-black px-4 py-2 font-semibold text-white transition hover:bg-gray-900"
                >
                    Submit
                </button>
            </form>
        </div>
    );
}

