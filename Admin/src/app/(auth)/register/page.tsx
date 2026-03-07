"use client";

import { registerAdmin } from "@/actions/auth";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function RegisterPage() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Prevent showing register page on back navigation if already logged in
        if (document.cookie.includes("is_logged_in=true")) {
            window.location.replace("/dashboard");
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        try {
            await registerAdmin(formData);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-[42%] relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700">
                {/* Subtle mesh pattern */}
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
                            Join the<br />administration team
                        </h2>
                        <p className="text-blue-100/80 text-base leading-relaxed max-w-xs">
                            Create your admin account to start managing members, payments, and church operations.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {[{ label: "Members", value: "500+" }, { label: "Records", value: "1.2K+" }, { label: "Years Active", value: "15+" }].map(({ label, value }) => (
                            <div key={label} className="bg-white/10 border border-white/20 rounded-xl p-3 text-center backdrop-blur-sm">
                                <div className="text-white font-bold text-xl">{value}</div>
                                <div className="text-blue-200/70 text-xs mt-0.5">{label}</div>
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

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Create Admin Account</h1>
                        <p className="text-gray-500 mt-1.5 text-sm">Fill in your details to register. A default password will be issued.</p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm mb-6">
                            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">First Name</label>
                                <input name="firstName" type="text" required placeholder="John"
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Last Name</label>
                                <input name="lastName" type="text" required placeholder="Doe"
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Username</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </span>
                                <input name="username" type="text" required placeholder="johndoe"
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Email Address</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                                </span>
                                <input name="email" type="email" required placeholder="admin@gethsemane.org"
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Phone Number</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                </span>
                                <input name="phone" type="tel" required placeholder="+233 24 123 4567"
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button type="submit" disabled={loading}
                                className="w-full py-2.5 px-6 rounded-lg font-semibold text-white text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {loading ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Creating Account...
                                    </>
                                ) : "Create Account"}
                            </button>
                        </div>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Already have an account?{" "}
                        <a href="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">Sign in</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
