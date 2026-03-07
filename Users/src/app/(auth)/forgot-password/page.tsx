"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        identifier: "",
        securityAnswer: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [activeQuestion, setActiveQuestion] = useState("");
    const [activeQuestionNumber, setActiveQuestionNumber] = useState<number | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleFetchQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/security-question", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier: formData.identifier })
            });

            if (res.ok) {
                const data = await res.json();
                setActiveQuestion(data.question);
                setActiveQuestionNumber(data.questionNumber);
                setStep(2);
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to locate account.");
            }
        } catch (err) {
            toast.error("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            return toast.error("Passwords do not match. Please try again.");
        }

        if (formData.newPassword.length < 6) {
            return toast.error("Password must be at least 6 characters long.");
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    identifier: formData.identifier,
                    questionNumber: activeQuestionNumber,
                    securityAnswer: formData.securityAnswer,
                    newPassword: formData.newPassword
                })
            });

            if (res.ok) {
                toast.success("Password Reset Successfully!");
                setIsSuccess(true);
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to reset password.");
            }
        } catch (err) {
            toast.error("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <Card className="w-full backdrop-blur-sm bg-white/90 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="space-y-4 pb-4 pt-12 items-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>
                    <CardTitle className="text-2xl text-center">Reset Complete</CardTitle>
                    <CardDescription className="text-center pb-4 text-emerald-700 font-medium">
                        Your password has been successfully reset. You can now use your new password to access your account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pb-10">
                    <Button onClick={() => router.push('/login')} className="w-full h-11 text-md font-semibold bg-emerald-600 hover:bg-emerald-700">
                        Proceed to Login
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full backdrop-blur-sm bg-white/90 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Link
                href="/login"
                className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 transition-colors p-2"
                aria-label="Back to login"
            >
                <ArrowLeft className="h-5 w-5" />
            </Link>
            <CardHeader className="space-y-1 pb-4 pt-10">
                <CardTitle className="text-2xl text-center">Identity Verification</CardTitle>
                <CardDescription className="text-center">
                    {step === 1 ? "Enter your Email or Username to begin password recovery." : "Answer your registered security question."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {step === 1 ? (
                    <form className="space-y-4" onSubmit={handleFetchQuestion}>
                        <div className="space-y-2">
                            <Label htmlFor="identifier">Email or Username</Label>
                            <Input id="identifier" type="text" placeholder="member@church.org" required value={formData.identifier} onChange={handleChange} disabled={isLoading} />
                        </div>
                        <Button type="submit" className="w-full mt-2 text-md font-semibold h-11" disabled={isLoading}>
                            {isLoading ? "Searching..." : "Recover Account"}
                        </Button>
                    </form>
                ) : (
                    <form className="space-y-4" onSubmit={handleReset}>
                        <div className="space-y-2 p-3 bg-slate-50 border rounded-md">
                            <Label className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1 block">Security Question</Label>
                            <p className="text-sm font-semibold text-slate-800">{activeQuestion}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="securityAnswer">Your Answer</Label>
                            <Input id="securityAnswer" type="text" placeholder="Answer here..." required value={formData.securityAnswer} onChange={handleChange} disabled={isLoading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    required
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    className="pr-10"
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full mt-2 text-md font-semibold h-11" disabled={isLoading}>
                            {isLoading ? "Resetting..." : "Reset Password"}
                        </Button>
                        <Button type="button" variant="ghost" className="w-full text-sm font-medium" onClick={() => setStep(1)} disabled={isLoading}>
                            Cancel
                        </Button>
                    </form>
                )}
            </CardContent>
            <CardFooter className="flex justify-center border-t border-slate-100 pt-4 pb-6 px-6">
                <p className="text-sm text-slate-600">
                    Remember your password?{" "}
                    <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-500 hover:underline transition-all">
                        Back to login
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
