"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowRight,
    TrendingDown,
    TrendingUp,
    Wallet,
    CalendarDays,
    AlertCircle,
    CheckCircle2,
    Clock,
    CreditCard,
    CalendarClock,
    PartyPopper
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardOverviewPage() {
    const [stats, setStats] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [recentPayments, setRecentPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [statsRes, paymentsRes, profileRes] = await Promise.all([
                    fetch("/api/dashboard/stats", { cache: "no-store" }),
                    fetch("/api/payments", { cache: "no-store" }),
                    fetch("/api/user/profile", { cache: "no-store" })
                ]);

                if (statsRes.ok) setStats(await statsRes.json());
                if (profileRes.ok) setUserData(await profileRes.json());
                if (paymentsRes.ok) {
                    const data = await paymentsRes.json();
                    const paymentsArray = data.transactions || [];
                    setRecentPayments(paymentsArray.slice(0, 2));
                }
            } catch (err) {
                console.error("Dashboard Load Error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboard();
    }, []);

    const totalAmountPaid = stats?.totalAmountPaid ?? 0;
    const remainingBalance = stats?.remainingBalance ?? 0;
    const outstandingBalance = stats?.outstandingBalance ?? 0;
    const totalArrears = stats?.totalArrears ?? 0;
    const upcomingDues = stats?.currentMonthDue ?? 0;
    const currentMonthStatus = stats?.status || "Loading...";
    const firstName = userData?.firstName || "Member";
    const progressPercentage = stats?.progressPercentage ?? 0;
    const nextDueDate = stats?.nextDueDate || "TBD";

    return (
        <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">


            {/* Premium Welcome Banner */}
            <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-primary-600 via-primary-500 to-blue-600 p-6 sm:p-10 text-white shadow-xl shadow-primary-500/20 group">
                {/* Abstract animated background shapes */}
                <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl group-hover:scale-110 transition-transform duration-1000 ease-in-out"></div>
                <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-blue-300 opacity-20 blur-2xl group-hover:scale-110 transition-transform duration-1000 ease-in-out"></div>

                <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", outstandingBalance === 0 ? "bg-emerald-400" : "bg-amber-400")}></span>
                                <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", outstandingBalance === 0 ? "bg-emerald-500" : "bg-amber-500")}></span>
                            </span>
                            <span className="text-xs font-bold tracking-wider uppercase text-white/90">
                                {outstandingBalance === 0 ? 'All Settled Up' : 'Action Needed'}
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                            Welcome back, <br className="hidden sm:block" /> <span className="text-primary-100">{firstName}</span>.
                        </h1>
                        <p className="text-primary-100/80 font-medium text-sm sm:text-base md:text-lg max-w-md">
                            Manage your contributions and track your spiritual investment effortlessly.
                        </p>
                    </div>

                    <div className="flex md:justify-end mt-4 md:mt-0">
                        <div className={cn(
                            "bg-white/10 backdrop-blur-md border border-white/20 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] w-full max-w-sm flex items-center justify-between shadow-lg transition-all duration-700",
                            remainingBalance <= 0 && totalAmountPaid > 0 && "ring-4 ring-emerald-400/30 bg-emerald-500/20 animate-success-glow"
                        )}>
                            <div>
                                <p className="text-xs sm:text-sm font-bold text-primary-100 uppercase tracking-widest mb-1">Total Paid This Year</p>
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl sm:text-4xl font-extrabold tracking-tighter">GH₵{totalAmountPaid}</div>
                                    {remainingBalance <= 0 && totalAmountPaid > 0 && (
                                        <div className="relative flex items-center justify-center animate-pop-3d">
                                            <PartyPopper className="h-8 w-8 text-yellow-300 fill-yellow-200" />
                                            {/* Confetti particles */}
                                            <div className="absolute top-0 h-1 w-1 bg-white rounded-full translate-x-4 -translate-y-4 animate-ping" />
                                            <div className="absolute top-0 h-1 w-1 bg-yellow-400 rounded-full -translate-x-4 -translate-y-2 animate-ping" />
                                            <div className="absolute top-0 h-1 w-1 bg-blue-300 rounded-full translate-x-5 translate-y-2 animate-ping" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={cn(
                                "h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30 shrink-0",
                                remainingBalance <= 0 && totalAmountPaid > 0 && "bg-emerald-400/40 border-emerald-400/50"
                            )}>
                                <CheckCircle2 className={cn("h-8 w-8 text-white", remainingBalance <= 0 && totalAmountPaid > 0 && "animate-bounce")} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Premium KPI Grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 lg:gap-6">
                {/* Paid Tally */}
                <div className={cn(
                    "p-5 sm:p-6 rounded-[1.75rem] sm:rounded-[2.25rem] bg-gradient-to-b from-white to-emerald-50/50 shadow-samsung border border-white hover:shadow-samsung-lg hover:-translate-y-1 transition-all duration-300 cursor-default group relative overflow-hidden",
                    remainingBalance <= 0 && totalAmountPaid > 0 && "animate-success-glow border-emerald-200 animate-liquid-shine"
                )}>
                    <div className={cn(
                        "absolute -right-4 -top-4 h-24 w-24 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700",
                        remainingBalance <= 0 && totalAmountPaid > 0 ? "bg-emerald-300/30" : "bg-emerald-100/50"
                    )}></div>
                    <div className="relative z-10">
                        <div className={cn(
                            "h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3 sm:mb-4 border group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300",
                            remainingBalance <= 0 && totalAmountPaid > 0 ? "border-emerald-300" : "border-emerald-100"
                        )}>
                            <TrendingUp className={cn("h-5 w-5 sm:h-6 sm:w-6 transition-colors", remainingBalance <= 0 && totalAmountPaid > 0 ? "text-emerald-600" : "text-emerald-500")} />
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest truncate">Total Paid</p>
                            {remainingBalance <= 0 && totalAmountPaid > 0 && (
                                <span className="bg-emerald-100 text-emerald-700 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase whitespace-nowrap">Goal Met</span>
                            )}
                        </div>
                        <div className={cn(
                            "text-2xl sm:text-3xl font-extrabold tracking-tighter transition-colors",
                            remainingBalance <= 0 && totalAmountPaid > 0 ? "text-emerald-700" : "text-black"
                        )}>GH₵{totalAmountPaid}</div>
                    </div>
                </div>

                {/* Balance Remaining */}
                <div className="p-5 sm:p-6 rounded-[1.75rem] sm:rounded-[2.25rem] bg-gradient-to-b from-white to-blue-50/50 shadow-samsung border border-white hover:shadow-samsung-lg hover:-translate-y-1 transition-all duration-300 cursor-default group relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 h-24 w-24 bg-blue-100/50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3 sm:mb-4 border border-blue-100 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                            <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                        </div>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 truncate">Year Balance</p>
                        <div className="text-2xl sm:text-3xl font-extrabold text-black tracking-tighter">GH₵{remainingBalance}</div>
                    </div>
                </div>

                {/* Arrears - Interactive */}
                <Link href={totalArrears > 0 ? "/arrears" : "#"} className={cn(
                    "block p-5 sm:p-6 rounded-[1.75rem] sm:rounded-[2.25rem] shadow-samsung border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden",
                    totalArrears > 0
                        ? "bg-gradient-to-b from-white to-red-50/50 border-red-100/50 hover:border-red-200 hover:shadow-red-500/10"
                        : "bg-gradient-to-b from-white to-emerald-50/50 border-emerald-100/50 hover:border-emerald-200 hover:shadow-emerald-500/10 cursor-default"
                )}>
                    <div className={cn(
                        "absolute -right-4 -top-4 h-24 w-24 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700",
                        totalArrears > 0 ? "bg-red-100/50" : "bg-emerald-100/50"
                    )}></div>
                    <div className="relative z-10">
                        <div className={cn(
                            "h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3 sm:mb-4 border group-hover:scale-110 transition-transform duration-300",
                            totalArrears > 0 ? "border-red-100 group-hover:rotate-12" : "border-emerald-100 group-hover:-rotate-3"
                        )}>
                            {totalArrears > 0 ? (
                                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
                            ) : (
                                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 truncate">
                                {totalArrears > 0 ? "Arrears Active" : "No Arrears"}
                            </p>
                            {totalArrears > 0 && (
                                <ArrowRight className="h-4 w-4 text-red-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                            )}
                        </div>
                        <div className={cn(
                            "text-2xl sm:text-3xl font-extrabold tracking-tighter",
                            totalArrears > 0 ? "text-red-600" : "text-emerald-600"
                        )}>
                            {totalArrears > 0 ? `GH₵${totalArrears}` : "0"}
                        </div>
                    </div>
                </Link>

                {/* Next Payment Due */}
                <div className="p-5 sm:p-6 rounded-[1.75rem] sm:rounded-[2.25rem] bg-gradient-to-b from-white to-amber-50/50 shadow-samsung border border-white hover:shadow-samsung-lg hover:-translate-y-1 transition-all duration-300 cursor-default group relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 h-24 w-24 bg-amber-100/50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3 sm:mb-4 border border-amber-100 group-hover:scale-110 transition-transform duration-300">
                            <CalendarClock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
                        </div>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 truncate">Next Due Date</p>
                        <div className="text-xl sm:text-2xl font-extrabold text-black tracking-tighter">{nextDueDate}</div>
                    </div>
                </div>
            </div>



            {/* Main Content Area */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Health Sidebar - Dynamic Month Status */}
                <div className="md:col-span-1 space-y-6">
                    <div className={cn(
                        "p-8 rounded-[2.5rem] text-white shadow-premium relative overflow-hidden group transition-colors duration-500",
                        currentMonthStatus === "Good Standing"
                            ? "bg-gradient-to-br from-emerald-500 to-emerald-700"
                            : currentMonthStatus === "Arrears"
                                ? "bg-gradient-to-br from-red-500 to-rose-700"
                                : "bg-gradient-to-br from-slate-800 to-slate-900"
                    )}>
                        {/* Background Pulse Effect for Arrears */}
                        {currentMonthStatus === "Arrears" && (
                            <div className="absolute inset-0 bg-red-600 opacity-0 group-hover:animate-pulse transition-opacity"></div>
                        )}
                        <div className="absolute -top-10 -right-10 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 z-0">
                            <Clock className="h-40 w-40" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                {currentMonthStatus === "Good Standing" ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-red-200" />
                                )}
                                <p className="text-xs font-bold text-white/80 uppercase tracking-widest">Current Status</p>
                            </div>

                            <h2 className="text-4xl font-extrabold mb-2 tracking-tighter leading-tight">
                                {currentMonthStatus}
                            </h2>
                            <p className="text-sm font-medium text-white/80 mb-8 max-w-[200px]">
                                {currentMonthStatus === "Good Standing"
                                    ? "You're all caught up for this billing cycle. Great job!"
                                    : "You have outstanding payments that need attention."}
                            </p>

                            <div className="space-y-3 pt-6 border-t border-white/20">
                                <Link href={currentMonthStatus === "Arrears" ? "/arrears" : "/payments"} className="block">
                                    <Button className={cn(
                                        "w-full h-14 rounded-[2rem] font-bold active:scale-95 transition-all shadow-lg text-lg",
                                        currentMonthStatus === "Good Standing"
                                            ? "bg-white text-emerald-700 hover:bg-emerald-50 shadow-emerald-900/20"
                                            : "bg-white text-red-700 hover:bg-red-50 shadow-red-900/20"
                                    )}>
                                        {currentMonthStatus === "Arrears" ? "Settle Debt Now" : "Manage Dues"}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Payments Card */}
                <div className="md:col-span-2 p-6 md:p-8 rounded-[2.5rem] bg-white shadow-samsung border border-white relative overflow-hidden group/card hover:shadow-samsung-lg transition-all duration-500">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -z-10 group-hover/card:bg-primary-50/50 transition-colors duration-700"></div>

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h3 className="text-xl font-extrabold text-black tracking-tight">Recent Activity</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Latest transactions</p>
                        </div>
                        <Link href="/transactions">
                            <Button variant="ghost" size="sm" className="rounded-full font-bold text-primary-600 hover:bg-primary-50 hover:text-primary-700 transition-colors">
                                View History <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </div>

                    <div className="space-y-4 relative z-10">
                        {recentPayments.map((payment) => (
                            <div key={payment.id} className="p-5 rounded-[1.75rem] border border-slate-100 bg-white hover:bg-slate-50/80 hover:border-slate-200 hover:shadow-md transition-all duration-300 group cursor-default">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl sm:rounded-[1.25rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-primary-500 group-hover:shadow-sm group-hover:scale-105 transition-all duration-300 shrink-0">
                                            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm sm:text-base">{payment.desc}</p>
                                            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5">{payment.date} <span className="text-slate-300 mx-1">•</span> <span className="font-mono text-[9px] sm:text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-400">#{payment.id.substring(0, 8)}</span></p>
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                                        <div className="flex items-center gap-1.5 sm:hidden">
                                            <div className={cn(
                                                "h-1.5 w-1.5 rounded-full animate-pulse",
                                                payment.status === "completed" ? "bg-emerald-500" : "bg-amber-500"
                                            )}></div>
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-widest",
                                                payment.status === "completed" ? "text-emerald-600" : "text-amber-600"
                                            )}>{payment.status}</span>
                                        </div>

                                        <p className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">GH₵{payment.amount.toFixed(2)}</p>

                                        <div className="hidden sm:flex items-center gap-1.5 mt-1 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">
                                            <div className={cn(
                                                "h-1.5 w-1.5 rounded-full animate-pulse",
                                                payment.status === "completed" ? "bg-emerald-500" : "bg-amber-500"
                                            )}></div>
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-widest",
                                                payment.status === "completed" ? "text-emerald-600" : "text-amber-600"
                                            )}>{payment.status}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {recentPayments.length === 0 && !isLoading && (
                            <div className="text-center py-12 px-4 rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-slate-50/50">
                                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-400">
                                    <Wallet className="h-6 w-6" />
                                </div>
                                <p className="text-slate-500 font-bold mb-1">No recent transactions</p>
                                <p className="text-xs text-slate-400 font-medium max-w-[200px] mx-auto">Your payment history will appear here once you make a contribution.</p>
                            </div>
                        )}
                    </div>
                </div>


            </div>
        </div>
    );
}
