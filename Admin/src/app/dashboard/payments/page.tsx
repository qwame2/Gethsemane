"use client";

import React, { useState, useEffect } from "react";
import {
    Search,
    Filter,
    Download,
    ArrowRight,
    CreditCard,
    TrendingUp,
    Wallet,
    Calendar,
    Activity,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    FileText,
    History,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { getPaymentsStats, getAllPayments, getDetailedFinancialReport } from "@/actions/payments";
import { cn } from "@/lib/utils";

export default function PaymentsManagementPage() {
    const [stats, setStats] = useState({
        monthly: 0, yearly: 0, total: 0,
        monthlyDues: 0, monthlyFund: 0,
        yearlyDues: 0, yearlyFund: 0,
        totalDues: 0, totalFund: 0
    });
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
    const [selectedMemberCalendar, setSelectedMemberCalendar] = useState<any>(null);
    const [selectedMemberHistory, setSelectedMemberHistory] = useState<any>(null);
    const [filter, setFilter] = useState("all");
    const [reportModal, setReportModal] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [generatingReport, setGeneratingReport] = useState<'monthly' | 'yearly' | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [s, p] = await Promise.all([
                    getPaymentsStats(),
                    getAllPayments()
                ]);
                setStats(s);
                setPayments(p);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleGenerateReport = async (mode: 'monthly' | 'yearly') => {
        setGeneratingReport(mode);
        try {
            const data = await getDetailedFinancialReport(mode);
            if (data) {
                setReportData(data);
                setReportModal(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setGeneratingReport(null);
        }
    };

    const generateEssay = (data: any) => {
        if (!data) return "";
        const diff = data.currentTotal - data.prevTotal;
        const trend = diff >= 0 ? "increased" : "decreased";
        const percent = data.prevTotal === 0 ? 100 : Math.abs((diff / data.prevTotal) * 100).toFixed(1);

        if (data.mode === 'monthly') {
            return `This monthly financial statement provides an operational update on the contribution activities for ${data.periodName} ${data.year}. During this thirty-day cycle, Gethsemane Assemble recorded a total inflow of GHS ${data.currentTotal.toLocaleString()}, stemming from ${data.contributorsCount} verified transactions.

The revenue streams were primarily driven by ${data.typeBreakdown.length > 0 ? data.typeBreakdown.map((t: any) => `${t.type} (GHS ${t.amount.toLocaleString()})`).join(" and ") : "Monthly Dues"}. When measured against the previous month's performance, collections have ${trend} by ${percent}%. This monthly benchmark is crucial for our immediate administrative needs and local outreach programs. 

As we conclude this month, our year-to-date standing is GHS ${data.yearToDateTotal.toLocaleString()}. We express our gratitude for the immediate response of the congregation to our monthly dues, which ensures the smooth day-to-day running of the assembly’s spiritual mission.`;
        }

        return `This Annual Financial Review serves as a comprehensive account of our fiscal journey throughout ${data.periodName}. It has been a year of significant spiritual and physical growth, reflected in our total annual collections of GHS ${data.currentTotal.toLocaleString()} from ${data.contributorsCount} across all sectors.

Over the course of these twelve months, the assembly’s financial health was bolstered by ${data.typeBreakdown.length > 0 ? data.typeBreakdown.map((t: any) => `${t.type} (GHS ${t.amount.toLocaleString()})`).join(" and ") : "Monthly Dues"}. Comparing this to the previous fiscal year, we have seen a notable ${trend} of ${percent}%. This long-term trend highlights the deepening commitment of our members to the Gethsemane vision.

These annual resources have been strategically allocated toward the structural development and long-term projects of the assembly. As we look forward to the next year, we do so with a solid financial foundation and a reinforced spirit of unity. We pray for continued blessings upon every contributor who made this year’s success possible.`;
    };

    const filteredPayments = payments.filter(p => {
        const matchesSearch = p.member.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === "all" ||
            (filter === "dues" && p.type === "Monthly Dues") ||
            (filter === "arrears" && p.type === "Arrears Settlement") ||
            (filter === "fundraising" && p.type === "Fundraising");
        return matchesSearch && matchesFilter;
    });

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    return (
        <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header Section - Samsung One UI Style */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 leading-none">
                        Payments
                    </h1>
                    <p className="text-sm md:text-base font-bold text-gray-400 uppercase tracking-[0.2em]">
                        Financial Management & History
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner gap-1">
                        <button
                            onClick={() => handleGenerateReport('monthly')}
                            disabled={!!generatingReport}
                            className={cn(
                                "px-6 h-11 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 text-center",
                                generatingReport === 'monthly' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            {generatingReport === 'monthly' ? <Activity className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />}
                            Monthly Report
                        </button>
                        <button
                            onClick={() => handleGenerateReport('yearly')}
                            disabled={!!generatingReport}
                            className={cn(
                                "px-6 h-11 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 text-center",
                                generatingReport === 'yearly' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            {generatingReport === 'yearly' ? <Activity className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
                            Yearly Report
                        </button>
                    </div>
                    <div className="relative group flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-14 pl-12 pr-6 bg-white border border-gray-100 rounded-2xl shadow-samsung focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-900"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "This Month", dues: stats.monthlyDues, fund: stats.monthlyFund, icon: Calendar, color: "blue" },
                    { label: "This Year", dues: stats.yearlyDues, fund: stats.yearlyFund, icon: TrendingUp, color: "indigo" },
                    { label: "Total Revenue", dues: stats.totalDues, fund: stats.totalFund, icon: Wallet, color: "emerald" }
                ].map((item, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-samsung group relative overflow-hidden text-left">
                        <div className={cn(
                            "absolute -right-4 -top-4 h-24 w-24 rounded-full blur-3xl opacity-20 transition-all group-hover:scale-150 duration-700",
                            item.color === "blue" ? "bg-blue-600" : item.color === "indigo" ? "bg-indigo-600" : "bg-emerald-600"
                        )} />

                        <div className="relative z-10 flex items-center justify-between">
                            <div className="space-y-4 flex-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{item.label}</p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Dues</p>
                                        <h3 className="text-xl font-black text-gray-900 tracking-tighter">GHS {item.dues.toLocaleString()}</h3>
                                    </div>
                                    <div className="border-l border-gray-50 pl-4">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Fund</p>
                                        <h3 className={cn(
                                            "text-xl font-black tracking-tighter",
                                            item.color === "blue" ? "text-blue-600" : item.color === "indigo" ? "text-indigo-600" : "text-emerald-600"
                                        )}>GHS {item.fund.toLocaleString()}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className={cn(
                                "h-14 w-14 rounded-2xl flex items-center justify-center p-3.5 shadow-sm border group-hover:rotate-12 transition-all duration-500 shrink-0",
                                item.color === "blue" ? "bg-blue-50 text-blue-600 border-blue-100" :
                                    item.color === "indigo" ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                        "bg-emerald-50 text-emerald-600 border-emerald-100"
                            )}>
                                <item.icon className="h-full w-full" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 px-1 text-center">
                {["all", "dues", "arrears", "fundraising"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            "px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
                            filter === f
                                ? "bg-gray-900 text-white shadow-lg scale-105"
                                : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
                        )}
                    >
                        {f === "all" ? "All Payments" : f === "dues" ? "Monthly Dues" : f === "arrears" ? "Arrears" : "Fundraising"}
                    </button>
                ))}
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-samsung overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <History className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 tracking-tight text-left">Member Contribution Summary</h3>
                    </div>
                    <button className="h-10 px-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 transition-all flex items-center gap-2 text-center">
                        <Download className="h-4 w-4" /> Export CSV
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-left">Member</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-left">Entries</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-left">Total Contributed</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-left">Status</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-8 py-6 bg-gray-50/20" />
                                    </tr>
                                ))
                            ) : filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="max-w-xs mx-auto space-y-3">
                                            <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-300">
                                                <CreditCard className="h-8 w-8" />
                                            </div>
                                            <p className="font-bold text-gray-900">No transactions found</p>
                                            <p className="text-xs text-gray-400 font-medium">Try adjusting your filters or search query.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((p) => (
                                    <tr key={p.userId} className="group hover:bg-gray-50/50 transition-all">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100 bg-blue-50 text-blue-600 font-black text-xs text-center shrink-0">
                                                    {p.image ? <img src={p.image} className="h-full w-full object-cover" /> : p.member[0]}
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-black text-gray-900 tracking-tight text-left">{p.member}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">{p.email.split('@')[0]}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 bg-gray-100 rounded-md text-[10px] font-black text-gray-600 text-center">
                                                    {p.paymentCount} Payments
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-left font-black text-gray-900">
                                            <p className="text-sm text-left font-black">GHS {p.totalAmount.toFixed(2)}</p>
                                            <p className="text-[10px] text-emerald-600 text-left">Latest: GHS {p.latestAmount.toFixed(2)}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "h-2 w-2 rounded-full",
                                                    p.status === "Completed" ? "bg-emerald-500" : "bg-amber-500"
                                                )} />
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest text-left",
                                                    p.status === "Completed" ? "text-emerald-600" : "text-amber-600"
                                                )}>
                                                    Active Member
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedMemberHistory(p)}
                                                className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-all shadow-sm active:scale-95"
                                                title="View Transactions"
                                            >
                                                <History className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setSelectedMemberCalendar(p)}
                                                className="h-10 w-10 bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all shadow-md active:scale-95"
                                                title="View Calendar"
                                            >
                                                <Calendar className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Calendar Modal */}
            {selectedMemberCalendar && (
                <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="p-8 md:p-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Calendar className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight">{selectedMemberCalendar.member}</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subscription Status {new Date().getFullYear()}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedMemberCalendar(null)}
                                    className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all font-black text-center"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {selectedMemberCalendar.yearlyCalendar.map((month: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all",
                                            month.status === "Paid"
                                                ? "bg-emerald-50 border-emerald-100"
                                                : month.status === "Owing"
                                                    ? "bg-red-50 border-red-100"
                                                    : "bg-gray-50 border-gray-100 opacity-60 hover:opacity-100 transition-opacity"
                                        )}
                                    >
                                        <p className={cn(
                                            "text-[10px] font-black uppercase tracking-widest mb-1.5",
                                            month.status === "Paid" ? "text-emerald-700" : month.status === "Owing" ? "text-red-700" : "text-gray-400"
                                        )}>
                                            {month.monthName}
                                        </p>
                                        <div className={cn(
                                            "h-6 w-6 rounded-full flex items-center justify-center shadow-sm",
                                            month.status === "Paid" ? "bg-emerald-500 text-white" : month.status === "Owing" ? "bg-red-500 text-white" : "bg-gray-200"
                                        )}>
                                            {month.status === "Paid" ? (
                                                <CheckCircle2 className="h-3 w-3" />
                                            ) : month.status === "Owing" ? (
                                                <AlertCircle className="h-3 w-3" />
                                            ) : (
                                                <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 p-6 bg-blue-50 rounded-[2rem] border border-blue-100">
                                <div className="flex items-center justify-between">
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 text-left">Yearly Subscription Progress</p>
                                        <p className="text-xl font-black text-gray-900 text-left">
                                            {selectedMemberCalendar.yearlyCalendar.filter((m: any) => m.status === "Paid").length} / 12 Months Covered
                                        </p>
                                    </div>
                                    <div className="h-14 w-14 rounded-2xl border-4 border-white flex items-center justify-center bg-blue-600 text-white font-black text-xs text-center shadow-lg">
                                        {Math.round((selectedMemberCalendar.yearlyCalendar.filter((m: any) => m.status === "Paid").length / 12) * 100)}%
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedMemberCalendar(null)}
                                className="w-full mt-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all shadow-lg text-center"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Financial Report Modal */}
            {reportModal && (
                <div className="fixed inset-0 z-[155] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col animate-in zoom-in-95 duration-500">
                        <div id="financial-report" className="p-10 md:p-16 flex flex-col items-center">
                            {/* Church Branding Center */}
                            <div className="flex flex-col items-center mb-10 text-center">
                                <div className="w-24 h-24 rounded-3xl bg-white shadow-xl border border-gray-100 p-4 flex items-center justify-center overflow-hidden mb-6">
                                    <img src="/logo.png" alt="Logo" className="object-contain" />
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Gethsemane Assemble</h2>
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-[0.3em] mt-2 underline underline-offset-8 text-center">Financial Summary Report</p>
                            </div>

                            {/* Report Essay */}
                            <div className="w-full bg-gray-50 rounded-[2.5rem] p-8 md:p-10 border border-gray-100 relative quote-container shadow-inner">
                                <FileText className="absolute top-6 left-6 h-12 w-12 text-gray-200 -z-0" />
                                <div className="relative z-10">
                                    <p className="text-gray-700 leading-relaxed text-lg font-medium whitespace-pre-line text-justify italic">
                                        {generateEssay(reportData)}
                                    </p>
                                </div>
                            </div>

                            {/* Digital Signoff */}
                            <div className="w-full mt-12 pt-8 border-t border-dashed border-gray-200 flex flex-col items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center shadow-inner">
                                    <Activity className="h-8 w-8 text-emerald-500" />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-1 text-center">Digitally Signed & Certified</p>
                                    <p className="text-[10px] font-bold text-gray-400 text-center">System Generation ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="w-full flex gap-3 mt-12 print:hidden font-black">
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 h-16 bg-gray-900 text-white rounded-[2rem] font-bold text-base hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg text-center"
                                >
                                    <Download className="w-5 h-5" />
                                    Export as PDF
                                </button>
                                <button
                                    onClick={() => setReportModal(false)}
                                    className="px-10 h-16 bg-gray-100 text-gray-500 rounded-[2rem] font-bold text-base hover:bg-gray-200 transition-all border border-gray-100 text-center"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {selectedReceipt && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col animate-in zoom-in-95 duration-500">
                        <div id="receipt-content" className="p-8 md:p-12 flex flex-col items-center">
                            {/* Official Header */}
                            <div className="w-full border-b-2 border-gray-900 pb-8 mb-8 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-6 sm:gap-4">
                                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                                    <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-gray-100 p-2 flex items-center justify-center overflow-hidden shrink-0">
                                        <img src="/logo.png" alt="Logo" className="object-contain" />
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase text-left">Gethsemane Assemble</h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] text-left">Official Payment Receipt</p>
                                    </div>
                                </div>
                                <div className="text-center sm:text-right">
                                    <div className="inline-block px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg mb-2">Internal Record</div>
                                    <p className="text-[10px] font-bold text-gray-400">{selectedReceipt.date}</p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="w-full space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-6 bg-gray-50 rounded-[2rem] border border-gray-100 text-center sm:text-left">
                                    <div className="space-y-4">
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Member Name</p>
                                            <p className="text-lg font-black text-gray-900 tracking-tight">{selectedReceipt.memberName}</p>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Type</p>
                                            <p className="text-sm font-extrabold text-blue-600 uppercase tracking-tight">{selectedReceipt.type}</p>
                                        </div>
                                    </div>
                                    <div className="sm:text-right space-y-4 font-black">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Receipt ID</p>
                                            <p className="text-sm font-black text-gray-900 tracking-tighter truncate max-w-[200px] sm:max-w-full mx-auto sm:mr-0">{selectedReceipt.id}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Verification</p>
                                            <div className="inline-flex items-center gap-2 text-green-600 text-[10px] font-black uppercase tracking-widest">
                                                <Activity className="w-3.5 h-3.5" />
                                                System Confirmed
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Amount Display */}
                                <div className="p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-gray-900 to-black text-white text-center shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transition-all group-hover:bg-white/10" />
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 relative z-10">Amount Received</p>
                                    <h3 className="text-4xl sm:text-5xl font-black tracking-tighter relative z-10">GHS {selectedReceipt.amount}</h3>
                                </div>

                                {/* Signatures Area */}
                                <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-10 sm:gap-4 pt-12 border-t border-dashed border-gray-200 text-center sm:text-left font-black">
                                    <div className="text-center sm:text-left">
                                        <div className="h-10 w-32 border-b border-gray-300 mb-2 mx-auto sm:ml-0" />
                                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Authorized Signatory</p>
                                    </div>
                                    <div className="sm:text-right">
                                        <div className="h-16 w-16 rounded-full border-4 border-emerald-50 flex items-center justify-center mb-2 mx-auto sm:mr-0 shadow-sm">
                                            <Activity className="w-8 h-8 text-emerald-500" />
                                        </div>
                                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-none">Church Official Seal</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="w-full flex gap-3 mt-12 print:hidden font-black">
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 py-4 bg-gray-50 text-gray-700 rounded-2xl font-bold text-sm border border-gray-100 hover:bg-gray-100 transition-all flex items-center justify-center gap-2 text-center"
                                >
                                    <Download className="w-4 h-4" />
                                    Print PDF Receipt
                                </button>
                                <button
                                    onClick={() => setSelectedReceipt(null)}
                                    className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all text-center"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Payment History Modal */}
            {selectedMemberHistory && (
                <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="p-8 md:p-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <History className="h-6 w-6" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight">{selectedMemberHistory.member}</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">Complete Transaction History</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedMemberHistory(null)}
                                    className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all font-black text-center"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                                <table className="w-full text-left whitespace-nowrap">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                            <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                                            <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                            <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Receipt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {selectedMemberHistory.history.map((h: any) => (
                                            <tr key={h.id}>
                                                <td className="py-4 text-left">
                                                    <p className="text-xs font-bold text-gray-900">
                                                        {new Date(h.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                                                        {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <span className={cn(
                                                        "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider text-center",
                                                        h.eventId || h.type?.toLowerCase().includes("fundraising") ? "bg-indigo-50 text-indigo-600" :
                                                            h.type === "arrears" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                                                    )}>
                                                        {h.eventId || h.type?.toLowerCase().includes("fundraising") ? "Fundraising" : (h.type === "arrears" ? "Arrears" : "Dues")}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-sm font-black text-gray-900 text-right">GHS {h.amount.toLocaleString()}</td>
                                                <td className="py-4 text-right">
                                                    <div className="flex items-center justify-end">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedReceipt({
                                                                    id: h.transactionId || `TRX-${h.id.slice(-4).toUpperCase()}`,
                                                                    memberName: selectedMemberHistory.member,
                                                                    amount: h.amount.toLocaleString(),
                                                                    type: h.eventId || h.type?.toLowerCase().includes("fundraising") ? "Fundraising" : (h.type === "arrears" ? "Arrears Settlement" : "Monthly Dues"),
                                                                    date: `${new Date(h.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                                });
                                                                setSelectedMemberHistory(null);
                                                            }}
                                                            className="h-8 w-8 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all font-black text-center"
                                                            title="View Full Receipt"
                                                        >
                                                            <FileText className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-8 pt-8 border-t border-gray-100 flex justify-between items-center text-left">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-left">Total Lifetime Contribution</p>
                                    <p className="text-2xl font-black text-gray-900 text-left">GHS {selectedMemberHistory.history.reduce((sum: number, h: any) => sum + h.amount, 0).toLocaleString()}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedMemberHistory(null)}
                                    className="h-14 px-8 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all text-center"
                                >
                                    Close History
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
