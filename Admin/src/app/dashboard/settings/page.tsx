"use client";

import React, { useState, useEffect } from "react";
import {
    Settings, Building, DollarSign, Shield, Save,
    Globe, Mail, Phone, MapPin, Percent, Coins, AlertCircle
} from "lucide-react";
import { getSystemSettings, updateSystemSettings, updateAdminSecurity } from "@/actions/settings";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<"general" | "financial" | "security">("general");
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [securitySaving, setSecuritySaving] = useState(false);

    // Controlled state for the two linked financial fields
    const [monthlyDues, setMonthlyDues] = useState<string>("");
    const [yearlyDues, setYearlyDues] = useState<string>("");

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await getSystemSettings();
                setSettings(data);
                setMonthlyDues(String(data?.monthlyDues ?? 20));
                setYearlyDues(String(data?.yearlyDues ?? 240));
            } catch (error) {
                toast.error("Failed to load settings");
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    /** When monthly changes → update yearly = monthly × 12 */
    const handleMonthlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setMonthlyDues(val);
        const num = parseFloat(val);
        if (!isNaN(num) && num > 0) {
            setYearlyDues((num * 12).toFixed(2).replace(/\.00$/, ""));
        }
    };

    /** When yearly changes → update monthly = yearly ÷ 12 */
    const handleYearlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setYearlyDues(val);
        const num = parseFloat(val);
        if (!isNaN(num) && num > 0) {
            setMonthlyDues((num / 12).toFixed(2).replace(/\.00$/, ""));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        const formData = new FormData(e.currentTarget);

        try {
            const result = await updateSystemSettings(formData);
            if (result.success) {
                toast.success("Settings updated successfully");
                setSettings(result.settings);
                setMonthlyDues(String(result.settings?.monthlyDues ?? monthlyDues));
                setYearlyDues(String(result.settings?.yearlyDues ?? yearlyDues));
            } else {
                toast.error(result.error || "Failed to update settings");
            }
        } catch (error) {
            toast.error("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    };

    const handleSecuritySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSecuritySaving(true);
        const formData = new FormData(e.currentTarget);
        try {
            const result = await updateAdminSecurity(formData);
            if (result.success) {
                toast.success(result.message || "Security settings updated");
                (e.target as HTMLFormElement).reset();
            } else {
                toast.error(result.error || "Failed to update security settings");
            }
        } catch (error) {
            toast.error("An error occurred while saving security settings");
        } finally {
            setSecuritySaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">Administration</p>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none">Settings &amp; Config</h1>
                    <p className="text-sm font-bold text-slate-500 max-w-md">Manage your church's global parameters, financial rates, and system preferences.</p>
                </div>
                <div className="flex items-center justify-start md:justify-end gap-2 bg-white p-2 rounded-2xl shadow-samsung border border-gray-100 overflow-x-auto w-full md:w-auto scrollbar-hide scroll-smooth">
                    {[
                        { id: "general", label: "General", icon: Building },
                        { id: "financial", label: "Financial", icon: DollarSign },
                        { id: "security", label: "Security", icon: Shield },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shrink-0",
                                activeTab === tab.id
                                    ? "bg-gray-900 text-white shadow-lg scale-105"
                                    : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                            )}
                        >
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 pb-20">
                {/* General Settings Tab */}
                <div className={cn("space-y-8", activeTab !== "general" && "hidden")}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="md:col-span-2 bg-white rounded-[3rem] p-10 border border-gray-100 shadow-samsung relative overflow-hidden group">
                            <div className="absolute -right-10 -top-10 h-40 w-40 bg-blue-50/50 rounded-full blur-3xl group-hover:scale-150 transition-all duration-700" />
                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 text-left">Church Display Name</label>
                                        <div className="relative group">
                                            <Building className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            <input
                                                name="churchName"
                                                defaultValue={settings?.churchName ?? "Gethsemane Assemble"}
                                                className="w-full h-16 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-slate-950 shadow-inner"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 text-left">Official Organization Email</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            <input
                                                name="churchEmail"
                                                defaultValue={settings?.churchEmail ?? "support@gethsemane.com"}
                                                className="w-full h-16 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-slate-950 shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 text-left">Primary Contact Number</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            <input
                                                name="churchPhone"
                                                defaultValue={settings?.churchPhone ?? "+233 24 000 0000"}
                                                className="w-full h-16 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-slate-950 shadow-inner"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 text-left">Physical Address / Location</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            <input
                                                name="churchAddress"
                                                defaultValue={settings?.churchAddress ?? "Accra, Ghana"}
                                                className="w-full h-16 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-slate-950 shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Settings Tab */}
                <div className={cn("space-y-8", activeTab !== "financial" && "hidden")}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-500">

                        {/* ── Yearly Subscription Fee (controlled) ── */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-samsung relative group flex flex-col items-center text-center">
                            <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:rotate-12 duration-500 shadow-sm border bg-blue-50 text-blue-600 border-blue-100">
                                <Globe className="h-6 w-6" />
                            </div>
                            <div className="space-y-1 mb-4 flex flex-col items-center">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Yearly Subscription Fee</label>
                                <span className="text-[9px] font-bold text-blue-600/60 uppercase tracking-tight">Current: {settings?.yearlyDues ?? 240} GHS</span>
                            </div>
                            <div className="relative w-full">
                                <input
                                    type="number"
                                    step="0.01"
                                    name="yearlyDues"
                                    value={yearlyDues}
                                    onChange={handleYearlyChange}
                                    className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl text-center font-black text-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner text-slate-950 placeholder:text-slate-300"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">
                                    GHS / yr
                                </span>
                            </div>

                        </div>

                        {/* ── Monthly Standard Payment (controlled) ── */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-samsung relative group flex flex-col items-center text-center">
                            <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:rotate-12 duration-500 shadow-sm border bg-emerald-50 text-emerald-600 border-emerald-100">
                                <Coins className="h-6 w-6" />
                            </div>
                            <div className="space-y-1 mb-4 flex flex-col items-center">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monthly Standard Payment</label>
                                <span className="text-[9px] font-bold text-blue-600/60 uppercase tracking-tight">Current: {settings?.monthlyDues ?? 20} GHS</span>
                            </div>
                            <div className="relative w-full">
                                <input
                                    type="number"
                                    step="0.01"
                                    name="monthlyDues"
                                    value={monthlyDues}
                                    onChange={handleMonthlyChange}
                                    className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl text-center font-black text-2xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-inner text-slate-950 placeholder:text-slate-300"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">
                                    GHS / mo
                                </span>
                            </div>

                        </div>

                        {/* ── Monthly Arrears Penalty (standalone, unchanged) ── */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-samsung relative group flex flex-col items-center text-center">
                            <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:rotate-12 duration-500 shadow-sm border bg-amber-50 text-amber-600 border-amber-100">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <div className="space-y-1 mb-4 flex flex-col items-center">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monthly Arrears Penalty</label>
                                <span className="text-[9px] font-bold text-blue-600/60 uppercase tracking-tight">Current: {settings?.latePenalty ?? 20} GHS</span>
                            </div>
                            <div className="relative w-full">
                                <input
                                    type="number"
                                    step="0.01"
                                    name="latePenalty"
                                    defaultValue={settings?.latePenalty ?? 20}
                                    className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl text-center font-black text-2xl outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-inner text-slate-950 placeholder:text-slate-300"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">
                                    GHS / mo
                                </span>
                            </div>

                        </div>

                        <div className="md:col-span-3 bg-indigo-50 rounded-[3rem] p-10 border border-indigo-100 flex flex-col md:flex-row items-center gap-8 shadow-inner overflow-hidden relative">
                            <div className="absolute -right-20 -bottom-20 h-60 w-60 bg-indigo-200/20 rounded-full blur-3xl shrink-0" />
                            <div className="h-20 w-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xl relative z-10">
                                <Percent className="h-10 w-10" />
                            </div>
                            <div className="space-y-1 relative z-10 text-left">
                                <h3 className="text-xl font-black text-indigo-900 tracking-tight text-left">Dynamic Financial Algorithm</h3>
                                <p className="text-sm font-bold text-indigo-700/60 max-w-xl italic text-left">
                                    Updating these values will immediately affect the payment status calculations for all members.
                                    The system uses these parameters to determine arrears, remaining balances, and calendar standings in real-time.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                {activeTab !== "security" && (
                    <div className="fixed bottom-28 md:bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl px-4 z-[40]">
                        <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[2.5rem] border border-white shadow-2xl flex items-center justify-between gap-4">
                            <div className="hidden md:flex items-center gap-4 ml-6">
                                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Save className="h-5 w-5" />
                                </div>
                                <p className="text-xs font-bold text-gray-500">Ensure all parameters are correct before saving global settings.</p>
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full md:w-auto h-14 px-12 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Save All Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </form>

            <form onSubmit={handleSecuritySubmit} className={cn("space-y-8 pb-20", activeTab !== "security" && "hidden")}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500 text-left">
                    <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-samsung space-y-8 relative overflow-hidden group">
                        <div className="absolute -right-10 -top-10 h-40 w-40 bg-amber-50/50 rounded-full blur-3xl group-hover:scale-150 transition-all duration-700 pointer-events-none" />

                        <div className="flex items-center gap-4 relative z-10">
                            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm shrink-0">
                                <Shield className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Administrative Authentication</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Change Account Password</p>
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10 pt-4">
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Current Password</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    placeholder="Enter current password"
                                    required
                                    className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none font-bold text-slate-950 shadow-inner"
                                />
                            </div>

                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">New Password</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    placeholder="Enter new password (min. 8 characters)"
                                    required
                                    minLength={8}
                                    className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-slate-950 shadow-inner"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={securitySaving}
                            className="w-full h-14 mt-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 relative z-10 shadow-xl"
                        >
                            {securitySaving ? (
                                <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Shield className="h-4 w-4" /> Save New Password
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-amber-50 rounded-[3rem] p-10 border border-amber-100 flex flex-col justify-center gap-6 shadow-inner relative overflow-hidden h-full">
                        <div className="absolute right-0 bottom-0 h-full w-full bg-gradient-to-t from-amber-100/30 to-transparent pointer-events-none" />
                        <h3 className="text-xl font-black text-amber-900 tracking-tight text-left relative z-10">Real-Time Security Protocol</h3>
                        <p className="text-sm font-bold text-amber-700/60 leading-relaxed text-left relative z-10">
                            Updating your password here modifies the administrative credentials immediately.
                            There is no need to log out; your session will remain securely active with the new signature.
                            <br /><br />
                            Make sure to memorize or securely store your new password.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}
