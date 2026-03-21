"use client";

import { useState } from "react";
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Calendar,
    Settings,
    LogOut,
    ChevronRight,
    Contact,
    Shield,
    X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { logoutAdmin } from "@/actions/logout";
import { authorizeSuperAdmin } from "@/actions/superadmin";
import { usePathname, useRouter } from "next/navigation";

const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Directory", href: "/dashboard/general-members", icon: Contact },
    { name: "Members", href: "/dashboard/members", icon: Users },
    { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
    { name: "Events", href: "/dashboard/events", icon: Calendar },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const [showSciFiModal, setShowSciFiModal] = useState(false);
    const [sciFiPassword, setSciFiPassword] = useState("");
    const [sciFiError, setSciFiError] = useState(false);

    const [isAuthorizing, setIsAuthorizing] = useState(false);

    const handleLogout = async () => {
        await logoutAdmin();
    };

    const handleSidebarDoubleClick = (e: React.MouseEvent) => {
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
            <aside 
                onDoubleClick={handleSidebarDoubleClick} 
                className="hidden md:flex flex-col w-72 border-r border-gray-100 bg-white shadow-[1px_0_0_0_rgba(0,0,0,0.02)] sticky top-0 h-screen z-50 select-none"
            >
                {/* Header / Brand Area */}
                <div className="px-8 py-9 shrink-0">
                    <Link href="/dashboard" className="flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 flex items-center justify-center p-2.5 transition-transform group-hover:scale-105 duration-300">
                            <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain brightness-0 invert" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-xl tracking-tighter text-gray-900 leading-none">Gethsemane</span>
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mt-1 opacity-70">Admin Panel</span>
                        </div>
                    </Link>
                </div>

                {/* Navigation Section */}
                <div className="flex-1 px-4 overflow-y-auto pb-6 space-y-8">
                    <div>
                        <h4 className="px-5 mb-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Menu</h4>
                        <nav className="space-y-1.5 font-bold">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`group relative flex items-center px-5 py-3.5 text-sm rounded-2xl transition-all duration-300 ${isActive
                                            ? "bg-blue-50 text-blue-700 shadow-sm"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                            }`}
                                    >
                                        {isActive && (
                                            <div className="absolute left-0 w-1.5 h-6 bg-blue-600 rounded-r-full animate-in fade-in slide-in-from-left-2 duration-300" />
                                        )}
                                        <item.icon
                                            className={`mr-4 h-5 w-5 shrink-0 transition-all duration-300 ${isActive
                                                ? "text-blue-600 scale-110"
                                                : "text-gray-400 group-hover:text-gray-600 group-hover:scale-110"
                                                }`}
                                        />
                                        <span className="flex-1">{item.name}</span>
                                        {!isActive && (
                                            <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-6 border-t border-gray-50 bg-gray-50/50">
                    <button
                        onClick={handleLogout}
                        className="group flex w-full items-center px-5 py-4 text-sm font-black rounded-2xl text-red-500 bg-white border border-red-50 hover:bg-red-50 hover:text-red-700 transition-all shadow-sm active:scale-95"
                    >
                        <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center mr-3 group-hover:bg-red-100 transition-colors">
                            <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
                        </div>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Sci-Fi Super Admin Modal */}
            {showSciFiModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <form onSubmit={handleSciFiSubmit} className="relative w-full max-w-sm bg-gray-900 border border-red-500/30 rounded-2xl p-8 shadow-[0_0_80px_rgba(239,68,68,0.15)] ring-1 ring-white/10">
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
