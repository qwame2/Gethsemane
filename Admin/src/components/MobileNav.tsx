"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Calendar,
    Settings,
    LogOut,
    Contact
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAdmin } from "@/actions/logout";

const navigation = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Directory", href: "/dashboard/general-members", icon: Contact },
    { name: "Members", href: "/dashboard/members", icon: Users },
    { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
    { name: "Events", href: "/dashboard/events", icon: Calendar },
];

export default function MobileNav() {
    const pathname = usePathname();

    const handleLogout = async () => {
        if (confirm("Are you sure you want to sign out?")) {
            await logoutAdmin();
        }
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-white/80 backdrop-blur-xl border-t border-gray-100 shadow-dock flex items-center justify-around px-4 md:hidden rounded-t-[2rem]">
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
    );
}
