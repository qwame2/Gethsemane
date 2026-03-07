"use client";

import { loginAdmin } from "@/actions/login";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const reason = urlParams.get("reason");

        if (reason) {
            // Clean the URL immediately so the user doesn't see the error param
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);

            // Clear the login status cookie if there's an error reason
            document.cookie = "is_logged_in=; Max-Age=0; path=/";

            if (reason === "session_expired") {
                toast.error("Session expired", {
                    description: "Please sign in again to continue.",
                });
            } else if (reason === "invalid_session") {
                toast.error("Invalid session", {
                    description: "Your session is no longer valid. Please sign in again.",
                });
            }
            return;
        }

        // Prevent showing login page on back navigation if already logged in and no error
        if (document.cookie.includes("is_logged_in=true")) {
            window.location.replace("/dashboard");
            return;
        }

        if (document.cookie.includes("flash_registered=true")) {
            document.cookie = "flash_registered=; Max-Age=0; path=/";
            toast.success("Account created!", {
                description: "You can now log in with the default password.",
            });
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        try {
            await loginAdmin(formData);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-[42%] relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700">
                <div className="absolute inset-0 opacity-[0.07]"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-indigo-900/40 to-transparent" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center overflow-hidden shadow-lg">
                            <Image src="/logo.png" alt="Church Logo" width={40} height={40} className="object-contain" />
                        </div>
                        <div>
                            <span className="text-white font-bold text-base block leading-tight">Gethsemane Assemble</span>
                            <span className="text-blue-200 text-xs">Admin Portal</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-white text-xs font-medium">Secure Admin Access</span>
                        </div>
                        <h2 className="text-4xl font-bold text-white leading-tight">
                            Welcome back,<br />administrator
                        </h2>
                        <p className="text-blue-100/80 text-base leading-relaxed max-w-xs">
                            Access your dashboard to manage members, payments, and all church operations.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {[
                            { d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", text: "Role-based secure access" },
                            { d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", text: "Real-time analytics & reports" },
                            { d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", text: "Dues & payment management" },
                        ].map(({ d, text }) => (
                            <div key={text} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
                                    </svg>
                                </div>
                                <span className="text-blue-100/70 text-sm">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 text-blue-200/50 text-xs">
                    © {new Date().getFullYear()} Gethsemane Assemble. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-[58%] flex items-center justify-center p-6 lg:p-16 bg-white">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden">
                            <Image src="/logo.png" alt="Church Logo" width={40} height={40} className="object-contain" />
                        </div>
                        <div>
                            <span className="text-gray-900 font-bold text-base block">Gethsemane Assemble</span>
                            <span className="text-gray-400 text-xs">Admin Portal</span>
                        </div>
                    </div>

                    {/* Desktop logo header */}
                    <div className="hidden lg:flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden">
                            <Image src="/logo.png" alt="Church Logo" width={40} height={40} className="object-contain" />
                        </div>
                        <div>
                            <span className="text-gray-900 font-bold text-base block">Gethsemane Assemble</span>
                            <span className="text-gray-400 text-xs">Admin Portal</span>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Sign In</h1>
                        <p className="text-gray-500 mt-1.5 text-sm">Enter your credentials to access the admin portal.</p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm mb-6">
                            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Email or Username</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </span>
                                <input name="identifier" type="text" required placeholder="admin@gethsemane.org"
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">Password</label>
                                <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">Forgot password?</a>
                            </div>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </span>
                                <input name="password" type={showPassword ? "text" : "password"} required placeholder="••••••••••"
                                    className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                    {showPassword ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="pt-1">
                            <button type="submit" disabled={loading}
                                className="w-full py-2.5 px-6 rounded-lg font-semibold text-white text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {loading ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Signing in...
                                    </>
                                ) : "Sign In"}
                            </button>
                        </div>
                    </form>

                    <div className="flex items-center gap-4 mt-6">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-gray-400 text-xs">OR</span>
                        <div className="h-px flex-1 bg-gray-200" />
                    </div>

                    <p className="text-center text-sm text-gray-500 mt-4">
                        Don't have an account?{" "}
                        <a href="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">Register here</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
