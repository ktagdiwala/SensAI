import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type SignInForm = {
    email: string;
    password: string;
};

type SignInProps = {
    signInType: "instructor" | "student";
    onClose: () => void;
};

export default function SignIn({ signInType, onClose }: SignInProps) {
    const [formData, setFormData] = useState<SignInForm>({
        email: "",
        password: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            setIsSubmitting(true);
            const response = await fetch("/api/signin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    role: signInType,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to sign in.");
            }

            console.log("User signed in successfully.");
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const friendlyLabel = signInType === "instructor" ? "Instructor" : "Student";

    return (
        <section className="flex items-center justify-center p-6">
            <div className="relative w-full max-w-md rounded-3xl bg-white shadow-xl border border-canvas-gray p-10">
                <button
                    onClick={onClose}
                    type="button"
                    aria-label="Close sign in"
                    className="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-100 transition"
                >
                    <img src="xIcon.svg" alt="Close" className="w-4 h-4" />
                </button>

                <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-6 text-center">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        {friendlyLabel} Sign In
                    </h1>

                    <div className="w-full text-left space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full rounded-full border border-gray-300 px-4 py-3 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="w-full text-left space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full rounded-full border border-gray-300 px-4 py-3 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="w-full border-t border-gray-200" />

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-3/4 rounded-full bg-canvas-orange py-2 text-white font-semibold transition hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Signing in..." : "Sign in"}
                    </button>

                   
                </form>
            </div>
        </section>
    );
}