import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decryptSession } from "@/lib/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("user_session")?.value;
    const session = sessionToken ? await decryptSession(sessionToken) : null;
    if (session?.id) {
        redirect("/dashboard");
    }
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Decorative background gradients */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

            <div className="w-full max-w-md space-y-8 relative z-10">
                <div className="flex flex-col items-center justify-center text-center">
                    <Link href="/" className="flex flex-col items-center gap-3 mb-6 group">
                        <div className="bg-white p-2 rounded-full shadow-glow group-hover:scale-105 transition-transform duration-300">
                            <img src="/logo.png" alt="Gethsemane Assemble Logo" className="h-16 w-16 md:h-20 md:w-20 object-contain rounded-full" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-slate-900">
                            Gethsemane Assemble
                        </span>
                    </Link>
                </div>

                {children}
            </div>

            <div className="mt-8 text-center text-sm text-slate-500 relative z-10">
                &copy; {new Date().getFullYear()} Gethsemane Assemble. All rights reserved.
            </div>
        </div>
    );
}
