"use client";

import React, { useState } from "react";
import {
    Bell,
    CreditCard,
    UserCircle,
    MessageSquare,
    ArrowLeft,
    CheckCheck,
    Settings2,
    Trash2,
    Calendar,
    ChevronRight,
    Search,
    Filter,
    CheckSquare,
    Square
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const IconMap: { [key: string]: any } = {
    CreditCard,
    UserCircle,
    Bell,
    MessageSquare,
    CheckCheck,
    Calendar,
};

const categories = [
    { id: "all", label: "All Items" },
    { id: "unread", label: "Unread" },
    { id: "payment", label: "Payments" },
    { id: "announcement", label: "Updates" }
];

export default function NotificationsPage() {
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [notificationsData, setNotificationsData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const handleDelete = async (id: string) => {
        setNotificationsData(prev => prev.filter(n => n.id !== id));
        setSelectedIds(prev => prev.filter(i => i !== id));

        try {
            await fetch("/api/user/notifications", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: [id] })
            });
            toast.success("Notification dismissed");
        } catch (error) {
            toast.error("Failed to dismiss notification");
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;

        const idsToDelete = [...selectedIds];
        setNotificationsData(prev => prev.filter(n => !idsToDelete.includes(n.id)));
        setSelectedIds([]);

        try {
            await fetch("/api/user/notifications", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: idsToDelete })
            });
            toast.success(`${idsToDelete.length} notification(s) dismissed`);
        } catch (error) {
            toast.error("Failed to dismiss notifications");
        }
    };

    React.useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await fetch("/api/user/notifications", { cache: "no-store" });
                if (res.ok) {
                    const data = await res.json();
                    setNotificationsData(data);
                }
            } catch (error) {
                console.error("Failed to load notifications", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const filteredNotifications = notificationsData.filter(notification => {
        const matchesTab =
            activeTab === "all" ||
            (activeTab === "unread" && !notification.isRead) ||
            notification.category === activeTab;

        const matchesSearch =
            notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            notification.description.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesTab && matchesSearch;
    });

    const isAllSelected = filteredNotifications.length > 0 && filteredNotifications.every(n => selectedIds.includes(n.id));

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(prev => prev.filter(id => !filteredNotifications.find(n => n.id === id)));
        } else {
            const newIds = filteredNotifications.map(n => n.id);
            setSelectedIds(Array.from(new Set([...selectedIds, ...newIds])));
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 sm:px-0">
            {/* Header Area */}
            <div className="space-y-6">
                <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4 sm:gap-0">
                    <div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black tracking-tighter">Activity</h2>
                        <div className="flex items-center gap-2 mt-1 sm:mt-2">
                            <span className="h-5 px-2 rounded-full bg-primary-100 text-primary-600 text-[10px] font-bold uppercase tracking-wider flex items-center">
                                {notificationsData.filter(n => !n.isRead).length} New
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-slate-400">Notifications Center</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button variant="outline" size="icon" className="rounded-xl sm:rounded-full h-10 w-10 sm:h-11 sm:w-11 border-slate-200 hidden sm:flex">
                            <Settings2 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-xl sm:rounded-full h-10 w-10 sm:h-11 sm:w-11 border-slate-200 text-slate-500 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 transition-all">
                            <CheckCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                    </div>
                </div>

                {/* Advanced Interaction Bar */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex bg-slate-100/50 p-1.5 rounded-[1.25rem] sm:rounded-[1.75rem] w-full sm:w-auto overflow-x-auto no-scrollbar snap-x">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setActiveTab(category.id)}
                                className={cn(
                                    "px-4 sm:px-6 py-2 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap snap-start",
                                    activeTab === category.id
                                        ? "bg-white text-black shadow-samsung"
                                        : "text-slate-500 hover:text-black hover:bg-slate-200/50"
                                )}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search activities..."
                            className="w-full h-11 sm:h-12 pl-11 pr-4 rounded-xl sm:rounded-full bg-slate-100/50 sm:bg-white sm:border sm:border-slate-100 sm:shadow-samsung-sm text-sm font-semibold focus:ring-2 focus:ring-primary-500/20 transition-all outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Mass Actions Bar */}
            {filteredNotifications.length > 0 && (
                <div className="flex items-center justify-between px-2 sm:px-4">
                    <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-black transition-colors"
                    >
                        {isAllSelected ? <CheckSquare className="h-5 w-5 text-primary-500" /> : <Square className="h-5 w-5" />}
                        Select All
                    </button>

                    {selectedIds.length > 0 && (
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleDeleteSelected}
                            className="h-9 px-4 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 border-none shadow-none"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Selected ({selectedIds.length})
                        </Button>
                    )}
                </div>
            )}

            {/* Notifications Grid/List */}
            <div className="space-y-6">
                {/* Empty State */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                        <div className="h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-semibold text-slate-400 mt-1 max-w-[280px]">
                            Loading notifications...
                        </p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                        <div className="h-24 w-24 bg-slate-50 rounded-[3rem] flex items-center justify-center animate-pulse">
                            <Bell className="h-10 w-10 text-slate-200" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-black tracking-tight">No notifications yet</h3>
                            <p className="text-sm font-semibold text-slate-400 mt-1 max-w-[280px]">
                                Your notification log is currently clear for this category.
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            className="font-bold text-primary-500 hover:bg-primary-50 rounded-full"
                            onClick={() => { setActiveTab("all"); setSearchQuery(""); }}
                        >
                            Reset filters
                        </Button>
                    </div>
                ) : null}

                {/* Categorized List */}
                <div className="grid gap-3 sm:gap-4">
                    {filteredNotifications.map((notification) => {
                        const IconComponent = IconMap[notification.iconName] || Bell;
                        return (
                            <div
                                key={notification.id}
                                className={cn(
                                    "group p-5 sm:p-6 rounded-[1.75rem] sm:rounded-[2.5rem] bg-white border border-slate-100 transition-all duration-500 hover:shadow-samsung-lg hover:-translate-y-1 relative overflow-hidden",
                                    !notification.isRead ? "shadow-samsung ring-1 ring-primary-500/10" : "opacity-80 hover:opacity-100"
                                )}
                            >
                                {/* Glass Overlay on Hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start relative z-10 w-full">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={(e) => { e.preventDefault(); toggleSelection(notification.id); }}
                                            className="text-slate-300 hover:text-primary-500 transition-colors shrink-0"
                                        >
                                            {selectedIds.includes(notification.id) ? (
                                                <CheckSquare className="h-6 w-6 text-primary-500" />
                                            ) : (
                                                <Square className="h-6 w-6" />
                                            )}
                                        </button>
                                        <div className={cn(
                                            "h-12 w-12 sm:h-14 sm:w-14 rounded-2xl sm:rounded-3xl flex items-center justify-center shrink-0 shadow-samsung-sm transition-transform duration-500 group-hover:rotate-6",
                                            notification.color
                                        )}>
                                            <IconComponent className="h-5 w-5 sm:h-7 sm:w-7" />
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-1.5 sm:space-y-2 w-full">
                                        <div className="flex justify-between items-start">
                                            <div className="pr-4">
                                                <h4 className={cn(
                                                    "font-bold text-black tracking-tight text-base sm:text-lg leading-tight sm:leading-none",
                                                    !notification.isRead ? "font-extrabold" : ""
                                                )}>
                                                    {notification.title}
                                                </h4>
                                                <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5">
                                                    <Calendar className="h-3 w-3 text-slate-400 hidden sm:block" />
                                                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {notification.date} • {notification.time}
                                                    </span>
                                                </div>
                                            </div>
                                            {!notification.isRead && (
                                                <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse shrink-0 mt-1 sm:mt-0" />
                                            )}
                                        </div>
                                        <p className="text-xs sm:text-sm font-semibold text-slate-500 leading-relaxed max-w-3xl">
                                            {notification.description}
                                        </p>

                                        {notification.action && (
                                            <div className="pt-3 sm:pt-4 flex flex-wrap items-center gap-2 sm:gap-3">
                                                <Link href={notification.action.href}>
                                                    <Button className="h-9 sm:h-10 px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-black hover:bg-slate-800 text-white font-bold text-[10px] sm:text-xs transition-all shadow-samsung active:scale-95 group/btn">
                                                        {notification.action.label}
                                                        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl hover:bg-slate-100 text-slate-400"
                                                    onClick={() => handleDelete(notification.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
