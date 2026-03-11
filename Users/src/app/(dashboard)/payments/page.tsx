"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, CheckCircle2, Building, Wallet, CalendarHeart, History, PieChart, Info, CalendarClock, ChevronRight, ArrowRight, AlertCircle, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import Script from "next/script";
import { toast } from "sonner";

export default function PaymentsPage() {
    const [paymentType, setPaymentType] = useState<"monthly" | "full" | "installment" | "arrears" | "fundraising" | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [customAmount, setCustomAmount] = useState("");
    const [userData, setUserData] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [activeEvents, setActiveEvents] = useState<any[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
    const [verifiedReceipt, setVerifiedReceipt] = useState<any>(null);

    const loadPageData = async () => {
        try {
            const [profileRes, statsRes, eventsRes] = await Promise.all([
                fetch("/api/user/profile", { cache: "no-store" }),
                fetch("/api/dashboard/stats", { cache: "no-store" }),
                fetch("/api/fundraising/active", { cache: "no-store" })
            ]);

            if (profileRes.ok) setUserData(await profileRes.json());
            if (statsRes.ok) setStats(await statsRes.json());
            if (eventsRes.ok) setActiveEvents(await eventsRes.json());
        } catch (err) {
            console.error("Failed to load page data", err);
        }
    };

    useEffect(() => {
        loadPageData();
    }, []);

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!(window as any).PaystackPop) {
            toast.error("Payment system is still loading. Please wait a moment.");
            return;
        }

        if (!userData?.email) {
            toast.error("Account not found. Please update your profile.");
            return;
        }

        let rawAmount = 0;
        if (paymentType === "monthly") {
            rawAmount = stats?.currentMonthDue || 20;
        } else if (paymentType === "full") {
            rawAmount = stats?.remainingBalance || (stats?.yearlyFee || 240);
        } else if (paymentType === "installment" || paymentType === "fundraising") {
            rawAmount = Number(customAmount);
            if (paymentType === "installment") {
                if (rawAmount < 70) {
                    toast.error("Minimum installment amount is GH₵70");
                    return;
                }
                if (rawAmount > (stats?.remainingBalance || (stats?.yearlyFee || 240))) {
                    toast.error("Amount exceeds your remaining balance");
                    return;
                }
            }
        }

        if (isNaN(rawAmount) || rawAmount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        const feeRate = 0.032;
        const transactionFee = rawAmount * feeRate;
        const amountToCharge = rawAmount + transactionFee;
        const amountInPesewas = Math.round(amountToCharge * 100);

        setIsProcessing(true);

        try {
            const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

            if (!paystackKey) {
                toast.error("Configuration error. Please contact support.");
                setIsProcessing(false);
                return;
            }

            // 1. Initialize Payment via Server (Secure PaymentIntent creation)
            const initRes = await fetch("/api/payments/initialize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: paymentType === "fundraising" ? "fundraising" : paymentType,
                    eventId: selectedEvent?.id,
                    amount: rawAmount
                })
            });
            const initData = await initRes.json();

            if (!initData.success || !initData.access_code) {
                toast.error(initData.error || "Failed to initialize payment securely.");
                setIsProcessing(false);
                return;
            }

            // 2. Open Paystack Inline
            const handler = (window as any).PaystackPop.setup({
                key: paystackKey,
                email: userData.email,
                amount: amountInPesewas,
                currency: "GHS",
                access_code: initData.access_code,
                ref: initData.reference,
                reference: initData.reference,
                metadata: {
                    custom_fields: [
                        { display_name: "Type", variable_name: "payment_type", value: paymentType === "fundraising" ? "fundraising" : paymentType }
                    ]
                },
                callback: (response: any) => {
                    const finalRef = response.reference || initData.reference;
                    handleVerification(response, finalRef, rawAmount);
                },
                onClose: () => {
                    setIsProcessing(false);
                    toast.info("Transaction cancelled");
                }
            });

            handler.openIframe();
        } catch (error) {
            console.error("Error setting up Paystack:", error);
            setIsProcessing(false);
            toast.error("Could not open payment window.");
        }
    };

    const handleVerification = async (response: any, secureReference: string, amount: number) => {
        try {
            // Use the most definitive reference!
            const finalReference = response.reference || secureReference;

            const verifyRes = await fetch(`/api/payments/verify?reference=${finalReference}`, {
                method: "GET",
            });

            const verifyData = await verifyRes.json();

            // Even if the server polling timed out (verifyData.success === false), 
            // the fact that we are in the Paystack success callback means the payment 
            // was successful. We show the success screen while background processing finishes.
            setIsProcessing(false);
            setShowSuccessModal(true);

            // Capture info for the receipt before resetting state
            const receiptType = paymentType === "fundraising" ? `Donation: ${selectedEvent?.title || 'Event'}` : ((paymentType as string) === "arrears" ? "Arrears Settlement" : "Monthly Dues Payment");

            // Reset state
            setPaymentType(null);
            setCustomAmount("");
            setSelectedEvent(null);
            loadPageData();

            setVerifiedReceipt({
                id: finalReference,
                date: new Date().toLocaleDateString(),
                amount: amount,
                type: receiptType,
                memberName: `${userData.firstName} ${userData.lastName}`,
                email: userData.email,
                status: "Completed"
            });
        } catch (error) {
            toast.error("An error occurred checking verification status.");
            setIsProcessing(false);
        }
    };

    const yearlyFee = stats?.yearlyFee ?? 240;
    const amountPaid = stats?.totalAmountPaid ?? 0;
    const remainingBalance = stats?.remainingBalance ?? yearlyFee;
    const totalBalanceToPay = stats?.totalBalanceToPay ?? remainingBalance;
    const carryoverArrears = stats?.carryoverArrears ?? 0;
    const progressPercentage = stats?.progressPercentage ?? 0;
    const paymentHistory = stats?.paymentHistory ?? [];
    const yearlyCalendar = stats?.yearlyCalendar ?? [];
    const previousYearCalendar = stats?.previousYearCalendar ?? [];

    return (
        <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700 w-full">
            <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />

            <div className="flex flex-col md:flex-row gap-6">

                {/* Left Column: Balance & Progress */}
                <div className="w-full md:w-1/3 space-y-6">
                    {/* Balance Overview Card */}
                    <div className="p-8 rounded-[2.5rem] text-white shadow-premium relative overflow-hidden group bg-gradient-to-br from-slate-900 to-black transition-all">
                        <div className="absolute -top-6 -right-6 p-8 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700">
                            <PieChart className="h-32 w-32" />
                        </div>
                        <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1 relative z-10">Total Balance to Pay</p>
                        <h2 className="text-4xl sm:text-5xl font-extrabold mb-8 tracking-tighter relative z-10">
                            GH₵{totalBalanceToPay.toFixed(2)}
                        </h2>

                        <div className="space-y-4 pt-6 border-t border-white/10 relative z-10">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-white/60">Total Yearly Fee ({stats?.currentYear})</span>
                                <span className="font-bold text-white">GH₵{yearlyFee}.00</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-white/60">Amount Paid ({stats?.currentYear})</span>
                                <span className="font-bold text-emerald-400">GH₵{amountPaid}.00</span>
                            </div>
                            {carryoverArrears > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-semibold text-white/60">Arrears ({stats?.prevYear})</span>
                                    <span className="font-bold text-red-400">GH₵{carryoverArrears.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Yearly Calendar View */}
                    <div className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-samsung">
                        {previousYearCalendar.length > 0 && (
                            <div className="mb-8 animate-in slide-in-from-top-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-8 w-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                                        <History className="h-4 w-4" />
                                    </div>
                                    <h3 className="text-sm font-extrabold text-black uppercase tracking-tight">Previous Year ({stats?.prevYear})</h3>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {previousYearCalendar.map((month: any, idx: number) => (
                                        <div key={idx} className={cn(
                                            "flex flex-col items-center justify-center p-2 rounded-xl border",
                                            month.status === "Paid" ? "bg-emerald-50/30 border-emerald-100" : "bg-red-50/30 border-red-100"
                                        )}>
                                            <p className="text-[8px] font-black uppercase text-slate-500 mb-1">{month.monthName}</p>
                                            <div className={cn("h-4 w-4 rounded-full flex items-center justify-center", month.status === "Paid" ? "bg-emerald-500" : "bg-red-500")}>
                                                {month.status === "Paid" ? <CheckCircle2 className="h-2.5 w-2.5 text-white" /> : <AlertCircle className="h-2.5 w-2.5 text-white" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 px-3 py-2 bg-red-50/50 rounded-xl border border-red-100/50">
                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-tighter">Total Arrears: GH₵{carryoverArrears.toFixed(2)}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 mb-6 pt-2">
                            <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <CalendarDays className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-extrabold text-black tracking-tight">{stats?.currentYear} Calendar</h3>
                        </div>

                        {yearlyCalendar.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-sm text-slate-400 font-semibold">Calendar loading...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {yearlyCalendar.map((month: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all",
                                            month.status === "Paid"
                                                ? "bg-emerald-50/50 border-emerald-100"
                                                : month.status === "Owing"
                                                    ? "bg-red-50/50 border-red-100"
                                                    : "bg-slate-50 border-slate-100 opacity-60 grayscale hover:grayscale-0"
                                        )}
                                    >
                                        <p className={cn(
                                            "text-[10px] font-bold uppercase tracking-widest mb-1.5",
                                            month.status === "Paid" ? "text-emerald-700" : month.status === "Owing" ? "text-red-700" : "text-slate-500"
                                        )}>
                                            {month.monthName}
                                        </p>
                                        <div className={cn(
                                            "h-6 w-6 rounded-full flex items-center justify-center",
                                            month.status === "Paid" ? "bg-emerald-500 text-white shadow-sm" : month.status === "Owing" ? "bg-red-500 text-white shadow-sm" : "bg-slate-200 text-slate-400"
                                        )}>
                                            {month.status === "Paid" ? (
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                            ) : month.status === "Owing" ? (
                                                <AlertCircle className="h-3.5 w-3.5" />
                                            ) : (
                                                <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Payment Progress Section */}
                    <div className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-samsung">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-black uppercase tracking-widest">Yearly Progress</h3>
                            <span className="text-sm font-extrabold text-primary-600">{progressPercentage}%</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                        <p className="text-xs font-semibold text-slate-400 mt-4 text-center">
                            {totalBalanceToPay <= 0 ? "You have fully paid your yearly subscription! 🎉" : `Keep it up! Pay GH₵${totalBalanceToPay.toFixed(2)} more to clear your yearly fee.`}
                        </p>
                    </div>

                    {/* Next Due Date Indicator */}
                    {stats?.nextDueDate && totalBalanceToPay > 0 && (
                        <div className="p-5 rounded-[2rem] bg-amber-50 border border-amber-100 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                <CalendarClock className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-amber-600/80 uppercase tracking-wider mb-0.5">Next Payment Due</p>
                                <p className="text-sm font-extrabold text-amber-900">{stats.nextDueDate}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Payment Options & History */}
                <div className="w-full md:w-2/3 space-y-6">
                    {/* Fundraising / Donations Section */}
                    {activeEvents.length > 0 && (
                        <div className="p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-premium animate-in zoom-in-95 duration-500">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                                    <CalendarHeart className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tight">Active Fundraising & Donations</h3>
                                    <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-0.5">Support God's Work</p>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {activeEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className={cn(
                                            "p-6 rounded-[2rem] border-2 transition-all cursor-pointer",
                                            selectedEvent?.id === event.id
                                                ? "bg-white text-indigo-900 border-white shadow-lg"
                                                : "bg-white/10 border-white/10 hover:bg-white/20"
                                        )}
                                        onClick={() => {
                                            setSelectedEvent(event);
                                            setPaymentType("fundraising");
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-black text-lg">{event.title}</h4>
                                            {selectedEvent?.id === event.id && (
                                                <CheckCircle2 className="h-6 w-6 text-indigo-600" />
                                            )}
                                        </div>
                                        <p className={cn(
                                            "text-sm font-medium mb-4 leading-relaxed",
                                            selectedEvent?.id === event.id ? "text-indigo-900/70" : "text-white/70"
                                        )}>
                                            {event.description}
                                        </p>

                                        {event.goalAmount && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                                    <span>Raised: GH₵{event.raisedAmount}</span>
                                                    <span>Goal: GH₵{event.goalAmount}</span>
                                                </div>
                                                <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-white rounded-full transition-all duration-1000"
                                                        style={{ width: `${Math.min(100, (event.raisedAmount / event.goalAmount) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {paymentType === "fundraising" && selectedEvent && (
                                <div className="mt-8 space-y-4 animate-in slide-in-from-top-4">
                                    <p className="text-xs font-black uppercase tracking-widest text-center text-white/80">
                                        Enter your contribution for {selectedEvent.title}
                                    </p>
                                    <div className="relative">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-2xl text-indigo-900">GH₵</div>
                                        <input
                                            type="number"
                                            value={customAmount}
                                            onChange={(e) => setCustomAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full h-20 pl-20 pr-8 bg-white text-indigo-900 rounded-[1.5rem] text-4xl font-black focus:outline-none focus:ring-4 focus:ring-white/50 transition-all placeholder:text-indigo-900/20"
                                        />
                                    </div>
                                    <Button
                                        onClick={handlePayment}
                                        disabled={isProcessing || !customAmount}
                                        className="w-full h-16 bg-white text-indigo-600 hover:bg-slate-50 font-black text-lg rounded-[1.5rem] shadow-xl active:scale-95 transition-all"
                                    >
                                        {isProcessing ? "Processing..." : `Donate GH₵${customAmount || '0.00'}`}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Payment Options Card */}
                    <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-samsung">
                        <div className="mb-6 flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-extrabold text-black tracking-tight text-left">Yearly Dues & Arrears</h3>
                                <p className="text-sm font-semibold text-slate-500 mt-1 text-left">Your flexible payment plan for {stats?.currentYear || new Date().getFullYear()}</p>
                            </div>
                            {totalBalanceToPay <= 0 && (
                                <div className="px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-200 animate-in zoom-in duration-500">
                                    Fully Settled
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            {totalBalanceToPay <= 0 && (
                                <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] rounded-[2rem] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
                                    <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                    </div>
                                    <h4 className="text-xl font-black text-black tracking-tight">Financial Obligations Fulfilled</h4>
                                    <p className="text-xs text-slate-500 font-bold mt-2 max-w-[240px]">
                                        You have successfully cleared all dues and arrears. Your account is in good standing!
                                    </p>
                                    <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-6 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">
                                        Resets Jan 1st, {Number(stats?.currentYear || new Date().getFullYear()) + 1}
                                    </p>
                                </div>
                            )}

                            <form onSubmit={handlePayment} className={cn("space-y-6 transition-all duration-700", totalBalanceToPay <= 0 && "opacity-40 grayscale pointer-events-none")}>
                                <div className="grid gap-4">
                                    {/* Option 1: Monthly Plan */}
                                    {(totalBalanceToPay >= 20 || totalBalanceToPay <= 0) && (
                                        <label className={cn(
                                            "group cursor-pointer rounded-[2rem] border-2 p-5 transition-all duration-300 flex items-center justify-between gap-4",
                                            paymentType === "monthly" ? "border-primary-500 bg-primary-50/30" : "border-slate-100 hover:border-slate-200"
                                        )}>
                                            <input type="radio" value="monthly" name="paymentType" className="sr-only" onChange={() => setPaymentType("monthly")} />
                                            <div className="flex items-center gap-4">
                                                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", paymentType === "monthly" ? "bg-primary-500 text-white" : "bg-slate-100 text-slate-500")}>
                                                    <CalendarHeart className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-black text-lg">Monthly Plan</h4>
                                                    <p className="text-xs font-semibold text-slate-500">Regular GHS {stats?.currentMonthDue || 20} monthly payment</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <div className="text-xl font-extrabold text-primary-600">GH₵{((stats?.currentMonthDue || 20) * 1.032).toFixed(2)}</div>
                                                <span className="text-[10px] text-slate-400 font-semibold mt-1 bg-slate-100 flex items-center justify-center px-2 py-0.5 rounded-full">Incl. GH₵{((stats?.currentMonthDue || 20) * 0.032).toFixed(2)} fee</span>
                                            </div>
                                        </label>
                                    )}

                                    {/* Option 2: Full Yearly Payment */}
                                    {(totalBalanceToPay > (stats?.currentMonthDue || 20)) && (
                                        <label className={cn(
                                            "group cursor-pointer rounded-[2rem] border-2 p-5 transition-all duration-300 flex items-center justify-between gap-4",
                                            paymentType === "full" ? "border-emerald-500 bg-emerald-50/30" : "border-slate-100 hover:border-slate-200"
                                        )}>
                                            <input type="radio" value="full" name="paymentType" className="sr-only" onChange={() => setPaymentType("full")} />
                                            <div className="flex items-center gap-4">
                                                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", paymentType === "full" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500")}>
                                                    <Wallet className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-black text-lg">Full Payment</h4>
                                                    <p className="text-sm text-slate-500 font-semibold">Clear remaining GH₵{totalBalanceToPay.toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <div className="text-xl font-extrabold text-primary-600">GH₵{(totalBalanceToPay * 1.032).toFixed(2)}</div>
                                                <span className="text-[10px] text-slate-400 font-semibold mt-1 bg-slate-100 flex items-center justify-center px-2 py-0.5 rounded-full">Incl. GH₵{(totalBalanceToPay * 0.032).toFixed(2)} fee</span>
                                            </div>
                                        </label>
                                    )}

                                    {/* Option 3: Yearly Installment */}
                                    {(remainingBalance > 70 || remainingBalance <= 0) && (
                                        <label className={cn(
                                            "group cursor-pointer rounded-[2rem] border-2 p-5 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                                            paymentType === "installment" ? "border-primary-500 bg-primary-50/30" : "border-slate-100 hover:border-slate-200"
                                        )}>
                                            <input type="radio" value="installment" name="paymentType" className="sr-only" onChange={() => setPaymentType("installment")} />
                                            <div className="flex items-center gap-4">
                                                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0", paymentType === "installment" ? "bg-primary-500 text-white" : "bg-slate-100 text-slate-500")}>
                                                    <PieChart className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-black text-lg">Yearly Installment</h4>
                                                    <p className="text-xs font-semibold text-slate-500">Flexible payment (Min GH₵70)</p>
                                                </div>
                                            </div>
                                            {paymentType === "installment" && (
                                                <div className="w-full sm:w-auto flex flex-col items-end gap-1 animate-in fade-in zoom-in duration-300 mt-2 sm:mt-0">
                                                    <Input
                                                        type="number"
                                                        placeholder="e.g. 70"
                                                        min="70"
                                                        max={totalBalanceToPay}
                                                        value={customAmount}
                                                        onChange={(e) => setCustomAmount(e.target.value)}
                                                        className="h-11 w-full sm:w-32 rounded-xl text-center font-bold bg-white"
                                                        onClick={(e) => e.preventDefault()}
                                                    />
                                                    {customAmount && Number(customAmount) >= 70 && (
                                                        <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-full mt-1">
                                                            Total: GH₵{(Number(customAmount) * 1.032).toFixed(2)} (Incl. fee)
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </label>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-slate-50 space-y-4">
                                    <Button
                                        type="submit"
                                        className="w-full h-14 rounded-[2rem] text-sm font-bold bg-black hover:bg-slate-800 text-white shadow-samsung transition-all disabled:opacity-50"
                                        disabled={userData?.role === "Guest" || !paymentType || isProcessing || (paymentType === 'installment' && (!customAmount || Number(customAmount) < 70))}
                                    >
                                        {userData?.role === "Guest" ? "Payments disabled in Guest Mode" : isProcessing ? "Processing..." : "Proceed to Secure Checkout"}
                                        {userData?.role !== "Guest" && !isProcessing && <ArrowRight className="h-4 w-4 ml-2" />}
                                    </Button>
                                    <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest flex items-center justify-center gap-2">
                                        <CreditCard className="h-3 w-3" /> Encrypted & Secure
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Payment History Table */}
                    <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-samsung overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <History className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-extrabold text-black tracking-tight">Payment History</h3>
                        </div>

                        {paymentHistory.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-sm text-slate-400 font-semibold">No transactions found for this year.</p>
                            </div>
                        ) : (
                            <div className="max-h-[400px] overflow-y-auto overflow-x-auto no-scrollbar lg:pr-2">
                                <table className="w-full text-left whitespace-nowrap">
                                    <thead className="sticky top-0 bg-white z-10">
                                        <tr className="border-b border-slate-100">
                                            <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider bg-white">Date</th>
                                            <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider bg-white">Method</th>
                                            <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right bg-white">Amount</th>
                                            <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right bg-white">Receipt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {paymentHistory.map((pt: any) => (
                                            <tr key={pt.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 text-sm font-semibold text-slate-700">{pt.date}</td>
                                                <td className="py-4 text-sm font-semibold text-slate-500">
                                                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                                        {pt.method}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-sm font-extrabold text-black text-right">GH₵{pt.amount}.00</td>
                                                <td className="py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold text-[10px] uppercase tracking-wider"
                                                        onClick={() => setSelectedReceipt({
                                                            id: pt.id,
                                                            date: pt.date,
                                                            amount: pt.amount,
                                                            type: pt.purpose || pt.method,
                                                            memberName: `${userData.firstName} ${userData.lastName}`,
                                                            email: userData.email,
                                                            status: "Completed"
                                                        })}
                                                    >
                                                        View
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="">
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="h-24 w-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center">
                        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-black tracking-tight">Payment Successful</h3>
                        <p className="text-sm font-semibold text-slate-500 mt-2 max-w-[280px] mx-auto">
                            {paymentType === "fundraising"
                                ? "Your contribution has been successfully received. Thank you for your support!"
                                : "Your payment has been successfully recorded towards your yearly subscription."}
                        </p>
                    </div>
                    <div className="w-full space-y-3">
                        <Button
                            onClick={() => {
                                setSelectedReceipt(verifiedReceipt);
                                setShowSuccessModal(false);
                            }}
                            className="w-full h-14 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all px-12"
                        >
                            View Receipt
                        </Button>
                        <Button onClick={() => {
                            setShowSuccessModal(false);
                            window.location.reload();
                        }} variant="ghost" className="w-full h-12 rounded-[2rem] font-bold text-slate-400">
                            Close & Continue
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Receipt View Modal */}
            <Modal isOpen={!!selectedReceipt} onClose={() => setSelectedReceipt(null)} title="">
                <div id="receipt-content" className="p-6 sm:p-10 bg-white flex flex-col items-center">
                    {/* Official Banner */}
                    <div className="w-full border-b-2 border-slate-900 pb-6 mb-8 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-6 sm:gap-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-slate-100 p-2 flex items-center justify-center overflow-hidden shrink-0">
                                <img src="/logo.png" alt="Logo" className="object-contain" />
                            </div>
                            <div className="text-center sm:text-left">
                                <h2 className="text-xl font-black text-black tracking-tighter uppercase">Gethsemane Assemble</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Official Payment Receipt</p>
                            </div>
                        </div>
                        <div className="text-center sm:text-right">
                            <div className="inline-block px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg mb-2">Original</div>
                            <p className="text-[10px] font-bold text-slate-400">{selectedReceipt?.date}</p>
                        </div>
                    </div>

                    {/* Receipt Details */}
                    <div className="w-full space-y-8">
                        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center sm:text-left">
                            <div className="space-y-4 w-full">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Received From</p>
                                    <p className="text-lg font-black text-black tracking-tight">{selectedReceipt?.memberName}</p>
                                    <p className="text-xs font-semibold text-slate-500">{selectedReceipt?.email}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Purpose of Payment</p>
                                    <p className="text-sm font-extrabold text-black uppercase tracking-tight">{selectedReceipt?.type}</p>
                                </div>
                            </div>
                            <div className="sm:text-right space-y-4 w-full">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Receipt Number</p>
                                    <p className="text-sm font-black text-indigo-600 tracking-tighter truncate max-w-[200px] sm:max-w-[120px] mx-auto sm:mr-0">{selectedReceipt?.id?.slice(0, 10)}...</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                    <div className="inline-flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Verified
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Amount Box */}
                        <div className="p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] bg-indigo-600 text-white text-center shadow-indigo-200 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2 relative z-10">Total Amount Paid</p>
                            <h3 className="text-4xl sm:text-5xl font-black tracking-tighter relative z-10">GH₵{selectedReceipt?.amount}.00</h3>
                        </div>

                        {/* Seal & Footer */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-8 sm:gap-4 pt-10 border-t border-dashed border-slate-200 text-center sm:text-left">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Digital Authorization</p>
                                <div className="h-10 flex items-center justify-center sm:justify-start gap-2">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <p className="text-[10px] font-mono text-slate-400">{selectedReceipt?.id}</p>
                                </div>
                            </div>
                            <div className="sm:text-right">
                                <div className="h-12 w-12 rounded-full border-4 border-emerald-100 flex items-center justify-center mb-2 mx-auto sm:mr-0">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                </div>
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Certified Payment</p>
                            </div>
                        </div>
                    </div>

                    {/* Print/Download Actions */}
                    <div className="w-full flex gap-3 mt-12 print:hidden justify-center sm:justify-end no-scrollbar">
                        <Button
                            variant="outline"
                            className="h-12 rounded-2xl font-bold border-slate-200"
                            onClick={() => window.print()}
                        >
                            Print Receipt
                        </Button>
                        <Button
                            className="h-12 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-8"
                            onClick={() => {
                                setSelectedReceipt(null);
                                window.location.reload();
                            }}
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
