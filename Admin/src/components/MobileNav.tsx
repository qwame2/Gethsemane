"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Calendar,
    Settings,
    LogOut,
    Contact,
    Shield,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAdmin } from "@/actions/logout";
import { authorizeSuperAdmin } from "@/actions/superadmin";

const navigation = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Directory", href: "/dashboard/general-members", icon: Contact },
    { name: "Members", href: "/dashboard/members", icon: Users },
    { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
    { name: "Events", href: "/dashboard/events", icon: Calendar },
];

export default function MobileNav() {
    const pathname = usePathname();
    const router = useRouter();

    const [showSciFiModal, setShowSciFiModal] = useState(false);
    const [sciFiPassword, setSciFiPassword] = useState("");
    const [sciFiError, setSciFiError] = useState(false);

    const [isAuthorizing, setIsAuthorizing] = useState(false);

    const handleLogout = async () => {
        if (confirm("Are you sure you want to sign out?")) {
            await logoutAdmin();
        }
    };

    const handleNavDoubleClick = (e: React.MouseEvent) => {
        // Only trigger if we double clicked on the nav background (the empty space), not the buttons themselves
        if ((e.target as Element).closest("a") || (e.target as Element).closest("button")) {
            return;
        }
        setShowSciFiModal(true);
        setSciFiPassword("");
        setSciFiError(false);
    };

    const handleSciFiSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAuthorizing(true);
        setSciFiError(false);

        try {
            const res = await authorizeSuperAdmin(sciFiPassword);
            if (res.success) {
                setShowSciFiModal(false);
                router.push("/dashboard/super-admin");
            } else {
                setSciFiError(true);
                setTimeout(() => setSciFiError(false), 2000);
            }
        } catch (error) {
            setSciFiError(true);
            setTimeout(() => setSciFiError(false), 2000);
        } finally {
            setIsAuthorizing(false);
        }
    };

    return (
        <>
            <nav 
                onDoubleClick={handleNavDoubleClick}
                className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-white/80 backdrop-blur-xl border-t border-gray-100 shadow-dock flex items-center justify-around px-4 md:hidden rounded-t-[2rem] select-none"
            >
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "relative flex flex-col items-center justify-center transition-all duration-300 w-16",
                                isActive ? "text-blue-600" : "text-gray-400"
                            )}
                        >
                            <div className={cn(
                                "flex items-center justify-center px-4 py-1.5 rounded-full transition-all duration-400",
                                isActive ? "bg-blue-100 text-blue-600 shadow-sm" : "transparent"
                            )}>
                                <Icon className={cn("h-5.5 w-5.5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-black mt-1.5 transition-all uppercase tracking-tighter",
                                isActive ? "opacity-100" : "opacity-60"
                            )}>
                                {item.name}
                            </span>
                        </Link>
                    )
                })}
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center text-gray-400 w-16"
                >
                    <div className="flex items-center justify-center px-4 py-1.5 rounded-full">
                        <LogOut className="h-5.5 w-5.5 stroke-2" />
                    </div>
                    <span className="text-[10px] font-black mt-1.5 opacity-60 uppercase tracking-tighter">Exit</span>
                </button>
            </nav>

            {/* Sci-Fi Super Admin Modal */}
            {showSciFiModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <form onSubmit={handleSciFiSubmit} className="relative w-[90%] max-w-sm bg-gray-900 border border-red-500/30 rounded-2xl p-8 shadow-[0_0_80px_rgba(239,68,68,0.15)] ring-1 ring-white/10">
                        <div className="absolute top-4 right-4 text-red-500 cursor-pointer p-2 rounded-full hover:bg-red-500/10 transition-colors" onClick={() => setShowSciFiModal(false)}>
                            <X className="w-4 h-4 opacity-70 hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <Shield className="text-red-500 w-12 h-12 relative z-10" strokeWidth={1.5} />
                                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                            </div>
                        </div>
                        <h3 className="text-center text-red-500 font-mono tracking-[0.3em] uppercase text-xs font-black mb-8 opacity-90 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">Classified Protocol</h3>
                        <div className="relative group flex flex-col items-center">
                            <input 
                                autoFocus
                                type="password"
                                value={sciFiPassword}
                                onChange={(e) => setSciFiPassword(e.target.value)}
                                className={`w-full bg-black/50 border ${sciFiError ? 'border-red-500 focus:border-red-500 animate-shake' : 'border-red-900/50 focus:border-red-500'} rounded-lg px-4 py-3 text-red-500 font-mono text-center tracking-widest outline-none transition-all placeholder:text-red-900/40`}
                                placeholder="AWAITING INPUT"
                            />
                            {sciFiError && (
                                <p className="absolute -bottom-7 w-full text-center text-red-500 text-[10px] font-mono font-black animate-pulse uppercase tracking-widest drop-shadow-[0_0_5px_rgba(239,68,68,1)]">
                                    Access Denied
                                </p>
                            )}
                        </div>
                        <button type="submit" className="hidden" />
                    </form>
                </div>
            )}
        </>
    );
}
