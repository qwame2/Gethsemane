"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        identifier: "",
        password: ""
    });

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const reason = urlParams.get("reason");

        if (reason) {
            // Clean the URL immediately to remove clues from the address bar
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);

            // Clear the login status cookie
            document.cookie = "is_user_logged_in=; Max-Age=0; path=/";

            if (reason === "session_expired") {
                toast.error("Session expired", {
                    description: "Please sign in again to continue.",
                });
            } else if (reason === "invalid_session") {
                toast.error("Invalid session", {
                    description: "Your session is no longer valid. Please sign in again.",
                });
            }
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success("Login successful! Redirecting to dashboard...");
                router.push("/dashboard");
            } else {
                const data = await res.json();
                toast.error(data.error || "Invalid login credentials.");
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
                <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
                <CardDescription className="text-center">
                    Enter your email or username and password to access your account
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="identifier">Email or Username</Label>
                        <Input id="identifier" type="text" placeholder="member@church.org or username" required value={formData.identifier} onChange={handleChange} disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Link
                                href="/forgot-password"
                                className="text-sm font-medium text-primary-600 hover:text-primary-500 hover:underline transition-all"
                            >
                                Forgot password?
                            </Link>
                        </div>
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
                    <Button type="submit" className="w-full mt-2 text-md font-semibold h-11" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center border-t border-slate-100 pt-4 pb-6 px-6">
                <p className="text-sm text-slate-600">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-500 hover:underline transition-all">
                        Register now
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
