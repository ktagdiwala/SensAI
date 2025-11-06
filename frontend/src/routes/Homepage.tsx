import { useState } from "react";
import SignUp from "../components/SignUpComponent";
import SignIn from "../components/SignInComponent";

type AuthState =
    | { mode: "signIn"; role: "instructor" | "student" }
    | { mode: "signUp"; role: "instructor" | "student" }
    | null;

export default function Home() {
    const [activeAuth, setActiveAuth] = useState<AuthState>(null);

    const openSignIn = (role: "instructor" | "student") => setActiveAuth({ mode: "signIn", role });
    const openSignUp = (role: "instructor" | "student") => setActiveAuth({ mode: "signUp", role });
    const closeModal = () => setActiveAuth(null);

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center space-y-10 bg-white">
            <h1 className="text-3xl font-semibold text-slate-900">Welcome to the home page</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button
                    className="rounded-lg bg-slate-800 px-8 py-3 text-white font-semibold shadow hover:bg-slate-400 transition"
                    onClick={() => openSignIn("instructor")}
                >
                    Instructor Sign in
                </button>
                <button
                    className="rounded-lg bg-slate-800 px-8 py-3 text-white font-semibold shadow hover:bg-slate-400 transition"
                    onClick={() => openSignIn("student")}
                >
                    Student Sign in
                </button>
                <button
                    className="rounded-lg bg-ai-blue-dark px-8 py-3 text-white font-semibold shadow hover:bg-blue-500 transition"
                    onClick={() => openSignUp("instructor")}
                >
                    Instructor Sign Up
                </button>
                <button
                    className="rounded-lg bg-ai-blue-dark px-8 py-3 text-white font-semibold shadow hover:bg-blue-500 transition"
                    onClick={() => openSignUp("student")}
                >
                    Student Sign Up
                </button>
            </div>

            {activeAuth && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    {activeAuth.mode === "signIn" ? (
                        <SignIn signInType={activeAuth.role} onClose={closeModal} />
                    ) : (
                        <SignUp signUpType={activeAuth.role} onClose={closeModal} />
                    )}
                </div>
            )}
        </section>
    );
}
