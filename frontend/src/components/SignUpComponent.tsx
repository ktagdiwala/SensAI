import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

//TODO: Update endpoint when backend is deployed for production
const SIGNUP_ENDPOINT = "http://localhost:3000/api/register";

type SignUpForm = {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
};

type SignUpProps = {
    signUpType: "Instructor" | "Student";
    onClose: () => void;
};

export default function SignUp({ signUpType, onClose }: SignUpProps) {
    const [formData, setFormData] = useState<SignUpForm>({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string>("");

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        if (formData.password !== formData.confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }

        if (!formData.name.trim()) {
            setErrorMessage("Name is required.");
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await fetch(SIGNUP_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                    role: signUpType,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to sign up.");
            }

            setSuccessMessage("Account created successfully! Redirecting to login...");
            
            // Clear form and redirect after 2 seconds
            setTimeout(() => {
                setFormData({
                    email: "",
                    password: "",
                    confirmPassword: "",
                    name: "",
                });
                onClose();
            }, 2000);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred.";
            setErrorMessage(errorMsg);
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const passwordMismatch =
        formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;
    const friendlyLabel = signUpType === "Instructor" ? "Instructor" : "Student";

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

                    {errorMessage && (
                        <div className="w-full rounded-lg bg-red-50 p-4 border border-red-200">
                            <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
                        </div>
                    )}

                    {successMessage && (
                        <div className="w-full rounded-lg bg-green-50 p-4 border border-green-200">
                            <p className="text-green-700 text-sm font-medium">{successMessage}</p>
                        </div>
                    )}

                    <div className="w-full text-left space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-gray-700">
                            Full Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full rounded-full border border-gray-300 px-4 py-3 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

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
                            className={`w-full rounded-full border px-4 py-3 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 ${passwordMismatch ? "border-red-500" : "border-gray-300"
                                }`}
                        />
                    </div>

                    <div className="w-full border-t border-gray-200" />

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-3/4 rounded-full bg-canvas-light-blue py-2 text-white font-semibold transition hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Signing up..." : "Sign up"}
                    </button>

                </form>
            </div>
        </section>
    );
}