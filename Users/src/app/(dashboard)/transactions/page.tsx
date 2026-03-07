"use client";

import React, { useState, useEffect } from "react";
import {
    Search,
    Filter,
    Trash2,
    MoreHorizontal,
    ChevronRight,
    ArrowUpDown,
    Check,
    CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await fetch("/api/payments");
                if (response.ok) {
                    const data = await response.json();
                    setTransactions(data);
                }
            } catch (error) {
                console.error("Failed to fetch transactions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const toggleSelectAll = () => {
        if (selectedIds.length === transactions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(transactions.map(t => t.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDelete = (id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
        setSelectedIds(prev => prev.filter(i => i !== id));
    };

    const handleBulkDelete = () => {
        setTransactions(prev => prev.filter(t => !selectedIds.includes(t.id)));
        setSelectedIds([]);
    };

    const filteredTransactions = transactions.filter(t =>
        t.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 sm:px-0">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
                <div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black tracking-tighter">Transactions</h2>
                    <p className="text-[10px] sm:text-sm font-semibold text-slate-400 mt-1 sm:mt-2 uppercase tracking-[0.2em]">Manage your financial records</p>
                </div>

                {/* Search & Bulk Actions Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 sm:min-w-[300px] xl:min-w-[400px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-[1.25rem] sm:rounded-2xl bg-white border border-slate-100 shadow-samsung-sm text-sm font-semibold focus:ring-2 focus:ring-primary-500/10 outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {selectedIds.length > 0 && (
                        <Button
                            onClick={handleBulkDelete}
                            className="h-12 w-full sm:w-auto px-6 rounded-[1.25rem] sm:rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete ({selectedIds.length})
                        </Button>
                    )}
                </div>
            </div>

            {/* Transactions Island Table - Hidden on Mobile */}
            <div className="hidden md:block bg-white rounded-[2.5rem] shadow-samsung border border-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="p-6 w-14">
                                    <button
                                        onClick={toggleSelectAll}
                                        className={cn(
                                            "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                            selectedIds.length === transactions.length && transactions.length > 0
                                                ? "bg-primary-500 border-primary-500 text-white"
                                                : "border-slate-200 hover:border-primary-300"
                                        )}
                                    >
                                        {selectedIds.length === transactions.length && transactions.length > 0 && <Check className="h-4 w-4 stroke-[3px]" />}
                                    </button>
                                </th>
                                <th className="py-6 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                    <div className="flex items-center gap-2 cursor-pointer hover:text-black transition-colors">
                                        ID <ArrowUpDown className="h-3 w-3" />
                                    </div>
                                </th>
                                <th className="py-6 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                    Description
                                </th>
                                <th className="py-6 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">
                                    Amount
                                </th>
                                <th className="py-6 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-center border-r-0">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredTransactions.map((tx) => (
                                <tr
                                    key={tx.id}
                                    className={cn(
                                        "group transition-colors",
                                        selectedIds.includes(tx.id) ? "bg-primary-50/30" : "hover:bg-slate-50/50"
                                    )}
                                >
                                    <td className="p-6">
                                        <button
                                            onClick={() => toggleSelect(tx.id)}
                                            className={cn(
                                                "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                                selectedIds.includes(tx.id)
                                                    ? "bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/20"
                                                    : "border-slate-200 hover:border-primary-300"
                                            )}
                                        >
                                            {selectedIds.includes(tx.id) && <Check className="h-4 w-4 stroke-[3px]" />}
                                        </button>
                                    </td>
                                    <td className="py-6 px-4 whitespace-nowrap">
                                        <span className="text-xs font-bold text-slate-400">#{tx.id}</span>
                                    </td>
                                    <td className="py-6 px-4">
                                        <div>
                                            <p className="text-sm font-bold text-black tracking-tight">{tx.desc}</p>
                                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{new Date(tx.createdAt || Date.now()).toLocaleDateString()}</p>
                                        </div>
                                    </td>
                                    <td className="py-6 px-4 text-right">
                                        <span className="text-sm font-extrabold text-black tracking-tight">
                                            GH₵{tx.amount.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="py-6 px-4 text-center">
                                        <span className={cn(
                                            "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                            tx.status === "completed" || tx.status === "success" ? "bg-emerald-100 text-emerald-600" :
                                                tx.status === "pending" ? "bg-amber-100 text-amber-600" :
                                                    "bg-red-100 text-red-600"
                                        )}>
                                            {tx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredTransactions.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                            <Search className="h-8 w-8 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-bold text-black tracking-tight">No transactions found</h3>
                        <p className="text-sm font-semibold text-slate-400 mt-1">Try adjusting your search criteria</p>
                    </div>
                )}
            </div>

            {/* Mobile View for Reachability */}
            <div className="md:hidden space-y-3 sm:space-y-4 pb-20">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest px-2 relative z-10 sticky top-4 bg-slate-50/80 backdrop-blur-md py-2 rounded-lg">Recent Items ({filteredTransactions.length})</p>
                {filteredTransactions.map(tx => (
                    <div key={tx.id} className="p-4 sm:p-5 bg-white rounded-[1.75rem] sm:rounded-[2rem] shadow-samsung border border-white flex items-center gap-3 sm:gap-4 active:scale-98 transition-all relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-50/0 via-primary-50/0 to-primary-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className={cn(
                            "h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 relative z-10",
                            tx.status === "completed" || tx.status === "success" ? "bg-emerald-50 text-emerald-600" :
                                tx.status === "pending" ? "bg-amber-50 text-amber-600" :
                                    "bg-red-50 text-red-600"
                        )}>
                            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="flex-1 min-w-0 relative z-10">
                            <h4 className="font-bold text-black truncate pr-2 sm:pr-4 text-sm sm:text-[15px]">{tx.desc}</h4>
                            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-0.5">{new Date(tx.createdAt || Date.now()).toLocaleDateString()} • #{tx.id.substring(0, 8)}</p>
                        </div>
                        <div className="text-right relative z-10">
                            <p className="font-extrabold text-black text-sm sm:text-base">GH₵{tx.amount.toFixed(0)}</p>
                            <p className={cn(
                                "text-[9px] font-bold uppercase tracking-wider mt-0.5 sm:mt-1",
                                tx.status === "completed" || tx.status === "success" ? "text-emerald-500" :
                                    tx.status === "pending" ? "text-amber-500" :
                                        "text-red-500"
                            )}>{tx.status}</p>
                        </div>
                    </div>
                ))}

                {filteredTransactions.length === 0 && (
                    <div className="p-10 text-center bg-white rounded-[2rem] shadow-samsung border border-white">
                        <div className="h-16 w-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                            <Search className="h-6 w-6 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-black tracking-tight">No transactions found</h3>
                        <p className="text-xs font-semibold text-slate-400 mt-1">Try a different search</p>
                    </div>
                )}
            </div>
        </div>
    );
}
