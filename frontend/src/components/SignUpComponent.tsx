import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type SignUpForm = {
    email: string;
    password: string;
    confirmPassword: string;
};

type SignUpProps = {
    signUpType: "instructor" | "student";
    onClose: () => void;
};

export default function SignUp({ signUpType, onClose }: SignUpProps) {
    const [formData, setFormData] = useState<SignUpForm>({
        email: "",
        password: "",
        confirmPassword: "",
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
        if (formData.password !== formData.confirmPassword) {
            console.error("Passwords do not match.");
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await fetch("/api/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    role: signUpType,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to sign up.");
            }

            console.log("User signed up successfully.");
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const passwordMismatch =
        formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;
    const friendlyLabel = signUpType === "instructor" ? "Instructor" : "Student";

    return (
        <section className="flex items-center justify-center p-6">
            <div className="relative w-full max-w-md rounded-3xl bg-white shadow-xl border border-canvas-gray p-10">
                <button
                    onClick={onClose}
                    type="button"
                    aria-label="Close sign up"
                    className="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-100 transition"
                >
                    <img src="xIcon.svg" alt="Close" className="w-4 h-4" />
                </button>

                <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-6 text-center">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        {friendlyLabel} Sign Up
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

                    <div className="w-full text-left space-y-2">
                        <label
                            htmlFor="confirmPassword"
                            className={`text-sm font-medium ${passwordMismatch ? "text-red-600" : "text-gray-700"}`}
                        >
                            Confirm password {passwordMismatch ? "(passwords don't match)" : ""}
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            placeholder="Re-enter your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className={`w-full rounded-full border px-4 py-3 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 ${
                                passwordMismatch ? "border-red-500" : "border-gray-300"
                            }`}
                        />
                    </div>

                    <div className="w-full border-t border-gray-200" />

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-3/4 rounded-full bg-canvas-orange py-2 text-white font-semibold transition hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Signing up..." : "Sign up"}
                    </button>

                </form>
            </div>
        </section>
    );
}