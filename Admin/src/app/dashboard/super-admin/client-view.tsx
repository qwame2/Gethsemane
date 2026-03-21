"use client";

import { useState } from "react";
import { resetAccountPassword, exitSuperAdminProtocol } from "@/actions/superadmin";
import { useRouter } from "next/navigation";
import { ShieldAlert, Users, History, Activity, Shield, LogOut, CheckCircle2, Copy, MonitorPlay, Key, X, Eye, Filter, Calendar } from "lucide-react";

export default function SuperAdminClientView({ admins, users, auditLogs }: any) {
    const router = useRouter();
    
    // Strict Security Modal State
    const [resetModal, setResetModal] = useState<{ id: string, type: "Admin" | "User", email: string, name: string } | null>(null);
    const [overridePassword, setOverridePassword] = useState("");
    const [isResetting, setIsResetting] = useState(false);
    
    const [successMessage, setSuccessMessage] = useState<{msg: string, pwd?: string} | null>(null);

    // Audit Log Filters and View
    const [dateFilter, setDateFilter] = useState("all");
    const [calendarDate, setCalendarDate] = useState("");
    const [viewLog, setViewLog] = useState<any>(null);

    // Dynamic log filtering
    const filteredLogs = auditLogs.filter((log: any) => {
        const logDate = new Date(log.createdAt);

        // If specific calendar date is selected, override presets
        if (calendarDate) {
            const year = logDate.getFullYear();
            const month = String(logDate.getMonth() + 1).padStart(2, '0');
            const day = String(logDate.getDate()).padStart(2, '0');
            const localYMD = `${year}-${month}-${day}`;
            return localYMD === calendarDate;
        }

        if (dateFilter === "all") return true;
        
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (dateFilter === "today") return logDate >= startOfToday;
        if (dateFilter === "week") {
            const weekAgo = new Date(startOfToday);
            weekAgo.setDate(startOfToday.getDate() - 7);
            return logDate >= weekAgo;
        }
        if (dateFilter === "month") {
            const monthAgo = new Date(startOfToday);
            monthAgo.setMonth(startOfToday.getMonth() - 1);
            return logDate >= monthAgo;
        }
        return true;
    });

    const handleOpenResetModal = (id: string, type: "Admin" | "User", email: string, firstName: string, lastName: string) => {
        setResetModal({ id, type, email, name: `${firstName} ${lastName}` });
        setOverridePassword("");
    };

    const confirmReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetModal || !overridePassword) return;

        setIsResetting(true);
        const res = await resetAccountPassword(resetModal.id, resetModal.type, overridePassword);
        setIsResetting(false);

        if (res.success) {
            setSuccessMessage({ 
                msg: `Protocol successful. Account ${resetModal.email} has been overridden.`, 
                pwd: res.defaultPassword 
            });
            setTimeout(() => setSuccessMessage(null), 15000);
            setResetModal(null);
            router.refresh();
        } else {
            alert(res.error || "Override Failed.");
        }
    };

    const handleExit = async () => {
        await exitSuperAdminProtocol();
        router.push("/dashboard");
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Temporary Override Password copied to clipboard!");
    };

    const resetCount = auditLogs.filter((log: any) => log.action === "RESET").length;

    return (
        <div className="space-y-8 relative">

            {/* Engaging Data Dashboard Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-100 shadow-sm p-6 rounded-3xl flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Executive Nodes</p>
                        <p className="text-4xl font-black text-gray-900">{admins.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
                        <ShieldAlert className="text-red-600 w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white border border-gray-100 shadow-sm p-6 rounded-3xl flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Platform Citizens</p>
                        <p className="text-4xl font-black text-gray-900">{users.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
                        <Users className="text-blue-600 w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white border border-gray-100 shadow-sm p-6 rounded-3xl flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">System Overrides</p>
                        <p className="text-4xl font-black text-gray-900">{resetCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200">
                        <History className="text-gray-600 w-6 h-6" />
                    </div>
                </div>
            </div>

            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 shadow-sm">
                    <div className="flex items-center gap-4 text-emerald-700">
                        <CheckCircle2 className="w-8 h-8" />
                        <div>
                            <p className="font-bold tracking-widest uppercase">{successMessage.msg}</p>
                            {successMessage.pwd && (
                                <p className="text-xs font-mono opacity-80 mt-1">Temporary authorization key generated.</p>
                            )}
                        </div>
                    </div>
                    {successMessage.pwd && (
                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-emerald-200 shadow-sm">
                            <span className="font-mono text-emerald-700 font-bold tracking-widest">{successMessage.pwd}</span>
                            <button onClick={() => copyToClipboard(successMessage.pwd!)} className="p-2 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600 hover:text-emerald-800">
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Admin Accounts Matrix */}
                <div className="bg-gray-50 border border-gray-100 rounded-[2rem] p-1 shadow-inner overflow-hidden">
                    <div className="bg-white rounded-[1.8rem] p-6 h-full flex flex-col shadow-sm">
                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-3 uppercase tracking-widest mb-6 border-b border-gray-100 pb-4">
                            <Shield className="w-5 h-5 text-red-500" /> Executive Privileges (Admins)
                        </h2>
                        <div className="space-y-3 overflow-y-auto max-h-[450px] pr-2 scrollbar-thin scrollbar-thumb-gray-200 flex-1">
                            {admins.map((admin: any) => (
                                <div key={admin.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50/50 hover:bg-red-50/30 border border-gray-100 rounded-2xl gap-4 hover:border-red-200 transition-all group">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-black text-gray-900 truncate text-sm">{admin.firstName} {admin.lastName}</p>
                                        <p className="text-[11px] font-mono text-gray-500 truncate mt-0.5">{admin.email}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleOpenResetModal(admin.id, "Admin", admin.email, admin.firstName, admin.lastName)}
                                        className="shrink-0 px-4 py-2 bg-white hover:bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border border-gray-200 group-hover:border-red-200 shadow-sm"
                                    >
                                        Force Reset
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Users / Platform Accounts */}
                <div className="bg-gray-50 border border-gray-100 rounded-[2rem] p-1 shadow-inner overflow-hidden">
                    <div className="bg-white rounded-[1.8rem] p-6 h-full flex flex-col shadow-sm">
                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-3 uppercase tracking-widest mb-6 border-b border-gray-100 pb-4">
                            <Users className="w-5 h-5 text-blue-500" /> Platform Access (Users)
                        </h2>
                        <div className="space-y-3 overflow-y-auto max-h-[450px] pr-2 scrollbar-thin scrollbar-thumb-gray-200 flex-1">
                            {users.map((user: any) => (
                                <div key={user.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50/50 hover:bg-blue-50/30 border border-gray-100 rounded-2xl gap-4 hover:border-blue-200 transition-all group">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-black text-gray-900 truncate text-sm">{user.firstName} {user.lastName}</p>
                                        <p className="text-[11px] font-mono text-gray-500 truncate mt-0.5">{user.email}</p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="px-2.5 py-1 bg-white text-[9px] font-bold uppercase tracking-widest text-blue-600 rounded-lg border border-gray-200 shadow-sm">
                                            {user.role}
                                        </span>
                                        <button 
                                            onClick={() => handleOpenResetModal(user.id, "User", user.email, user.firstName, user.lastName)}
                                            className="shrink-0 px-4 py-2 bg-white hover:bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border border-gray-200 shadow-sm opacity-80 group-hover:opacity-100 group-hover:border-red-200"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Logs Core */}
            <div className="bg-gray-50 border border-gray-100 rounded-[2rem] p-1 shadow-inner overflow-hidden">
                <div className="bg-white rounded-[1.8rem] p-6 shadow-sm">
                    <h2 className="text-lg font-black text-gray-900 flex flex-col sm:flex-row items-start sm:items-center justify-between uppercase tracking-widest mb-6 border-b border-gray-100 pb-4 gap-4">
                        <div className="flex items-center gap-3">
                            <History className="w-5 h-5 text-gray-700" /> Live Audit Engine
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                <input 
                                    type="date" 
                                    value={calendarDate}
                                    onChange={(e) => {
                                        setCalendarDate(e.target.value);
                                        if (e.target.value) setDateFilter("all"); // Reset preset if specific date picked
                                    }}
                                    className="text-[10px] font-bold tracking-widest uppercase bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none text-gray-600 focus:border-red-400 cursor-pointer shadow-sm"
                                />
                                {!calendarDate && (
                                    <>
                                        <Filter className="w-4 h-4 text-gray-400 ml-2" />
                                        <select 
                                            value={dateFilter} 
                                            onChange={(e) => setDateFilter(e.target.value)}
                                            className="text-[10px] font-bold tracking-widest uppercase bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none text-gray-600 focus:border-gray-400 cursor-pointer"
                                        >
                                            <option value="all">All Time</option>
                                            <option value="today">Today</option>
                                            <option value="week">Past 7 Days</option>
                                            <option value="month">Past 30 Days</option>
                                        </select>
                                    </>
                                )}
                            </div>
                            <span className="hidden sm:flex text-[10px] items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 font-mono text-emerald-700">
                                <Activity className="w-3 h-3 text-emerald-500 animate-pulse" /> RECORDING
                            </span>
                        </div>
                    </h2>
                    
                    <div className="overflow-x-auto pb-4 scrollbar-hide">
                        {/* Mobile Card View */}
                        <div className="grid grid-cols-1 gap-4 md:hidden pb-4">
                            {filteredLogs.map((log: any) => (
                                <div key={log.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            {log.actorRole === "SuperAdmin" && <ShieldAlert className="w-4 h-4 text-red-500" />}
                                            {log.actorRole === "Admin" && <Shield className="w-4 h-4 text-blue-500" />}
                                            {log.actorRole === "System" && <MonitorPlay className="w-4 h-4 text-emerald-500" />}
                                            <span className="text-gray-900 font-bold tracking-widest text-xs uppercase">{log.actorName}</span>
                                        </div>
                                        <button onClick={() => setViewLog(log)} className="p-2 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                                            <Eye className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-gray-50 pb-2">
                                        <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(log.createdAt).toLocaleDateString()}</div>
                                        <span>{log.entity}</span>
                                    </div>
                                    <p className="text-xs text-gray-700 line-clamp-2 font-mono" title={log.details}>{log.details}</p>
                                </div>
                            ))}
                            {filteredLogs.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed m-1">
                                    <History className="w-8 h-8 text-gray-300 mb-3" />
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm text-center">No Data Found</p>
                                    <p className="text-[10px] text-gray-400 font-mono mt-2 text-center border-t border-gray-200 pt-2 inline-block">No audit logs match that date.</p>
                                </div>
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <table className="hidden md:table w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                            <thead className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.2em] bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-2xl">Timestamp</th>
                                    <th className="px-6 py-4">Actor</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">Entity</th>
                                    <th className="px-6 py-4 w-full">Event Sequence</th>
                                    <th className="px-6 py-4 rounded-tr-2xl text-right">View</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-mono text-xs">
                                {filteredLogs.map((log: any) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {log.actorRole === "SuperAdmin" && <ShieldAlert className="w-3.5 h-3.5 text-red-500" />}
                                                {log.actorRole === "Admin" && <Shield className="w-3.5 h-3.5 text-blue-500" />}
                                                {log.actorRole === "System" && <MonitorPlay className="w-3.5 h-3.5 text-emerald-500" />}
                                                <span className="text-gray-900 font-bold tracking-widest">{log.actorName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md border text-[9px] font-bold tracking-[0.15em] uppercase shadow-sm
                                                ${log.action === "RESET" || log.action === "DELETED" ? "bg-red-50 text-red-600 border-red-100" : 
                                                log.action === "UPDATED" ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                log.action.includes("LOGGED") ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                "bg-gray-50 text-gray-600 border-gray-200"}
                                            `}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 uppercase tracking-widest text-[10px]">{log.entity}</td>
                                        <td className="px-6 py-4 text-gray-700 truncate max-w-sm hover:text-gray-900 transition-colors cursor-default" title={log.details}>
                                            {log.details}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => setViewLog(log)} className="p-2 bg-white hover:bg-gray-100 border border-gray-200 shadow-sm rounded-lg transition-colors text-gray-600">
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16">
                                            <div className="flex flex-col items-center justify-center">
                                                <History className="w-8 h-8 text-gray-300 mb-3" />
                                                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No Data Found</p>
                                                <p className="text-[10px] text-gray-400 font-mono mt-2 border-t border-gray-100 pt-2">No audit records exist for the selected date filter.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="flex justify-center pt-8">
                <button 
                    onClick={handleExit}
                    className="flex items-center gap-3 px-8 py-4 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 font-bold tracking-widest uppercase rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                    <LogOut className="w-5 h-5 text-gray-500" /> Terminate Override & Exit
                </button>
            </div>

            {/* Strict Security Override Modal */}
            {resetModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <form onSubmit={confirmReset} className="relative w-[90%] max-w-md bg-white border border-gray-200 rounded-3xl p-8 shadow-2xl overflow-hidden">
                        
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-center">
                                <Key className="w-6 h-6 text-red-600" />
                            </div>
                            <button type="button" onClick={() => setResetModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Strict Security Lock</h3>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            You are about to forcibly reset the core credentials of <span className="text-gray-900 font-bold">{resetModal.name}</span> ({resetModal.type}). This action is heavily logged and cannot be undone.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-[0.1em] mb-2">Enter Override Key</label>
                                <input 
                                    autoFocus
                                    type="password"
                                    required
                                    value={overridePassword}
                                    onChange={(e) => setOverridePassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-mono tracking-widest focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder:text-gray-300"
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={isResetting || !overridePassword}
                                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-red-600 shadow-sm active:scale-95 shadow-red-600/20"
                            >
                                {isResetting ? "Overriding System..." : "Confirm & Execute Reset"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Audit Log Full Detail Modal */}
            {viewLog && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                        
                        <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center">
                                    <Activity className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Audit Record Detail</p>
                                    <p className="text-gray-900 font-mono text-sm">{new Date(viewLog.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                            <button onClick={() => setViewLog(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Actor Name</p>
                                    <p className="font-bold text-gray-900 flex items-center gap-2">
                                        {viewLog.actorRole === "SuperAdmin" && <ShieldAlert className="w-3.5 h-3.5 text-red-500" />}
                                        {viewLog.actorRole === "Admin" && <Shield className="w-3.5 h-3.5 text-blue-500" />}
                                        {viewLog.actorRole === "System" && <MonitorPlay className="w-3.5 h-3.5 text-emerald-500" />}
                                        {viewLog.actorName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Action Engine</p>
                                    <p className="font-mono text-xs font-bold text-gray-800">{viewLog.action}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target Entity</p>
                                    <p className="font-mono text-xs font-bold text-gray-800">{viewLog.entity}</p>
                                </div>
                                <div className="col-span-2 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Deep Event Sequence Data</p>
                                    <p className="font-mono text-sm text-gray-800 leading-relaxed font-medium">
                                        {viewLog.details}
                                    </p>
                                </div>
                            </div>

                            <button onClick={() => setViewLog(null)} className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-all shadow-sm">
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
