"use client";

import { completeSetup } from "@/actions/setup";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Lock, Image as ImageIcon, CheckCircle, ArrowRight } from "lucide-react";

export default function SetupPage() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Give user a preview of what they are uploading
            setImageUrl(URL.createObjectURL(file));
        }
    };

    useEffect(() => {
        if (document.cookie.includes("flash_login=true")) {
            document.cookie = "flash_login=; Max-Age=0; path=/";
            toast.success("Signed in successfully!", {
                description: "Please complete your account setup to continue.",
            });
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        try {
            await completeSetup(formData);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 lg:p-12 bg-gray-50 relative overflow-hidden">
            {/* Artistic Background Tokens */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '32px 32px' }} />

            <div className="w-full max-w-5xl flex flex-col lg:flex-row bg-white rounded-3xl shadow-2xl shadow-blue-900/5 overflow-hidden border border-gray-100 z-10 relative">

                {/* Left Panel - Information */}
                <div className="w-full lg:w-5/12 bg-gradient-to-br from-blue-600 to-indigo-700 p-10 lg:p-12 relative flex flex-col justify-between overflow-hidden text-white">
                    <div className="absolute inset-0 opacity-[0.07]"
                        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-12">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center overflow-hidden shadow-lg">
                                <Image src="/logo.png" alt="Church Logo" width={32} height={32} className="object-contain" />
                            </div>
                            <div>
                                <span className="font-bold text-lg block leading-tight">Gethsemane</span>
                                <span className="text-blue-200 text-xs tracking-wider uppercase font-medium">Admin Portal</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h1 className="text-4xl font-bold leading-tight">
                                Finalizing your<br />account setup
                            </h1>
                            <p className="text-blue-100/90 text-sm leading-relaxed max-w-sm">
                                To ensure maximum security for your admin account, please change your default password to something private and memorable.
                            </p>
                        </div>

                        <div className="mt-12 space-y-4">
                            {[
                                { title: "Secure your access", desc: "Set a strong, private password." },
                                { title: "Personalize profile", desc: "Add a custom avatar (optional)." },
                                { title: "Enter dashboard", desc: "Start managing the fellowship." }
                            ].map((step, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-sm">
                                        <CheckCircle className="w-4 h-4 text-green-300" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold">{step.title}</h3>
                                        <p className="text-xs text-blue-200/80 mt-0.5">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Setup Form */}
                <div className="w-full lg:w-7/12 p-8 lg:p-14 flex items-center justify-center relative">
                    <div className="w-full max-w-sm">

                        <div className="text-center mb-8">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="mx-auto w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-300 rounded-full mb-4 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all text-gray-500 hover:text-blue-500"
                            >
                                {imageUrl ? (
                                    <Image src={imageUrl} alt="Profile preview" fill className="object-cover" unoptimized onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                ) : (
                                    <ImageIcon className="w-8 h-8 opacity-70 group-hover:scale-110 transition-transform" />
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs font-semibold">Upload</span>
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900">Secure Your Account</h2>
                            <p className="text-sm text-gray-500 mt-2">Replace your default password to proceed</p>
                        </div>

                        {error && (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm mb-6 shadow-sm">
                                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Hidden Image Input */}
                            <input
                                type="file"
                                name="image"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">New Password <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Lock className="w-4 h-4" />
                                    </span>
                                    <input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        placeholder="••••••••••••"
                                        className="w-full pl-10 pr-12 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 px-6 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Saving Details...
                                        </>
                                    ) : (
                                        <>
                                            Complete Setup
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
