"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    CreditCard,
    LogOut,
    Bell,
    Settings,
    UserCircle,
    ArrowUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [userData, setUserData] = useState({
        firstName: "User",
        lastName: "",
        role: "Member",
        image: null as string | null
    });
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/user/profile", { cache: "no-store" });
                if (res.status === 401) {
                    router.push("/login");
                    return;
                }
                if (res.ok) {
                    const data = await res.json();
                    setUserData(data);
                }
            } catch (err) {
                console.error("Layout: Failed to fetch user profile");
            }
        };
        const fetchNotifications = async () => {
            try {
                const res = await fetch("/api/user/notifications", { cache: "no-store" });
                if (res.ok) {
                    const data = await res.json();
                    setUnreadCount(data.length);
                }
            } catch (err) {
                console.error("Layout: Failed to fetch notifications");
            }
        };

        fetchUser();
        fetchNotifications();
    }, [router, pathname]);

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        const handleActivity = () => {
            clearTimeout(timeout);
            // 40 minutes = 40 * 60 * 1000 = 2400000 ms
            timeout = setTimeout(() => {
                handleLogout();
            }, 2400000);
        };

        handleActivity();

        window.addEventListener("mousemove", handleActivity);
        window.addEventListener("keydown", handleActivity);
        window.addEventListener("click", handleActivity);
        window.addEventListener("scroll", handleActivity);

        return () => {
            clearTimeout(timeout);
            window.removeEventListener("mousemove", handleActivity);
            window.removeEventListener("keydown", handleActivity);
            window.removeEventListener("click", handleActivity);
            window.removeEventListener("scroll", handleActivity);
        };
    }, []);

    const navigation = [
        { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { name: "Payments & Dues", href: "/payments", icon: CreditCard },
        { name: "Transactions", href: "/transactions", icon: ArrowUpDown },
        { name: "Profile Settings", href: "/profile", icon: UserCircle },
    ];

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch (err) {
            console.error("Logout failed:", err);
        }
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row pb-24 md:pb-0 font-sans">
            {/* Samsung One UI Mobile Header - Focus on Reachability (Large Title Area) */}
            <header className="px-6 pt-10 pb-6 bg-background md:hidden">
                <div className="flex items-center justify-between mb-8">
                    <div className="h-12 w-12 rounded-[1.25rem] bg-white shadow-samsung border border-white flex items-center justify-center p-2">
                        <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/notifications">
                            <div className="h-11 w-11 rounded-full bg-white shadow-samsung border border-white flex items-center justify-center text-slate-600 active:bg-slate-50 transition-all cursor-pointer relative">
                                <Bell className="h-5.5 w-5.5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                                )}
                            </div>
                        </Link>
                        <Link href="/profile" className="h-11 w-11 rounded-[1rem] bg-primary-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-samsung active:scale-95 transition-all">
                            {userData.image ? (
                                <img src={userData.image} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-primary-600 font-bold text-sm tracking-tighter">{userData.firstName?.[0]}</span>
                            )}
                        </Link>
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Member Portal</p>
                    <h1 className="text-4xl font-extrabold text-black tracking-tight leading-tight">
                        {pathname === "/dashboard" ? "Gethsemane" :
                            pathname === "/payments" ? "Payments" :
                                pathname === "/profile" ? "Profile Setting" : "Portal"}
                    </h1>
                </div>
            </header>




            {/* Samsung One UI Bottom Navigation - Pill Tab Style */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-white border-t border-slate-100 shadow-dock flex items-center justify-around px-6 md:hidden rounded-t-[2.5rem]">
                {navigation.filter(item => item.name !== "Transactions").map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "relative flex flex-col items-center justify-center transition-all duration-300",
                                isActive ? "text-primary-500" : "text-slate-400"
                            )}
                        >
                            <div className={cn(
                                "flex items-center justify-center px-5 py-1.5 rounded-full transition-all duration-300",
                                isActive ? "bg-primary-100 text-primary-500" : "transparent"
                            )}>
                                <Icon className={cn("h-6 w-6", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                            </div>
                            <span className={cn(
                                "text-[11px] font-semibold mt-1 transition-all",
                                isActive ? "opacity-100 text-primary-500" : "opacity-70"
                            )}>
                                {item.name.split(' ')[0]}
                            </span>
                        </Link>
                    )
                })}
                <button
                    onClick={() => setIsLogoutModalOpen(true)}
                    className="flex flex-col items-center justify-center text-slate-400"
                >
                    <div className="flex items-center justify-center px-5 py-1.5 rounded-full">
                        <LogOut className="h-6 w-6 stroke-2" />
                    </div>
                    <span className="text-[11px] font-semibold mt-1 opacity-70">Exit</span>
                </button>
            </nav>



            {/* Desktop Sidebar - Samsung One UI Solid Style */}
            <div className="hidden md:flex w-64 lg:w-72 flex-col fixed inset-y-0 bg-background border-r border-slate-200 transition-all duration-500">
                <div className="p-6 lg:p-8 pb-4">
                    <div className="flex flex-col gap-4">
                        <div className="h-12 w-12 lg:h-16 lg:w-16 rounded-[1.5rem] lg:rounded-[2rem] bg-white shadow-samsung-lg border border-white flex items-center justify-center p-3 transition-all">
                            <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
                        </div>
                        <div>
                            <h1 className="text-xl lg:text-2xl font-bold text-black tracking-tight transition-all">Gethsemane</h1>
                            <p className="text-[10px] lg:text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Assemble Portal</p>
                        </div>
                    </div>
                </div>



                <nav className="flex-1 px-4 py-8 space-y-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center px-5 py-4 text-sm font-semibold rounded-[1.75rem] transition-all duration-300",
                                    isActive
                                        ? "bg-primary-500 text-white shadow-samsung-lg shadow-primary-500/20"
                                        : "text-slate-500 hover:bg-white hover:shadow-samsung"
                                )}
                            >
                                <Icon className={cn("mr-4 h-5.5 w-5.5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>



                <div className="p-6 mt-auto">
                    <div className="mb-6 px-4">
                        <div className="flex items-center gap-3 p-3 rounded-3xl bg-white shadow-samsung border border-white">
                            <div className="h-10 w-10 rounded-2xl bg-primary-100 flex items-center justify-center overflow-hidden">
                                {userData.image ? (
                                    <img src={userData.image} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-primary-600 font-bold text-sm">{userData.firstName?.[0]}</span>
                                )}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-black truncate">{userData.firstName}</p>
                                <p className="text-[10px] text-slate-400 font-semibold truncate uppercase">{userData.role}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="flex w-full items-center px-6 py-4 text-sm font-bold text-red-500 rounded-[1.75rem] bg-red-50/50 hover:bg-red-50 transition-all duration-300"
                    >
                        <LogOut className="h-5 w-5 mr-3" />
                        Sign Out
                    </button>
                </div>

            </div>


            {/* Main Content Area */}
            <div className="flex-1 md:pl-64 lg:pl-72 flex flex-col min-h-screen transition-all duration-500">
                {/* Top Header */}
                <header className="hidden md:flex bg-white/50 backdrop-blur-md border-b border-slate-200 h-16 items-center justify-end px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <Link href="/notifications" className="text-slate-400 hover:text-slate-600 transition-colors relative">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                            )}
                        </Link>
                        <div className="h-8 w-px bg-slate-200 mx-2"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-extrabold text-black tracking-tight">{userData.firstName} {userData.lastName}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{userData.role}</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-white p-0.5 shadow-lg border border-black/5 overflow-hidden">
                                {userData.image ? (
                                    <img src={userData.image} alt="Profile" className="h-full w-full rounded-[10px] object-cover" />
                                ) : (
                                    <div className="h-full w-full rounded-[10px] bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
                                        {userData.firstName?.[0]}{userData.lastName?.[0]}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>



                <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
                    <div className="max-w-[1440px] mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>

            <Modal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                title="Confirm Logout"
                description="Are you sure you want to log out of your account?"
                footer={
                    <>
                        <Button
                            variant="outline"
                            onClick={() => setIsLogoutModalOpen(false)}
                            className="w-full sm:w-auto mt-2 sm:mt-0"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleLogout}
                            className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white"
                        >
                            Logout
                        </Button>
                    </>
                }
            >
                <div className="py-2 text-slate-600 text-sm leading-relaxed">
                    You will need to sign in again to access your dashboard, track your dues, and make payments.
                </div>
            </Modal>
        </div>
    );
}
