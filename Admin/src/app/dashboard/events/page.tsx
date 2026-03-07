"use client"

import React, { useState, useEffect } from "react";
import { Plus, CalendarHeart, Trash2, Power, PowerOff, Activity, Wallet, FileText, ChevronRight } from "lucide-react";
import { getFundraisingEvents, createFundraisingEvent, toggleEventStatus, deleteEvent } from "@/actions/events";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EventsManagementPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const [newEvent, setNewEvent] = useState({
        title: "",
        description: "",
        goalAmount: "",
        endDate: ""
    });

    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [deleteConfirmTitle, setDeleteConfirmTitle] = useState("");
    const [typedConfirmation, setTypedConfirmation] = useState("");

    const loadEvents = async () => {
        setLoading(true);
        const data = await getFundraisingEvents();
        setEvents(data);
        setLoading(false);
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        const res = await createFundraisingEvent({
            ...newEvent,
            goalAmount: newEvent.goalAmount ? parseFloat(newEvent.goalAmount) : undefined,
            endDate: newEvent.endDate ? new Date(newEvent.endDate) : undefined
        });

        if (res.success) {
            toast.success("Event created successfully");
            setShowModal(false);
            setNewEvent({ title: "", description: "", goalAmount: "", endDate: "" });
            loadEvents();
        } else {
            toast.error(res.error || "Failed to create event");
        }
        setIsCreating(false);
    };

    const handleToggle = async (id: string, current: boolean) => {
        const res = await toggleEventStatus(id, !current);
        if (res.success) {
            toast.success(`Event ${!current ? 'activated' : 'deactivated'}`);
            loadEvents();
        }
    };

    const handleDelete = async (id: string) => {
        const res = await deleteEvent(id);
        if (res.success) {
            toast.success("Event deleted permanently");
            loadEvents();
        } else {
            toast.error("Deletion failed");
        }
    };

    return (
        <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 leading-none">
                        Events
                    </h1>
                    <p className="text-sm md:text-base font-bold text-gray-400 uppercase tracking-[0.2em] text-left">
                        Fundraising & Special Collections
                    </p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="h-14 px-8 bg-black text-white rounded-2xl font-bold flex items-center gap-3 shadow-lg active:scale-95 transition-all text-center"
                >
                    <Plus className="h-5 w-5" />
                    New Fundraising
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-64 bg-gray-100 rounded-[2.5rem] animate-pulse" />
                    ))
                ) : events.length === 0 ? (
                    <div className="col-span-full py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                        <CalendarHeart className="h-16 w-16 text-gray-200 mb-4" />
                        <h3 className="text-xl font-black text-gray-900">No events yet</h3>
                        <p className="text-gray-400 font-bold mt-2">Start a fundraising campaign to support church projects.</p>
                    </div>
                ) : (
                    events.map((event) => (
                        <div key={event.id} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-samsung relative overflow-hidden group">
                            <div className={cn(
                                "absolute top-0 right-0 h-24 w-24 blur-3xl opacity-10 transition-all duration-700 group-hover:scale-150 pointer-events-none",
                                event.isActive ? "bg-emerald-500" : "bg-gray-500"
                            )} />

                            <div className="flex justify-between items-start mb-6">
                                <div className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                    event.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                                )}>
                                    {event.isActive ? "Active Now" : "Inactive"}
                                </div>
                                <div className="flex gap-2 relative z-10">
                                    <button
                                        onClick={() => handleToggle(event.id, event.isActive)}
                                        className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90",
                                            event.isActive ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                        )}
                                    >
                                        {event.isActive ? <PowerOff className="h-5 w-5" /> : <Power className="h-5 w-5" />}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setDeleteConfirmId(event.id);
                                            setDeleteConfirmTitle(event.title);
                                        }}
                                        className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors shadow-sm active:scale-90"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-3 text-left">{event.title}</h3>
                            <p className="text-gray-500 font-bold text-sm leading-relaxed mb-8 line-clamp-3 text-left">
                                {event.description}
                            </p>

                            <div className="space-y-4 pt-6 border-t border-gray-50">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-left">Raised Amount</p>
                                        <p className="text-xl font-black text-gray-900 text-left">GH₵{event.raisedAmount.toLocaleString()}</p>
                                    </div>
                                    {event.goalAmount && (
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-right">Goal</p>
                                            <p className="text-sm font-black text-gray-900 text-right">GH₵{event.goalAmount.toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>

                                {event.goalAmount && (
                                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min(100, (event.raisedAmount / event.goalAmount) * 100)}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Event Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-500">
                        <form onSubmit={handleCreate} className="p-10 space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Create Fundraising</h2>
                                <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 font-black">✕</button>
                            </div>

                            <div className="space-y-4 text-left">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block text-left">Title / Purpose</label>
                                    <input
                                        autoFocus
                                        required
                                        value={newEvent.title}
                                        onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                        placeholder="e.g. Church Building Project"
                                        className="w-full h-14 px-6 bg-gray-50 text-gray-900 rounded-2xl border-none focus:ring-4 focus:ring-black/5 font-bold placeholder:text-gray-400"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block text-left">Description / Details</label>
                                    <textarea
                                        required
                                        value={newEvent.description}
                                        onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                        rows={3}
                                        placeholder="Describe why we are raising this fund..."
                                        className="w-full p-6 bg-gray-50 text-gray-900 rounded-2xl border-none focus:ring-4 focus:ring-black/5 font-bold text-sm resize-none placeholder:text-gray-400"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-left">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block text-left">Target Goal (Optional)</label>
                                        <input
                                            type="number"
                                            value={newEvent.goalAmount}
                                            onChange={e => setNewEvent({ ...newEvent, goalAmount: e.target.value })}
                                            placeholder="GHS 0.00"
                                            className="w-full h-14 px-6 bg-gray-50 text-gray-900 rounded-2xl border-none focus:ring-4 focus:ring-black/5 font-bold placeholder:text-gray-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block text-left">End Date</label>
                                        <input
                                            type="date"
                                            value={newEvent.endDate}
                                            onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })}
                                            className="w-full h-14 px-6 bg-gray-50 text-gray-900 rounded-2xl border-none focus:ring-4 focus:ring-black/5 font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                disabled={isCreating}
                                className="w-full h-16 bg-black text-white rounded-[1.5rem] font-black text-lg shadow-xl active:scale-95 transition-all text-center"
                            >
                                {isCreating ? "Creating..." : "Launch Campaign"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="h-20 w-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                            <Trash2 className="h-10 w-10" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Are you absolutely sure?</h3>
                            <p className="text-gray-500 font-bold leading-relaxed text-sm">
                                This will permanently delete <span className="text-red-600">"{deleteConfirmTitle}"</span> and all its recorded donation history. This action cannot be undone.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Type <span className="text-gray-900 border-b-2 border-red-200">DELETE</span> to proceed</p>
                            <input
                                type="text"
                                value={typedConfirmation}
                                onChange={e => setTypedConfirmation(e.target.value)}
                                placeholder="Type DELETE here"
                                className="w-full h-14 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-red-500 focus:ring-0 text-center font-black uppercase tracking-widest text-red-600 placeholder:text-gray-200"
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setDeleteConfirmId(null);
                                    setTypedConfirmation("");
                                }}
                                className="flex-1 h-14 bg-gray-100 text-gray-900 rounded-2xl font-black hover:bg-gray-200 transition-all text-[10px] uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={typedConfirmation !== "DELETE"}
                                onClick={() => {
                                    handleDelete(deleteConfirmId);
                                    setDeleteConfirmId(null);
                                    setTypedConfirmation("");
                                }}
                                className="flex-1 h-14 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-200 disabled:opacity-30 disabled:grayscale transition-all text-sm"
                            >
                                Delete Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
