"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const SECURITY_QUESTIONS = [
    "What was the name of your first pet?",
    "In what city were you born?",
    "What is your mother's maiden name?",
    "What was the name of your first school?",
    "What is your favorite color?",
    "What was your childhood nickname?",
    "What is the name of your favorite childhood friend?",
    "In what city or town did your parents meet?",
    "What is your favorite food?"
];

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        securityQuestion1: SECURITY_QUESTIONS[0],
        securityAnswer1: "",
        securityQuestion2: SECURITY_QUESTIONS[1],
        securityAnswer2: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.securityQuestion1 === formData.securityQuestion2) {
            return toast.error("Please select two different security questions.");
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success("Account created successfully! Please sign in.");
                router.push("/login?registered=true");
            } else {
                const data = await res.json();
                toast.error(data.error || "Something went wrong.");
            }
        } catch (err) {
            toast.error("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full backdrop-blur-sm bg-white/90">
            <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl text-center">Create an account</CardTitle>
                <CardDescription className="text-center">
                    Enter your information to join Gethsemane Assemble
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First name</Label>
                            <Input id="firstName" placeholder="John" required value={formData.firstName} onChange={handleChange} disabled={isLoading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last name</Label>
                            <Input id="lastName" placeholder="Doe" required value={formData.lastName} onChange={handleChange} disabled={isLoading} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" placeholder="churchmember123" required value={formData.username} onChange={handleChange} disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="member@church.org" required value={formData.email} onChange={handleChange} disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" placeholder="+233 234567890" value={formData.phone} onChange={handleChange} disabled={isLoading} />
                    </div>

                    {/* Security Questions Section */}
                    <div className="pt-2 border-t mt-2">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Security Questions</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="securityQuestion1">Question 1</Label>
                                <select
                                    id="securityQuestion1"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.securityQuestion1}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
                                >
                                    {SECURITY_QUESTIONS.map((q, idx) => (
                                        <option key={`q1-${idx}`} value={q}>{q}</option>
                                    ))}
                                </select>
                                <Input id="securityAnswer1" placeholder="Your Answer" required value={formData.securityAnswer1} onChange={handleChange} disabled={isLoading} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="securityQuestion2">Question 2</Label>
                                <select
                                    id="securityQuestion2"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.securityQuestion2}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
                                >
                                    {SECURITY_QUESTIONS.map((q, idx) => (
                                        <option key={`q2-${idx}`} value={q}>{q}</option>
                                    ))}
                                </select>
                                <Input id="securityAnswer2" placeholder="Your Answer" required value={formData.securityAnswer2} onChange={handleChange} disabled={isLoading} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t mt-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                required
                                value={formData.password}
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

                    <Button type="submit" className="w-full mt-4 text-md font-semibold h-11" disabled={isLoading}>
                        {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center border-t border-slate-100 pt-4 pb-6 px-6">
                <p className="text-sm text-slate-600">
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-500 hover:underline transition-all">
                        Sign in
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
