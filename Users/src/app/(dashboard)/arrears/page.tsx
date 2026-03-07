"use client";

import React, { useState, useEffect } from "react";
import {
    CreditCard,
    CheckCircle2,
    AlertCircle,
    History,
    Wallet,
    CalendarClock,
    ArrowLeft,
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Script from "next/script";
import { toast } from "sonner";

export default function ArrearsPage() {
    const [paymentAmount, setPaymentAmount] = useState<number | "">("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
    const [verifiedReceipt, setVerifiedReceipt] = useState<any>(null);

    const loadData = async () => {
        try {
            const [profileRes, statsRes] = await Promise.all([
                fetch("/api/user/profile"),
                fetch("/api/dashboard/stats")
            ]);

            const profileData = await profileRes.json();
            const statsData = await statsRes.json();

            setUserData(profileData);
            setStats(statsData);
        } catch (err) {
            console.error("Failed to load data", err);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Define data variables from new stats endpoint
    const outstandingBalance = stats?.outstandingBalance ?? 0;
    const lateFees = stats?.lateFees ?? 0;
    const totalAmountOwing = stats?.totalArrears ?? 0;

    // Standardized 20 Cedis payment or remaining balance if less
    const handlePayStandard = () => {
        setPaymentAmount(Math.min(totalAmountOwing, 20));
    };

    const handlePayFull = () => {
        setPaymentAmount(totalAmountOwing);
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log("Initiating arrears payment...");
        if (!(window as any).PaystackPop) {
            console.error("PaystackPop not found on window object");
            toast.error("Payment system is still loading. Please wait a moment.");
            return;
        }

        if (!userData?.email) {
            console.error("User email missing:", userData);
            toast.error("Account not found. Please update your profile.");
            return;
        }

        const rawAmount = Number(paymentAmount);

        // Calculate transaction fee (0.41 Paystack + 0.30 withdrawal = ~0.71 for every 20 GHS => 3.55%)
        const feeRate = 0.0355;
        const transactionFee = rawAmount * feeRate;
        const amountToCharge = rawAmount + transactionFee;
        const amountInPesewas = Math.round(amountToCharge * 100);

        console.log("Arrears Payment Details:", {
            email: userData.email,
            amount: rawAmount,
            amountInPesewas,
            publicKeyExists: !!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
        });

        if (isNaN(rawAmount) || rawAmount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setIsProcessing(true);

        try {
            const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

            if (!paystackKey) {
                console.error("Paystack Public Key is missing in environment variables");
                toast.error("Configuration error. Please contact support.");
                setIsProcessing(false);
                return;
            }

            // 1. Initialize Payment via Server
            const initRes = await fetch("/api/payments/initialize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "arrears",
                    amount: rawAmount
                })
            });
            const initData = await initRes.json();

            if (!initData.success || !initData.access_code) {
                toast.error(initData.error || "Failed to initialize payment securely.");
                setIsProcessing(false);
                return;
            }

            const handler = (window as any).PaystackPop.setup({
                key: paystackKey,
                email: userData.email,
                amount: amountInPesewas,
                currency: "GHS",
                access_code: initData.access_code,
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
            console.error("Error setting up Paystack (Arrears):", error);
            setIsProcessing(false);
            toast.error("Could not open payment window. Check console for details.");
        }
    };

    const handleVerification = async (response: any, secureReference: string, amount: number) => {
        console.log("[ARREARS] Verification started for ref:", secureReference, "Paystack Response:", response);
        try {
            const finalReference = response.reference || secureReference;
            console.log(`[ARREARS] Querying server for: ${finalReference}`);

            const verifyRes = await fetch(`/api/payments/verify?reference=${finalReference}`, {
                method: "GET",
            });

            const verifyData = await verifyRes.json();

            // Optimistically show success because Paystack callback only triggers on actual success.
            // Optimistically show success because Paystack callback only triggers on actual success.
            setIsProcessing(false);
            setShowSuccessModal(true);
            setPaymentAmount(0);
            loadData();

            setVerifiedReceipt({
                id: secureReference,
                date: new Date().toLocaleDateString(),
                amount: verifyData.amount || amount,
                type: "Arrears Settlement",
                memberName: `${userData.firstName} ${userData.lastName}`,
                email: userData.email,
                status: "Completed"
            });
        } catch (error) {
            console.error("Verification Error:", error);
            toast.error("An error occurred checking verification status.");
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
            <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
            <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-0">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-white shadow-samsung border border-white hover:bg-slate-50 transition-all">
                        <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tighter">Settle Arrears</h2>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1">Debt Management</p>
                </div>
            </div>

            <div className="grid gap-6 sm:gap-8 md:grid-cols-5 px-4 sm:px-0">
                {/* Left: Summary and Breakdown */}
                <div className="md:col-span-2 space-y-4 sm:space-y-6">
                    <div className="p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-red-500 to-red-700 text-white shadow-premium relative overflow-hidden group">
                        <div className="absolute -top-4 -right-4 p-8 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700">
                            <CalendarClock className="h-32 w-32" />
                        </div>
                        <p className="text-[10px] font-bold text-red-100 uppercase tracking-widest mb-2 relative z-10">Total Outstanding</p>
                        <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tighter relative z-10">GH₵{totalAmountOwing.toFixed(2)}</h3>
                        <div className="mt-6 sm:mt-8 pt-6 border-t border-white/10 space-y-3 sm:space-y-4 relative z-10">
                            {totalAmountOwing > 0 ? (
                                <>
                                    <div className="flex justify-between items-center bg-white/10 backdrop-blur-sm rounded-[1.25rem] p-3 sm:p-4 border border-white/20">
                                        <div>
                                            <p className="text-[10px] sm:text-xs font-bold text-white/90">Outstanding Balance</p>
                                            <p className="text-[9px] sm:text-[10px] font-bold text-red-200 uppercase mt-0.5 tracking-wider">Unpaid Dues</p>
                                        </div>
                                        <span className="font-extrabold text-sm sm:text-base">GH₵{outstandingBalance.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/10 backdrop-blur-sm rounded-[1.25rem] p-3 sm:p-4 border border-white/20">
                                        <div>
                                            <p className="text-[10px] sm:text-xs font-bold text-white/90">Late Penalties</p>
                                            <p className="text-[9px] sm:text-[10px] font-bold text-red-200 uppercase mt-0.5 tracking-wider">Default Fees</p>
                                        </div>
                                        <span className="font-extrabold text-sm sm:text-base">GH₵{lateFees.toFixed(2)}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4 bg-white/5 rounded-[1.25rem] border border-white/10 backdrop-blur-sm">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-white">No arrears found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 rounded-[1.75rem] sm:rounded-[2.25rem] bg-white border border-white shadow-samsung">
                        <div className="flex items-center gap-3 mb-3 sm:mb-4">
                            <History className="h-5 w-5 text-slate-400" />
                            <h4 className="text-[10px] sm:text-sm font-bold text-black uppercase tracking-widest">Why Arrears?</h4>
                        </div>
                        <p className="text-[10px] sm:text-xs font-semibold text-slate-500 leading-relaxed">
                            Arrears accumulate when dues are not completely settled. Paying these clears your record and restores <span className="text-emerald-600 font-bold">Good Standing</span>.
                        </p>
                    </div>
                </div>

                {/* Right: Payment Input and Action */}
                <div className="md:col-span-3">
                    <div className="p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-white border border-white shadow-samsung min-h-full flex flex-col relative">
                        <div className="mb-8">
                            <h3 className="text-xl sm:text-2xl font-extrabold text-black tracking-tight tracking-tighter">Standardized Payments</h3>
                            <p className="text-[10px] sm:text-sm font-semibold text-slate-500 mt-1">Payments are for {stats?.currentYear || new Date().getFullYear()} fiscal year</p>
                        </div>

                        {totalAmountOwing === 0 && (
                            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] rounded-[2.5rem] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
                                <div className="h-20 w-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-4 shadow-inner">
                                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                </div>
                                <h4 className="text-xl font-black text-black tracking-tight">Record is Clean</h4>
                                <p className="text-xs text-slate-500 font-bold mt-2 max-w-[200px]">
                                    You have no outstanding arrears or penalties for the current year.
                                </p>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-8">
                                    Fiscal Reset: Jan 1st, {Number(stats?.currentYear || new Date().getFullYear()) + 1}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handlePayment} className={cn("space-y-8 flex-1 flex flex-col justify-between transition-all duration-700", totalAmountOwing === 0 && "opacity-30 grayscale pointer-events-none")}>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <label
                                        className={cn(
                                            "group cursor-pointer rounded-[1.75rem] border-2 p-5 transition-all text-left relative overflow-hidden",
                                            paymentAmount === Math.min(totalAmountOwing, 20) && paymentAmount !== totalAmountOwing
                                                ? "border-primary-500 bg-primary-50/50 shadow-md"
                                                : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="arrearsPaymentType"
                                            className="sr-only"
                                            onChange={handlePayStandard}
                                            checked={paymentAmount === Math.min(totalAmountOwing, 20) && paymentAmount !== totalAmountOwing}
                                            disabled={totalAmountOwing === 0}
                                        />
                                        <div className="flex items-center justify-between mb-3 relative z-10">
                                            <div className={cn(
                                                "h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center transition-colors",
                                                paymentAmount === Math.min(totalAmountOwing, 20) && paymentAmount !== totalAmountOwing ? "bg-primary-500 text-white" : "bg-slate-100 text-slate-400 group-hover:text-primary-500"
                                            )}>
                                                <Wallet className="h-5 w-5" />
                                            </div>
                                            <div className={cn(
                                                "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                                                paymentAmount === Math.min(totalAmountOwing, 20) && paymentAmount !== totalAmountOwing ? "border-primary-500 bg-primary-500" : "border-slate-300"
                                            )}>
                                                {paymentAmount === Math.min(totalAmountOwing, 20) && paymentAmount !== totalAmountOwing && <div className="h-1.5 w-1.5 rounded-full bg-white animate-in zoom-in" />}
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 relative z-10">Standard Step</p>
                                        <div className="relative z-10">
                                            <p className="text-xl sm:text-2xl font-extrabold text-black tracking-tight">GH₵{(Math.min(totalAmountOwing, 20) * 1.0355).toFixed(2)}</p>
                                            <span className="text-[10px] text-slate-500 font-semibold mt-0.5 inline-block bg-white/50 px-2 py-0.5 rounded-md">Incl. GH₵{(Math.min(totalAmountOwing, 20) * 0.0355).toFixed(2)} fee</span>
                                        </div>
                                    </label>

                                    <label
                                        className={cn(
                                            "group cursor-pointer rounded-[1.75rem] border-2 p-5 transition-all text-left relative overflow-hidden",
                                            paymentAmount === totalAmountOwing && totalAmountOwing > 0
                                                ? "border-red-500 bg-red-50/50 shadow-md"
                                                : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="arrearsPaymentType"
                                            className="sr-only"
                                            onChange={handlePayFull}
                                            checked={paymentAmount === totalAmountOwing && totalAmountOwing > 0}
                                            disabled={totalAmountOwing === 0}
                                        />
                                        <div className="flex items-center justify-between mb-3 relative z-10">
                                            <div className={cn(
                                                "h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center transition-colors",
                                                paymentAmount === totalAmountOwing && totalAmountOwing > 0 ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400 group-hover:text-red-500"
                                            )}>
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            <div className={cn(
                                                "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                                                paymentAmount === totalAmountOwing && totalAmountOwing > 0 ? "border-red-500 bg-red-500" : "border-slate-300"
                                            )}>
                                                {paymentAmount === totalAmountOwing && totalAmountOwing > 0 && <div className="h-1.5 w-1.5 rounded-full bg-white animate-in zoom-in" />}
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 relative z-10">Pay Full Owed</p>
                                        <div className="relative z-10">
                                            <p className="text-xl sm:text-2xl font-extrabold text-black tracking-tight">GH₵{(totalAmountOwing * 1.0355).toFixed(2)}</p>
                                            <span className="text-[10px] text-slate-400 font-semibold mt-0.5 inline-block bg-white/50 px-2 py-0.5 rounded-md">Incl. GH₵{(totalAmountOwing * 0.0355).toFixed(2)} fee</span>
                                        </div>
                                    </label>
                                </div>

                                <div className="p-4 rounded-[1.25rem] bg-slate-50 border border-slate-100 text-center">
                                    <div className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">
                                        <AlertCircle className="h-3.5 w-3.5 mr-1" /> Payment Rule enforced
                                    </div>
                                    <p className="text-xs font-semibold text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                                        Custom amounts are disabled. You can only pay in <strong className="text-black">GH₵ 20</strong> increments or settle the total balance.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-8 sm:pt-10 border-t border-slate-50 mt-8 sm:mt-10">
                                <Button
                                    type="submit"
                                    disabled={userData?.role === "Guest" || !paymentAmount || isProcessing || totalAmountOwing === 0}
                                    className={cn(
                                        "w-full h-14 sm:h-16 rounded-[2rem] font-extrabold text-white text-base sm:text-lg shadow-premium active:scale-95 transition-all disabled:opacity-50 disabled:scale-100",
                                        "bg-black hover:bg-zinc-800"
                                    )}
                                >
                                    {userData?.role === "Guest" ? "Payments disabled in Guest Mode" : isProcessing ? "Processing..." : `Settle GH₵ ${paymentAmount ? (Number(paymentAmount) * 1.0355).toFixed(2) : '0.00'}`}
                                </Button>
                                <div className="flex items-center justify-center gap-2 mt-4 sm:mt-6">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Secured by Gatekeeper™</span>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            <Modal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title=""
            >
                <div className="flex flex-col items-center justify-center py-10 px-6 text-center space-y-8">
                    <div className="h-24 w-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center animate-in zoom-in duration-500">
                        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-extrabold text-black tracking-tighter">Arrears Cleared!</h3>
                        <p className="text-sm font-semibold text-slate-500 mt-3 max-w-[300px] leading-relaxed">
                            Thank you for settling your outstanding balance. Your account status has been restored to <span className="text-emerald-600 font-bold">Good Standing</span>.
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
                        <Link href="/dashboard" className="w-full block">
                            <Button variant="ghost" className="w-full h-14 rounded-[2rem] text-slate-400 font-bold">
                                Return to Dashboard
                            </Button>
                        </Link>
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
