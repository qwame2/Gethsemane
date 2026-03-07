"use client";

import { Users, Clock, Activity, ArrowDownRight, MoreHorizontal, Calendar, TrendingUp, Download, Plus, Filter, MoreVertical, Wallet, X, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getTotalMembers, getMonthlyDuesCollected, getTotalOutstandingArrears, getActiveRegistrations, getRecentPayments, getYearlyRevenue, getAllMembers, createTransaction, getActiveFundraising } from "@/actions/dashboard";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
    useEffect(() => {
        if (document.cookie.includes("flash_setup_complete=true")) {
            document.cookie = "flash_setup_complete=; Max-Age=0; path=/";
            toast.success("Profile Setup Complete!", {
                description: "Welcome to your admin dashboard.",
            });
        }
        if (document.cookie.includes("flash_login=dashboard")) {
            document.cookie = "flash_login=; Max-Age=0; path=/";
            toast.success("Welcome Back!", {
                description: "You have signed in successfully.",
            });
        }
    }, []);

    const [totalMembers, setTotalMembers] = useState<{ value: number; change: string; changeType: string }>({ value: 0, change: '+0%', changeType: 'positive' });
    const [monthlyDues, setMonthlyDues] = useState<{ value: number; change: string; changeType: string }>({ value: 0, change: '+0%', changeType: 'positive' });
    const [totalArrears, setTotalArrears] = useState<{ value: number; change: string; changeType: string }>({ value: 0, change: '+0%', changeType: 'positive' });
    const [activeRegistrations, setActiveRegistrations] = useState<{ value: number; change: string; changeType: string }>({ value: 0, change: '+0%', changeType: 'positive' });
    const [recentPaymentsData, setRecentPaymentsData] = useState<any[]>([]);
    const [yearlyRevenue, setYearlyRevenue] = useState<any[]>([]);
    const [activeFundraising, setActiveFundraising] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUserPayments, setSelectedUserPayments] = useState<any | null>(null);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [allMembers, setAllMembers] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newTransaction, setNewTransaction] = useState({
        userId: "",
        userName: "",
        amount: "",
        type: "monthly",
        status: "Completed",
        eventId: ""
    });
    const [memberSearchQuery, setMemberSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

    useEffect(() => {
        const handleSearch = (e: any) => {
            setSearchQuery(e.detail || "");
        };
        window.addEventListener('dashboardSearch', handleSearch as EventListener);
        return () => window.removeEventListener('dashboardSearch', handleSearch as EventListener);
    }, []);

    const refreshDashboard = async () => {
        const [membersCount, duesTotal, arrearsSum, activeRegs, payments, revenue, fundraising] = await Promise.all([
            getTotalMembers(),
            getMonthlyDuesCollected(),
            getTotalOutstandingArrears(),
            getActiveRegistrations(),
            getRecentPayments(),
            getYearlyRevenue(),
            getActiveFundraising()
        ]);
        setTotalMembers(membersCount);
        setMonthlyDues(duesTotal);
        setTotalArrears(arrearsSum);
        setActiveRegistrations(activeRegs);
        setRecentPaymentsData(payments);
        setYearlyRevenue(revenue);
        setActiveFundraising(fundraising);
    };

    useEffect(() => {
        refreshDashboard();
        // Fetch all members for the transaction modal
        getAllMembers().then(setAllMembers);
    }, []);

    const stats = [
        { name: 'Total Members', value: totalMembers.value.toLocaleString(), change: totalMembers.change, changeType: totalMembers.changeType, icon: Users, gradient: 'from-blue-600 to-indigo-600', iconBg: 'bg-blue-500/10 text-blue-600' },
        { name: 'Monthly Dues Collected', value: `GHS ${monthlyDues.value.toLocaleString()}`, change: monthlyDues.change, changeType: monthlyDues.changeType, icon: Wallet, gradient: 'from-emerald-500 to-teal-600', iconBg: 'bg-emerald-500/10 text-emerald-600' },
        { name: 'Outstanding Arrears', value: `GHS ${totalArrears.value.toLocaleString()}`, change: totalArrears.change, changeType: totalArrears.changeType, icon: Clock, gradient: 'from-amber-500 to-orange-600', iconBg: 'bg-amber-500/10 text-amber-600' },
        { name: 'Active Registrations', value: activeRegistrations.value.toLocaleString(), change: activeRegistrations.change, changeType: activeRegistrations.changeType, icon: Activity, gradient: 'from-purple-600 to-fuchsia-600', iconBg: 'bg-purple-500/10 text-purple-600' },
    ];

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const filteredPayments = recentPaymentsData.filter(payment =>
        payment.member.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedPayments: any[] = Object.values(filteredPayments.reduce((acc: any, p: any) => {
        const userId = p.userId;
        if (!acc[userId]) {
            acc[userId] = {
                ...p,
                totalAmount: p.rawAmount,
                count: 1,
                transactions: [p]
            };
        } else {
            acc[userId].totalAmount += p.rawAmount;
            acc[userId].count += 1;
            acc[userId].transactions.push(p);
        }
        return acc;
    }, {}));

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20 md:pb-0">
            {/* Samsung One UI Mobile Header - Reachability Optimized */}
            <div className="md:hidden pt-8 pb-6 px-4">
                <div className="flex items-center gap-2 text-[11px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-4 opacity-80">
                    <Activity className="w-3 h-3" />
                    Overview
                </div>
                <div className="flex items-end justify-between">
                    <h1 className="text-5xl font-extrabold text-gray-900 tracking-tighter leading-none">
                        Dashboard
                    </h1>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsTransactionModalOpen(true)}
                            className="p-3.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop Header section */}
            <div className="hidden md:flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                        <Calendar className="w-4 h-4" />
                        {today}
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Overview</h1>
                    <p className="mt-1 text-base text-gray-500 max-w-2xl">
                        Monitor church activities, track financial health, and manage your congregation seamlessly.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsTransactionModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/20 group"
                    >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                        New Transaction
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 px-1 md:px-0">
                {stats.map((stat) => (
                    <div
                        key={stat.name}
                        className="relative overflow-hidden rounded-[1.8rem] md:rounded-[2rem] bg-white p-4 md:p-6 shadow-samsung border border-white hover:shadow-samsung-lg hover:-translate-y-1 transition-all duration-300 group"
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-[0.03] group-hover:opacity-[0.08] rounded-bl-full transition-opacity duration-300 pointer-events-none`} />

                        <dt className="flex justify-between items-start mb-4">
                            <div className={`p-3.5 rounded-2xl ${stat.iconBg.replace('bg-', 'bg-').replace('/10', '/10')} backdrop-blur-sm shadow-sm`}>
                                <stat.icon className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <div className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-full ${stat.changeType === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} shadow-sm`}>
                                {stat.changeType === 'positive' ? (
                                    <TrendingUp className="h-3 w-3" />
                                ) : (
                                    <ArrowDownRight className="h-3 w-3" />
                                )}
                                {stat.change}
                            </div>
                        </dt>
                        <dd>
                            <p className="text-2xl md:text-3xl font-black tracking-tighter text-gray-900 mb-1">{stat.value}</p>
                            <p className="text-[9px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none">{stat.name}</p>
                        </dd>
                    </div>
                ))}
            </div>

            {/* Main Content Split Grid */}
            <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3 transition-all duration-700">
                {/* Revenue Chart Section */}
                <div className={cn(
                    "rounded-[2.5rem] bg-white shadow-samsung border border-white p-6 md:p-8 flex flex-col h-[400px] md:h-[420px] relative overflow-hidden group transition-all duration-700 ease-in-out",
                    activeFundraising ? "xl:col-span-2" : "xl:col-span-3"
                )}>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none transition-opacity opacity-50 group-hover:opacity-100" />

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Revenue Analytics</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Monthly variations</p>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
                            <button className="px-4 py-2 text-[10px] font-bold bg-white text-gray-900 rounded-xl shadow-samsung border border-white uppercase tracking-tighter">This Year</button>
                            <button className="px-4 py-2 text-[10px] font-bold text-gray-400 hover:text-gray-900 rounded-xl transition-colors uppercase tracking-tighter">Last Year</button>
                        </div>
                    </div>

                    <div className="flex-1 flex items-end justify-between gap-1.5 md:gap-3 relative z-10">
                        {/* Real-time bar chart */}
                        {yearlyRevenue.length > 0 ? (
                            yearlyRevenue.map((data, i) => (
                                <div key={i} className="w-full flex justify-center group/bar relative h-full items-end pb-8">
                                    {/* Tooltip */}
                                    <div className="absolute -top-10 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none z-20 whitespace-nowrap">
                                        GHS {data.amount.toLocaleString()}
                                    </div>

                                    <div className="w-full max-w-[8px] md:max-w-[32px] bg-gray-50 rounded-full overflow-hidden relative shadow-inner" style={{ height: '100%' }}>
                                        <div
                                            className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 via-indigo-400 to-blue-600 group-hover/bar:from-blue-500 group-hover/bar:to-indigo-300 transition-all duration-700 ease-in-out shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                                            style={{ height: `${data.percentage}%` }}
                                        >
                                        </div>
                                    </div>

                                    {/* Labels */}
                                    <span className="absolute bottom-0 text-[9px] md:text-[11px] font-bold text-gray-400 group-hover/bar:text-gray-900 transition-colors uppercase tracking-tighter">
                                        {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                                    </span>
                                </div>
                            ))
                        ) : (
                            // Loading markers
                            Array(12).fill(0).map((_, i) => (
                                <div key={i} className="w-full flex justify-center h-full items-end pb-8">
                                    <div className="w-[8px] md:w-[32px] h-4 bg-gray-100 rounded-full animate-pulse" />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Insight/Action Sidebar */}
                {activeFundraising && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-8 duration-700">
                        <div className="rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800 p-8 text-white relative overflow-hidden shadow-samsung shadow-blue-900/40 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl" />

                            <Wallet className="w-8 h-8 text-blue-300 mb-6" />
                            <h3 className="text-lg font-bold mb-2">{activeFundraising.title}</h3>
                            <p className="text-sm text-blue-200/80 mb-6 leading-relaxed font-medium line-clamp-2">
                                {activeFundraising.description}
                            </p>

                            <div className="w-full h-3 bg-white/10 rounded-full mb-3 overflow-hidden shadow-inner p-0.5">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 rounded-full shadow-lg transition-all duration-1000 ease-out"
                                    style={{ width: `${activeFundraising.percentage}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black text-blue-100 uppercase tracking-widest opacity-80">
                                <span>GHS {activeFundraising.raisedAmount.toLocaleString()} raised</span>
                                <span>Target: {activeFundraising.goalAmount >= 1000 ? `${(activeFundraising.goalAmount / 1000).toFixed(0)}k` : activeFundraising.goalAmount}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Transactions Section */}
            <div className="rounded-[2.2rem] md:rounded-[2.5rem] bg-white shadow-samsung border border-white overflow-hidden">
                <div className="border-b border-gray-50 px-6 py-6 flex items-center justify-between bg-white sm:px-8">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Recent Activity by Member</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Grouped financial contributions</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2.5 bg-gray-50 text-gray-400 rounded-2xl hover:text-blue-600 transition-all border border-transparent hover:border-blue-100">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Mobile List View */}
                <div className="block md:hidden">
                    {groupedPayments.length === 0 ? (
                        <div className="py-12 text-center text-sm text-gray-400 font-medium">
                            No recent contributions found.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {groupedPayments.map((payment) => (
                                <div key={payment.userId} className="p-4 flex items-center gap-4 active:bg-gray-50 transition-colors" onClick={() => setSelectedUserPayments(payment)}>
                                    <div className="w-12 h-12 rounded-[1.2rem] bg-gray-50 flex items-center justify-center shadow-sm border border-gray-100 text-gray-600 font-bold text-sm overflow-hidden relative">
                                        {payment.image ? (
                                            <img src={payment.image} alt={payment.member} className="w-full h-full object-cover" />
                                        ) : (
                                            payment.avatar
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <p className="text-sm font-bold text-gray-900 truncate">{payment.member}</p>
                                            <p className="text-sm font-black text-blue-600">GHS {payment.totalAmount.toFixed(2)}</p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{payment.count} contribution{payment.count > 1 ? 's' : ''} • Latest {payment.date}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-50">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th scope="col" className="whitespace-nowrap py-5 pl-8 pr-3 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Latest ID</th>
                                <th scope="col" className="whitespace-nowrap px-3 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Member</th>
                                <th scope="col" className="whitespace-nowrap px-3 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Amount</th>
                                <th scope="col" className="whitespace-nowrap px-3 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Contributions</th>
                                <th scope="col" className="whitespace-nowrap px-3 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Latest Date</th>
                                <th scope="col" className="whitespace-nowrap px-3 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Latest Status</th>
                                <th scope="col" className="relative whitespace-nowrap py-5 pl-3 pr-8"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white italic-none">
                            {groupedPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-sm text-gray-400 font-medium italic">
                                        No recent contributions found.
                                    </td>
                                </tr>
                            ) : (
                                groupedPayments.map((payment) => (
                                    <tr key={payment.userId} className="hover:bg-blue-50/20 transition-all group">
                                        <td className="whitespace-nowrap py-5 pl-8 pr-3 text-sm font-bold text-gray-900 tracking-tighter">
                                            {payment.id}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-gray-50 text-gray-600 flex items-center justify-center text-xs font-black shadow-inner border border-gray-100 overflow-hidden relative">
                                                    {payment.image ? (
                                                        <img src={payment.image} alt={payment.member} className="w-full h-full object-cover" />
                                                    ) : (
                                                        payment.avatar
                                                    )}
                                                </div>
                                                <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{payment.member}</span>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-5 text-sm text-gray-900 font-black">GHS {payment.totalAmount.toFixed(2)}</td>
                                        <td className="whitespace-nowrap px-3 py-5">
                                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tight">{payment.count} Record{payment.count > 1 ? 's' : ''}</span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-tighter">{payment.date}</td>
                                        <td className="whitespace-nowrap px-3 py-5">
                                            <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest
                                                ${payment.status === 'Completed' ? 'bg-green-50 text-green-700 border border-green-100' :
                                                    payment.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                                        'bg-red-50 text-red-700 border border-red-100'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${payment.status === 'Completed' ? 'bg-green-500' : payment.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'} animate-pulse`} />
                                                {payment.status}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap py-5 pl-3 pr-8 text-right">
                                            <button
                                                onClick={() => setSelectedUserPayments(payment)}
                                                className="text-gray-300 hover:text-blue-600 p-2 rounded-xl hover:bg-blue-50 transition-all"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transaction Details Modal (Improved Mobile) */}
            {selectedUserPayments && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] md:max-h-[80vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-full md:slide-in-from-bottom-8 md:zoom-in-95 duration-500 ease-out">
                        {/* Modal Header */}
                        <div className="px-6 md:px-8 py-5 md:py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10 shrink-0">
                            <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs md:text-sm font-black shadow-inner border border-blue-100 overflow-hidden relative shrink-0">
                                    {selectedUserPayments.image ? (
                                        <img src={selectedUserPayments.image} alt={selectedUserPayments.member} className="w-full h-full object-cover" />
                                    ) : (
                                        selectedUserPayments.avatar
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg md:text-xl font-black text-gray-900 leading-tight truncate">{selectedUserPayments.member}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 truncate">{selectedUserPayments.count} Recent Transactions</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedUserPayments(null)}
                                className="p-2.5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all shrink-0 ml-2"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-4 md:pt-6 space-y-6">
                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                <div className="bg-blue-50/50 rounded-3xl p-4 md:p-5 border border-blue-100">
                                    <p className="text-[9px] md:text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Total Paid</p>
                                    <p className="text-xl md:text-2xl font-black text-blue-600 tracking-tighter">GHS {selectedUserPayments.totalAmount.toFixed(2)}</p>
                                </div>
                                <div className="bg-emerald-50/50 rounded-3xl p-4 md:p-5 border border-emerald-100">
                                    <p className="text-[9px] md:text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Records Found</p>
                                    <p className="text-xl md:text-2xl font-black text-emerald-600 tracking-tighter">{selectedUserPayments.count}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Transaction History</h4>
                                {selectedUserPayments.transactions.map((t: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-white shadow-sm">
                                        <div className="flex flex-col gap-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-900 truncate">{t.id}</span>
                                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-white border border-gray-100 rounded text-gray-500 uppercase shrink-0">{t.type.split(' ')[0]}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{t.date}</span>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <div className="shrink-0">
                                                <p className="text-sm font-black text-gray-900">{t.amount}</p>
                                                <div className={`text-[9px] font-black uppercase ${t.status === 'Completed' ? 'text-green-500' : 'text-amber-500'}`}>
                                                    {t.status}
                                                </div>
                                            </div>
                                            {t.status === 'Completed' && (
                                                <button
                                                    onClick={() => setSelectedReceipt({
                                                        id: t.id,
                                                        date: t.date,
                                                        amount: t.amount.replace('GHS ', ''),
                                                        type: t.type,
                                                        memberName: selectedUserPayments.member,
                                                        status: "Completed"
                                                    })}
                                                    className="p-2 bg-white border border-gray-100 rounded-xl text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                                                    title="View Receipt"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="px-6 md:px-8 py-5 md:py-6 bg-gray-50 border-t border-gray-100 flex justify-center md:justify-end shrink-0 pb-10 md:pb-6">
                            <button
                                onClick={() => setSelectedUserPayments(null)}
                                className="w-full md:w-auto px-10 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl text-sm font-bold hover:bg-gray-100 transition-all shadow-sm active:scale-95"
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Transaction Modal (Improved Mobile) */}
            {isTransactionModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-lg flex flex-col animate-in slide-in-from-bottom-full md:slide-in-from-bottom-8 md:zoom-in-95 duration-500 shrink-0">
                        <div className="px-6 md:px-8 py-5 md:py-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Record Payment</h3>
                            <button
                                onClick={() => {
                                    setIsTransactionModalOpen(false);
                                    setIsDropdownOpen(false);
                                }}
                                className="p-2.5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!newTransaction.userId || !newTransaction.amount) {
                                toast.error("Please fill in all required fields.");
                                return;
                            }
                            setIsSubmitting(true);
                            const result = await createTransaction({
                                ...newTransaction,
                                amount: parseFloat(newTransaction.amount)
                            });
                            setIsSubmitting(false);

                            if (result.success) {
                                toast.success("Transaction recorded successfully!");
                                setIsTransactionModalOpen(false);
                                setNewTransaction({ userId: "", userName: "", amount: "", type: "monthly", status: "Completed", eventId: "" });
                                refreshDashboard();
                            } else {
                                toast.error("Failed to record transaction.");
                            }
                        }} className="p-6 md:p-8 space-y-6 pb-12 md:pb-8">
                            <div className="space-y-2 relative">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Select Member</label>
                                <div className="relative">
                                    <div
                                        className={`w-full px-4 py-3.5 bg-gray-50/50 border ${isDropdownOpen ? 'border-blue-500 ring-4 ring-blue-500/5' : 'border-gray-100'} rounded-2xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]`}
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 pr-2">
                                            {newTransaction.userId ? (
                                                <>
                                                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-[11px] font-black uppercase shrink-0">
                                                        {newTransaction.userName[0]}
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900 truncate">{newTransaction.userName}</span>
                                                </>
                                            ) : (
                                                <span className="text-sm font-medium text-gray-400">Tap to search members...</span>
                                            )}
                                        </div>
                                        <Search className={`w-4 h-4 shrink-0 ${isDropdownOpen ? 'text-blue-500' : 'text-gray-400'} transition-colors`} />
                                    </div>

                                    {isDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-gray-100 z-[120] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="p-3 border-b border-gray-50 flex items-center gap-2">
                                                <Search className="w-4 h-4 text-gray-400 ml-2" />
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Type name or ID..."
                                                    className="w-full px-2 py-2 bg-transparent border-none text-sm font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-medium focus:ring-0 outline-none"
                                                    value={memberSearchQuery}
                                                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                                                />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto py-1">
                                                {allMembers
                                                    .filter(m =>
                                                        `${m.firstName} ${m.lastName} ${m.id}`.toLowerCase()
                                                            .includes(memberSearchQuery.toLowerCase())
                                                    )
                                                    .map(m => (
                                                        <div
                                                            key={m.id}
                                                            className="px-5 py-3.5 hover:bg-blue-50 cursor-pointer flex items-center gap-3 active:bg-blue-100 transition-colors"
                                                            onClick={() => {
                                                                setNewTransaction({ ...newTransaction, userId: m.id, userName: `${m.firstName} ${m.lastName}` });
                                                                setIsDropdownOpen(false);
                                                                setMemberSearchQuery("");
                                                            }}
                                                        >
                                                            <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-black uppercase shrink-0">
                                                                {m.firstName[0]}{m.lastName[0]}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-sm font-bold text-gray-900 truncate">{m.firstName} {m.lastName}</span>
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate">Member ID: {m.id.slice(-6).toUpperCase()}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                {allMembers.filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(memberSearchQuery.toLowerCase())).length === 0 && (
                                                    <div className="p-8 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest leading-relaxed">
                                                        No members found matching that search
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Amount (GHS)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400">₵</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="w-full pl-8 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-base font-black text-gray-900 focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all outline-none shadow-inner"
                                        value={newTransaction.amount}
                                        onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Payment For</label>
                                    <select
                                        className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-[11px] font-black text-gray-900 uppercase tracking-tight transition-all outline-none"
                                        value={newTransaction.type}
                                        onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
                                    >
                                        <option value="monthly">Monthly Due</option>
                                        <option value="arrears">Arrears</option>
                                        <option value="fundraising">Fundraising</option>
                                    </select>
                                </div>
                                {newTransaction.type === "fundraising" && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Select Campaign</label>
                                        <select
                                            className="w-full px-4 py-3.5 bg-blue-50/30 border border-blue-100 rounded-2xl text-[11px] font-black text-gray-900 uppercase tracking-tight transition-all outline-none"
                                            value={newTransaction.eventId}
                                            onChange={(e) => setNewTransaction({ ...newTransaction, eventId: e.target.value })}
                                            required
                                        >
                                            <option value="">Choose active campaign...</option>
                                            {activeFundraising && (
                                                <option value={activeFundraising.id}>{activeFundraising.title}</option>
                                            )}
                                        </select>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Initial Status</label>
                                    <select
                                        className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-[11px] font-black text-gray-900 uppercase tracking-tight transition-all outline-none"
                                        value={newTransaction.status}
                                        onChange={(e) => setNewTransaction({ ...newTransaction, status: e.target.value })}
                                    >
                                        <option value="Completed">Success</option>
                                        <option value="Pending">Pending</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 pb-4 md:pb-0">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[1.4rem] font-bold text-sm shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Plus className="w-5 h-5" />
                                            Record Contribution
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
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
                                        <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase">Gethsemane Assemble</h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Official Payment Receipt</p>
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
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Member Name</p>
                                            <p className="text-lg font-black text-gray-900 tracking-tight">{selectedReceipt.memberName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Type</p>
                                            <p className="text-sm font-extrabold text-blue-600 uppercase tracking-tight">{selectedReceipt.type}</p>
                                        </div>
                                    </div>
                                    <div className="sm:text-right space-y-4">
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
                                <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-10 sm:gap-4 pt-12 border-t border-dashed border-gray-200 text-center sm:text-left">
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
                            <div className="w-full flex gap-3 mt-12 print:hidden">
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 py-4 bg-gray-50 text-gray-700 rounded-2xl font-bold text-sm border border-gray-100 hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Print PDF Receipt
                                </button>
                                <button
                                    onClick={() => setSelectedReceipt(null)}
                                    className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
